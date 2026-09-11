import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';

export const runtime = 'edge';

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * GET /api/admin/posts?limit=50&offset=0
 * Liệt kê bài viết (kể cả draft/archived) cho bảng quản trị.
 */
export async function GET(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
  const offset = Number(searchParams.get('offset') || 0);

  const supabase = supabaseAdmin();
  const { data, error, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data, total: count });
}

/**
 * POST /api/admin/posts
 * Body: { title, excerpt, contentHtml, category, catLabel, catColor?, author?,
 *         thumbUrl?, readTime?, tags?, featured?, sourceName?, sourceUrl?, slug? }
 * slug tự sinh từ title nếu không truyền. Trùng slug (unique constraint) → 409.
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

  const {
    title,
    excerpt,
    contentHtml,
    category,
    catLabel,
    catColor,
    author,
    thumbUrl,
    readTime,
    tags,
    featured,
    sourceName,
    sourceUrl,
  } = body || {};

  if (!title?.trim() || !contentHtml?.trim() || !category?.trim() || !catLabel?.trim()) {
    return NextResponse.json(
      { error: 'Thiếu title, contentHtml, category hoặc catLabel' },
      { status: 400 }
    );
  }

  let slug = body.slug?.trim() || slugify(title);
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: 'Slug không hợp lệ — chỉ chữ thường, số và dấu gạch ngang.' },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      slug,
      title: title.trim(),
      excerpt: excerpt?.trim() || '',
      content_html: contentHtml.trim(),
      category: category.trim(),
      cat_label: catLabel.trim(),
      cat_color: catColor || 'emerald',
      author: author?.trim() || 'TreXanh Team',
      thumb_url: thumbUrl?.trim() || null,
      read_time: readTime?.trim() || '4 phút đọc',
      tags: Array.isArray(tags) ? tags : [],
      featured: Boolean(featured),
      source_name: sourceName?.trim() || null,
      source_url: sourceUrl?.trim() || null,
      created_by: auth.email,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug đã tồn tại, chọn slug khác.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
