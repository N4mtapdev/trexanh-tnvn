-- ============================================================
-- Migration Phase 2 — chạy file NÀY nếu đã chạy schema.sql (Phase 1) rồi
-- Chỉ thêm phần mới: cột last_decay_at + RPC tính suy giảm theo thời gian
-- ============================================================

alter table pets add column if not exists last_decay_at timestamptz not null default now();

create or replace function rpc_sync_pet_decay(p_pet_id uuid)
returns pets as $$
declare
    v_pet pets;
    v_hours_elapsed numeric;
    v_whole_hours int;
begin
    if auth.uid() is null then raise exception 'not authenticated'; end if;

    select * into v_pet from pets where id = p_pet_id and user_id = auth.uid();
    if v_pet is null then raise exception 'pet_not_found'; end if;

    v_hours_elapsed := extract(epoch from (now() - v_pet.last_decay_at)) / 3600.0;
    v_whole_hours   := floor(v_hours_elapsed)::int;

    if v_whole_hours < 1 then
        return v_pet;
    end if;

    update pets set
        hunger        = greatest(0, hunger    - v_whole_hours * 3),
        happiness     = greatest(0, happiness - v_whole_hours * 2),
        energy        = greatest(0, energy    - v_whole_hours * 1),
        last_decay_at = last_decay_at + (v_whole_hours || ' hours')::interval,
        updated_at    = now()
        where id = p_pet_id
        returning * into v_pet;

    return v_pet;
end;
$$ language plpgsql security definer set search_path = public;

NOTIFY pgrst, 'reload schema';
