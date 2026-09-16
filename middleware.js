import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const config = {
  matcher: ['/add-data', '/add-data/:path*', '/assets/images/:path*'],
};

/** So referer/origin của request với host của chính request đó — tự thích
 *  ứng theo domain thật (không hardcode), kể cả khi đổi sang domain riêng. */
function isSameOrigin(request, host) {
  const referer = request.headers.get('referer') || '';
  const origin = request.headers.get('origin') || '';
  try {
    if (referer && new URL(referer).host === host) return true;
  } catch {}
  try {
    if (origin && new URL(origin).host === host) return true;
  } catch {}
  return false;
}

/** Tra whitelist admin_emails trực tiếp qua Supabase REST API (dùng
 *  service_role key) — middleware chạy Edge Runtime riêng biệt, không dùng
 *  chung được lib/supabase.js (vốn để import trong route handlers/Node),
 *  nên gọi thẳng REST endpoint ở đây cho gọn. */
async function isAdminEmailEdge(email) {
  if (!email) return false;
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/admin_emails?email=eq.${encodeURIComponent(email.toLowerCase())}&select=email`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return false;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

export default async function middleware(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/assets/images/')) {
    /* og-image.png: crawler Zalo/FB/Telegram cần fetch trực tiếp, không
       kèm referer, để render link preview — luôn cho qua.
       posts/: thuộc phần blog, không đụng vào — luôn cho qua. */
    if (
      url.pathname === '/assets/images/og-image.png' ||
      url.pathname.startsWith('/assets/images/posts/')
    ) {
      return NextResponse.next();
    }

    if (isSameOrigin(request, url.host)) return NextResponse.next();

    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }

  /* ── /add-data: yêu cầu đã đăng nhập Google qua Supabase Auth VÀ nằm
     trong whitelist admin_emails ──
     Whitelist đã được kiểm tra 1 lần ở /auth/callback lúc đăng nhập, nhưng
     kiểm tra lại ở đây phòng trường hợp session cũ còn hạn trong khi email
     đã bị gỡ khỏi whitelist sau đó — quyền admin phải mất ngay lập tức chứ
     không đợi session hết hạn.
     Trang /add-data/login không cần bảo vệ (đó chính là trang đăng nhập). */
  if (url.pathname.startsWith('/add-data/login')) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/add-data/login', url);
    return NextResponse.redirect(loginUrl);
  }

  const allowed = await isAdminEmailEdge(user.email);
  if (!allowed) {
    return NextResponse.redirect(new URL('/forbidden', url));
  }

  return response;
}
