/**
 * Xác thực JWT do Supabase Auth cấp (gửi qua header Authorization: Bearer ...)
 *
 * Supabase ký JWT bằng HS256 với "JWT Secret" của project (Settings → API →
 * JWT Settings). Cần set env var SUPABASE_JWT_SECRET trên Vercel — KHÁC với
 * SUPABASE_ANON_KEY (anon key là public, JWT secret là bí mật thật sự,
 * TUYỆT ĐỐI không để lộ client-side).
 *
 * Dùng trong mọi Edge Function cần biết "ai đang gọi" một cách đáng tin cậy
 * (vd cộng vật phẩm, chấm điểm quiz) — không bao giờ tin user_id do client
 * tự gửi lên trong body request.
 */

function b64urlDecodeToBytes(str) {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

function b64urlDecodeToString(str) {
    return new TextDecoder().decode(b64urlDecodeToBytes(str));
}

/**
 * Trả về payload JWT (gồm .sub = user_id) nếu chữ ký hợp lệ + chưa hết hạn,
 * null nếu không hợp lệ vì bất kỳ lý do gì.
 */
export async function verifySupabaseJWT(authHeader) {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret || !authHeader) return null;

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    try {
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );
        const sig = b64urlDecodeToBytes(sigB64);
        const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
        const valid = await crypto.subtle.verify('HMAC', key, sig, signedData);
        if (!valid) return null;

        const payload = JSON.parse(b64urlDecodeToString(payloadB64));
        if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
        if (!payload.sub) return null;

        return payload; /* payload.sub = user_id (uuid), payload.email, ... */
    } catch {
        return null;
    }
}
