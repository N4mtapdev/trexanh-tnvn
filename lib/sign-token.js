/**
 * Ký/xác thực payload JSON bất kỳ bằng HMAC-SHA256 — bản tổng quát của
 * pattern trong lib/gate-auth.js (chỉ ký riêng cookie phiên đăng nhập).
 * Dùng cho quiz token: server sinh câu hỏi + đáp án đúng, ký vào token gửi
 * cho client; client làm bài xong gửi token + câu trả lời về, server xác
 * thực chữ ký rồi mới chấm điểm — không bao giờ tin điểm số client tự báo.
 */

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

/** Ký payload (object bất kỳ, sẽ tự thêm "exp"), trả về chuỗi token "data.sig" */
export async function signPayload(payload, secret, ttlMs) {
    const full = { ...payload, exp: Date.now() + ttlMs };
    const dataB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(full)));
    const key = await hmacKey(secret);
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(dataB64));
    const sigB64 = b64urlEncode(new Uint8Array(sigBuf));
    return `${dataB64}.${sigB64}`;
}

/** Xác thực token, trả về payload gốc nếu hợp lệ + chưa hết hạn, null nếu không */
export async function verifyPayload(token, secret) {
    if (!token || typeof token !== 'string') return null;
    const [dataB64, sigB64] = token.split('.');
    if (!dataB64 || !sigB64) return null;

    try {
        const key = await hmacKey(secret);
        const sig = b64urlDecode(sigB64);
        const valid = await crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(dataB64));
        if (!valid) return null;

        const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(dataB64)));
        if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}
