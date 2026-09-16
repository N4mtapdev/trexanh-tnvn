import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';

export const runtime = 'edge';

/**
 * GET /api/admin/questions?cat=LLCT&limit=50&offset=0
 * Liệt kê câu hỏi để hiển thị trong bảng quản trị của /add-data
 * (kể cả draft/archived — khác với /api/data chỉ trả published).
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
  const offset = Number(searchParams.get('offset') || 0);

  const supabase = supabaseAdmin();
  let query = supabase
    .from('questions')
    .select('id, category_id, question, answer, week, week_title, status, created_at, updated_at', { count: 'exact' })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1);

  if (cat) query = query.eq('category_id', cat);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data, total: count });
}

/**
 * POST /api/admin/questions
 * Body: { categoryId, question, answer, week?, weekTitle? }
 * Tạo 1 câu hỏi mới. Thay thế cơ chế cũ: sửa file JSON rồi commit lên GitHub.
 * Ràng buộc trùng lặp (unique constraint) được DB tự kiểm tra — trả lỗi rõ
 * ràng thay vì âm thầm ghi đè hay tạo file JSON hỏng.
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });
  }

  const { categoryId, question, answer, week, weekTitle } = body || {};

  if (!categoryId || !question?.trim() || !answer?.trim()) {
    return NextResponse.json(
      { error: 'Thiếu categoryId, question hoặc answer' },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .insert({
      category_id: categoryId,
      question: question.trim(),
      answer: answer.trim(),
      week: week ?? null,
      week_title: weekTitle?.trim() || null,
      created_by: auth.email,
    })
    .select()
    .single();

  if (error) {
    // Trùng câu hỏi trong cùng danh mục (unique constraint) → lỗi 23505
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Câu hỏi này đã tồn tại trong danh mục — không tạo trùng.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
