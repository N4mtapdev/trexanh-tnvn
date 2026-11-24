import { getLocalPostBySlug, getLocalPosts } from '@/lib/local-data';

export const CAT_COLORS = {
  emerald: { bg: 'rgba(16,185,129,.1)', text: '#059669' },
  blue: { bg: 'rgba(59,130,246,.1)', text: '#2563eb' },
  amber: { bg: 'rgba(245,158,11,.1)', text: '#d97706' },
  purple: { bg: 'rgba(139,92,246,.1)', text: '#7c3aed' },
};

/**
 * Dữ liệu bài viết giờ đọc từ data/posts.json trong repo (Supabase cũ đã mất).
 * Giữ nguyên chữ ký hàm để các trang /blog không phải sửa.
 */

/** Lấy 1 bài viết published theo slug — dùng trong generateMetadata + trang chi tiết. */
export async function getPostBySlug(slug) {
  return getLocalPostBySlug(slug);
}

/** Bài viết liên quan — cùng chuyên mục trước, khác chuyên mục sau, không lấy chính nó. */
export async function getRelatedPosts(slug, category, limit = 3) {
  const data = getLocalPosts().filter((p) => p.slug !== slug);

  const sameCat = data.filter((p) => p.category === category);
  const others = data.filter((p) => p.category !== category);
  return [...sameCat, ...others].slice(0, limit);
}

/** Toàn bộ slug đã publish — dùng cho generateStaticParams. */
export async function getAllSlugs() {
  return getLocalPosts().map((p) => p.slug);
}

/**
 * Bài trước/sau theo thời gian đăng (published_at) — dùng cho nút Prev/Next.
 * "Trước" = đăng sớm hơn, "sau" = đăng muộn hơn.
 */
export async function getAdjacentPosts(currentPublishedAt) {
  const posts = getLocalPosts();
  const current = new Date(currentPublishedAt).getTime();

  const prev = posts.find((p) => new Date(p.published_at).getTime() < current) || null;
  const next =
    [...posts].reverse().find((p) => new Date(p.published_at).getTime() > current) || null;

  return {
    prev: prev ? { slug: prev.slug, title: prev.title } : null,
    next: next ? { slug: next.slug, title: next.title } : null,
  };
}
