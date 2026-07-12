-- ============================================================
-- TreXanh Pet Game — Schema Phase 1
-- Chạy toàn bộ file này trong Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── Loài pet (config tĩnh, admin thêm loài mới bằng cách insert thêm dòng) ──
create table if not exists pet_species (
    id          text primary key,          -- vd 'bamboo_sprite'
    name        text not null,             -- vd 'Tre Con'
    base_hp     int  not null default 100,
    base_atk    int  not null default 10,
    base_def    int  not null default 10,
    icon        text,                      -- emoji hoặc url ảnh
    evolves_to  text references pet_species(id),  -- loài tiến hóa thành (null = chưa có)
    evolves_at_level int default 10
);

-- ── Pet của từng user ──
create table if not exists pets (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    species_id  text not null references pet_species(id),
    name        text not null default 'Pet của tôi',
    level       int  not null default 1,
    xp          int  not null default 0,
    hunger      int  not null default 100 check (hunger between 0 and 100),
    happiness   int  not null default 100 check (happiness between 0 and 100),
    energy      int  not null default 100 check (energy between 0 and 100),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);
create index if not exists idx_pets_user on pets(user_id);

-- ── Lịch sử xem câu hỏi — nguồn XP, đồng thời chống cày (1 câu = 1 XP/ngày/user) ──
create table if not exists study_activity (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    card_id     text not null,             -- vd 'HHT-12'
    category    text not null,
    xp_awarded  int  not null default 2,
    study_date  date not null default current_date,
    created_at  timestamptz not null default now(),
    unique (user_id, card_id, study_date)   -- chặn cày: 1 card/ngày chỉ tính 1 lần
);
create index if not exists idx_study_user_date on study_activity(user_id, study_date);

-- ── Vật phẩm trong kho ──
create table if not exists inventory_items (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    item_type   text not null check (item_type in ('food', 'toy')),
    quantity    int  not null default 0 check (quantity >= 0),
    unique (user_id, item_type)
);

-- ── Nhật ký nhận thưởng hàng ngày — nguồn để tính cap (3 thi / 3 QC-food / 3 QC-toy mỗi ngày) ──
create table if not exists daily_rewards (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    reward_date date not null default current_date,
    source      text not null check (source in ('quiz', 'ad_food', 'ad_toy')),
    item_type   text not null check (item_type in ('food', 'toy')),
    created_at  timestamptz not null default now()
);
create index if not exists idx_daily_rewards_lookup on daily_rewards(user_id, reward_date, source);

-- ── Phiên thi (quiz) — lưu lại để tránh gian lận + thống kê ──
create table if not exists quiz_sessions (
    id          bigint generated always as identity primary key,
    user_id     uuid not null references auth.users(id) on delete cascade,
    category    text not null,
    total_q     int  not null,
    correct_q   int  not null,
    passed      boolean not null,
    created_at  timestamptz not null default now()
);


-- ============================================================
-- TRIGGER — tự cộng XP vào pet khi có study_activity mới
-- Chạy với quyền SECURITY DEFINER (bỏ qua RLS) — đây là CÁCH DUY NHẤT
-- pets.xp được thay đổi, client không bao giờ UPDATE trực tiếp cột này được
-- ============================================================
create or replace function fn_award_study_xp() returns trigger as $$
declare
    v_pet pets;
    v_new_level int;
    v_species pet_species;
begin
    update pets set xp = xp + new.xp_awarded, updated_at = now()
        where user_id = new.user_id
        returning * into v_pet;

    if v_pet is null then
        return new; /* user chưa có pet — bỏ qua, không lỗi */
    end if;

    /* Công thức lên cấp đơn giản: level = floor(xp/100) + 1 */
    v_new_level := floor(v_pet.xp / 100.0) + 1;

    if v_new_level > v_pet.level then
        update pets set level = v_new_level where id = v_pet.id returning * into v_pet;
    end if;

    /* Tự tiến hóa nếu đủ level và loài hiện tại có bậc tiến hóa kế tiếp */
    select * into v_species from pet_species where id = v_pet.species_id;
    if v_species.evolves_to is not null and v_pet.level >= coalesce(v_species.evolves_at_level, 999999) then
        update pets set species_id = v_species.evolves_to where id = v_pet.id;
    end if;

    return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_award_study_xp on study_activity;
