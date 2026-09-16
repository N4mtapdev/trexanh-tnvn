import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/posts?cat=chinhTri&q=từ+khóa&limit=20
 * Danh sách bài viết công khai (status=published), dùng cho trang /blog.
 * Thay thế /posts.json tĩnh cũ — dữ liệu giờ đọc trực tiếp từ Supabase.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');
  const q = searchParams.get('q')?.trim();
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  const supabase = supabasePublic();
  let query = supabase
    .from('posts')
    .select(
      'slug, title, excerpt, category, cat_label, cat_color, author, thumb_url, read_time, tags, featured, published_at'
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (cat && cat !== 'all') query = query.eq('category', cat);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, error } = await query;

  if (error) {
    console.error('[api/posts] Supabase error:', error.message);
    return NextResponse.json({ error: 'Không tải được danh sách bài viết' }, { status: 500 });
  }

  const items = (data || []).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    catLabel: p.cat_label,
    catColor: p.cat_color,
    author: p.author,
    date: p.published_at,
    readTime: p.read_time,
    thumb: p.thumb_url,
    tags: p.tags,
    featured: p.featured,
  }));

  return NextResponse.json(items, { headers: { 'Cache-Control': 'no-store' } });
}
