/**
 * session-guard.js — Xử lý phiên đăng nhập hết hạn giữa chừng.
 * Dùng chung cho pet.html và account.html.
 *
 * Vấn đề: supabase-js tự động refresh access token ở nền (mặc định
 * autoRefreshToken:true), nên phần lớn trường hợp người dùng không thấy
 * gì cả — token cứ âm thầm gia hạn. NHƯNG nếu refresh token cũng hết hạn
 * (vắng mặt nhiều ngày) hoặc bị thu hồi (user đổi mật khẩu Google, rút
 * quyền truy cập app...), Supabase sẽ bắn ra sự kiện "SIGNED_OUT" — CÙNG
 * một sự kiện với lúc người dùng chủ động bấm "Đăng xuất"! Cần phân biệt
 * 2 trường hợp này để không hiện nhầm thông báo.
 */

/**
 * Gắn theo dõi trạng thái auth cho 1 supabase client.
 * @param {object} supabase - instance từ createClient()
 * @param {object} opts
 * @param {function} opts.onExpired - gọi khi phiên bị hết hạn/thu hồi NGOÀI Ý MUỐN
 *        (không phải do người dùng chủ động bấm đăng xuất)
 */
export function setupSessionGuard(supabase, { onExpired } = {}) {
    let explicitSignOut = false;

    /* "Đánh dấu" mỗi khi code TỰ gọi signOut() (logout chủ động), để khi
       sự kiện SIGNED_OUT bắn ra sau đó, mình biết đây không phải hết hạn
       ngoài ý muốn — không cần báo "phiên hết hạn" nhầm lẫn. */
    const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
    supabase.auth.signOut = async (...args) => {
        explicitSignOut = true;
        return originalSignOut(...args);
    };

    supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') {
            if (!explicitSignOut && typeof onExpired === 'function') {
                onExpired();
            }
            explicitSignOut = false;
        }
    });
}

/**
 * Kiểm tra 1 lỗi (từ supabase-js hoặc response fetch API riêng) có phải
 * lỗi liên quan tới phiên đăng nhập không (JWT hết hạn/không hợp lệ...),
 * để hiện thông báo rõ ràng thay vì lỗi chung chung khó hiểu.
 */
export function isAuthError(error) {
    if (!error) return false;
    const msg = String(error.message || error.error || '').toLowerCase();
    const status = error.status || error.code;
    return status === 401 ||
        msg.includes('jwt') || msg.includes('token') ||
        msg.includes('expired') || msg.includes('unauthorized') ||
        msg.includes('chưa đăng nhập');
}

/** Thông báo chuẩn khi phát hiện lỗi liên quan phiên đăng nhập, kèm gợi ý
 *  hành động — dùng chung để nhất quán giữa các trang. */
export const SESSION_EXPIRED_MSG = '⚠️ Phiên đăng nhập đã hết hạn. Đang tải lại để đăng nhập lại nhé...';
