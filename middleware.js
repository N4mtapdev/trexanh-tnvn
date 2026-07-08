import { next } from '@vercel/edge';
import { COOKIE_NAME, verifyToken, readCookie } from './lib/gate-auth.js';

/* Matcher CỐ Ý đơn giản (wildcard thường, không dùng regex phức tạp trong
   :param) — phần loại trừ og-image.png/posts/ xử lý bằng JS thường bên dưới,
   để tránh rủi ro path-to-regexp compile sai làm 404 luôn TOÀN BỘ ảnh */
export const config = {
    matcher: [
        '/add-data.html',
        '/assets/images/:path*',
    ],
};

/** So referer/origin của request với host của chính request đó — tự thích
 *  ứng theo domain thật (không hardcode), kể cả khi đổi sang domain riêng. */
function isSameOrigin(request, host) {
    const referer = request.headers.get('referer') || '';
    const origin  = request.headers.get('origin')  || '';
    try { if (referer && new URL(referer).host === host) return true; } catch {}
    try { if (origin  && new URL(origin).host  === host) return true; } catch {}
    return false;
}

export default async function middleware(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/assets/images/')) {
        /* og-image.png: crawler Zalo/FB/Telegram cần fetch trực tiếp, không
           kèm referer, để render link preview — luôn cho qua.
           posts/: thuộc phần blog, không đụng vào — luôn cho qua. */
        if (
            url.pathname === '/assets/images/og-image.png' ||
            url.pathname.startsWith('/assets/images/posts/')
        ) {
            return next();
        }

        if (isSameOrigin(request, url.host)) return next();

        return new Response('Not Found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
        });
    }

    /* ── Passphrase gate cho add-data.html ── */
    const secret = process.env.ADD_DATA_SECRET;
    const cookieHeader = request.headers.get('cookie') || '';
    const token = readCookie(cookieHeader, COOKIE_NAME);

    if (secret && token && (await verifyToken(token, secret))) {
        return next();
    }

    const gateUrl = new URL('/api/gate', url);
    gateUrl.searchParams.set('next', url.pathname + url.search);
    return Response.redirect(gateUrl, 307);
}
