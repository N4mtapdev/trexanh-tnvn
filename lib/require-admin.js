import { createServerClient } from '@supabase/ssr';
import { isAdminEmail } from '@/lib/supabase';

/**
 * Kiểm tra request có phải từ 1 session Google đã đăng nhập VÀ nằm trong
 * whitelist admin_emails không. Dùng trong mọi route /api/admin/*.
 *
 * Kiểm tra whitelist lại ở ĐÂY (không chỉ tin session tồn tại) để phòng
 * trường hợp email bị gỡ khỏi whitelist sau khi đã đăng nhập — session
 * cũ vẫn còn hạn nhưng quyền admin phải mất ngay lập tức.
 *
 * @returns {Promise<{ok: true, email: string} | {ok: false, status: number, error: string}>}
 */
export async function requireAdmin(request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, status: 401, error: 'Chưa đăng nhập' };
  }

  const allowed = await isAdminEmail(user.email);
  if (!allowed) {
    return { ok: false, status: 403, error: 'Tài khoản không có quyền truy cập' };
  }

  return { ok: true, email: user.email };
}
