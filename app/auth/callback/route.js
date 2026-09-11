import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/supabase';

export const runtime = 'edge';

/**
 * GET /auth/callback?code=...&next=/add-data
 * Google redirect về đây sau khi người dùng đồng ý đăng nhập.
 * Bước quan trọng: dù đăng nhập Google thành công, chỉ email nằm trong
 * bảng admin_emails (whitelist) mới được coi là hợp lệ — mọi email khác
 * bị đăng xuất ngay và đưa về trang báo lỗi.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') || '/add-data';

  if (!code) {
    return NextResponse.redirect(new URL('/add-data/login?error=missing_code', url));
  }

  const cookieStore = cookies();
  const supabase = supabaseServer(cookieStore);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.user) {
    return NextResponse.redirect(new URL('/add-data/login?error=exchange_failed', url));
  }

  const email = data.user.email;
  const allowed = await isAdminEmail(email);

  if (!allowed) {
    // Đăng xuất ngay lập tức — không giữ session cho tài khoản không được phép.
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL('/add-data/login?error=not_authorized', url));
  }

  return NextResponse.redirect(new URL(next, url));
}
