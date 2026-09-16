import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { generateWithFallback, extractJson } from '@/lib/ai-provider';
import { POST_GENERATION_SYSTEM_PROMPT, buildUserMessage } from '@/lib/post-prompt';

// Node runtime thay vì Edge: gọi 3 API ngoài tuần tự có thể vượt giới hạn
// thời gian thực thi ngắn của Edge Runtime trên 1 số gói Vercel.
export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_CATEGORIES = new Set(['chinhTri', 'lichSu', 'hoatDong', 'tuLieu']);
const CATEGORY_DEFAULTS = {
  chinhTri: { catLabel: 'Chính trị', catColor: 'amber' },
  lichSu: { catLabel: 'Lịch sử', catColor: 'blue' },
  hoatDong: { catLabel: 'Hoạt động', catColor: 'emerald' },
  tuLieu: { catLabel: 'Tư liệu', catColor: 'purple' },
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

/** Chuẩn hoá + validate output AI trước khi trả về form — không tin tưởng mù quáng vào JSON model trả. */
function normalizeResult(raw) {
  if (!raw.title?.trim() || !raw.contentHtml?.trim()) {
    throw new Error('AI không trả đủ title/contentHtml');
  }

  const category = VALID_CATEGORIES.has(raw.category) ? raw.category : 'hoatDong';
  const catDefaults = CATEGORY_DEFAULTS[category];

  return {
    title: String(raw.title).slice(0, 200).trim(),
    slug: raw.slug?.trim() ? slugify(raw.slug) : slugify(raw.title),
    excerpt: String(raw.excerpt || '').slice(0, 300).trim(),
    category,
    catLabel: raw.catLabel?.trim() || catDefaults.catLabel,
    catColor: raw.catColor?.trim() || catDefaults.catColor,
    contentHtml: String(raw.contentHtml).trim(),
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 8).map(String) : [],
    readTime: raw.readTime?.trim() || '3 phút đọc',
    author: raw.author?.trim() || 'TreXanh Team',
    sourceName: raw.sourceName?.trim() || '',
    featured: Boolean(raw.featured),
  };
}

/**
 * POST /api/admin/generate-post
 * Body: { rawContent: string }
 * Chuyển nội dung thô thành bài viết có cấu trúc bằng AI (Groq → Gemini →
 * OpenRouter, tự chuyển provider khi bị rate-limit/lỗi). Trả về field rời
 * để đổ vào form /add-data/posts — người dùng luôn xem lại trước khi đăng.
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

  const rawContent = body?.rawContent?.trim();
  if (!rawContent || rawContent.length < 30) {
    return NextResponse.json(
      { error: 'Nội dung quá ngắn — cần ít nhất vài câu để AI xử lý.' },
      { status: 400 }
    );
  }

  let aiResult;
  try {
    aiResult = await generateWithFallback(
      POST_GENERATION_SYSTEM_PROMPT,
      buildUserMessage(rawContent)
    );
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  let parsed;
  try {
    parsed = extractJson(aiResult.text);
  } catch (e) {
    return NextResponse.json(
      { error: `AI (${aiResult.provider}) trả về không đúng định dạng JSON: ${e.message}` },
      { status: 502 }
    );
  }

  let normalized;
  try {
    normalized = normalizeResult(parsed);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }

  return NextResponse.json({ item: normalized, provider: aiResult.provider });
}
