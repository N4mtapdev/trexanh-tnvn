/**
 * TREXANH BASE.JS v2.0
 * Template engine chung — inject nav, footer, blobs, dark mode
 * CÁCH DÙNG: <script src="assets/js/base.js"></script>
 *            TreXanh.init({ page: 'blog' }); // 'blog' | 'post'
 */
window.TreXanh = (function () {

    const CFG = {
        siteName: 'TreXanh',
        version:  'v2.4',
        logo:     'assets/images/logo.png',
        homeUrl:  'index.html',
        blogUrl:  'blog.html',
        updated:  '28/06/2026',
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

        // Tailwind — chỉ inject nếu chưa có
        if (!document.querySelector('script[src*="tailwindcss"]')) {
            const tw = document.createElement('script');
            tw.src = 'https://cdn.tailwindcss.com';
            tw.onload = () => { if (window.tailwind) tailwind.config = { darkMode: 'class' }; };
            h.appendChild(tw);
        }
        // Fonts
        if (!document.querySelector('link[href*="Plus+Jakarta"]')) {
            addLink('https://fonts.googleapis.com', 'preconnect');
            const pc2 = document.createElement('link');
            pc2.rel = 'preconnect'; pc2.href = 'https://fonts.gstatic.com';
            pc2.setAttribute('crossorigin', ''); h.appendChild(pc2);
            addLink('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap');
        }
        // Icons
        if (!document.querySelector('link[href*="bootstrap-icons"]'))
            addLink('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css');
        // Animate.css
        if (!document.querySelector('link[href*="animate.css"]'))
            addLink('https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css');
        // SweetAlert2
        if (!document.querySelector('script[src*="sweetalert2"]'))
            addScript('https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js', true);
    }

    /* ── Inject CSS chung ── */
    function _css() {
        if (document.getElementById('tx-base-css')) return;
        const s = document.createElement('style');
        s.id = 'tx-base-css';
        s.textContent = `
            :root {
                --brand:#10b981; --brand-dk:#059669; --brand-deeper:#064e3b;
                --brand-glow:rgba(16,185,129,.22); --brand-soft:rgba(16,185,129,.08);
                --bg:#f0fdf4; --bg2:#ffffff; --text:#0f172a; --muted:#64748b;
                --border:#d1fae5; --shadow:rgba(16,185,129,.07); --fs:14px;
            }
            .dark {
                --bg:#060d18; --bg2:#0c1a2e; --text:#ecfdf5; --muted:#6b7280;
                --border:rgba(16,185,129,.13); --shadow:rgba(0,0,0,.3);
            }
            *,*::before,*::after { box-sizing:border-box; }
            * { -webkit-tap-highlight-color:transparent; }
            body {
                background:var(--bg); color:var(--text);
                font-family:'Plus Jakarta Sans',sans-serif;
                font-size:var(--fs); max-width:415px; margin:0 auto;
                min-height:100vh; overflow-x:hidden;
                transition:background .25s,color .25s;
                display:flex; flex-direction:column;
            }
            .no-sb::-webkit-scrollbar{display:none}
            .no-sb{-ms-overflow-style:none;scrollbar-width:none}

            /* Blobs */
            #tx-blobs{position:fixed;inset:0;max-width:415px;margin:0 auto;pointer-events:none;z-index:0;overflow:hidden}
            .tx-blob{position:absolute;border-radius:50%;filter:blur(55px);opacity:.28;animation:txBlob 9s ease-in-out infinite}
            .tx-blob-1{width:230px;height:230px;background:radial-gradient(circle,rgba(16,185,129,.5),transparent);top:-60px;left:-60px;animation-delay:0s}
            .tx-blob-2{width:180px;height:180px;background:radial-gradient(circle,rgba(59,130,246,.4),transparent);top:38%;right:-50px;animation-delay:-3.5s}
            .tx-blob-3{width:160px;height:160px;background:radial-gradient(circle,rgba(139,92,246,.3),transparent);bottom:20%;left:-40px;animation-delay:-6s}
            .dark .tx-blob{opacity:.1}
            @keyframes txBlob{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(12px,-16px) scale(1.05)}66%{transform:translate(-9px,13px) scale(.96)}}

            /* Progress bar */
            #tx-prog{position:fixed;top:0;left:0;right:0;max-width:415px;margin:0 auto;height:3px;z-index:500;pointer-events:none}
            #tx-prog-bar{height:100%;width:0%;background:linear-gradient(90deg,#10b981,#34d399);transition:width .08s linear;border-radius:0 2px 2px 0}

            /* Font size indicator */
            #tx-fs-ind{position:fixed;bottom:148px;left:50%;transform:translateX(-50%);background:rgba(6,78,59,.9);color:white;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:800;z-index:500;pointer-events:none;opacity:0;transition:opacity .2s;backdrop-filter:blur(10px);white-space:nowrap;display:flex;align-items:center;gap:6px}
            #tx-fs-ind.show{opacity:1}

            /* Nav */
            #tx-nav{background:rgba(240,253,244,.9);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-bottom:1px solid var(--border);transition:background .25s;position:sticky;top:0;z-index:100;padding:12px 16px}
            .dark #tx-nav{background:rgba(6,13,24,.9)}

            /* Logo */
            .tx-logo{background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 0 0 3px rgba(16,185,129,.2),0 4px 14px rgba(16,185,129,.22);width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:txPulse 2.5s ease-in-out infinite}
            @keyframes txPulse{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,.2),0 4px 14px rgba(16,185,129,.22)}50%{box-shadow:0 0 0 6px rgba(16,185,129,.1),0 4px 14px rgba(16,185,129,.22)}}

            /* Nav buttons */
            .tx-hdr-btn{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;background:var(--bg2);border:1.5px solid var(--border);color:var(--muted);cursor:pointer;transition:all .18s;text-decoration:none;font-family:inherit}
            .tx-hdr-btn:active{transform:scale(.88)}
            .tx-fs-btn{width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:var(--bg2);border:1.5px solid var(--border);color:var(--muted);font-size:11px;font-weight:900;cursor:pointer;transition:all .18s;font-family:inherit}
            .tx-fs-btn:active{transform:scale(.88);background:var(--brand-soft);color:var(--brand)}

            /* Breadcrumb */
            .tx-bc{display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:var(--muted);margin-top:8px;flex-wrap:wrap}
            .tx-bc a{color:var(--brand-dk);text-decoration:none;font-weight:800}
            .tx-bc a:hover{text-decoration:underline}

            /* Pulse dot */
            .tx-pdot{width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block;animation:txPring 1.8s infinite;flex-shrink:0}
            @keyframes txPring{0%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}70%{box-shadow:0 0 0 6px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}

            /* Scroll top */
            #tx-st{width:46px;height:46px;border-radius:14px;background:var(--bg2);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;position:fixed;right:18px;bottom:26px;z-index:999;box-shadow:0 4px 18px var(--shadow);cursor:pointer;transition:all .22s;opacity:0;pointer-events:none}
            #tx-st.show{opacity:1;pointer-events:auto}
            #tx-st:active{transform:scale(.9)}

            /* Footer */
            #tx-footer{background:var(--bg2);border-top:1px solid var(--border);padding:20px 16px 32px;margin-top:auto;position:relative;z-index:1}
            .tx-fdiv{height:1px;margin:12px 0;background:linear-gradient(90deg,transparent,var(--border),transparent)}
            .tx-sbadge{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:800;letter-spacing:.4px;padding:4px 10px;border-radius:8px;text-transform:uppercase;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0}
            .dark .tx-sbadge{background:rgba(16,185,129,.1);border-color:rgba(16,185,129,.2)}

            /* Section header */
            .tx-sec-head{display:flex;align-items:center;gap:8px;margin-bottom:14px}
            .tx-sec-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.7px;display:flex;align-items:center;gap:5px;white-space:nowrap;color:var(--text)}
            .tx-sec-line{flex:1;height:1px;background:linear-gradient(90deg,var(--border),transparent)}

            /* Highlight search */
            mark.tx-hl{background:rgba(16,185,129,.2);color:#059669;border-radius:3px;padding:0 2px;font-weight:800}
            .dark mark.tx-hl{background:rgba(16,185,129,.28);color:#34d399}

            /* Skeleton */
            .tx-sk{display:block;border-radius:8px;background:linear-gradient(90deg,var(--border) 25%,rgba(16,185,129,.05) 50%,var(--border) 75%);background-size:200% 100%;animation:txShimmer 1.5s infinite}
            @keyframes txShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

            /* Page content z-index */
            #page-content,#tx-nav,#tx-footer{position:relative;z-index:1}
        `;
        document.head.appendChild(s);
    }

    /* ── Dark mode ── */
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

    /* ── Font size ── */
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

    /* ── Render decorations (blobs, progress, fs indicator, scroll top) ── */
    function _deco() {
        // Blobs
        const b = document.createElement('div');
        b.id = 'tx-blobs'; b.setAttribute('aria-hidden','true');
        b.innerHTML = '<div class="tx-blob tx-blob-1"></div><div class="tx-blob tx-blob-2"></div><div class="tx-blob tx-blob-3"></div>';
        document.body.insertBefore(b, document.body.firstChild);

        // Progress bar
        const p = document.createElement('div');
        p.id = 'tx-prog'; p.setAttribute('aria-hidden','true');
        p.innerHTML = '<div id="tx-prog-bar"></div>';
        document.body.insertBefore(p, document.body.firstChild);

        // FS indicator
        const fi = document.createElement('div');
        fi.id = 'tx-fs-ind';
        fi.innerHTML = '<i class="bi bi-fonts"></i> Cỡ chữ: <span id="tx-fs-val">14</span>px';
        document.body.appendChild(fi);

        // Scroll top
        const st = document.createElement('div');
        st.id = 'tx-st'; st.title = 'Lên đầu trang';
        st.innerHTML = '<i class="bi bi-chevron-up" style="color:var(--muted);font-size:14px"></i>';
        st.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
        document.body.appendChild(st);

        // Scroll listener
        window.addEventListener('scroll', () => {
            const bar = document.getElementById('tx-prog-bar');
            const btn = document.getElementById('tx-st');
            const pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight) * 100;
            if (bar) bar.style.width = pct + '%';
            if (btn) btn.classList.toggle('show', window.scrollY > 300);
        }, { passive: true });
    }

    /* ── Render nav ── */
    function _nav(cfg) {
        const dk = document.documentElement.classList.contains('dark');

        // Breadcrumb
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

    /* ── Render footer ── */
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

    /* ── Public API ── */
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
        _css();
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