import { supabasePublic } from '@/lib/supabase';

export const CAT_COLORS = {
  emerald: { bg: 'rgba(16,185,129,.1)', text: '#059669' },
  blue: { bg: 'rgba(59,130,246,.1)', text: '#2563eb' },
  amber: { bg: 'rgba(245,158,11,.1)', text: '#d97706' },
  purple: { bg: 'rgba(139,92,246,.1)', text: '#7c3aed' },
};

/** Lấy 1 bài viết published theo slug — dùng trong generateMetadata + trang chi tiết. */
export async function getPostBySlug(slug) {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/** Bài viết liên quan — cùng chuyên mục trước, khác chuyên mục sau, không lấy chính nó. */
export async function getRelatedPosts(slug, category, limit = 3) {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from('posts')
    .select('slug, title, cat_label, cat_color, read_time, category')
    .eq('status', 'published')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(limit + 4); // lấy dư để ưu tiên cùng category phía client

  if (error || !data) return [];

  const sameCat = data.filter((p) => p.category === category);
  const others = data.filter((p) => p.category !== category);
  return [...sameCat, ...others].slice(0, limit);
}

/** Toàn bộ slug đã publish — dùng cho generateStaticParams. */
export async function getAllSlugs() {
  const supabase = supabasePublic();
  const { data, error } = await supabase.from('posts').select('slug').eq('status', 'published');
  if (error || !data) return [];
  return data.map((p) => p.slug);
}

/**
 * Bài trước/sau theo thời gian đăng (published_at) — dùng cho nút Prev/Next.
 * "Trước" = đăng sớm hơn (published_at nhỏ hơn), "sau" = đăng muộn hơn.
 * Trả về { prev, next }, mỗi cái là { slug, title } hoặc null nếu không có.
 */
export async function getAdjacentPosts(currentPublishedAt) {
  const supabase = supabasePublic();

  const [{ data: prevData }, { data: nextData }] = await Promise.all([
    supabase
      .from('posts')
      .select('slug, title')
      .eq('status', 'published')
      .lt('published_at', currentPublishedAt)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('slug, title')
      .eq('status', 'published')
      .gt('published_at', currentPublishedAt)
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return { prev: prevData || null, next: nextData || null };
}
