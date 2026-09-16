'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase chạy trong trình duyệt — dùng cho luồng OAuth Google
 * (supabase.auth.signInWithOAuth) trên trang /add-data/login.
 * Khác với lib/supabase.js (server-only, service_role/anon cho API routes).
 */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
