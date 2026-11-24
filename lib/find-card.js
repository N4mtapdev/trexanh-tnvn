import { findLocalCard } from '@/lib/local-data';

/**
 * Tra 1 câu hỏi theo cardId dạng "PREFIX-N" (vd: "LLCT-5"), khớp định dạng
 * id mà assets/js/load.js gán cho mỗi item: `${category_id}-${row.id}`.
 *
 * Trước đây tra qua Supabase, giờ tra trực tiếp trong assets/json/*.json
 * vì project Supabase đã mất.
 */
export async function findCard(cardId) {
  return findLocalCard(cardId);
}
