/**
 * POST /api/quiz/start
 * Body: { category: 'HHT' | 'LLCT' }
 *
 * Server tự chọn 5 câu ngẫu nhiên từ dataset thật + tự sinh 3 đáp án nhiễu
 * cho mỗi câu (lấy từ đáp án của câu khác cùng danh mục). Đáp án ĐÚNG được
 * ký vào "quizToken" (HMAC, xem lib/sign-token.js) gửi kèm về — client KHÔNG
 * đọc được đáp án đúng từ token này (chỉ server verify được chữ ký), nhưng
 * vẫn cần thiết để /api/quiz/submit biết đề bài THẬT SỰ đã đưa là gì mà
 * không cần lưu session ở server (edge function không giữ state).
 */

import { DATASETS } from '../../lib/dataset.js';
import { signPayload } from '../../lib/sign-token.js';
import { verifySupabaseJWT } from '../../lib/supabase-auth.js';

export const config = { runtime: 'edge' };

const QUIZ_TTL_MS = 5 * 60 * 1000; /* 5 phút để làm bài */
const NUM_QUESTIONS = 5;

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export default async function handler(req) {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    }

    const auth = await verifySupabaseJWT(req.headers.get('authorization'));
    if (!auth) {
        return new Response(JSON.stringify({ error: 'Chưa đăng nhập' }), { status: 401, headers });
    }

    let body;
    try { body = await req.json(); } catch { body = {}; }
    const category = (body.category || '').toUpperCase();
    const pool = DATASETS[category];

    if (!pool || pool.length < NUM_QUESTIONS + 3) {
        return new Response(JSON.stringify({ error: 'Danh mục không hợp lệ hoặc chưa đủ câu' }), { status: 400, headers });
    }

    const chosen = shuffle(pool).slice(0, NUM_QUESTIONS);
    const allAnswers = pool.map(x => x.answer || x.a || '');

    const questions = chosen.map((item) => {
        const correct = item.answer || item.a || '';
        const wrongPool = allAnswers.filter(a => a && a !== correct);
        const wrongs = shuffle(wrongPool).slice(0, 3);
        const options = shuffle([correct, ...wrongs]);
        return {
            id: item.id,
            question: item.question || item.q || '',
            options,
            /* KHÔNG gửi index đáp án đúng ra client */
        };
    });

    /* Ký lại đúng bộ đáp án đúng (theo thứ tự option đã shuffle) để submit
       sau này so khớp — client không đọc được nội dung này (chỉ server
       verify chữ ký được), nhưng vẫn phải gửi lại nguyên vẹn token */
    const quizToken = await signPayload(
        {
            uid: auth.sub,
            category,
            answers: chosen.map((item, i) => questions[i].options.indexOf(item.answer || item.a || '')),
            ids: chosen.map(item => item.id),
        },
        process.env.QUIZ_SECRET || process.env.ADD_DATA_SECRET,
        QUIZ_TTL_MS
    );

    return new Response(JSON.stringify({ questions, quizToken }), { status: 200, headers });
}
