import { NextResponse } from 'next/server';
import { getLocalQuestions } from '@/lib/local-data';

export const dynamic = 'force-dynamic';

/**
 * GET /api/data?cat=LLCT
 * Trả về mảng câu hỏi của 1 danh mục, format khớp với những gì
 * assets/js/load.js đang mong đợi: { id, question, answer, week?, weekTitle? }
 *
 * Dữ liệu đọc từ assets/json/*.json trong repo (Supabase cũ đã mất).
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat');

  if (!cat) {
    return NextResponse.json({ error: 'Thiếu tham số cat' }, { status: 400 });
  }

  const questions = getLocalQuestions(cat);

  if (!questions) {
    return NextResponse.json({ error: 'Không có danh mục này' }, { status: 404 });
  }

  const formatted = questions.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    ...(row.week != null ? { week: row.week, weekTitle: row.week_title || row.weekTitle } : {}),
  }));

  return NextResponse.json(formatted, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
