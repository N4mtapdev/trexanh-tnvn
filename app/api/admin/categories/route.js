import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';

export const runtime = 'edge';

/** GET /api/admin/categories — liệt kê tất cả danh mục (kể cả ẩn) cho dropdown trong /add-data. */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, color, sort_order, is_active')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

/**
 * POST /api/admin/categories
 * Body: { id, name, icon?, color?, sortOrder? }
 * Thêm danh mục mới — trước đây phải sửa code (mảng filesToLoad trong load.js),
 * giờ chỉ cần thêm 1 dòng trong DB và trang chính tự nhận ngay.
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

  const { id, name, icon, color, sortOrder } = body || {};
  if (!id?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'Thiếu id hoặc name' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('categories')
    .insert({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      icon: icon || 'bi-journal-bookmark-fill',
      color: color || 'emerald',
      sort_order: sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Mã danh mục đã tồn tại' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
