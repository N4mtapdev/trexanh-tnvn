/**
 * POST /api/quiz/submit
 * Body: { quizToken, chosenAnswers: [optionIndex, ...] }
 *
 * Chấm điểm bằng cách so khớp với "answers" đã ký sẵn trong quizToken (sinh
 * ra ở /api/quiz/start) — KHÔNG bao giờ tin điểm số/kết quả do client tự
 * báo. Nếu đạt (>=4/5 đúng) và chưa vượt cap 3 đồ ăn/ngày từ nguồn "quiz",
 * cộng 1 đồ ăn qua service role (bỏ qua RLS một cách có kiểm soát, sau khi
 * đã tự kiểm tra điều kiện ở đây).
 */

import { verifyPayload } from '../../lib/sign-token.js';
import { verifySupabaseJWT } from '../../lib/supabase-auth.js';

export const config = { runtime: 'edge' };

const PASS_THRESHOLD = 4; /* đúng >= 4/5 mới đạt */
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
        return new Response(JSON.stringify({ error: 'Server chưa cấu hình SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }), { status: 503, headers });
    }

    const auth = await verifySupabaseJWT(req.headers.get('authorization'));
    if (!auth) {
        return new Response(JSON.stringify({ error: 'Chưa đăng nhập' }), { status: 401, headers });
    }

    let body;
    try { body = await req.json(); } catch { body = {}; }
    const { quizToken, chosenAnswers } = body;

    const payload = await verifyPayload(quizToken, process.env.QUIZ_SECRET || process.env.ADD_DATA_SECRET);
    if (!payload) {
        return new Response(JSON.stringify({ error: 'Đề thi không hợp lệ hoặc đã hết hạn, làm lại nhé' }), { status: 400, headers });
    }
    /* Token phải thuộc đúng user đang gọi — chặn dùng token của người khác */
    if (payload.uid !== auth.sub) {
        return new Response(JSON.stringify({ error: 'Token không khớp tài khoản' }), { status: 403, headers });
    }
    if (!Array.isArray(chosenAnswers) || chosenAnswers.length !== payload.answers.length) {
        return new Response(JSON.stringify({ error: 'Dữ liệu bài làm không hợp lệ' }), { status: 400, headers });
    }

    const total   = payload.answers.length;
    const correct = payload.answers.filter((ans, i) => ans === chosenAnswers[i]).length;
    const passed  = correct >= PASS_THRESHOLD;

    /* Log lại phiên thi — dùng service role vì client không có quyền insert bảng này */
    await sbFetch('/rest/v1/quiz_sessions', {
        method: 'POST',
        body: JSON.stringify({
            user_id: auth.sub, category: payload.category,
            total_q: total, correct_q: correct, passed,
        }),
    });

    if (!passed) {
        return new Response(JSON.stringify({ correct, total, passed, awarded: false, reason: 'Chưa đạt — cần đúng ít nhất 4/5 câu' }), { headers });
    }

    /* Kiểm tra cap 3 đồ ăn/ngày từ nguồn "quiz" — đếm trực tiếp trong Postgres,
       không tin bất kỳ giá trị đếm nào từ client */
    const today = new Date().toISOString().slice(0, 10);
    const capRes = await sbFetch(
        `/rest/v1/daily_rewards?select=id&user_id=eq.${auth.sub}&reward_date=eq.${today}&source=eq.quiz`,
        { headers: { 'Prefer': 'count=exact' } }
    );
    const capCount = capRes.headers.get('content-range')?.split('/')[1];
    const usedToday = capCount ? parseInt(capCount, 10) : (await capRes.json()).length;

    if (usedToday >= DAILY_CAP) {
        return new Response(JSON.stringify({
            correct, total, passed, awarded: false,
            reason: `Đã nhận đủ ${DAILY_CAP} đồ ăn từ thi hôm nay rồi, mai quay lại nhé!`,
        }), { headers });
    }

    /* Ghi nhận thưởng + cộng đồ ăn — 2 việc này nên cùng thành công hoặc
       cùng thất bại, nhưng REST API rời rạc không có transaction; chấp nhận
       rủi ro nhỏ (ghi log được mà cộng đồ lỗi) hơn là không cấp được thưởng */
    await sbFetch('/rest/v1/daily_rewards', {
        method: 'POST',
        body: JSON.stringify({ user_id: auth.sub, source: 'quiz', item_type: 'food' }),
    });
    await sbFetch('/rest/v1/rpc/rpc_increment_inventory', {
        method: 'POST',
        body: JSON.stringify({ p_user_id: auth.sub, p_item_type: 'food', p_amount: 1 }),
    });

    return new Response(JSON.stringify({
        correct, total, passed, awarded: true,
        remainingToday: DAILY_CAP - usedToday - 1,
    }), { headers });
}