create trigger trg_award_study_xp
    after insert on study_activity
    for each row execute function fn_award_study_xp();


-- ============================================================
-- ROW LEVEL SECURITY — bắt buộc, đây là lớp bảo vệ THẬT SỰ
-- ============================================================
alter table pets              enable row level security;
alter table study_activity    enable row level security;
alter table inventory_items   enable row level security;
alter table daily_rewards     enable row level security;
alter table quiz_sessions     enable row level security;
alter table pet_species       enable row level security;

-- pet_species: ai cũng đọc được (config công khai), không ai ghi được qua client
create policy "species_select_all" on pet_species for select using (true);

-- pets: user chỉ thấy pet của chính mình, và chỉ tự đổi được "name" trực
-- tiếp. TẠO pet mới và mọi thay đổi stat (xp/level/hunger/happiness/energy)
-- đều phải qua RPC function (security definer) — không có policy/grant
-- INSERT thông thường cho client, để không ai tự tạo pet với xp/level tùy ý.
create policy "pets_select_own" on pets for select using (auth.uid() = user_id);
create policy "pets_update_own" on pets for update using (auth.uid() = user_id);

revoke insert, update on pets from authenticated;
grant update (name) on pets to authenticated;

-- Phase 1: mỗi user 1 pet. Bỏ dòng constraint này khi làm Phase 3 (nhiều pet).
alter table pets add constraint uniq_one_pet_per_user unique (user_id);


-- ============================================================
-- RPC — tạo pet khởi đầu (stat CỐ ĐỊNH, bỏ qua mọi giá trị client gửi lên
-- ngoài species_id/name) — chỉ tạo được nếu user CHƯA có pet nào
-- ============================================================
create or replace function rpc_create_starter_pet(p_species_id text, p_name text)
returns pets as $$
declare
    v_pet pets;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    insert into pets (user_id, species_id, name, level, xp, hunger, happiness, energy)
    values (auth.uid(), p_species_id, coalesce(nullif(trim(p_name), ''), 'Pet của tôi'), 1, 0, 100, 100, 100)
    returning * into v_pet;

    return v_pet;
end;
$$ language plpgsql security definer set search_path = public;

-- ============================================================
-- RPC — cho ăn / chơi với pet (atomic: kiểm tra đủ đồ trong kho, trừ đồ,
-- cộng chỉ số, tất cả trong 1 transaction — không tách rời như 2 request
-- riêng để tránh vừa mất đồ vừa không được cộng chỉ số nếu lỗi giữa chừng)
-- ============================================================
create or replace function rpc_feed_pet(p_pet_id uuid)
returns pets as $$
declare
    v_qty int;
    v_pet pets;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;

    select quantity into v_qty from inventory_items
        where user_id = auth.uid() and item_type = 'food' for update;
    if v_qty is null or v_qty < 1 then
        raise exception 'not_enough_food';
    end if;

    update inventory_items set quantity = quantity - 1
        where user_id = auth.uid() and item_type = 'food';

    update pets set
        hunger = least(100, hunger + 30),
        energy = least(100, energy + 5),
        updated_at = now()
        where id = p_pet_id and user_id = auth.uid()
        returning * into v_pet;

    if v_pet is null then raise exception 'pet_not_found'; end if;
    return v_pet;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function rpc_play_pet(p_pet_id uuid)
