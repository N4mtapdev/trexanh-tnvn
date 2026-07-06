/**
 * img-guard.js — Làm khó thao tác chọn / kéo-thả / Save Image As / chuột
 * phải lên ảnh trong assets/images/ (slider, logo, thumbnail bài viết...).
 *
 * LƯU Ý: đây là biện pháp "làm khó", KHÔNG phải chặn tuyệt đối — người
 * dùng vẫn có thể lấy ảnh qua DevTools / Network tab / chụp màn hình.
 *
 * Chỉ áp dụng cho ảnh (thẻ <img> và các phần tử có background-image trỏ
 * tới assets/images/) — KHÔNG chặn chuột phải/copy trên phần text của
 * trang, để không gây khó chịu cho người dùng bình thường.
 */
(function () {
    'use strict';

    const IMG_PATH = 'assets/images';

    /* Inject CSS ngay lập tức (không chờ DOMContentLoaded) — chặn cả việc
       bôi đen/chọn ảnh bằng cách rê chuột (khác với text selection), và
       cần đủ vendor prefix vì unprefixed user-select không đủ trên mọi
       trình duyệt (đặc biệt Safari/iOS). !important để không bị CSS khác
       của trang (Tailwind, inline style...) ghi đè. */
    const style = document.createElement('style');
    style.textContent = `
        img, [style*="background-image"] {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-user-drag: none !important;
            -webkit-touch-callout: none !important;
        }
    `;
    document.head.appendChild(style);

    function isGuardedImage(el) {
        if (!el || el.nodeType !== 1) return false;
        if (el.tagName === 'IMG') {
            return (el.currentSrc || el.src || '').includes(IMG_PATH);
        }
        const bg = getComputedStyle(el).backgroundImage || '';
        return bg.includes(IMG_PATH);
    }

    function guard(el) {
        if (!el || el.dataset.imgGuarded) return;
        el.dataset.imgGuarded = '1';
        if (el.tagName === 'IMG') el.setAttribute('draggable', 'false');
    }

    function scan(root) {
        if (!root.querySelectorAll) return;
        root.querySelectorAll('img, [style*="background-image"]')
            .forEach((el) => { if (isGuardedImage(el)) guard(el); });
    }

    /* Chặn kéo-thả ảnh (Firefox/Chrome "Save Image As" qua drag ra desktop) */
    document.addEventListener('dragstart', (e) => {
        if (isGuardedImage(e.target)) e.preventDefault();
    }, true);

    /* Chặn bôi đen/chọn ảnh bằng chuột (mousedown trên ảnh) */
    document.addEventListener('mousedown', (e) => {
        if (isGuardedImage(e.target)) e.preventDefault();
    }, true);

    /* Chặn menu chuột phải — chỉ trên ảnh, không chặn toàn trang */
    document.addEventListener('contextmenu', (e) => {
        if (isGuardedImage(e.target)) e.preventDefault();
    }, true);

    /* Quét ảnh có sẵn — chạy ngay (script đặt cuối body nên DOM đã có),
       và chạy lại khi DOMContentLoaded phòng trường hợp script bị defer */
    scan(document);
    document.addEventListener('DOMContentLoaded', () => scan(document));

    /* Quét ảnh được thêm động (slider, thumbnail blog/post load qua JS) */
    new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach((node) => {
                if (node.nodeType !== 1) return;
                if (isGuardedImage(node)) guard(node);
                scan(node);
            });
        }
    }).observe(document.documentElement, { childList: true, subtree: true });
})();
