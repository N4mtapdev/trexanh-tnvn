/**
 * dev-notice.js — Popup thông báo dự án đã ngừng phát triển.
 *
 * Hiện MỖI LẦN vào trang (không nhớ qua localStorage nữa) — vì đây là
 * thông báo ngừng hẳn, không phải tạm dừng, nên cần hiện liên tục cho
 * người dùng biết rõ tình trạng thay vì chỉ 1 lần.
 */
(function () {
    'use strict';

    function inject() {
        const dk = document.documentElement.classList.contains('dark');
        const overlay = document.createElement('div');
        overlay.id = 'txDevNotice';
        overlay.style.cssText = `position:fixed;inset:0;z-index:99999;display:flex;
            align-items:center;justify-content:center;padding:20px;
            background:rgba(0,0,0,.55);backdrop-filter:blur(2px)`;

        const box = document.createElement('div');
        box.style.cssText = `max-width:380px;width:100%;background:${dk ? '#0c1a2e' : '#ffffff'};
            border-radius:20px;padding:26px 22px;text-align:center;
            box-shadow:0 20px 60px rgba(0,0,0,.35);
            border:1.5px solid ${dk ? 'rgba(16,185,129,.2)' : '#d1fae5'}`;

        box.innerHTML = `
            <div style="font-size:40px;margin-bottom:10px">🛑</div>
            <p style="font-size:15px;font-weight:900;margin:0 0 8px;color:${dk ? '#ecfdf5' : '#0f172a'}">
                Dự án đã ngừng phát triển
            </p>
            <p style="font-size:12.5px;line-height:1.6;color:${dk ? '#9ca3af' : '#64748b'};margin:0 0 20px">
                TreXanh không còn được cập nhật tính năng mới nữa.
                Phần tra cứu câu hỏi/đáp án vẫn hoạt động bình thường — cảm ơn bạn đã đồng hành!
            </p>
            <button id="txDevNoticeClose" style="width:100%;padding:11px;border:none;border-radius:12px;
                background:#10b981;color:#fff;font-size:13px;font-weight:800;cursor:pointer;
                font-family:inherit">Đã hiểu</button>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        /* Đóng được để xem nội dung trang, nhưng KHÔNG lưu lại — sẽ hiện lại
           ở lần vào trang kế tiếp (khác với bản "tạm ngưng" trước đây) */
        document.getElementById('txDevNoticeClose').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();
