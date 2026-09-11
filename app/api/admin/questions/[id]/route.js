import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';

export const runtime = 'edge';

/**
 * PATCH /api/admin/questions/[id]
 * Body: bất kỳ trường nào trong { question, answer, week, weekTitle, status, categoryId }
 * Sửa 1 câu hỏi. Trigger DB tự lưu bản cũ vào question_revisions trước khi ghi đè,
 * nên luôn có thể xem lại/khôi phục nếu sửa nhầm.
 */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'id không hợp lệ' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body không hợp lệ' }, { status: 400 });
  }

  const patch = {};
  if (typeof body.question === 'string') patch.question = body.question.trim();
  if (typeof body.answer === 'string') patch.answer = body.answer.trim();
  if ('week' in body) patch.week = body.week;
  if ('weekTitle' in body) patch.week_title = body.weekTitle?.trim() || null;
  if (typeof body.status === 'string') patch.status = body.status;
  if (typeof body.categoryId === 'string') patch.category_id = body.categoryId;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Không có trường nào để cập nhật' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Câu hỏi trùng với 1 câu đã có trong danh mục.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

/**
 * DELETE /api/admin/questions/[id]
 * Xóa mềm mặc định (chuyển status='archived') để không mất dữ liệu lịch sử.
 * Thêm ?hard=1 để xóa cứng thật sự (hiếm khi cần).
 */
export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'id không hợp lệ' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const hard = searchParams.get('hard') === '1';
  const supabase = supabaseAdmin();

  if (hard) {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, hard: true });
  }

  const { data, error } = await supabase
    .from('questions')
    .update({ status: 'archived' })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data, hard: false });
}
