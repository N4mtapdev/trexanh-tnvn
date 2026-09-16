import { createServerClient } from '@supabase/ssr';

/**
 * Client Supabase server-side dùng cookie của request để biết ai đang
 * đăng nhập (qua Google OAuth). Dùng trong middleware + route handler
 * để kiểm tra session, KHÁC với supabaseAdmin() (service_role, bỏ qua
 * auth hoàn toàn) và supabasePublic() (anon, không biết ai đăng nhập).
 *
 * cookieStore: object có get/set/remove — truyền vào từ
 * next/headers cookies() (route handler) hoặc từ request/response
 * cookies API (middleware).
 */
export function supabaseServer(cookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            /* set() có thể no-op trong Server Component thuần đọc — bỏ qua an toàn */
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            /* tương tự set() */
          }
        },
      },
    }
  );
}
