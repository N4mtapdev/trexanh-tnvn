/**
 * Trả 403 cho mọi request — dùng làm đích rewrite cho /assets/json/*
 * (xem "rewrites" trong vercel.json). File JSON gốc vẫn nằm trong output
 * để scripts/build-data.js đọc lúc build, nhưng browser/curl gọi thẳng
 * URL sẽ bị chặn ở đây thay vì nhận file thật.
 */

export const config = { runtime: 'edge' };

export default function handler() {
    return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }
    );
}
