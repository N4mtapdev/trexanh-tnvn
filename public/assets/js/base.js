/**
 * TREXANH BASE.JS v1.0 (Next.js port, giữ nguyên logic)
 * Template engine chung — inject nav, footer, blobs, dark mode
 * CÁCH DÙNG: <script src="/assets/js/base.js"></script>
 *            TreXanh.init({ page: 'blog' }); // 'blog' | 'post'
 */
window.TreXanh = (function () {

    const CFG = {
        siteName: 'TreXanh',
        version:  'v1.0',
        logo:     '/assets/images/logo.png',
        homeUrl:  '/',
        blogUrl:  '/blog',
        updated:  '10/09/2026',
        fb: '#', tg: '#', gh: '#',
    };

    let _fs = parseInt(localStorage.getItem('fontSize') || '14');

    /* ── Inject CDN vào <head> nếu chưa có ── */
    function _cdn() {
        const h = document.head;
        function addScript(src, defer) {
            if (document.querySelector(`script[src*="${src.split('/')[4]}"]`)) return;
            const s = document.createElement('script');
            s.src = src; if (defer) s.defer = true; h.appendChild(s);
        }
        function addLink(href, rel, extra) {
            if (document.querySelector(`link[href*="${href.split('//')[1]?.split('/')[0]}"]`)) return;
            const l = document.createElement('link');
            l.rel = rel || 'stylesheet'; l.href = href;
            if (extra) Object.assign(l, extra); h.appendChild(l);
        }

        if (!document.querySelector('link[href*="Plus+Jakarta"]')) {
            addLink('https://fonts.googleapis.com', 'preconnect');
            const pc2 = document.createElement('link');
            pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com';
            pc2.setAttribute('crossorigin', ''); h.appendChild(pc2);
            addLink('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap');
        }
        if (!document.querySelector('link[href*="bootstrap-icons"]'))
            addLink('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');
        if (!document.querySelector('link[href*="animate.css"]'))
            addLink('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');
        if (!document.querySelector('script[src*="sweetalert2"]'))
            addScript('https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js', true);
    }

    /* CSS chung nay đã chuyển hẳn sang /assets/css/main.css (file tĩnh,
       load qua <link> ở mỗi trang gọi TreXanh.init). Hàm _css() tự inject
       <style> trước đây đã bị xóa để tránh 2 nguồn CSS trùng lặp. */


    const darkMode = {
        apply() {
            const saved = localStorage.getItem('theme');
            const sys   = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (saved === 'dark' || (!saved && sys)) {
                document.documentElement.classList.add('dark');
                document.body.classList.add('dark');
            }
        },
        toggle() {
            const dk = document.documentElement.classList.contains('dark');
            document.documentElement.classList.toggle('dark', !dk);
            document.body.classList.toggle('dark', !dk);
            localStorage.setItem('theme', !dk ? 'dark' : 'light');
            const btn = document.getElementById('tx-dark-btn');
            if (btn) btn.querySelector('i').className = `bi ${!dk ? 'bi-sun-fill' : 'bi-moon-stars-fill'}`;
        }
    };

    function _applyFs(size, hint) {
        _fs = Math.max(12, Math.min(20, size));
        document.documentElement.style.setProperty('--fs', _fs + 'px');
        localStorage.setItem('fontSize', _fs);
        if (hint) {
            const ind = document.getElementById('tx-fs-ind');
            const val = document.getElementById('tx-fs-val');
            if (ind && val) {
                val.textContent = _fs;
                ind.classList.add('show');
                clearTimeout(window._txFst);
                window._txFst = setTimeout(() => ind.classList.remove('show'), 1500);
            }
        }
    }

    function _deco() {
        const b = document.createElement('div');
        b.id = 'tx-blobs'; b.setAttribute('aria-hidden','true');
        b.innerHTML = '<div class="tx-blob tx-blob-1"></div><div class="tx-blob tx-blob-2"></div><div class="tx-blob tx-blob-3"></div>';
        document.body.insertBefore(b, document.body.firstChild);

        const p = document.createElement('div');
        p.id = 'tx-prog'; p.setAttribute('aria-hidden','true');
        p.innerHTML = '<div id="tx-prog-bar"></div>';
        document.body.insertBefore(p, document.body.firstChild);

        const fi = document.createElement('div');
        fi.id = 'tx-fs-ind';
        fi.innerHTML = '<i class="bi bi-fonts"></i> Cỡ chữ: <span id="tx-fs-val">14</span>px';
        document.body.appendChild(fi);

        const st = document.createElement('div');
        st.id = 'tx-st'; st.title = 'Lên đầu trang';
        st.innerHTML = '<i class="bi bi-chevron-up" style="color:var(--muted);font-size:14px"></i>';
        st.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
        document.body.appendChild(st);

        window.addEventListener('scroll', () => {
            const bar = document.getElementById('tx-prog-bar');
            const btn = document.getElementById('tx-st');
            const pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight) * 100;
            if (bar) bar.style.width = pct + '%';
            if (btn) btn.classList.toggle('show', window.scrollY > 300);
        }, { passive: true });
    }

    function _nav(cfg) {
        const dk = document.documentElement.classList.contains('dark');

        let bc = '';
        if (cfg.page === 'blog') {
            bc = `<nav class="tx-bc"><a href="${CFG.homeUrl}"><i class="bi bi-house-fill"></i> Trang chủ</a><span style="opacity:.4">›</span><span style="color:var(--text)">Blog</span></nav>`;
        } else if (cfg.page === 'post') {
            bc = `<nav class="tx-bc"><a href="${CFG.homeUrl}"><i class="bi bi-house-fill"></i> Trang chủ</a><span style="opacity:.4">›</span><a href="${CFG.blogUrl}">Blog</a><span style="opacity:.4">›</span><span style="color:var(--text)" id="tx-bc-title">Bài viết</span></nav>`;
        }

        const subtitle = cfg.page === 'blog' ? 'Blog & Tin tức' : cfg.page === 'post' ? 'Chi tiết bài viết' : 'Hệ thống hoạt động';

        const nav = document.createElement('header');
        nav.id = 'tx-nav';
        nav.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;${bc?'margin-bottom:8px':''}">
                <a href="${CFG.homeUrl}" style="display:flex;align-items:center;gap:10px;text-decoration:none">
                    <div class="tx-logo">
                        <img src="${CFG.logo}" alt="${CFG.siteName}" style="width:20px;height:20px;object-fit:contain">
                    </div>
                    <div style="line-height:1.25">
                        <p style="font-size:13px;font-weight:900;text-transform:uppercase;font-style:italic;color:var(--text);margin:0">
                            ${CFG.siteName} <span style="color:#10b981">${CFG.version}</span>
                        </p>
                        <div style="display:flex;align-items:center;gap:5px">
                            <span class="tx-pdot"></span>
                            <p style="font-size:9px;font-weight:700;color:var(--muted);margin:0">${subtitle}</p>
                        </div>
                    </div>
                </a>
                <div style="display:flex;align-items:center;gap:5px">
                    <button onclick="TreXanh.fontDown()" class="tx-fs-btn" title="Giảm cỡ chữ">A−</button>
                    <button onclick="TreXanh.fontUp()"   class="tx-fs-btn" title="Tăng cỡ chữ">A+</button>
                    <button onclick="TreXanh.darkMode.toggle()" class="tx-hdr-btn" id="tx-dark-btn" title="Đổi giao diện">
                        <i class="bi ${dk?'bi-sun-fill':'bi-moon-stars-fill'}" style="font-size:13px"></i>
                    </button>
                    <a href="${CFG.homeUrl}" class="tx-hdr-btn" title="Trang chủ">
                        <i class="bi bi-house-fill" style="font-size:13px"></i>
                    </a>
                </div>
            </div>
            ${bc}
        `;

        const pc = document.getElementById('page-content');
        document.body.insertBefore(nav, pc);
    }

    function _footer() {
        const f = document.createElement('footer');
        f.id = 'tx-footer';
        f.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
                <div style="width:44px;height:44px;border-radius:16px;flex-shrink:0;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,.22)">
                    <img src="${CFG.logo}" alt="${CFG.siteName}" style="width:24px;height:24px;object-fit:contain">
                </div>
                <div>
                    <p style="font-size:12px;font-weight:900;text-transform:uppercase;color:var(--text);margin:0">${CFG.siteName} Developer</p>
                    <p style="font-size:9px;font-weight:700;color:var(--muted);margin:0"><i class="bi bi-calendar-check"></i> Cập nhật: ${CFG.updated}</p>
                </div>
                <span style="margin-left:auto;padding:4px 10px;border-radius:8px;font-size:9px;font-weight:800;text-transform:uppercase;background:rgba(16,185,129,.1);color:#059669;border:1px solid rgba(16,185,129,.2)">${CFG.version}</span>
            </div>
            <div class="tx-fdiv"></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
                <a href="${CFG.homeUrl}" style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:10px;background:var(--bg);border:1.5px solid var(--border);font-size:10px;font-weight:700;color:var(--muted);text-decoration:none">
                    <i class="bi bi-house-fill" style="color:#10b981"></i> Tra cứu
                </a>
                <a href="${CFG.blogUrl}" style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:10px;background:var(--bg);border:1.5px solid var(--border);font-size:10px;font-weight:700;color:var(--muted);text-decoration:none">
                    <i class="bi bi-newspaper" style="color:#3b82f6"></i> Blog
                </a>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="display:flex;gap:12px;font-size:17px;color:var(--muted)">
                    <a href="${CFG.fb}" style="color:var(--muted)" onmouseover="this.style.color='#3b82f6'" onmouseout="this.style.color='var(--muted)'"><i class="bi bi-facebook"></i></a>
                    <a href="${CFG.tg}" style="color:var(--muted)" onmouseover="this.style.color='#38bdf8'" onmouseout="this.style.color='var(--muted)'"><i class="bi bi-telegram"></i></a>
                    <a href="${CFG.gh}" style="color:var(--muted)"><i class="bi bi-github"></i></a>
                </div>
                <span class="tx-sbadge"><span class="tx-pdot"></span> System OK</span>
            </div>
            <p style="text-align:center;font-size:9px;margin-top:16px;font-weight:600;color:var(--muted)">© 2026 ${CFG.siteName} · Dữ liệu TNVN · Mọi quyền được bảo lưu</p>
        `;
        document.body.appendChild(f);
    }

    function setMeta({ title, description, image, url }) {
        if (title) {
            document.title = `${title} | ${CFG.siteName}`;
            document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
        }
        if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
        if (image)       document.querySelector('meta[property="og:image"]')?.setAttribute('content', image);
        if (url)         document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
    }

    function toast(icon, title, timer) {
        if (typeof Swal === 'undefined') return;
        Swal.fire({ toast:true, position:'top', icon, title, showConfirmButton:false, timer:timer||1500 });
    }

    function countUp(el, target, dur) {
        if (!el) return;
        dur = dur || 1100;
        const t0 = performance.now();
        (function step(now) {
            const p = Math.min((now - t0) / dur, 1);
            const e = 1 - Math.pow(2, -10 * p);
            el.textContent = Math.floor(target * e).toLocaleString('vi');
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target.toLocaleString('vi');
        })(t0);
    }

    function relativeTime(dateStr) {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
        if (diff < 60)      return 'Vừa xong';
        if (diff < 3600)    return Math.floor(diff/60) + ' phút trước';
        if (diff < 86400)   return Math.floor(diff/3600) + ' giờ trước';
        if (diff < 2592000) return Math.floor(diff/86400) + ' ngày trước';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    }

    function init(cfg) {
        cfg = cfg || {};
        darkMode.apply();
        _applyFs(_fs, false);
        _cdn();
        _deco();
        _nav(cfg);
        _footer();
        return this;
    }

    return {
        init, setMeta, toast, countUp, relativeTime, darkMode,
        fontUp:   function() { _applyFs(_fs + 1, true); },
        fontDown: function() { _applyFs(_fs - 1, true); },
    };
})();
