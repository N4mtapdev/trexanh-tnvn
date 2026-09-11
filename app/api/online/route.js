/**
 * Next.js Edge Route Handler — Số người online realtime
 * Dùng Vercel KV (Redis) để track session
 *
 * Cách dùng:
 *   GET  /api/online?action=ping&sid=SESSION_ID  → { count, sid }
 *   GET  /api/online?action=count                → { count }
 *
 * Setup:
 *   1. vercel env add KV_REST_API_URL
 *   2. vercel env add KV_REST_API_TOKEN
 */

export const runtime = 'edge';

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const TTL = 30; // giây — session hết hạn sau 30s không ping
const PREFIX = 'tx:online:';
const SID_RE = /^[A-Za-z0-9_-]{8,64}$/;

async function kv(cmd, ...args) {
  const r = await fetch(`${KV_URL}/${[cmd, ...args].join('/')}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  const d = await r.json();
  return d.result;
}

function isSameOrigin(req, host) {
  const referer = req.headers.get('referer') || '';
  const origin = req.headers.get('origin') || '';
  try {
    if (referer && new URL(referer).host === host) return true;
  } catch {}
  try {
    if (origin && new URL(origin).host === host) return true;
  } catch {}
  return false;
}

export async function GET(req) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'count';
  const sid = url.searchParams.get('sid') || '';

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (!isSameOrigin(req, url.host)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
  }

  try {
    if (action === 'ping' && sid && SID_RE.test(sid)) {
      await kv('set', `${PREFIX}${sid}`, '1', 'ex', TTL);
    }

    const keys = await kv('keys', `${PREFIX}*`);
    const count = Array.isArray(keys) ? keys.length : 0;

    return new Response(JSON.stringify({ count, sid }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ count: 0, sid, error: e.message }), { headers });
  }
}
