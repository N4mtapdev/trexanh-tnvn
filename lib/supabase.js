import { createClient } from '@supabase/supabase-js';

/**
 * Client "public" — dùng cho các API đọc dữ liệu công khai (/api/data, /api/og).
 * Dùng anon key, chịu sự ràng buộc của RLS (chỉ đọc được status = 'published').
 *
 * Dùng SUPABASE_URL / SUPABASE_ANON_KEY (không có tiền tố NEXT_PUBLIC_) vì
 * các route này chỉ chạy ở server (route handlers), không cần lộ ra client.
 * Trên Vercel project chỉ có SUPABASE_URL/SUPABASE_ANON_KEY (không có bản
 * NEXT_PUBLIC_), nên dùng nhầm tên biến trước đây khiến client luôn khởi
 * tạo với URL rỗng và mọi query đều fail âm thầm.
 */
let _publicClient = null;
export function supabasePublic() {
  if (!_publicClient) {
    _publicClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _publicClient;
}

/**
 * Client "admin" — CHỈ dùng trong route handler server-side đã xác thực
 * qua Google OAuth + whitelist (xem lib/require-admin.js + app/add-data).
 * Dùng service_role key, bỏ qua RLS — vì vậy KHÔNG BAO GIỜ để lộ ra client.
 */
let _adminClient = null;
export function supabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _adminClient;
}

/**
 * Kiểm tra email đã đăng nhập Google có trong whitelist admin không.
 * Bảng admin_emails không có RLS policy public nên phải dùng service_role
 * để đọc — vì vậy hàm này CHỈ được gọi từ server (route handler/middleware),
 * không bao giờ từ client.
 */
export async function isAdminEmail(email) {
  if (!email) return false;
  const { data, error } = await supabaseAdmin()
    .from('admin_emails')
    .select('email')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  if (error) {
    console.error('[isAdminEmail] lỗi tra whitelist:', error.message);
    return false;
  }
  return Boolean(data);
}
