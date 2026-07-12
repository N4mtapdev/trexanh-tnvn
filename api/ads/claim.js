/**
 * POST /api/ads/claim
 * Body: { rewardType: 'food' | 'toy' }
 *
 * !!! GIỚI HẠN QUAN TRỌNG — ĐỌC KỸ TRƯỚC KHI DÙNG THẬT !!!
 * Endpoint này hiện tin client báo "tôi đã xem xong quảng cáo" — ĐÂY LÀ
 * ĐIỂM YẾU: người dùng rành kỹ thuật có thể gọi endpoint này trực tiếp mà
 * không xem quảng cáo thật (vd qua DevTools/console), vì server không có
 * cách nào tự xác minh 1 quảng cáo THẬT SỰ đã phát xong.
 *
 * Cách khắc phục ĐÚNG: dùng Server-Side Verification (SSV) — ad network gọi
 * THẲNG vào 1 webhook trên server của bạn (không qua client) kèm chữ ký xác
 * nhận quảng cáo đã xem xong, server verify chữ ký đó rồi mới cộng thưởng.
 * Google Ad Manager / AdMob hỗ trợ SSV; Google AdSense (rewarded) cần kiểm
 * tra lại vì AdSense chuẩn thường không có cơ chế này — nếu tài khoản
 * AdSense của bạn không hỗ trợ, cần đổi sang Ad Manager hoặc network khác
 * có SSV để đóng lỗ hổng này thật sự.
 *
 * TẠM THỜI (cho tới khi có SSV): cap 3 lần/ngày mỗi loại vẫn được thực thi
 * ở server (không tin số đếm từ client) — hạn chế được QUY MÔ gian lận
 * (tối đa lợi được 3 món/ngày dù có bypass), dù không chặn được hoàn toàn.
 */

export const config = { runtime: 'edge' };

import { verifySupabaseJWT } from '../../lib/supabase-auth.js';

const DAILY_CAP = 3;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sbFetch(path, options = {}) {
    return fetch(`${SUPABASE_URL}${path}`, {
        ...options,
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
}

export default async function handler(req) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }
    if (!SUPABASE_URL || !SERVICE_KEY) {
        return new Response(JSON.stringify({ error: 'Server chưa cấu hình Supabase' }), { status: 503, headers });
    }

    const auth = await verifySupabaseJWT(req.headers.get('authorization'));
    if (!auth) {
        return new Response(JSON.stringify({ error: 'Chưa đăng nhập' }), { status: 401, headers });
    }

    let body;
    try { body = await req.json(); } catch { body = {}; }
    const rewardType = body.rewardType === 'toy' ? 'toy' : 'food';
    const source = rewardType === 'toy' ? 'ad_toy' : 'ad_food';

    const today = new Date().toISOString().slice(0, 10);
    const capRes = await sbFetch(
        `/rest/v1/daily_rewards?select=id&user_id=eq.${auth.sub}&reward_date=eq.${today}&source=eq.${source}`,
        { headers: { 'Prefer': 'count=exact' } }
    );
    const capCountHeader = capRes.headers.get('content-range')?.split('/')[1];
    const usedToday = capCountHeader ? parseInt(capCountHeader, 10) : (await capRes.json()).length;

    if (usedToday >= DAILY_CAP) {
        return new Response(JSON.stringify({
            awarded: false,
            reason: `Đã nhận đủ ${DAILY_CAP} ${rewardType === 'toy' ? 'đồ chơi' : 'đồ ăn'} từ quảng cáo hôm nay rồi!`,
        }), { headers });
    }

    await sbFetch('/rest/v1/daily_rewards', {
        method: 'POST',
        body: JSON.stringify({ user_id: auth.sub, source, item_type: rewardType }),
    });
    await sbFetch('/rest/v1/rpc/rpc_increment_inventory', {
        method: 'POST',
        body: JSON.stringify({ p_user_id: auth.sub, p_item_type: rewardType, p_amount: 1 }),
    });

    return new Response(JSON.stringify({ awarded: true, rewardType, remainingToday: DAILY_CAP - usedToday - 1 }), { headers });
}
