/**
 * img-guard.js — Làm khó thao tác kéo-thả / Save Image As / chuột phải
 * lên ảnh trong assets/images/ (slider, logo, thumbnail bài viết...).
 *
 * LƯU Ý: đây là biện pháp "làm khó", KHÔNG phải chặn tuyệt đối — người
 * dùng vẫn có thể lấy ảnh qua DevTools / Network tab / chụp màn hình.
 * Mục tiêu là chặn thao tác chuột phải > Save image / kéo-thả thông thường,
 * không phải bảo mật thật sự.
 *
 * Chỉ áp dụng cho ảnh (thẻ <img> và các phần tử có background-image trỏ
 * tới assets/images/) — KHÔNG chặn chuột phải/copy trên phần text của
 * trang, để không gây khó chịu cho người dùng bình thường.
 */
(function () {
    'use strict';

    const IMG_PATH = 'assets/images';

    function isGuardedImage(el) {
        if (!el) return false;
        if (el.tagName === 'IMG') {
            return (el.currentSrc || el.src || '').includes(IMG_PATH);
        }
        const bg = getComputedStyle(el).backgroundImage || '';
        return bg.includes(IMG_PATH);
    }

    function guard(el) {
        if (!el || el.dataset.imgGuarded) return;
        el.dataset.imgGuarded = '1';
        if (el.tagName === 'IMG') {
            el.setAttribute('draggable', 'false');
        }
        el.style.webkitUserDrag = 'none';
        el.style.userSelect = 'none';
        el.style.webkitTouchCallout = 'none';
    }

    function scan(root) {
        (root.querySelectorAll ? root.querySelectorAll('img, [style*="background-image"]') : [])
            .forEach((el) => { if (isGuardedImage(el)) guard(el); });
    }

    /* Chặn kéo-thả ảnh (Firefox/Chrome "Save Image As" qua drag ra desktop) */
    document.addEventListener('dragstart', (e) => {
        if (isGuardedImage(e.target)) e.preventDefault();
    }, true);

    /* Chặn menu chuột phải — chỉ trên ảnh, không chặn toàn trang */
    document.addEventListener('contextmenu', (e) => {
        if (isGuardedImage(e.target)) e.preventDefault();
    }, true);

    /* Quét ảnh có sẵn khi trang load */
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
