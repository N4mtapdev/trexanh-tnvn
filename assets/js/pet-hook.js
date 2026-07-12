/**
 * pet-hook.js — Nối trang chính (index.html) với hệ thống Pet Game.
 *
 * Nếu người dùng ĐÃ đăng nhập Google qua pet.html trước đó (session còn
 * hiệu lực), mỗi lần họ mở xem 1 câu hỏi trên trang chính sẽ tự động ghi
 * 1 dòng study_activity → trigger ở Postgres tự cộng XP cho pet.
 *
 * Nếu CHƯA đăng nhập: không làm gì cả, không hiện thông báo, không ép
 * đăng nhập — trang chính vẫn dùng bình thường như trước giờ.
 *
 * Chống cày đã xử lý ở tầng database (unique constraint user_id+card_id+
 * ngày trong bảng study_activity, xem supabase/schema.sql) — script này
 * gọi insert thoải mái, trùng thì Postgres tự bỏ qua (silent, không lỗi).
 */
(function () {
    'use strict';

    let supabasePromise = null;

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

    /** Gọi hàm này khi người dùng xem 1 câu hỏi (cardId dạng "HHT-12") */
    window.trackStudyXP = async function (cardId, category) {
        try {
            const supabase = await getSupabase();
            if (!supabase) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; /* chưa đăng nhập pet game — bỏ qua êm, không báo lỗi */

            /* upsert với onConflict:'user_id,card_id,study_date' — nếu đã có
               (xem lại câu cũ trong ngày) thì bỏ qua, KHÔNG cộng thêm XP */
            await supabase.from('study_activity').upsert(
                { user_id: user.id, card_id: cardId, category },
                { onConflict: 'user_id,card_id,study_date', ignoreDuplicates: true }
            );
        } catch {
            /* Không để lỗi ở tính năng phụ này ảnh hưởng tới trải nghiệm tra cứu chính */
        }
    };
})();
