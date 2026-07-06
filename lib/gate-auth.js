/**
 * Ký/xác thực cookie phiên đăng nhập cho add-data.html.
 * Cookie chỉ chứa 1 timestamp hết hạn, được ký bằng HMAC-SHA256 với
 * ADD_DATA_SECRET (env var) — không lưu passphrase trong cookie.
 *
 * Dùng chung giữa middleware.js (kiểm tra cookie) và api/gate.js (tạo cookie
 * sau khi passphrase đúng).
 */

export const COOKIE_NAME  = 'tx_gate';
export const SESSION_MS   = 12 * 60 * 60 * 1000; /* 12 giờ */

function b64urlEncode(bytes) {
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function hmacKey(secret) {
    return crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

/** Tạo cookie token mới, hết hạn sau SESSION_MS kể từ lúc gọi. */
export async function createToken(secret) {
    const payload = JSON.stringify({ exp: Date.now() + SESSION_MS });
    const payloadB64 = b64urlEncode(new TextEncoder().encode(payload));
    const key = await hmacKey(secret);
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const sigB64 = b64urlEncode(new Uint8Array(sigBuf));
    return `${payloadB64}.${sigB64}`;
}

/** Xác thực token: chữ ký đúng + chưa hết hạn. */
export async function verifyToken(token, secret) {
    if (!token || !secret) return false;
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return false;

    try {
        const key = await hmacKey(secret);
        const sig = b64urlDecode(sigB64);
        const valid = await crypto.subtle.verify(
            'HMAC', key, sig, new TextEncoder().encode(payloadB64)
        );
        if (!valid) return false;

        const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
        return typeof payload.exp === 'number' && payload.exp > Date.now();
    } catch {
        return false;
    }
}

/** Đọc cookie theo tên từ header Cookie thô. */
export function readCookie(cookieHeader, name) {
    if (!cookieHeader) return '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : '';
}

/** So sánh 2 chuỗi theo kiểu constant-time (tránh timing attack khi so passphrase). */
export async function timingSafeEqual(a, b) {
    const enc = new TextEncoder();
    const ha = await crypto.subtle.digest('SHA-256', enc.encode(a));
    const hb = await crypto.subtle.digest('SHA-256', enc.encode(b));
    const va = new Uint8Array(ha), vb = new Uint8Array(hb);
    if (va.length !== vb.length) return false;
    let diff = 0;
    for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
    return diff === 0;
}
