import { NextResponse } from 'next/server';
import { supabasePublic } from '@/lib/supabase';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // luôn đọc mới nhất từ DB, không cache build-time

/**
 * GET /api/data?cat=LLCT
 * Trả về mảng câu hỏi của 1 danh mục, format khớp với những gì
 * assets/js/load.js đang mong đợi: { id, question, answer, week?, weekTitle? }
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');

  if (!cat) {
    return NextResponse.json({ error: 'Thiếu tham số cat' }, { status: 400 });
  }

  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from('questions')
    .select('id, question, answer, week, week_title')
    .eq('category_id', cat)
    .eq('status', 'published')
    .order('id', { ascending: true });

  if (error) {
    console.error('[api/data] Supabase error:', error.message);
    return NextResponse.json({ error: 'Không tải được dữ liệu' }, { status: 500 });
  }

  const formatted = (data || []).map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    ...(row.week != null ? { week: row.week, weekTitle: row.week_title } : {}),
  }));

  return NextResponse.json(formatted, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
