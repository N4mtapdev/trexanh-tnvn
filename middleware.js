import { next } from '@vercel/edge';
import { COOKIE_NAME, verifyToken, readCookie } from './lib/gate-auth.js';

export const config = { matcher: ['/add-data.html'] };

export default async function middleware(request) {
    const secret = process.env.ADD_DATA_SECRET;

    /* Chưa cấu hình secret ở Vercel env → chặn luôn (an toàn là trên hết),
       trang gate sẽ giải thích rõ cần set ADD_DATA_SECRET + ADD_DATA_PASSPHRASE */
    const cookieHeader = request.headers.get('cookie') || '';
    const token = readCookie(cookieHeader, COOKIE_NAME);

    if (secret && token && (await verifyToken(token, secret))) {
        return next();
    }

    const url = new URL(request.url);
    const gateUrl = new URL('/api/gate', url);
    gateUrl.searchParams.set('next', url.pathname + url.search);
    return Response.redirect(gateUrl, 307);
}
