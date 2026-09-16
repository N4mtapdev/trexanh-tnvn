/**
 * Gọi AI để chuyển nội dung thô thành bài viết có cấu trúc (JSON), với
 * cơ chế tự động chuyển nhà cung cấp khi bị rate-limit hoặc lỗi.
 *
 * Thứ tự thử: Groq → Gemini → OpenRouter (dừng ở provider đầu tiên có
 * GROQ_API_KEY/GEMINI_API_KEY/OPENROUTER_API_KEY được cấu hình VÀ trả lời
 * thành công). Provider nào không có API key trong env sẽ bị bỏ qua.
 *
 * Mỗi provider có schema request/response khác nhau nhưng đều expose 1 API
 * dạng "chat completion" — hàm callX() chuẩn hoá về cùng 1 dạng trả về:
 * text string, hoặc ném lỗi để fallback thử provider kế tiếp.
 */

const TIMEOUT_MS = 30000;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

class ProviderError extends Error {
  constructor(message, retryable) {
    super(message);
    this.retryable = retryable;
  }
}

async function callGroq(systemPrompt, userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new ProviderError('GROQ_API_KEY chưa cấu hình', false);

  const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderError(`Groq lỗi ${res.status}: ${body.slice(0, 200)}`, res.status === 429 || res.status >= 500);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError('Groq trả về rỗng', true);
  return text;
}

async function callGemini(systemPrompt, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ProviderError('GEMINI_API_KEY chưa cấu hình', false);

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 4000 },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderError(`Gemini lỗi ${res.status}: ${body.slice(0, 200)}`, res.status === 429 || res.status >= 500);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ProviderError('Gemini trả về rỗng', true);
  return text;
}

async function callOpenRouter(systemPrompt, userMessage) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new ProviderError('OPENROUTER_API_KEY chưa cấu hình', false);

  const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://trexanh-tnvn.vercel.app',
      'X-Title': 'TreXanh',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ProviderError(`OpenRouter lỗi ${res.status}: ${body.slice(0, 200)}`, res.status === 429 || res.status >= 500);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new ProviderError('OpenRouter trả về rỗng', true);
  return text;
}

const PROVIDERS = [
  { name: 'groq', call: callGroq },
  { name: 'gemini', call: callGemini },
  { name: 'openrouter', call: callOpenRouter },
];

/**
 * Gọi lần lượt từng provider đã cấu hình cho tới khi có kết quả.
 * Trả về { text, provider }. Ném lỗi gộp khi tất cả đều thất bại.
 */
export async function generateWithFallback(systemPrompt, userMessage) {
  const errors = [];

  for (const { name, call } of PROVIDERS) {
    try {
      const text = await call(systemPrompt, userMessage);
      return { text, provider: name };
    } catch (e) {
      errors.push(`${name}: ${e.message}`);
      continue;
    }
  }

  throw new Error(`Tất cả provider AI đều thất bại:\n${errors.join('\n')}`);
}

/** Tách JSON từ text trả về — phòng trường hợp model vẫn bọc ```json dù đã dặn không làm vậy. */
export function extractJson(text) {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('Không tìm thấy JSON object trong phản hồi AI');
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  return JSON.parse(cleaned);
}
