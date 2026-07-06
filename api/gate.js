import { createToken, COOKIE_NAME, SESSION_MS, timingSafeEqual } from '../lib/gate-auth.js';

export const config = { runtime: 'edge' };

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function renderForm({ next, error, configured }) {
    return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Đăng nhập — TreXanh Admin</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: linear-gradient(135deg, #065f46, #10b981);
  }
  .card {
    background: #fff; border-radius: 16px; padding: 32px; width: 100%; max-width: 340px;
    box-shadow: 0 20px 50px rgba(0,0,0,.25);
  }
  h1 { font-size: 18px; margin: 0 0 4px; color: #065f46; }
  p.sub { font-size: 13px; color: #6b7280; margin: 0 0 20px; }
  input[type=password] {
    width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 10px;
    font-size: 15px; margin-bottom: 12px;
  }
  input[type=password]:focus { outline: 2px solid #10b981; border-color: transparent; }
  button {
    width: 100%; padding: 12px; border: none; border-radius: 10px; background: #10b981;
    color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
  }
  button:hover { background: #059669; }
  .err {
    background: #fef2f2; color: #b91c1c; font-size: 13px; padding: 10px 12px;
    border-radius: 8px; margin-bottom: 14px;
  }
  .warn {
    background: #fffbeb; color: #92400e; font-size: 13px; padding: 10px 12px;
    border-radius: 8px; margin-bottom: 14px;
  }
</style>
</head>
<body>
  <div class="card">
    <h1>🔒 Khu vực quản trị</h1>
    <p class="sub">Nhập passphrase để tiếp tục vào add-data.html</p>
    ${!configured ? `<div class="warn">Chưa cấu hình <code>ADD_DATA_SECRET</code> và <code>ADD_DATA_PASSPHRASE</code> trong Vercel Project Settings → Environment Variables. Trang sẽ luôn bị chặn cho tới khi cấu hình xong.</div>` : ''}
    ${error ? `<div class="err">${escapeHtml(error)}</div>` : ''}
    <form method="POST" action="/api/gate">
      <input type="hidden" name="next" value="${escapeHtml(next)}">
      <input type="password" name="pass" placeholder="Passphrase" autofocus required>
      <button type="submit">Vào trang</button>
    </form>
  </div>
</body>
</html>`;
}

export default async function handler(req) {
    const url  = new URL(req.url);
    const next = url.searchParams.get('next') || '/add-data.html';
    const secret     = process.env.ADD_DATA_SECRET;
    const passphrase = process.env.ADD_DATA_PASSPHRASE;
    const configured = Boolean(secret && passphrase);

    if (req.method === 'POST') {
        const form = await req.formData();
        const pass = String(form.get('pass') || '');
        const nextPath = String(form.get('next') || '/add-data.html');

        if (!configured) {
            return new Response(renderForm({ next: nextPath, error: 'Server chưa cấu hình xong.', configured }), {
                status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        const ok = await timingSafeEqual(pass, passphrase);
        if (!ok) {
            return new Response(renderForm({ next: nextPath, error: 'Passphrase sai. Thử lại.', configured }), {
                status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
        }

        const token = await createToken(secret);
        const headers = new Headers({
            'Location': nextPath.startsWith('/') ? nextPath : '/add-data.html',
            'Set-Cookie': `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${Math.floor(SESSION_MS / 1000)}; HttpOnly; Secure; SameSite=Lax`,
        });
        return new Response(null, { status: 303, headers });
    }

    return new Response(renderForm({ next, error: '', configured }), {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
