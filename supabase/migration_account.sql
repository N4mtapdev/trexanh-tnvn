-- ============================================================
-- Migration — Hệ thống tài khoản (Account System)
-- Chạy SAU KHI đã chạy schema.sql (Phase 1) + migration_phase2.sql
-- ============================================================

-- ── Thông tin hồ sơ tùy chỉnh — tách riêng khỏi auth.users vì Google có
--    thể ghi đè user_metadata mỗi lần đăng nhập lại; display_name ở đây
--    do NGƯỜI DÙNG tự đặt, không bị Google đồng bộ đè lên. ──
create table if not exists profiles (
    user_id      uuid primary key references auth.users(id) on delete cascade,
    display_name text,
    updated_at   timestamptz not null default now()
);

alter table profiles enable row level security;

-- Chỉ xem/sửa được hồ sơ của chính mình — display_name chỉ là text tự do,
-- không có trường số/nhạy cảm nào cần bảo vệ thêm như bảng pets, nên RLS
-- theo dòng (row-level) là đủ, không cần khoá thêm theo cột.
create policy "profiles_select_own" on profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
