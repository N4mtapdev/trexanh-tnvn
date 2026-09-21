'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export default function HomePage() {
  /* ============================================================
     TOÀN BỘ LOGIC INLINE TỪ index.html GỐC — port nguyên vẹn
     Chạy 1 lần sau khi component mount (giống DOMContentLoaded)
  ============================================================ */
  useEffect(() => {
    /* ---- Dark mode đã áp dụng ở layout.js (chạy trước khi paint) ---- */

    /* ---- FONT SIZE A-/A+ ---- */
    let currentFs = parseInt(localStorage.getItem('fontSize') || '14');

    function applyFs(size, hint = true) {
      currentFs = Math.max(12, Math.min(20, size));
      document.documentElement.style.setProperty('--fs', currentFs + 'px');
      localStorage.setItem('fontSize', currentFs);
      if (hint) {
        const el = document.getElementById('fsIndicator');
        const val = document.getElementById('fsValue');
        if (el && val) {
          val.textContent = currentFs;
          el.classList.add('show');
          clearTimeout(window._fst);
          window._fst = setTimeout(() => el.classList.remove('show'), 1500);
        }
      }
    }
    applyFs(currentFs, false);
    window.changeFontSize = (d) => applyFs(currentFs + d);

    /* ---- COUNT-UP ---- */
    window.countUp = function (el, target, dur = 1100) {
      if (!el) return;
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min((now - t0) / dur, 1);
        const e = 1 - Math.pow(2, -10 * p);
        el.textContent = Math.floor(target * e).toLocaleString('vi');
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('vi');
      })(t0);
    };

    /* ---- TOGGLE DARK MODE (dùng trong settings modal) ---- */
    window.toggleDarkMode = function (isDark) {
      document.documentElement.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark', isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      if (typeof window.Swal !== 'undefined') window.Swal.close();
    };

    /* ---- SETTINGS MODAL ---- */
    function handleSettings() {
      if (typeof window.Swal === 'undefined') return;
      const dk = document.documentElement.classList.contains('dark');
      window.Swal.fire({
        title:
          '<span style="font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.5px">⚙️ Cài đặt</span>',
        background: dk ? '#0c1a2e' : '#fff',
        color: dk ? '#ecfdf5' : '#0f172a',
        html: `
          <div style="margin-top:10px;text-align:left">
            <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;color:#64748b">
              <i class="bi bi-palette-fill"></i> Giao diện
            </p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
              <div onclick="toggleDarkMode(false)" style="padding:12px;border-radius:14px;border:2px solid ${!dk ? '#10b981' : '#334155'};
                   background:${!dk ? 'rgba(16,185,129,.08)' : 'transparent'};cursor:pointer;text-align:center;transition:all .2s">
                <i class="bi bi-sun-fill" style="font-size:22px;color:${!dk ? '#10b981' : '#64748b'}"></i>
                <p style="font-size:10px;font-weight:800;margin-top:6px">Sáng</p>
              </div>
              <div onclick="toggleDarkMode(true)" style="padding:12px;border-radius:14px;border:2px solid ${dk ? '#10b981' : '#334155'};
                   background:${dk ? 'rgba(16,185,129,.08)' : 'transparent'};cursor:pointer;text-align:center;transition:all .2s">
                <i class="bi bi-moon-stars-fill" style="font-size:22px;color:${dk ? '#10b981' : '#64748b'}"></i>
                <p style="font-size:10px;font-weight:800;margin-top:6px">Tối</p>
              </div>
            </div>
            <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;color:#64748b">
              <i class="bi bi-fonts"></i> Cỡ chữ (${currentFs}px)
            </p>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
              <button onclick="changeFontSize(-1)"
                style="flex:1;padding:9px;border-radius:10px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);
                       font-size:14px;font-weight:900;color:#059669;cursor:pointer">A−</button>
              <button onclick="changeFontSize(1)"
                style="flex:1;padding:9px;border-radius:10px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);
                       font-size:14px;font-weight:900;color:#059669;cursor:pointer">A+</button>
            </div>
            <p style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px;color:#64748b">
              <i class="bi bi-tools"></i> Tính năng nhanh
            </p>
            <div style="display:flex;flex-direction:column;gap:6px">
              <button onclick="Swal.close();window.handleSort&&window.handleSort()"
                style="padding:9px 12px;border-radius:11px;background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.18);
                       font-size:11px;font-weight:700;color:#059669;text-align:left;cursor:pointer;width:100%;display:flex;align-items:center;gap:6px">
                <i class="bi bi-sort-down-alt"></i> Sắp xếp dữ liệu
              </button>
              <button onclick="Swal.close();window.clearSearchAndReset&&clearSearchAndReset()"
                style="padding:9px 12px;border-radius:11px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.18);
                       font-size:11px;font-weight:700;color:#2563eb;text-align:left;cursor:pointer;width:100%;display:flex;align-items:center;gap:6px">
                <i class="bi bi-arrow-counterclockwise"></i> Reset tìm kiếm
              </button>
            </div>
          </div>`,
        showConfirmButton: false,
      });
    }

    /* ---- PROFILE MODAL ---- */
    function handleProfile() {
      if (typeof window.Swal === 'undefined') return;
      const dk = document.documentElement.classList.contains('dark');
      window.Swal.fire({
        title: '🌿 TreXanh',
        background: dk ? '#0c1a2e' : '#fff',
        color: dk ? '#ecfdf5' : '#0f172a',
        html: `<div style="font-size:11px;line-height:2.2;margin-top:6px;text-align:left">
            <p><i class="bi bi-check-circle-fill" style="color:#10b981"></i> Hệ thống hoạt động bình thường</p>
            <p><i class="bi bi-database-fill" style="color:#3b82f6"></i> Dữ liệu: <b id="mp-t">…</b> câu hỏi</p>
            <p><i class="bi bi-hand-index-fill" style="color:#10b981"></i> Double-tap card → copy nhanh</p>
            <p><i class="bi bi-image-fill" style="color:#8b5cf6"></i> Share card thành ảnh PNG</p>
            <p><i class="bi bi-fonts" style="color:#f59e0b"></i> Điều chỉnh cỡ chữ A− / A+</p>
            <p><i class="bi bi-highlighter" style="color:#10b981"></i> Highlight từ khóa tìm kiếm</p>
            <p><i class="bi bi-bar-chart-fill" style="color:#3b82f6"></i> Số liệu count-up animation</p>
          </div>`,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Tuyệt vời! 👍',
        didOpen: () => {
          const el = document.getElementById('mp-t');
          const total = document.getElementById('stat-total');
          if (el && total) el.textContent = total.textContent;
        },
      });
    }

    /* ---- NHẠC NỀN ---- */
    const music = document.getElementById('bgMusic');
    const musicBtn = document.getElementById('musicBtn');
    const musicIcon = document.getElementById('musicIcon');
    let isMusicOn = false;
    if (music) music.volume = 0.18;

    function toggleMusic() {
      if (!music || !musicBtn || !musicIcon) return;
      if (isMusicOn) {
        music.pause();
        musicBtn.classList.remove('active');
        musicIcon.style.color = 'var(--muted)';
      } else {
        music.play().catch(() => {
          if (typeof window.Swal !== 'undefined')
            window.Swal.fire({
              toast: true,
              position: 'top',
              title: '<i class="bi bi-music-note-beamed"></i> Nhấn thêm lần nữa để bật nhạc',
              timer: 1600,
              showConfirmButton: false,
            });
        });
        musicBtn.classList.add('active');
        musicIcon.style.color = 'white';
      }
      isMusicOn = !isMusicOn;
    }

    /* ---- SLIDER ---- */
    let sliderCleanup = () => {};
    (function initSlider() {
      const slides = document.querySelectorAll('#headerSlider .slide');
      const dots = document.getElementById('sliderDots');
      if (!slides.length || !dots) return;
      let cur = 0;
      let tm = null;

      dots.innerHTML = '';
      slides.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 's-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('role', 'tab');
        d.setAttribute('aria-label', `Slide ${i + 1}`);
        d.addEventListener('click', () => go(i));
        dots.appendChild(d);
      });

      function go(i) {
        slides[cur].classList.remove('active');
        dots.children[cur].classList.remove('active');
        cur = i;
        slides[cur].classList.add('active');
        dots.children[cur].classList.add('active');
      }
      const start = () => {
        tm = setInterval(() => go((cur + 1) % slides.length), 4500);
      };
      const stop = () => clearInterval(tm);

      const el = document.getElementById('headerSlider');
      if (el) {
        el.addEventListener('mouseenter', stop);
        el.addEventListener('mouseleave', start);
        el.addEventListener('touchstart', stop, { passive: true });
        el.addEventListener('touchend', () => { stop(); start(); }, { passive: true });
      }
      start();
      sliderCleanup = () => stop();
    })();

    /* ---- SEARCH: nút X clear + quick chips ---- */
    const si = document.getElementById('mainSearch');
    const bc = document.getElementById('btnClear');

    function onSearchInput() {
      if (bc) bc.classList.toggle('hidden', !si.value);
    }
    if (si) si.addEventListener('input', onSearchInput);

    window.clearSearch = function () {
      if (!si) return;
      si.value = '';
      if (bc) bc.classList.add('hidden');
      si.dispatchEvent(new Event('input'));
      si.focus();
    };

    window.quickSearch = function (kw) {
      if (!si) return;
      si.value = kw;
      if (bc) bc.classList.remove('hidden');
      si.dispatchEvent(new Event('input'));
    };

    /* ---- SCROLL: progress bar + scroll-to-top ---- */
    const readBar = document.getElementById('readBar');
    const stBtn = document.getElementById('scrollTopBtn');

    function onScroll() {
      const pct = (window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)) * 100;
      if (readBar) readBar.style.width = pct + '%';
      if (stBtn) stBtn.classList.toggle('show', window.scrollY > 300);
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---- SHARE CARD ẢNH (html2canvas) ---- */
    let _shareBlob = null;

    window.shareCardAsImage = async function (cardEl) {
      if (typeof window.html2canvas === 'undefined') {
        if (typeof window.Swal !== 'undefined')
          window.Swal.fire({
            toast: true,
            position: 'top',
            icon: 'warning',
            title: 'Đang tải thư viện, thử lại sau 1s',
            timer: 1500,
            showConfirmButton: false,
          });
        return;
      }
      const actions = cardEl.querySelector('.card-actions');
      if (actions) actions.style.visibility = 'hidden';

      if (typeof window.Swal !== 'undefined')
        window.Swal.fire({
          toast: true,
          position: 'top',
          title: '<i class="bi bi-hourglass-split"></i> Đang tạo ảnh…',
          timer: 2000,
          showConfirmButton: false,
        });

      try {
        const canvas = await window.html2canvas(cardEl, {
          scale: 2.5,
          useCORS: true,
          logging: false,
          backgroundColor: document.documentElement.classList.contains('dark') ? '#0c1a2e' : '#ffffff',
        });
        canvas.toBlob((blob) => {
          _shareBlob = blob;
          const img = document.getElementById('shareImg');
          const overlay = document.getElementById('shareOverlay');
          if (img) img.src = URL.createObjectURL(blob);
          if (overlay) overlay.classList.add('open');
        }, 'image/png');
      } catch (e) {
        if (typeof window.Swal !== 'undefined') window.Swal.fire('Lỗi', 'Không thể tạo ảnh. Thử lại sau.', 'error');
      } finally {
        if (actions) actions.style.visibility = '';
      }
    };

    function closeShareOverlay(e) {
      const overlay = document.getElementById('shareOverlay');
      if (!overlay) return;
      if (!e || e.target === overlay) overlay.classList.remove('open');
    }

    function downloadShareImg() {
      if (!_shareBlob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(_shareBlob);
      a.download = `trexanh-card-${Date.now()}.png`;
      a.click();
    }

    async function nativeShareImg() {
      if (!_shareBlob) return;
      const f = new File([_shareBlob], 'trexanh-card.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [f] })) {
        try {
          await navigator.share({ files: [f], title: 'TreXanh', text: 'Tra cứu từ TreXanh TNVN' });
        } catch {}
      } else downloadShareImg();
    }

    /* ---- ONLINE USERS — ping mỗi 20 giây ---- */
    let onlineInterval = null;
    function initOnline() {
      let sid = sessionStorage.getItem('txSid');
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem('txSid', sid);
      }

      const elOnline = document.getElementById('stat-online');
      const elDot = document.getElementById('onlineDot');

      async function ping() {
        try {
          const r = await fetch(`/api/online?action=ping&sid=${sid}`);
          if (!r.ok) return;
          const d = await r.json();
          const n = d.count || 0;
          if (elOnline) {
            elOnline.textContent = n.toLocaleString('vi');
            elOnline.style.color = n > 1 ? '#a855f7' : 'var(--muted)';
          }
          if (elDot) elDot.style.display = n > 0 ? 'block' : 'none';
        } catch {
          if (elOnline) elOnline.textContent = '—';
        }
      }

      ping();
      onlineInterval = setInterval(ping, 20_000);
      document.addEventListener('visibilitychange', onVisibility);
      function onVisibility() {
        if (!document.hidden) ping();
      }
      return () => document.removeEventListener('visibilitychange', onVisibility);
    }
    const cleanupOnline = initOnline();

    /* ---- CONTRIBUTORS POPUP ---- */
    const CONTRIBUTORS = [
      { name: 'N4mtapdev', role: 'Founder · Dev · Nội dung', icon: '/assets/images/n4mtapdev.png', col: '#10b981', contrib: 'Toàn bộ hệ thống & dữ liệu' },
      { name: 'Yenlynh', role: 'Co-Founder · Content · Supporter', icon: '/assets/images/yl.jpg', col: '#f472b6', contrib: 'Nội dung & hỗ trợ cho Dev' },
    ];
    const ROLE_ICONS = [
      [/founder/i, 'bi-award-fill'],
      [/dev/i, 'bi-code-slash'],
      [/content/i, 'bi-pencil-fill'],
      [/supporter/i, 'bi-heart-fill'],
      [/design/i, 'bi-palette-fill'],
    ];
    function roleIcon(part) {
      const hit = ROLE_ICONS.find(([re]) => re.test(part));
      return hit ? hit[1] : 'bi-star-fill';
    }

    function showContributors() {
      const old = document.getElementById('txContribModal');
      if (old) {
        old.remove();
        return;
      }

      const dk = document.documentElement.classList.contains('dark');
      const bgCard = dk ? '#0c1a2e' : '#ffffff';
      const colTxt = dk ? '#ecfdf5' : '#0f172a';
      const colMut = dk ? '#94a3b8' : '#64748b';
      const border = 'rgba(139,92,246,.2)';
      const divider = dk ? 'rgba(255,255,255,.05)' : '#f1f5f9';

      const overlay = document.createElement('div');
      overlay.id = 'txContribModal';
      overlay.style.cssText = `position:fixed;inset:0;z-index:9999;
                display:flex;align-items:flex-end;justify-content:center;
                background:rgba(0,0,0,.48);animation:txFadeIn .15s ease`;

      const box = document.createElement('div');
      box.style.cssText = `width:100%;max-width:420px;background:${bgCard};
                border-radius:24px 24px 0 0;padding:0 0 24px;
                border-top:1.5px solid ${border};
                box-shadow:0 -12px 48px ${dk ? 'rgba(0,0,0,.5)' : 'rgba(139,92,246,.15)'};
                animation:txSlideUp .22s cubic-bezier(.34,1.56,.64,1);
                display:flex;flex-direction:column;max-height:82vh;
                touch-action:none`;

      const dragZone = document.createElement('div');
      dragZone.style.cssText = 'flex-shrink:0;cursor:grab';

      const handle = document.createElement('div');
      handle.style.cssText = `width:36px;height:4px;border-radius:2px;margin:12px auto 16px;
                background:${dk ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'};
                transition:background .15s,width .15s`;
      dragZone.appendChild(handle);

      const header = document.createElement('div');
      header.style.cssText = `padding:0 20px 12px;border-bottom:1px solid ${divider}`;
      header.innerHTML = `
                <p style="font-size:13px;font-weight:900;color:${colTxt};margin:0">
                    <i class="bi bi-people-fill" style="color:#7c3aed"></i> Contributors
                </p>
                <p style="font-size:9px;color:${colMut};margin:3px 0 0;font-weight:600">
                    Những người đằng sau TreXanh · ${CONTRIBUTORS.length} người
                </p>`;
      dragZone.appendChild(header);
      box.appendChild(dragZone);

      const list = document.createElement('div');
      list.style.cssText = `padding:8px 12px 0;overflow-y:auto;overscroll-behavior:contain;
                -webkit-overflow-scrolling:touch;touch-action:pan-y;flex:1;min-height:0`;

      CONTRIBUTORS.forEach((c, i) => {
        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:12px;padding:10px 8px;
                    border-radius:14px;transition:background .15s,transform .1s;
                    -webkit-tap-highlight-color:transparent;
                    ${i < CONTRIBUTORS.length - 1 ? `border-bottom:1px solid ${divider}` : ''}`;
        row.addEventListener('mouseenter', () => (row.style.background = dk ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.02)'));
        row.addEventListener('mouseleave', () => (row.style.background = 'transparent'));
        row.addEventListener(
          'touchstart',
          () => {
            row.style.background = dk ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.03)';
            row.style.transform = 'scale(.99)';
          },
          { passive: true }
        );
        row.addEventListener(
          'touchend',
          () => {
            row.style.background = 'transparent';
            row.style.transform = 'scale(1)';
          },
          { passive: true }
        );

        const avatar = document.createElement('div');
        avatar.style.cssText = `width:46px;height:46px;border-radius:14px;flex-shrink:0;
                    background:${c.col}18;border:1.5px solid ${c.col}40;
                    box-shadow:0 3px 10px ${c.col}25;
                    display:flex;align-items:center;justify-content:center;overflow:hidden`;

        const isImg = c.icon && (c.icon.includes('/') || c.icon.includes('.'));
        if (isImg) {
          const img = document.createElement('img');
          img.src = c.icon;
          img.alt = c.name;
          img.style.cssText = 'width:100%;height:100%;object-fit:cover';
          img.onerror = () => {
            img.replaceWith(
              Object.assign(document.createElement('i'), {
                className: `bi bi-person-fill`,
                style: `font-size:20px;color:${c.col}`,
              })
            );
          };
          avatar.appendChild(img);
        } else {
          avatar.innerHTML = `<i class="bi ${c.icon || 'bi-person-fill'}" style="font-size:18px;color:${c.col}"></i>`;
        }

        const info = document.createElement('div');
        info.style.cssText = 'flex:1;min-width:0';

        const nm = document.createElement('p');
        nm.style.cssText = `font-size:13px;font-weight:900;color:${colTxt};margin:0 0 5px;
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
        nm.textContent = c.name;

        const rl = document.createElement('div');
        rl.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:0 0 4px';
        c.role
          .split('·')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((part) => {
            const badge = document.createElement('span');
            badge.style.cssText = `display:inline-flex;align-items:center;gap:3px;
                        font-size:9px;font-weight:800;color:${c.col};background:${c.col}15;
                        border:1px solid ${c.col}30;border-radius:999px;padding:2px 7px 2px 6px;
                        white-space:nowrap`;
            badge.innerHTML = `<i class="bi ${roleIcon(part)}" style="font-size:8px"></i> ${part}`;
            rl.appendChild(badge);
          });

        const ct = document.createElement('p');
        ct.style.cssText = `font-size:9px;color:${colMut};margin:0;font-weight:500`;
        ct.textContent = c.contrib || '';

        info.appendChild(nm);
        info.appendChild(rl);
        if (c.contrib) info.appendChild(ct);
        row.appendChild(avatar);
        row.appendChild(info);
        list.appendChild(row);
      });

      box.appendChild(list);
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      function closeSheet() {
        overlay.style.animation = 'txFadeOut .15s ease forwards';
        box.style.transition = 'transform .18s ease';
        box.style.transform = 'translateY(100%)';
        document.body.style.overflow = prevOverflow;
        setTimeout(() => overlay.remove(), 180);
      }

      overlay.addEventListener('click', (e) => {
        if (e.target !== overlay) return;
        closeSheet();
      });

      let dragging = false,
        startY = 0,
        currentY = 0;

      function onPointerDown(e) {
        dragging = true;
        startY = e.clientY;
        currentY = 0;
        box.style.transition = 'none';
        dragZone.style.cursor = 'grabbing';
        dragZone.setPointerCapture?.(e.pointerId);
      }
      function onPointerMove(e) {
        if (!dragging) return;
        const dy = e.clientY - startY;
        currentY = Math.max(0, dy);
        box.style.transform = `translateY(${currentY}px)`;
        overlay.style.background = `rgba(0,0,0,${Math.max(0, 0.48 - currentY / 600)})`;
      }
      function onPointerUp() {
        if (!dragging) return;
        dragging = false;
        dragZone.style.cursor = 'grab';
        box.style.transition = 'transform .2s cubic-bezier(.34,1.56,.64,1)';

        const THRESHOLD = 90;
        if (currentY > THRESHOLD) {
          closeSheet();
        } else {
          box.style.transform = 'translateY(0)';
          overlay.style.background = 'rgba(0,0,0,.48)';
        }
      }

      dragZone.addEventListener('pointerdown', onPointerDown);
      dragZone.addEventListener('pointermove', onPointerMove);
      dragZone.addEventListener('pointerup', onPointerUp);
      dragZone.addEventListener('pointercancel', onPointerUp);
    }

    /* ---- GẮN EVENT LISTENERS ---- */
    const $scrollTopBtn = document.getElementById('scrollTopBtn');
    const $musicBtn = document.getElementById('musicBtn');
    const $btnFsDown = document.getElementById('btnFsDown');
    const $btnFsUp = document.getElementById('btnFsUp');
    const $btnSettings = document.getElementById('btnSettings');
    const $btnProfile = document.getElementById('btnProfile');
    const $btnClear = document.getElementById('btnClear');
    const $btnSort = document.getElementById('btnSort');
    const $tabAll = document.getElementById('tabAll');
    const $chipReset = document.getElementById('btnChipReset');
    const $shareOverlay = document.getElementById('shareOverlay');
    const $btnDownloadShare = document.getElementById('btnDownloadShare');
    const $btnNativeShare = document.getElementById('btnNativeShare');
    const $btnCloseShare = document.getElementById('btnCloseShare');
    const $btnContributors = document.getElementById('btnContributors');

    const onScrollTopClick = () => scrollTo({ top: 0, behavior: 'smooth' });
    const onFsDown = () => window.changeFontSize(-1);
    const onFsUp = () => window.changeFontSize(1);
    const onTabAllClick = () => window.filterByFile && window.filterByFile('ALL');
    const onSortClick = () => window.handleSort && window.handleSort();

    $scrollTopBtn?.addEventListener('click', onScrollTopClick);
    $musicBtn?.addEventListener('click', toggleMusic);
    $btnFsDown?.addEventListener('click', onFsDown);
    $btnFsUp?.addEventListener('click', onFsUp);
    $btnSettings?.addEventListener('click', handleSettings);
    $btnProfile?.addEventListener('click', handleProfile);
    $btnClear?.addEventListener('click', window.clearSearch);
    $btnSort?.addEventListener('click', onSortClick);
    $tabAll?.addEventListener('click', onTabAllClick);
    $chipReset?.addEventListener('click', window.clearSearch);
    $shareOverlay?.addEventListener('click', closeShareOverlay);
    $btnDownloadShare?.addEventListener('click', downloadShareImg);
    $btnNativeShare?.addEventListener('click', nativeShareImg);
    $btnCloseShare?.addEventListener('click', () => closeShareOverlay());
    $btnContributors?.addEventListener('click', showContributors);

    const chipEls = Array.from(document.querySelectorAll('.qchip[data-qs]'));
    const chipHandlers = chipEls.map((btn) => {
      const h = () => window.quickSearch(btn.dataset.qs);
      btn.addEventListener('click', h);
      return { btn, h };
    });

    /* ---- PWA Service Worker ---- */
    function showOfflineBanner(show) {
      let b = document.getElementById('offlineBanner');
      if (!b && show) {
        b = document.createElement('div');
        b.id = 'offlineBanner';
        b.style.cssText = `position:fixed;bottom:86px;left:50%;transform:translateX(-50%);
                    background:#0f172a;color:white;padding:8px 16px;border-radius:12px;
                    font-size:11px;font-weight:800;z-index:9998;
                    display:flex;align-items:center;gap:7px;
                    box-shadow:0 4px 20px rgba(0,0,0,.35);
                    animation:txFadeIn .2s ease`;
        b.innerHTML = '<i class="bi bi-wifi-off"></i> Đang offline — dùng dữ liệu đã lưu';
        document.body.appendChild(b);
      } else if (b && !show) {
        b.style.animation = 'txFadeOut .2s ease forwards';
        setTimeout(() => b?.remove(), 200);
      }
    }
    const onOnlineEvt = () => showOfflineBanner(false);
    const onOfflineEvt = () => showOfflineBanner(true);
    window.addEventListener('online', onOnlineEvt);
    window.addEventListener('offline', onOfflineEvt);
    if (typeof navigator !== 'undefined' && !navigator.onLine) showOfflineBanner(true);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            nw?.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                if (typeof window.Swal !== 'undefined') {
                  window.Swal.fire({
                    toast: true,
                    position: 'top',
                    icon: 'info',
                    title: '🔄 Có bản cập nhật mới!',
                    text: 'Tải lại trang để dùng phiên bản mới.',
                    showConfirmButton: true,
                    confirmButtonText: 'Tải lại',
                    confirmButtonColor: '#10b981',
                    timer: 8000,
                  }).then((r) => {
                    if (r.isConfirmed) location.reload();
                  });
                }
              }
            });
          });
        })
        .catch(() => {});
    }

    /* ---- CLEANUP ---- */
    return () => {
      sliderCleanup();
      if (si) si.removeEventListener('input', onSearchInput);
      window.removeEventListener('scroll', onScroll);
      if (onlineInterval) clearInterval(onlineInterval);
      cleanupOnline && cleanupOnline();
      $scrollTopBtn?.removeEventListener('click', onScrollTopClick);
      $musicBtn?.removeEventListener('click', toggleMusic);
      $btnFsDown?.removeEventListener('click', onFsDown);
      $btnFsUp?.removeEventListener('click', onFsUp);
      $btnSettings?.removeEventListener('click', handleSettings);
      $btnProfile?.removeEventListener('click', handleProfile);
      $btnClear?.removeEventListener('click', window.clearSearch);
      $btnSort?.removeEventListener('click', onSortClick);
      $tabAll?.removeEventListener('click', onTabAllClick);
      $chipReset?.removeEventListener('click', window.clearSearch);
      $shareOverlay?.removeEventListener('click', closeShareOverlay);
      $btnDownloadShare?.removeEventListener('click', downloadShareImg);
      $btnNativeShare?.removeEventListener('click', nativeShareImg);
      $btnCloseShare?.removeEventListener('click', () => closeShareOverlay());
      $btnContributors?.removeEventListener('click', showContributors);
      chipHandlers.forEach(({ btn, h }) => btn.removeEventListener('click', h));
      window.removeEventListener('online', onOnlineEvt);
      window.removeEventListener('offline', onOfflineEvt);
    };
  }, []);

  return (
    <>
      {/* Ghi chú: public/assets/js/load.js đã được sửa để tự init() ngay khi
          document.readyState !== 'loading', vì Script afterInteractive load
          sau khi DOMContentLoaded đã fire — nếu không sửa, load.js gốc
          (chỉ nghe DOMContentLoaded) sẽ không bao giờ tự chạy trong Next.js. */}
      {/* ===== DECORATIVE BLOBS ===== */}
      <div className="blob-wrap" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* ===== PROGRESS BAR ===== */}
      <div id="readProgress" aria-hidden="true">
        <div id="readBar" />
      </div>

      {/* ===== FONT SIZE INDICATOR ===== */}
      <div id="fsIndicator" role="status" aria-live="polite">
        <i className="bi bi-fonts" /> Cỡ chữ: <span id="fsValue">14</span>px
      </div>

      {/* ===== AUDIO ===== */}
      <audio id="bgMusic" loop preload="none">
        <source src="/assets/music.mp3" type="audio/mpeg" />
      </audio>

      {/* ===== FIXED BUTTONS ===== */}
      <div id="scrollTopBtn" className="flt-btn" title="Lên đầu trang" role="button" aria-label="Cuộn lên đầu trang" tabIndex={0}>
        <i className="bi bi-chevron-up" style={{ color: 'var(--muted)', fontSize: 14 }} />
      </div>
      <div id="musicBtn" className="flt-btn" title="Nhạc nền" role="button" aria-label="Bật/tắt nhạc nền" tabIndex={0}>
        <i id="musicIcon" className="bi bi-music-note-beamed text-lg" style={{ color: 'var(--muted)' }} />
      </div>

      {/* ===== SHARE IMAGE OVERLAY ===== */}
      <div id="shareOverlay" role="dialog" aria-modal="true" aria-label="Chia sẻ card">
        <div id="shareBox">
          <p style={{ fontSize: 11, fontWeight: 800, color: '#064e3b', marginBottom: 10, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-image-fill" /> Chia sẻ card
          </p>
          <img id="shareImg" src="" alt="Share card preview" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button id="btnDownloadShare" style={{ flex: 1, padding: 10, borderRadius: 12, background: '#10b981', color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none' }}>
              <i className="bi bi-download" /> Tải ảnh
            </button>
            <button id="btnNativeShare" style={{ flex: 1, padding: 10, borderRadius: 12, background: '#064e3b', color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none' }}>
              <i className="bi bi-share-fill" /> Chia sẻ
            </button>
            <button id="btnCloseShare" style={{ padding: '10px 14px', borderRadius: 12, background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 800, cursor: 'pointer', border: 'none' }}>
              <i className="bi bi-x-lg" />
            </button>
          </div>
        </div>
      </div>

      {/* ===========================
           HEADER
      =========================== */}
      <header className="nav-glass sticky top-0 z-[100] px-4 pt-3 pb-3" role="banner">
        {/* Row 1: Logo + Font controls + Settings */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="logo-wrap w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 logo-pulse-limited" role="img" aria-label="TreXanh Logo">
              <picture>
                <source srcSet="/assets/images/logo.webp" type="image/webp" />
                <img src="/assets/images/logo.png" alt="TreXanh" className="w-5 h-5 object-contain" />
              </picture>
            </div>
            <div style={{ lineHeight: 1.5 }}>
              <h1 className="text-[13px] font-black tracking-tight italic" style={{ color: 'var(--text)' }}>
                TreXanh <span className="text-emerald-500">v1.0</span>
              </h1>
              <div className="flex items-center gap-1.5" style={{ marginTop: 3 }}>
                <span className="pdot" aria-hidden="true" />
                <p className="text-[9px] font-bold" style={{ color: 'var(--muted)' }}>Hệ thống hoạt động</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button id="btnFsDown" className="fs-btn" title="Giảm cỡ chữ" aria-label="Giảm cỡ chữ">A−</button>
            <button id="btnFsUp" className="fs-btn" title="Tăng cỡ chữ" aria-label="Tăng cỡ chữ">A+</button>
            <button id="btnSettings" className="hdr-btn" title="Cài đặt" aria-label="Mở cài đặt">
              <i className="bi bi-sliders2-vertical text-sm" />
            </button>
            <button id="btnProfile" className="hdr-btn" style={{ background: 'rgba(16,185,129,.1)', borderColor: 'rgba(16,185,129,.25)', color: '#059669' }} title="Thông tin" aria-label="Xem thông tin hệ thống">
              <i className="bi bi-person-fill text-sm" />
            </button>
          </div>
        </div>

        {/* Row 2: Search */}
        <div className="search-wrap" role="search">
          <i className="bi bi-search text-emerald-400 flex-shrink-0" aria-hidden="true" />
          <input id="mainSearch" type="search" placeholder="Tìm câu hỏi, từ khóa..." autoComplete="off" inputMode="search" enterKeyHint="search" aria-label="Tìm kiếm câu hỏi" />
          <button id="btnClear" className="hidden flex-shrink-0" title="Xóa tìm kiếm" aria-label="Xóa ô tìm kiếm">
            <i className="bi bi-x-circle-fill" style={{ color: 'var(--muted)', fontSize: 14 }} />
          </button>
        </div>

        {/* Row 3: Slider banner */}
        <div className="hdr-slider" id="headerSlider" role="banner" aria-label="Slider banner">
          <div className="slide active" style={{ backgroundImage: "image-set(url('/assets/images/slider1.webp') type('image/webp'), url('/assets/images/slider1.jpg') type('image/jpeg'))" }}>
            <div className="s-overlay" aria-hidden="true" />
            <span className="s-cap"><i className="bi bi-book-fill" aria-hidden="true" /> App: Thanh niên Việt Nam</span>
          </div>
          <div className="slide" style={{ backgroundImage: "image-set(url('/assets/images/slider2.webp') type('image/webp'), url('/assets/images/slider2.jpg') type('image/jpeg'))" }}>
            <div className="s-overlay" aria-hidden="true" />
            <span className="s-cap"><i className="bi bi-stars" aria-hidden="true" /> Hưởng ứng Đại hội Đoàn toàn quốc Lần thứ XIII</span>
          </div>
          <div className="s-dots" id="sliderDots" role="tablist" aria-label="Chọn slide" />
        </div>

        {/* Row 4: Quick search chips */}
        <div className="flex gap-2 mt-2.5 overflow-x-auto no-sb pb-0.5" role="navigation" aria-label="Tìm kiếm nhanh">
          <button className="qchip" data-qs="ngày tháng"><i className="bi bi-calendar3" aria-hidden="true" />Ngày</button>
          <button className="qchip" data-qs="tổ chức"><i className="bi bi-building" aria-hidden="true" />Tổ chức</button>
          <button className="qchip" data-qs="đảng"><i className="bi bi-flag-fill" aria-hidden="true" />Đảng</button>
          <button className="qchip" data-qs="hội nghị"><i className="bi bi-people-fill" aria-hidden="true" />Hội nghị</button>
          <button className="qchip" data-qs="lịch sử"><i className="bi bi-clock-history" aria-hidden="true" />Lịch sử</button>
          <button className="qchip" data-qs="năm"><i className="bi bi-123" aria-hidden="true" />Năm</button>
          <button className="qchip" id="btnChipReset"><i className="bi bi-x-lg" aria-hidden="true" />Reset</button>
        </div>
      </header>

      {/* ===== TICKER ===== */}
      <div className="ticker-wrap mx-4 mt-4" role="marquee" aria-label="Thông báo cuộn">
        <div className="ticker-track">
          <span className="t-item"><i className="bi bi-megaphone-fill" aria-hidden="true" />Dữ liệu cập nhật liên tục</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-shield-check-fill" aria-hidden="true" />Nguồn chính thống TNVN</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-lightning-charge-fill" aria-hidden="true" />Tìm kiếm Fuse.js siêu nhanh</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-hand-index-fill" aria-hidden="true" />Double-tap card để copy</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-image-fill" aria-hidden="true" />Share card ảnh PNG</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-fonts" aria-hidden="true" />Tùy chỉnh cỡ chữ A− A+</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-megaphone-fill" aria-hidden="true" />Dữ liệu cập nhật liên tục</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-shield-check-fill" aria-hidden="true" />Nguồn chính thống TNVN</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-lightning-charge-fill" aria-hidden="true" />Tìm kiếm Fuse.js siêu nhanh</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-hand-index-fill" aria-hidden="true" />Double-tap card để copy</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-image-fill" aria-hidden="true" />Share card ảnh PNG</span><span className="t-sep" aria-hidden="true" />
          <span className="t-item"><i className="bi bi-fonts" aria-hidden="true" />Tùy chỉnh cỡ chữ A− A+</span><span className="t-sep" aria-hidden="true" />
        </div>
      </div>

      {/* ===========================
           MAIN CONTENT
      =========================== */}
      <main className="px-4 py-5 flex-grow" role="main" id="main-content">
        {/* SECTION: Thống kê */}
        <div className="sec-head">
          <span className="sec-title"><i className="bi bi-bar-chart-fill text-emerald-500" aria-hidden="true" />Thống kê</span>
          <div className="sec-line" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5" role="region" aria-label="Thống kê dữ liệu">
          <div className="stat-box s-green" style={{ borderLeft: '4px solid #10b981' }} role="status">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-500" style={{ background: 'rgba(16,185,129,.1)' }} aria-hidden="true">
              <i className="bi bi-database-fill-check text-base" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Tổng Q&A</p>
              <p id="stat-total" className="text-base font-black" style={{ color: 'var(--text)' }} aria-label="Tổng số câu hỏi">—</p>
            </div>
          </div>
          <div className="stat-box s-blue" style={{ borderLeft: '4px solid #3b82f6' }} role="status">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-500" style={{ background: 'rgba(59,130,246,.1)' }} aria-hidden="true">
              <i className="bi bi-collection-fill text-base" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Danh mục</p>
              <p id="stat-files" className="text-base font-black" style={{ color: 'var(--text)' }} aria-label="Số danh mục">—</p>
            </div>
          </div>
        </div>

        {/* Online users */}
        <div className="stat-box mb-5" style={{ borderLeft: '3px solid #a855f7', background: 'linear-gradient(135deg,rgba(168,85,247,.06),rgba(139,92,246,.03))' }} role="status">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,.12)' }} aria-hidden="true">
            <i className="bi bi-people-fill" style={{ color: '#a855f7', fontSize: 15 }} />
          </div>
          <div style={{ flex: 1 }}>
            <p className="text-[8px] font-black uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Đang online</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p id="stat-online" className="text-base font-black" style={{ color: '#a855f7' }}>—</p>
              <span id="onlineDot" style={{ display: 'none', width: 6, height: 6, borderRadius: '50%', background: '#a855f7', flexShrink: 0, animation: 'pring 1.8s infinite' }} />
            </div>
          </div>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', textAlign: 'right', lineHeight: 1.4 }}>
            người đang<br />tra cứu
          </p>
        </div>

        {/* SECTION: Danh mục + Sort */}
        <div className="sec-head">
          <span className="sec-title"><i className="bi bi-grid-fill text-emerald-500" aria-hidden="true" />Danh mục</span>
          <div className="sec-line" aria-hidden="true" />
          <button id="btnSort" className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg2)', border: '1.5px solid var(--border)', color: 'var(--muted)' }} title="Sắp xếp" aria-label="Sắp xếp dữ liệu">
            <i className="bi bi-sort-down-alt text-sm" aria-hidden="true" />
          </button>
        </div>
        <div className="cat-dd" id="catDd">
          <button type="button" id="catDdTrigger" className="cat-dd-trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="categoryTabs">
            <span className="cat-dd-icon"><i className="bi bi-grid-fill" id="catDdIcon" aria-hidden="true" /></span>
            <span className="cat-dd-label" id="catDdLabel">Tất cả</span>
            <span className="cat-dd-badge" id="catDdBadge">0</span>
            <i className="bi bi-chevron-down cat-dd-chevron" aria-hidden="true" />
          </button>

          <div className="cat-dd-backdrop" id="catDdBackdrop" />

          <div id="categoryTabs" className="cat-dd-panel" role="listbox" aria-label="Danh mục">
            <button id="tabAll" className="filter-tab active" data-file="ALL" role="option" aria-selected="true">
              <span className="cat-dd-row-icon"><i className="bi bi-grid-fill" aria-hidden="true" /></span>
              <span className="cat-dd-row-label">Tất cả</span>
              <span className="tab-badge" id="tabAllBadge">0</span>
              <i className="bi bi-check-lg cat-dd-check" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Sub-tab tuần */}
        <div id="weekTabsWrap" className="hidden flex items-center gap-2 overflow-x-auto no-sb pb-1 mb-5" role="tablist" aria-label="Chọn tuần" />

        {/* SECTION: Kết quả */}
        <div className="sec-head">
          <span className="sec-title"><i className="bi bi-card-list text-emerald-500" aria-hidden="true" />Kết quả</span>
          <div className="sec-line" aria-hidden="true" />
          <span id="resultCount" className="flex-shrink-0 ml-1 text-[10px] font-black" style={{ color: 'var(--muted)' }} aria-live="polite" />
        </div>

        <div id="gridDisplay" role="list" aria-label="Danh sách câu hỏi và đáp án" />

        <div id="loadMoreTrigger" className="py-8 text-center" aria-live="polite">
          <div id="loadingUI" className="flex flex-col items-center gap-2">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(16,185,129,.15)', borderTopColor: '#10b981' }} role="progressbar" aria-label="Đang tải" />
            <span className="text-[10px] font-black tracking-[3px] uppercase" style={{ color: 'var(--muted)' }}>Đang tải...</span>
          </div>
          <div id="endMessage" className="hidden animate__animated animate__fadeIn">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border" style={{ background: 'rgba(16,185,129,.07)', borderColor: 'rgba(16,185,129,.15)', color: '#059669' }}>
              <i className="bi bi-check-all" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase italic">Đã hiển thị tất cả</span>
            </div>
          </div>
        </div>
      </main>

      {/* ===========================
           FOOTER
      =========================== */}
      <footer className="px-5 pt-5 pb-8 mt-auto" role="contentinfo">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            <picture>
              <source srcSet="/assets/images/logo.webp" type="image/webp" />
              <img src="/assets/images/logo.png" alt="TreXanh Logo" className="w-6 h-6 object-contain" loading="lazy" />
            </picture>
          </div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-tight" style={{ color: 'var(--text)' }}>TreXanh Developer</p>
            <p className="text-[9px] font-bold tracking-wide" style={{ color: 'var(--muted)' }}>
              <i className="bi bi-calendar-check" aria-hidden="true" /> Cập nhật: 10/09/2026
            </p>
          </div>
          <div className="ml-auto px-2.5 py-1 rounded-lg text-[9px] font-black uppercase" style={{ background: 'rgba(16,185,129,.1)', color: '#059669', border: '1px solid rgba(16,185,129,.2)' }}>
            v1.0.0
          </div>
        </div>

        <div className="fdivider" />

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="feat-chip"><i className="bi bi-lightning-charge-fill text-amber-500" aria-hidden="true" />Fuse.js Search</span>
          <span className="feat-chip"><i className="bi bi-hand-index-fill text-emerald-500" aria-hidden="true" />Double-tap Copy</span>
          <span className="feat-chip"><i className="bi bi-image-fill text-purple-500" aria-hidden="true" />Share PNG</span>
          <span className="feat-chip"><i className="bi bi-fonts text-blue-500" aria-hidden="true" />Font A±</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center rounded-xl" style={{ background: 'var(--bg)', padding: '8px 4px' }}>
            <p className="text-[11px] font-black" style={{ color: 'var(--text)' }}>
              <i className="bi bi-database text-emerald-500 text-[10px]" aria-hidden="true" /> <span id="footer-total">—</span>
            </p>
            <p className="text-[8px] font-bold" style={{ color: 'var(--muted)' }}>Câu hỏi</p>
          </div>
          <div className="text-center rounded-xl" style={{ background: 'var(--bg)', padding: '8px 4px' }}>
            <p className="text-[11px] font-black" style={{ color: 'var(--text)' }}>
              <i className="bi bi-collection text-blue-500 text-[10px]" aria-hidden="true" /> <span id="footer-files">—</span>
            </p>
            <p className="text-[8px] font-bold" style={{ color: 'var(--muted)' }}>Danh mục</p>
          </div>
          <div className="text-center rounded-xl" style={{ background: 'var(--bg)', padding: '8px 4px' }}>
            <p className="text-[11px] font-black text-emerald-500">
              <i className="bi bi-activity text-[10px]" aria-hidden="true" /> Live
            </p>
            <p className="text-[8px] font-bold" style={{ color: 'var(--muted)' }}>Trạng thái</p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-3" style={{ fontSize: 17 }}>
            <a href="#" title="Facebook" aria-label="Facebook" style={{ color: 'var(--muted)' }}><i className="bi bi-facebook" aria-hidden="true" /></a>
            <a href="#" title="Telegram" aria-label="Telegram" style={{ color: 'var(--muted)' }}><i className="bi bi-telegram" aria-hidden="true" /></a>
            <a href="#" title="GitHub" aria-label="GitHub" style={{ color: 'var(--muted)' }}><i className="bi bi-github" aria-hidden="true" /></a>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btnContributors"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800,
                letterSpacing: 0.4, padding: '4px 10px', borderRadius: 8, textTransform: 'uppercase',
                background: 'rgba(139,92,246,.1)', color: '#7c3aed', border: '1px solid rgba(139,92,246,.25)',
                cursor: 'pointer',
              }}
              aria-label="Contributors"
            >
              <i className="bi bi-people-fill" aria-hidden="true" /> Contributors
            </button>
            <span className="sbadge"><span className="pdot" aria-hidden="true" /> System OK</span>
          </div>
        </div>

        <p className="text-center text-[9px] mt-4 font-semibold" style={{ color: 'var(--muted)' }}>
          © 2026 TreXanh · Dữ liệu TNVN · Mọi quyền được bảo lưu
        </p>
      </footer>

      {/* ===== THƯ VIỆN NGOÀI + ENGINE ===== */}
      {/* beforeInteractive chỉ hợp lệ trong app/layout.js — dùng afterInteractive ở page,
          Next.js Script tự đảm bảo thứ tự load theo đúng thứ tự khai báo trong cây component. */}
      <Script src="https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" strategy="afterInteractive" />
      <Script src="/assets/js/img-guard.js" strategy="afterInteractive" />
      <Script src="/assets/js/load.js" strategy="afterInteractive" />
    </>
  );
}
