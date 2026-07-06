/**
 * Vercel Edge Function — Số người online realtime
 * Dùng Vercel KV (Redis) để track session
 *
 * Cách dùng:
 *   GET  /api/online?action=ping&sid=SESSION_ID  → { count, sid }
 *   GET  /api/online?action=count                → { count }
 *
 * Setup:
 *   1. vercel env add KV_REST_API_URL
 *   2. vercel env add KV_REST_API_TOKEN
 *   (Lấy từ Vercel Dashboard → Storage → KV → .env.local)
 *
 * Hardening:
 *   - Không còn Access-Control-Allow-Origin:'*' — trang khác không đọc
 *     được response qua fetch cross-origin nữa (chỉ site nhà mới đọc được).
 *   - sid phải đúng định dạng (chữ/số/gạch ngang, 8-64 ký tự) — chặn bớt
 *     rác/spam sid tuỳ ý để thổi phồng số liệu "đang online".
 */

export const config = { runtime: 'edge' };

const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const TTL      = 30; /* giây — session hết hạn sau 30s không ping */
const PREFIX   = 'tx:online:';
const SID_RE   = /^[A-Za-z0-9_-]{8,64}$/;

/* Helper gọi Vercel KV REST API */
async function kv(cmd, ...args) {
    const r = await fetch(`${KV_URL}/${[cmd, ...args].join('/')}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    const d = await r.json();
    return d.result;
}

function isSameOrigin(req, host) {
    const referer = req.headers.get('referer') || '';
    const origin  = req.headers.get('origin')  || '';
    try { if (referer && new URL(referer).host === host) return true; } catch {}
    try { if (origin  && new URL(origin).host  === host) return true; } catch {}
    return false;
}

export default async function handler(req) {
    const url    = new URL(req.url);
    const action = url.searchParams.get('action') || 'count';
    const sid    = url.searchParams.get('sid') || '';

    const headers = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
    };

    if (!isSameOrigin(req, url.host)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
    }

    try {
        if (action === 'ping' && sid && SID_RE.test(sid)) {
            /* Ghi/gia hạn session key với TTL 30s */
            await kv('set', `${PREFIX}${sid}`, '1', 'ex', TTL);
        }

        /* Đếm tất cả key còn sống */
        const keys  = await kv('keys', `${PREFIX}*`);
        const count = Array.isArray(keys) ? keys.length : 0;

        return new Response(JSON.stringify({ count, sid }), { headers });
    } catch (e) {
        /* KV chưa setup → trả count = 0, không crash */
        return new Response(JSON.stringify({ count: 0, sid, error: e.message }), { headers });
    }
}
