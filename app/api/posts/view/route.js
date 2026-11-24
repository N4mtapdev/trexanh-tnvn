import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/posts/view
 * Body: { slug: string }
 *
 * Trước đây tăng view_count trong Supabase. Project Supabase đã mất và
 * bài viết giờ là dữ liệu tĩnh trong data/posts.json nên không có nơi
 * lưu lượt xem — route giữ lại để client không nhận lỗi 500.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });
  }

  if (!body?.slug?.trim()) {
    return NextResponse.json({ error: 'Thiếu slug' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, counted: false });
}
