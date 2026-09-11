import { supabasePublic } from '@/lib/supabase';

/**
 * Tra 1 câu hỏi theo cardId dạng "PREFIX-N" (vd: "LLCT-5"), khớp định dạng
 * id mà assets/js/load.js gán cho mỗi item: `${category_id}-${row.id}`.
 * Thay thế findCard() tĩnh trong lib/dataset.js cũ.
 */
export async function findCard(cardId) {
  if (!cardId) return null;

  const i = cardId.lastIndexOf('-');
  if (i < 0) return null;

  const categoryId = cardId.slice(0, i);
  const rawId = cardId.slice(i + 1);
  const numericId = Number(rawId);
  if (!Number.isInteger(numericId)) return null;

  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from('questions')
    .select('question, answer, categories(name)')
    .eq('category_id', categoryId)
    .eq('id', numericId)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return null;

  return {
    q: data.question,
    a: data.answer,
    cat: data.categories?.name || categoryId,
  };
}
