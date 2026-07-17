/**
 * POST /api/account/delete
 *
 * Xóa vĩnh viễn tài khoản người dùng qua Supabase Admin API. Vì mọi bảng
 * liên quan (pets, study_activity, inventory_items, daily_rewards,
 * quiz_sessions, profiles) đều có `references auth.users(id) on delete
 * cascade`, xóa đúng 1 dòng trong auth.users sẽ TỰ ĐỘNG xóa sạch toàn bộ
 * dữ liệu liên quan — không cần xóa từng bảng thủ công.
 *
 * Cần SUPABASE_SERVICE_ROLE_KEY vì admin API không cho anon/user JWT gọi
 * trực tiếp — đây là hành động không thể hoàn tác, PHẢI qua server, không
 * bao giờ để client tự gọi admin API bằng key của mình.
 */

import { verifySupabaseJWT } from '../../lib/supabase-auth.js';

export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }
    if (!SUPABASE_URL || !SERVICE_KEY) {
        return new Response(JSON.stringify({ error: 'Server chưa cấu hình Supabase' }), { status: 503, headers });
    }

    /* Xác thực JWT của chính người gọi — chỉ cho phép tự xóa tài khoản của
       MÌNH, không nhận user_id từ body (tránh xóa nhầm/xóa hộ tài khoản khác) */
    const auth = await verifySupabaseJWT(req.headers.get('authorization'));
    if (!auth) {
        return new Response(JSON.stringify({ error: 'Chưa đăng nhập' }), { status: 401, headers });
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${auth.sub}`, {
        method: 'DELETE',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
        },
    });

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        return new Response(JSON.stringify({ error: 'Xóa tài khoản thất bại', detail }), { status: 502, headers });
    }

    return new Response(JSON.stringify({ deleted: true }), { status: 200, headers });
}