returns pets as $$
declare
    v_qty int;
    v_pet pets;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;

    select quantity into v_qty from inventory_items
        where user_id = auth.uid() and item_type = 'toy' for update;
    if v_qty is null or v_qty < 1 then
        raise exception 'not_enough_toy';
    end if;

    update inventory_items set quantity = quantity - 1
        where user_id = auth.uid() and item_type = 'toy';

    update pets set
        happiness = least(100, happiness + 30),
        energy    = greatest(0, energy - 10),
        updated_at = now()
        where id = p_pet_id and user_id = auth.uid()
        returning * into v_pet;

    if v_pet is null then raise exception 'pet_not_found'; end if;
    return v_pet;
end;
$$ language plpgsql security definer set search_path = public;

-- study_activity: chỉ chèn/đọc của chính mình. KHÔNG cho update/delete — vì
-- đây là log chống cày, sửa được thì mất tác dụng chống gian lận
create policy "study_select_own" on study_activity for select using (auth.uid() = user_id);
create policy "study_insert_own" on study_activity for insert with check (auth.uid() = user_id);

-- inventory_items: client CHỈ được xem kho đồ của mình. Số lượng thay đổi
-- (cộng khi thưởng, trừ khi cho ăn/chơi) đều đi qua RPC function — không có
-- policy insert/update/delete cho client, tránh tự ý set quantity tùy ý.
create policy "inventory_select_own" on inventory_items for select using (auth.uid() = user_id);

-- daily_rewards: chỉ đọc của mình. INSERT chỉ nên qua Edge Function (service
-- role) để đảm bảo cap được kiểm tra đúng trước khi ghi — KHÔNG có policy
-- insert cho client ở đây (cố tình), ép mọi lượt "nhận thưởng" phải qua server
create policy "daily_rewards_select_own" on daily_rewards for select using (auth.uid() = user_id);

-- quiz_sessions: tương tự — chỉ đọc trực tiếp, ghi qua Edge Function
create policy "quiz_sessions_select_own" on quiz_sessions for select using (auth.uid() = user_id);


-- ============================================================
-- RPC — cộng vật phẩm an toàn (atomic upsert), gọi qua service role
-- từ Edge Function sau khi đã kiểm tra cap. Tránh race condition nếu
-- 2 request cùng lúc (vd double-click, mất mạng bấm lại...)
-- ============================================================
create or replace function rpc_increment_inventory(
    p_user_id uuid, p_item_type text, p_amount int
) returns void as $$
begin
    insert into inventory_items (user_id, item_type, quantity)
    values (p_user_id, p_item_type, p_amount)
    on conflict (user_id, item_type)
    do update set quantity = inventory_items.quantity + excluded.quantity;
end;
$$ language plpgsql security definer set search_path = public;

-- QUAN TRỌNG: mặc định Postgres/Supabase cấp quyền EXECUTE hàm cho role
-- "authenticated" — nếu không revoke, BẤT KỲ user đã đăng nhập nào cũng gọi
-- thẳng được RPC này qua REST API để tự cộng vật phẩm vô hạn cho mình,
-- bỏ qua hoàn toàn cap kiểm tra ở api/quiz/submit.js và api/ads/claim.js.
-- Hàm này CHỈ được gọi bởi service role (từ Edge Function, sau khi đã tự
-- kiểm tra cap) — service role không bị ảnh hưởng bởi revoke này.
revoke execute on function rpc_increment_inventory(uuid, text, int) from public, anon, authenticated;


-- ============================================================
-- DỮ LIỆU MẪU — vài loài pet ban đầu (sửa/thêm tùy ý)
-- ============================================================
insert into pet_species (id, name, base_hp, base_atk, base_def, icon, evolves_to, evolves_at_level) values
    ('bamboo_sprite', 'Tre Con',    80, 8,  8,  '🌱', 'bamboo_guard', 10),
    ('bamboo_guard',  'Tre Vệ Sĩ',  140, 16, 14, '🎋', null, null)
on conflict (id) do nothing;
