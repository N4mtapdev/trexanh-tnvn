import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * POST /api/posts/view
 * Body: { slug: string }
 * Tăng view_count cho 1 bài viết qua RPC increment_post_view (atomic, chạy
 * với quyền định nghĩa sẵn nên không cần mở policy UPDATE công khai cho
 * bảng posts). Gọi từ client component sau khi trang bài viết load xong —
 * không gọi từ Server Component để tránh tính trùng lúc Next.js prerender.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });
  }

  const slug = body?.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Thiếu slug' }, { status: 400 });
  }

  const supabase = supabasePublic();
  const { error } = await supabase.rpc('increment_post_view', { post_slug: slug });

  if (error) {
    console.error('[api/posts/view] lỗi tăng view:', error.message);
  }

  return NextResponse.json({ ok: true });
}
