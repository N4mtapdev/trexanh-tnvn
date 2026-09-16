import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';

export const runtime = 'edge';

/**
 * PATCH /api/admin/posts/[id]
 * Body: bất kỳ trường nào — title, excerpt, contentHtml, category, catLabel,
 * catColor, author, thumbUrl, readTime, tags, featured, status, slug.
 * Trigger DB tự lưu bản cũ vào post_revisions trước khi ghi đè.
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
  const strFields = {
    title: 'title',
    excerpt: 'excerpt',
    contentHtml: 'content_html',
    category: 'category',
    catLabel: 'cat_label',
    catColor: 'cat_color',
    author: 'author',
    readTime: 'read_time',
    status: 'status',
    slug: 'slug',
  };
  for (const [bodyKey, col] of Object.entries(strFields)) {
    if (typeof body[bodyKey] === 'string') patch[col] = body[bodyKey].trim();
  }
  if ('thumbUrl' in body) patch.thumb_url = body.thumbUrl?.trim() || null;
  if ('sourceName' in body) patch.source_name = body.sourceName?.trim() || null;
  if ('sourceUrl' in body) patch.source_url = body.sourceUrl?.trim() || null;
  if (Array.isArray(body.tags)) patch.tags = body.tags;
  if (typeof body.featured === 'boolean') patch.featured = body.featured;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Không có trường nào để cập nhật' }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug đã tồn tại.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

/**
 * DELETE /api/admin/posts/[id]
 * Xóa mềm mặc định (status='archived'). Thêm ?hard=1 để xóa cứng.
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
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, hard: true });
  }

  const { data, error } = await supabase
    .from('posts')
    .update({ status: 'archived' })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data, hard: false });
}
