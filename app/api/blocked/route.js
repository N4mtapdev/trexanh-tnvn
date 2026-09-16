export const runtime = 'edge';

/**
 * Trả 403 cho mọi request — giữ lại từ bản gốc để chặn truy cập trực tiếp
 * vào các đường dẫn JSON tĩnh cũ (nếu còn bot/link nào trỏ tới).
 * Dữ liệu câu hỏi giờ nằm trong Supabase, không còn file JSON nào để lộ.
 */
export async function GET() {
  return new Response(JSON.stringify({ error: 'Forbidden' }), {
    status: 403,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
