import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';

export const runtime = 'edge';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/admin/upload-image
 * Content-Type: multipart/form-data, field "file"
 * Upload 1 ảnh vào bucket Supabase Storage "post-images", trả về URL công khai
 * để dán vào ô thumbnail hoặc <figure><img src="..."> trong nội dung bài viết.
 * Thay thế thư mục tĩnh assets/images/posts/SLUG/ của bản gốc.
 */
export async function POST(request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Request không phải multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Thiếu file ảnh (field "file")' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Định dạng không hỗ trợ: ${file.type}. Chỉ nhận JPEG/PNG/WEBP/GIF.` },
      { status: 415 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Ảnh vượt quá 5MB' }, { status: 413 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const supabase = supabaseAdmin();
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(path);

  return NextResponse.json({ url: publicUrlData.publicUrl, path }, { status: 201 });
}
