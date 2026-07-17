/**
 * pet-hook.js — Nối trang chính (index.html) với hệ thống Pet Game.
 *
 * 1. Nếu người dùng ĐÃ đăng nhập Google qua pet.html trước đó, mỗi lần họ
 *    mở xem 1 câu hỏi trên trang chính sẽ tự động ghi nhận XP cho pet.
 * 2. Link "Pet Game" ở footer sẽ đổi thành widget mini hiện icon + level +
 *    trạng thái pet thật, thay vì chỉ là link tĩnh — bấm vào vẫn dẫn tới
 *    pet.html như cũ.
 *
 * Nếu CHƯA đăng nhập: không làm gì cả, không hiện thông báo, không ép
 * đăng nhập — trang chính vẫn dùng bình thường như trước giờ.
 *
 * Chống cày đã xử lý ở tầng database (unique constraint user_id+card_id+
 * ngày trong bảng study_activity, xem supabase/schema.sql).
 */
(function () {
    'use strict';

    let supabasePromise = null;
    let cachedPet = null;

    function showToast(msg) {
        if (typeof window.toast === 'function') {
            try { window.toast('bi-star-fill', msg, 2200); return; } catch {}
        }
        /* Fallback nhẹ nếu vì lý do gì đó chưa có toast() từ load.js */
        const el = document.createElement('div');
        el.textContent = msg;
        el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
            background:#0f172a;color:#fff;padding:9px 16px;border-radius:10px;font-size:12.5px;
            font-weight:700;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25)`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2200);
    }

    async function getSupabase() {
        if (!supabasePromise) {
            supabasePromise = (async () => {
                try {
                    const res = await fetch('/api/config');
                    if (!res.ok) return null;
                    const { supabaseUrl, supabaseAnonKey } = await res.json();
                    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
                    return createClient(supabaseUrl, supabaseAnonKey);
                } catch {
                    return null; /* Supabase chưa cấu hình, hoặc mất mạng — im lặng bỏ qua */
                }
            })();
        }
        return supabasePromise;
    }

    /** Hiện avatar Google ở header trang chủ — chỉ hiện khi đã đăng nhập */
    function renderAvatarBadge(user) {
        const link = document.getElementById('userAvatarLink');
        const img  = document.getElementById('userAvatarImg');
        if (!link || !img) return;

        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (!avatarUrl) return; /* không có avatar (hiếm) — giữ ẩn, không hiện badge trống */

        img.src = avatarUrl;
        img.onerror = () => link.classList.add('hidden'); /* avatar link lỗi thì ẩn lại, đỡ hiện ảnh vỡ */
        link.classList.remove('hidden');
    }

    /** Cập nhật link "Pet Game" ở footer thành widget mini hiện trạng thái pet thật */
    async function renderPetWidget(supabase, userId) {
        const link = document.getElementById('petGameLink');
        if (!link) return;

        const { data: pet } = await supabase.from('pets').select('*').eq('user_id', userId).maybeSingle();
        if (!pet) return; /* user đã login nhưng chưa tạo pet — giữ nguyên link tĩnh */

        const { data: synced } = await supabase.rpc('rpc_sync_pet_decay', { p_pet_id: pet.id });
        cachedPet = synced || pet;

        const { data: species } = await supabase.from('pet_species').select('icon').eq('id', cachedPet.species_id).single();
        const icon = species?.icon || '🌱';
        const needsCare = cachedPet.hunger < 30 || cachedPet.happiness < 30 || cachedPet.energy < 30;

        link.innerHTML = `${icon} Lv.${cachedPet.level}${needsCare ? ' <span style="color:#f59e0b">⚠️</span>' : ''}`;
        link.setAttribute('aria-label', `Pet ${cachedPet.name} — Level ${cachedPet.level}`);
        if (needsCare) link.style.borderColor = 'rgba(245,158,11,.5)';
    }

    /** Gọi hàm này khi người dùng xem 1 câu hỏi (cardId dạng "HHT-12") */
    window.trackStudyXP = async function (cardId, category) {
        try {
            const supabase = await getSupabase();
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; /* chưa đăng nhập pet game — bỏ qua êm, không báo lỗi */

            /* upsert với onConflict:'user_id,card_id,study_date' — nếu đã có
               (xem lại câu cũ trong ngày) thì bỏ qua, KHÔNG cộng thêm XP.
               .select() để biết CHẮC có insert thật hay bị bỏ qua do trùng,
               từ đó mới quyết định có nên báo toast hay không. */
            const { data } = await supabase.from('study_activity').upsert(
                { user_id: user.id, card_id: cardId, category },
                { onConflict: 'user_id,card_id,study_date', ignoreDuplicates: true }
            ).select();

            if (data && data.length > 0) {
                showToast('⭐ +2 XP cho pet của bạn!');
                await renderPetWidget(supabase, user.id); /* cập nhật lại widget — có thể vừa lên cấp */
            }
        } catch {
            /* Không để lỗi ở tính năng phụ này ảnh hưởng tới trải nghiệm tra cứu chính */
        }
    };

    /* Khởi tạo widget + avatar ngay khi trang load, nếu user đã đăng nhập từ trước */
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const supabase = await getSupabase();
            if (!supabase) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            renderAvatarBadge(user);
            await renderPetWidget(supabase, user.id);
        } catch {
            /* im lặng bỏ qua — widget chỉ là tiện ích thêm, không phải tính năng lõi */
        }
    });
})();
