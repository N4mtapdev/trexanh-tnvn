/**
 * Trả cấu hình public cho client (Supabase URL + anon key).
 *
 * LƯU Ý: SUPABASE_ANON_KEY được thiết kế để lộ ra client-side — đây không
 * phải secret. Bảo mật thật sự nằm ở Row Level Security (RLS) trong Postgres
 * (xem supabase/schema.sql), không phải ở việc giấu key này. TUYỆT ĐỐI
 * không bao giờ đặt SERVICE_ROLE_KEY (secret thật) vào đây hay bất kỳ đâu
 * client đọc được — service role bỏ qua RLS hoàn toàn.
 */

export const config = { runtime: 'edge' };

export default async function handler() {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
    };

    if (!url || !anonKey) {
        return new Response(
            JSON.stringify({ error: 'Chưa cấu hình SUPABASE_URL / SUPABASE_ANON_KEY trên Vercel' }),
            { status: 503, headers }
        );
    }

    return new Response(JSON.stringify({ supabaseUrl: url, supabaseAnonKey: anonKey }), { headers });
}
