import { NextResponse } from 'next/server';
import { getLocalPosts } from '@/lib/local-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/posts?cat=chinhTri&q=từ+khóa&limit=20
 * Danh sách bài viết công khai, dùng cho trang /blog.
 * Dữ liệu đọc từ data/posts.json trong repo (Supabase cũ đã mất).
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');
  const q = searchParams.get('q')?.trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);

  let posts = getLocalPosts();

  if (cat && cat !== 'all') posts = posts.filter((p) => p.category === cat);
  if (q) posts = posts.filter((p) => (p.title || '').toLowerCase().includes(q));

  const items = posts.slice(0, limit).map((p) => ({
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
