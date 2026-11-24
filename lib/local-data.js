/**
 * DỮ LIỆU CÔNG KHAI — đọc trực tiếp từ file trong repo.
 *
 * Trước đây câu hỏi/đáp án và bài viết nằm trong Supabase. Project Supabase
 * đó đã mất, nên các trang công khai (/api/data, /api/posts, /blog/[slug],
 * /api/og) giờ đọc từ:
 *   - assets/json/HHT.json, assets/json/KTHTCBHLLCT.json  → câu hỏi/đáp án
 *   - data/posts.json                                     → bài viết blog
 *
 * Muốn thêm/sửa dữ liệu thì sửa trực tiếp các file trên rồi deploy lại.
 * Các route /api/admin/* vẫn là code cũ dùng Supabase — hiện không còn
 * hoạt động vì project Supabase đã mất, không dùng cho phần public nữa.
 */
import HHT_QUESTIONS from '@/assets/json/HHT.json';
import LLCT_QUESTIONS from '@/assets/json/KTHTCBHLLCT.json';
import LOCAL_POSTS from '@/data/posts.json';

export const LOCAL_DATASETS = {
  HHT: HHT_QUESTIONS,
  LLCT: LLCT_QUESTIONS,
};

export const CATEGORY_NAMES = {
  HHT: 'TBT Hà Huy Tập',
  LLCT: 'Lý Luận Chính Trị',
};

/** Mảng câu hỏi của 1 danh mục (đúng format load.js mong đợi), null nếu không có. */
export function getLocalQuestions(cat) {
  const key = String(cat || '').toUpperCase();
  return LOCAL_DATASETS[key] || null;
}

/** Bài viết đã publish, mới nhất trước. */
export function getLocalPosts() {
  return LOCAL_POSTS.filter((p) => p.status === 'published').sort(
    (a, b) => new Date(b.published_at) - new Date(a.published_at)
  );
}

export function getLocalPostBySlug(slug) {
  return getLocalPosts().find((p) => p.slug === slug) || null;
}

/** Tra 1 câu hỏi theo cardId dạng "PREFIX-N" (vd: "LLCT-5"). */
export function findLocalCard(cardId) {
  if (!cardId) return null;
  const i = cardId.lastIndexOf('-');
  if (i < 0) return null;

  const prefix = cardId.slice(0, i);
  const rawId = cardId.slice(i + 1);
  const list = LOCAL_DATASETS[prefix];
  if (!list) return null;

  const item = list.find((x) => String(x.id) === rawId);
  if (!item) return null;

  return {
    q: item.question || item.q || '',
    a: item.answer || item.a || '',
    cat: CATEGORY_NAMES[prefix] || prefix,
  };
}
