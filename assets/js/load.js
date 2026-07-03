/**
 * ============================================================
 *  TREXANH ENGINE v2.4.0
 *  Cập nhật: 28/06/2026
 * ============================================================
 *  MỚI v2.4:
 *  [NEW] Card popup — click card mở modal chi tiết đẹp
 *  [NEW] Share link — nút share tạo URL ?card=ID, ai mở link
 *        sẽ thấy popup card đó ngay lập tức
 *  [NEW] Deep link — load xong tự detect ?card= param và popup
 *  [NEW] Copy link vào clipboard khi Web Share API không có
 * ============================================================
 */


/* ============================================================
   CẤU HÌNH
============================================================ */
const filesToLoad = [
    { name:'Lý Luận Chính Trị', icon:'bi-journal-bookmark-fill', url:'./assets/json/KTHTCBHLLCT.json', color:'emerald', prefix:'LLCT' },
    { name:'TBT Hà Huy Tập',    icon:'bi-person-vcard-fill',      url:'./assets/json/HHT.json',          color:'blue',    prefix:'HHT'  },
    /* Category có sub-tab theo tuần — chỉ cần thêm field "week"/"weekTitle" trong JSON,
       hệ thống tự nhận diện và render sub-tab, không cần khai báo gì thêm ở đây */
    { name:'Tìm hiểu Đoàn',     icon:'bi-flag-fill',              url:'./assets/json/SAMPLE-WEEKLY.json', color:'purple', prefix:'TUAN' },
];


/* ============================================================
   STATE
============================================================ */
let fullDb       = [];
let filteredDb   = [];
let itemsShown   = 0;
let currentFile  = 'ALL';
let currentWeek  = 'ALL';  /* Tuần đang chọn trong category hiện tại — 'ALL' = xem hết các tuần */
let currentSort  = 'random';
let currentQuery = '';
let isLoading    = false;

const DATA_VER  = '2.4'; /* tăng khi cập nhật JSON */
const PAGE_SIZE = 12;

/** Map nội dung card theo id — tránh XSS qua attribute */
const _cardData = new Map();

/** Fuse instance cache — tạo lại khi fullDb thay đổi */
let _fuseInstance = null;
function getFuse() {
    if (!_fuseInstance) _fuseInstance = new Fuse(fullDb, { keys:['q','a'], threshold:0.35, includeScore:true, minMatchCharLength:2 });
    return _fuseInstance;
}

/** Cache Fuse riêng cho từng category — tránh rebuild mỗi keystroke khi search trong tab cụ thể */
const _categoryFuseCache = new Map();
function getFuseForCategory(fileName) {
    if (fileName === 'ALL') return getFuse();
    if (!_categoryFuseCache.has(fileName)) {
        const subset = getByCategory(fileName);
        _categoryFuseCache.set(fileName, new Fuse(subset, { keys:['q','a'], threshold:0.35, includeScore:true, minMatchCharLength:2 }));
    }
    return _categoryFuseCache.get(fileName);
}

/** IntersectionObserver ref — để disconnect khi load xong */
let _scrollObserver = null;

/** Index câu hỏi theo category — Map<fileName, item[]>
 *  Tránh fullDb.filter() quét toàn mảng mỗi lần đổi tab/đếm badge.
 *  Khi có nhiều tab (10+), filter tuyến tính sẽ chậm dần — Map tra cứu O(1). */
let _categoryIndex = new Map();

function rebuildCategoryIndex() {
    _categoryIndex = new Map();
    for (const item of fullDb) {
        if (!_categoryIndex.has(item.fileName)) _categoryIndex.set(item.fileName, []);
        _categoryIndex.get(item.fileName).push(item);
    }
}

/** Lấy danh sách câu hỏi theo category — O(1) thay vì O(n) filter */
function getByCategory(fileName) {
    if (fileName === 'ALL') return fullDb;
    return _categoryIndex.get(fileName) || [];
}

/** Badge color lookup — cache Map thay vì .find() linear search mỗi card render */
const _badgeColorMap = new Map(filesToLoad.map(f => [f.name, `cb-${f.color}`]));

/** Category có chia theo tuần hay không — true nếu bất kỳ item nào có field week */
function categoryHasWeeks(fileName) {
    const items = getByCategory(fileName);
    return items.length > 0 && items.some(i => i.week != null);
}

/** Lấy danh sách tuần duy nhất trong 1 category, sắp xếp tăng dần,
 *  kèm tiêu đề tuần (weekTitle) và số lượng câu hỏi mỗi tuần */
function getWeeksForCategory(fileName) {
    const items = getByCategory(fileName);
    const map = new Map(); /* week number → { title, count } */
    items.forEach(i => {
        if (i.week == null) return;
        if (!map.has(i.week)) map.set(i.week, { title: i.weekTitle || `Tuần ${i.week}`, count: 0 });
        map.get(i.week).count++;
    });
    return [...map.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([week, info]) => ({ week, ...info }));
}


/* ============================================================
   UTILITY
============================================================ */

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function debounce(fn, ms) {
    let t;
    return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

function hl(text, query) {
    if (!query || !text) return String(text || '');
    const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(text).replace(new RegExp(`(${esc})`, 'gi'), '<mark class="tx-hl">$1</mark>');
}

function toast(icon, title, timer = 1500) {
    if (typeof Swal === 'undefined') return;
    Swal.fire({ toast:true, position:'top', icon, title, showConfirmButton:false, timer });
}

function badgeClass(fileName) {
    return _badgeColorMap.get(fileName) || 'cb-emerald';
}

/** Tạo URL deep-link cho một card */
function cardUrl(id) {
    const u = new URL(location.href);
    u.searchParams.set('card', id);
    return u.toString();
}

/** Tạo URL OG image động cho card — dùng /api/og Edge Function */
function ogImageUrl(item) {
    const base = location.origin;
    const p    = new URLSearchParams({
        q:   item.q.substring(0, 120),
        a:   item.a.substring(0, 100),
        cat: item.fileName,
    });
    return `${base}/api/og?${p.toString()}`;
}


/* ============================================================
   CARD POPUP — modal DOM thuần, không dùng SweetAlert2
============================================================ */
function openCardPopup(id) {
    const item = _cardData.get(id);
    if (!item) return;

    /* Xóa popup cũ nếu còn */
    const old = document.getElementById('txCardModal');
    if (old) old.remove();

    history.replaceState(null, '', `?card=${id}`);

    const dk     = document.documentElement.classList.contains('dark');
    const bc     = badgeClass(item.fileName);
    const bgCard = dk ? '#0c1a2e' : '#ffffff';
    const bgAns  = dk ? 'rgba(16,185,129,.12)' : 'rgba(16,185,129,.07)';
    const colAns = dk ? '#34d399' : '#059669';
    const colMut = dk ? '#94a3b8' : '#64748b';
    const colTxt = dk ? '#ecfdf5' : '#0f172a';
    const border = dk ? 'rgba(16,185,129,.2)' : '#d1fae5';

    const badgeMap = {
        'cb-emerald': { bg: dk?'rgba(16,185,129,.18)':'rgba(16,185,129,.12)', col: dk?'#34d399':'#059669' },
        'cb-blue':    { bg: dk?'rgba(59,130,246,.18)' :'rgba(59,130,246,.12)',  col: dk?'#60a5fa':'#2563eb' },
        'cb-purple':  { bg: dk?'rgba(139,92,246,.18)' :'rgba(139,92,246,.12)',  col: dk?'#a78bfa':'#7c3aed' },
        'cb-amber':   { bg: dk?'rgba(245,158,11,.18)' :'rgba(245,158,11,.12)',  col: dk?'#fbbf24':'#d97706' },
    };
    const bs = badgeMap[bc] || badgeMap['cb-emerald'];

    /* ── Overlay ── */
    const overlay = document.createElement('div');
    overlay.id = 'txCardModal';
    overlay.style.cssText = `
        position:fixed;inset:0;z-index:9999;
        display:flex;align-items:center;justify-content:center;padding:16px;
        background:rgba(0,0,0,.52);
        animation:txFadeIn .15s ease;
    `;

    /* ── Popup box ── */
    const box = document.createElement('div');
    box.style.cssText = `
        position:relative;width:100%;max-width:400px;
        background:${bgCard};border-radius:24px;overflow:hidden;
        border:1.5px solid ${border};
        box-shadow:0 24px 64px ${dk?'rgba(0,0,0,.7)':'rgba(16,185,129,.2)'};
        max-height:88vh;overflow-y:auto;
        animation:txSlideUp .22s cubic-bezier(.34,1.56,.64,1);
    `;

    /* ── Nút đóng ── */
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    closeBtn.style.cssText = `
        position:absolute;top:12px;right:12px;z-index:2;
        width:28px;height:28px;border-radius:50%;border:none;cursor:pointer;
        background:rgba(100,116,139,.15);color:${colMut};
        display:flex;align-items:center;justify-content:center;font-size:12px;
        transition:background .15s;
    `;
    closeBtn.addEventListener('click', closeCardPopup);
    box.appendChild(closeBtn);

    /* ── Body ── */
    const popupBody = document.createElement('div');
    popupBody.style.cssText = 'padding:20px 20px 0;';

    /* Header: badge + id */
    const hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px';

    const badge = document.createElement('span');
    badge.style.cssText = `display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:800;
        text-transform:uppercase;padding:4px 10px;border-radius:8px;
        background:${bs.bg};color:${bs.col}`;
    badge.innerHTML = `<i class="bi bi-patch-check-fill" style="font-size:8px"></i>`;
    badge.appendChild(document.createTextNode(item.fileName));

    const badgeGroup = document.createElement('div');
    badgeGroup.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap';
    badgeGroup.appendChild(badge);

    if (item.week != null) {
        const weekBadge = document.createElement('span');
        weekBadge.style.cssText = `display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:800;
            text-transform:uppercase;padding:4px 10px;border-radius:8px;
            background:${dk?'rgba(139,92,246,.18)':'rgba(139,92,246,.12)'};color:${dk?'#a78bfa':'#7c3aed'}`;
        weekBadge.innerHTML = `<i class="bi bi-calendar-week-fill" style="font-size:8px"></i>`;
        weekBadge.appendChild(document.createTextNode(`Tuần ${item.week}`));
        weekBadge.title = item.weekTitle || '';
        badgeGroup.appendChild(weekBadge);
    }

    const idTag = document.createElement('span');
    idTag.style.cssText = `font-size:9px;font-weight:700;color:${colMut};font-family:monospace;
        background:${dk?'rgba(255,255,255,.06)':'rgba(0,0,0,.04)'};padding:3px 7px;border-radius:6px`;
    idTag.textContent = `#${id}`;

    hdr.appendChild(badgeGroup);
    hdr.appendChild(idTag);
    popupBody.appendChild(hdr);

    /* Label câu hỏi */
    const qLabel = document.createElement('p');
    qLabel.style.cssText = `font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:1px;
        color:${colMut};margin:0 0 6px;display:flex;align-items:center;gap:5px`;
    qLabel.innerHTML = `<i class="bi bi-question-circle-fill" style="color:#f59e0b"></i>`;
    qLabel.appendChild(document.createTextNode('Câu hỏi'));
    popupBody.appendChild(qLabel);

    /* Nội dung câu hỏi */
    const qText = document.createElement('p');
    qText.style.cssText = `font-size:14px;font-weight:700;color:${colTxt};line-height:1.65;margin:0 0 14px`;
    qText.textContent = item.q;
    popupBody.appendChild(qText);

    /* Box đáp án */
    const ansBox = document.createElement('div');
    ansBox.style.cssText = `background:${bgAns};border:1px solid ${dk?'rgba(16,185,129,.22)':'rgba(16,185,129,.2)'};
        border-radius:16px;padding:14px 16px;margin-bottom:0`;

    const ansLabel = document.createElement('p');
    ansLabel.style.cssText = `font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:1px;
        color:${colAns};margin:0 0 6px;display:flex;align-items:center;gap:5px`;
    ansLabel.innerHTML = `<i class="bi bi-lightbulb-fill"></i>`;
    ansLabel.appendChild(document.createTextNode('Đáp án'));
    ansBox.appendChild(ansLabel);

    const ansText = document.createElement('p');
    ansText.style.cssText = `font-size:15px;font-weight:800;color:${colAns};font-style:italic;line-height:1.65;margin:0`;
    ansText.textContent = item.a;
    ansBox.appendChild(ansText);
    popupBody.appendChild(ansBox);
    box.appendChild(popupBody);

    /* ── Action bar ── */
    const bar = document.createElement('div');
    bar.style.cssText = `display:grid;grid-template-columns:1fr 1fr 1fr;
        margin-top:16px;border-top:1px solid ${border}`;

    const actions = [
        {
            icon:'bi-clipboard2-plus', label:'Copy', col:colMut, bg:'transparent',
            fn: async () => {
                const text = `❓ ${item.q}\n✅ ${item.a}\n\n— TreXanh v2.4 —`;
                let ok = false;
                try { await navigator.clipboard.writeText(text); ok = true; }
                catch {
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
                        document.body.appendChild(ta); ta.focus(); ta.select();
                        ok = document.execCommand('copy');
                        document.body.removeChild(ta);
                    } catch {}
                }
                closeCardPopup();
                toast(ok?'success':'error', ok?'✅ Đã copy!':'Không thể copy');
            }
        },
        {
            icon:'bi-link-45deg', label:'Share link', col:'#2563eb',
            bg: dk?'rgba(59,130,246,.08)':'rgba(59,130,246,.06)',
            fn: async () => {
                const shareUrl = cardUrl(id);
                const ogImg    = ogImageUrl(item);

                /* Cập nhật OG meta tags động trước khi share
                   (có tác dụng khi crawlers đọc trang qua Vercel SSR/Edge) */
                const setMeta = (prop, val, attr='property') => {
                    let el = document.querySelector(`meta[${attr}="${prop}"]`);
                    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
                    el.setAttribute('content', val);
                };
                setMeta('og:url',         shareUrl);
                setMeta('og:title',       `❓ ${item.q.substring(0,60)}…`);
                setMeta('og:description', `✅ ${item.a.substring(0,100)}`);
                setMeta('og:image',       ogImg);
                setMeta('twitter:image',  ogImg, 'name');
                setMeta('twitter:title',  `❓ ${item.q.substring(0,60)}…`, 'name');

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: `TreXanh · ${item.fileName}`,
                            text:  `❓ ${item.q.substring(0,80)}…`,
                            url:   shareUrl,
                        });
                    } catch {}
                } else {
                    let ok = false;
                    try { await navigator.clipboard.writeText(shareUrl); ok = true; } catch {}
                    closeCardPopup();
                    toast('success', ok?'🔗 Đã copy link!':'🔗 Copy link thất bại', 2000);
                }
            }
        },
        {
            icon:'bi-image-fill', label:'Ảnh', col:'#7c3aed',
            bg: dk?'rgba(139,92,246,.08)':'rgba(139,92,246,.06)',
            fn: () => {
                closeCardPopup();
                setTimeout(() => {
                    const cardEl = document.querySelector(`.answer-card[data-id="${id}"]`);
                    if (cardEl && typeof window.shareCardAsImage === 'function') window.shareCardAsImage(cardEl);
                    else toast('warning', 'Cuộn đến card để share ảnh');
                }, 300);
            }
        }
    ];

    actions.forEach((a, i) => {
        const btn = document.createElement('button');
        btn.style.cssText = `display:flex;flex-direction:column;align-items:center;justify-content:center;
            gap:5px;padding:14px 8px;border:none;cursor:pointer;background:${a.bg};
            border-right:${i<2?`1px solid ${border}`:'none'};transition:opacity .15s;`;
        btn.innerHTML = `<i class="bi ${a.icon}" style="font-size:18px;color:${a.col}"></i>`;
        const lbl = document.createElement('span');
        lbl.style.cssText = `font-size:9px;font-weight:800;color:${a.col}`;
        lbl.textContent = a.label;
        btn.appendChild(lbl);
        btn.addEventListener('click', a.fn);
        bar.appendChild(btn);
    });

    box.appendChild(bar);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    /* Đóng khi tap ngoài box */
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCardPopup(); });

    /* Đóng khi bấm Escape */
    document.addEventListener('keydown', _escClose);
}

function closeCardPopup() {
    const modal = document.getElementById('txCardModal');
    if (!modal) return;
    modal.style.animation = 'txFadeOut .15s ease forwards';
    setTimeout(() => {
        modal.remove();
        document.removeEventListener('keydown', _escClose);
        const u = new URL(location.href);
        u.searchParams.delete('card');
        history.replaceState(null, '', u.pathname + (u.search === '?'?'':u.search));
    }, 150);
}

function _escClose(e) { if (e.key === 'Escape') closeCardPopup(); }


/* ============================================================
   DEEP LINK — xử lý ?card=ID khi load trang
============================================================ */
function checkDeepLink() {
    const params = new URLSearchParams(location.search);
    const cardId = params.get('card');
    if (!cardId) return;
    let attempts = 0;
    const tryOpen = () => {
        if (_cardData.has(cardId)) {
            openCardPopup(cardId);
        } else if (++attempts < 30) {   /* tối đa 30 × 150ms = 4.5s */
            setTimeout(tryOpen, 150);
        } else {
            console.warn('[TreXanh] Deep link card not found:', cardId);
        }
    };
    tryOpen();
}


/* ============================================================
   KHỞI TẠO
============================================================ */
async function init() {
    showSkeletons(4);

    const tabsEl = document.getElementById('categoryTabs');
    const failedFiles = []; /* track các file tải thất bại */

    const results = await Promise.all(filesToLoad.map(async (file) => {
        try {
            const res  = await fetch(`${file.url}?v=${DATA_VER}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const items = data.map(item => ({
                id:       `${file.prefix}-${item.id}`,
                q:        (item.question || item.q || '').trim(),
                a:        (item.answer   || item.a || '').trim(),
                fileName: file.name,
                week:      item.week ?? null,
                weekTitle: item.weekTitle ? item.weekTitle.trim() : null,
            })).filter(i => i.q && i.a);

            if (items.length === 0) {
                /* File tải được nhưng rỗng */
                failedFiles.push({ name: file.name, reason: 'empty' });
            }
            return items;
        } catch(e) {
            console.warn(`[TreXanh] Không tải được: ${file.url}`, e);
            failedFiles.push({ name: file.name, reason: e.message });
            return [];
        }
    }));

    fullDb = shuffleArray(results.flat());
    fullDb.forEach(item => _cardData.set(item.id, item));
    _fuseInstance = null;
    _categoryFuseCache.clear();
    rebuildCategoryIndex();

    /* Hiện error banner nếu có file thất bại */
    if (failedFiles.length > 0) {
        showFetchError(failedFiles);
    }

    const elTotal = document.getElementById('stat-total');
    const elFiles = document.getElementById('stat-files');
    if (window.countUp) {
        window.countUp(elTotal, fullDb.length, 1200);
        window.countUp(elFiles, filesToLoad.length, 700);
    } else {
        elTotal.textContent = fullDb.length.toLocaleString('vi');
        elFiles.textContent = filesToLoad.length;
    }

    /* Build tab bar — dùng DocumentFragment để 1 lần reflow thay vì N lần appendChild */
    const tabFrag = document.createDocumentFragment();
    filesToLoad.forEach(file => {
        const count = getByCategory(file.name).length; /* O(1) thay vì fullDb.filter() */
        const btn   = document.createElement('button');
        btn.className = 'filter-tab';
        btn.dataset.file = file.name;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.innerHTML = `<i class="bi ${file.icon}" aria-hidden="true"></i>${file.name}<span class="tab-badge">${count}</span>`;
        btn.addEventListener('click', () => filterByFile(file.name));
        tabFrag.appendChild(btn);
    });
    tabsEl.appendChild(tabFrag);

    filteredDb = [...fullDb];
    renderGrid();
    attachSearchListener();
    setTimeout(syncFooter, 1500);

    /* Xử lý deep link sau khi data sẵn sàng */
    checkDeepLink();
}


/* ============================================================
   SEARCH LISTENER
============================================================ */
function attachSearchListener() {
    const input = document.getElementById('mainSearch');
    if (!input) return;

    const handler = debounce((e) => {
        currentQuery = e.target.value.trim();
        const rc = document.getElementById('resultCount');

        if (!currentQuery) {
            if (rc) rc.textContent = '';
            if (currentWeek !== 'ALL') filterByWeek(currentWeek);
            else filterByFile(currentFile);
            return;
        }

        /* Search trực tiếp trong tập con category (Fuse cache riêng cho subset)
           thay vì search toàn bộ fullDb rồi filter — nhanh hơn nhiều khi
           có nhiều category, vì Fuse chỉ cần duyệt đúng phần cần thiết.
           Nếu đang lọc theo tuần, search tiếp trong phạm vi tuần đó. */
        let results = getFuseForCategory(currentFile).search(currentQuery).map(r => r.item);
        if (currentWeek !== 'ALL') results = results.filter(i => i.week === currentWeek);
        filteredDb = results;

        if (rc) rc.textContent = filteredDb.length ? `${filteredDb.length} kết quả` : '';

        renderGrid();
    }, 280);

    input.addEventListener('input', handler);
}


/* ============================================================
   INFINITE SCROLL
============================================================ */
function setupInfiniteScroll() {
    const trigger = document.getElementById('loadMoreTrigger');
    if (!trigger) return;
    _scrollObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && itemsShown < filteredDb.length) loadBatch();
    }, { threshold:0.1, rootMargin:'300px 0px' });
    _scrollObserver.observe(trigger);
}


/* ============================================================
   SORT
============================================================ */
window.executeSort = function(type) {
    currentSort = type;
    let base = getByCategory(currentFile); /* O(1) index lookup */
    if (currentWeek !== 'ALL') base = base.filter(i => i.week === currentWeek);

    if      (type === 'random') filteredDb = shuffleArray(base);
    else if (type === 'az')     filteredDb = [...base].sort((a,b) => a.q.localeCompare(b.q,'vi'));
    else if (type === 'za')     filteredDb = [...base].sort((a,b) => b.q.localeCompare(a.q,'vi'));

    if (currentQuery) {
        const fuse = new Fuse(filteredDb, { keys:['q','a'], threshold:.35, minMatchCharLength:2 });
        filteredDb = fuse.search(currentQuery).map(r => r.item);
    }
    renderGrid();
    toast('success', { random:'🔀 Xáo ngẫu nhiên', az:'🔠 Sắp xếp A → Z', za:'🔡 Sắp xếp Z → A' }[type] || 'Đã cập nhật');
};

window.handleSort = function() {
    if (typeof Swal === 'undefined') return;
    const dk = document.documentElement.classList.contains('dark');
    const opts = [
        { t:'random', e:'🔀', l:'Ngẫu nhiên', d:'Xáo trộn toàn bộ dữ liệu' },
        { t:'az',     e:'🔠', l:'A → Z',      d:'Sắp xếp theo bảng chữ cái' },
        { t:'za',     e:'🔡', l:'Z → A',      d:'Sắp xếp ngược bảng chữ cái' },
    ];
    Swal.fire({
        title: '<span style="font-size:13px;font-weight:900;text-transform:uppercase">⇅ Sắp xếp</span>',
        background: dk ? '#0c1a2e' : '#fff',
        color:      dk ? '#ecfdf5' : '#0f172a',
        html: `<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">` +
            opts.map(o => `
            <button onclick="window.executeSort('${o.t}');Swal.close()"
                style="display:flex;align-items:center;gap:12px;padding:12px 14px;
                       border-radius:14px;border:2px solid ${currentSort===o.t?'#10b981':'rgba(100,116,139,.2)'};
                       background:${currentSort===o.t?'rgba(16,185,129,.08)':'transparent'};
                       cursor:pointer;width:100%;transition:all .2s;text-align:left">
                <span style="font-size:20px">${o.e}</span>
                <div><p style="font-size:12px;font-weight:800;margin:0">${o.l}</p>
                     <p style="font-size:10px;color:#64748b;margin:2px 0 0">${o.d}</p></div>
                ${currentSort===o.t?'<i class="bi bi-check-circle-fill" style="color:#10b981;margin-left:auto"></i>':''}
            </button>`).join('') + `</div>`,
        showConfirmButton: false
    });
};


/* ============================================================
   FILTER
============================================================ */
window.filterByFile = function(fileName) {
    currentFile  = fileName;
    currentWeek  = 'ALL';
    currentQuery = '';

    const si = document.getElementById('mainSearch');
    const bc = document.getElementById('btnClear');
    if (si) si.value = '';
    if (bc) bc.classList.add('hidden');

    document.querySelectorAll('.filter-tab').forEach(t => {
        const active = t.dataset.file === fileName;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
        /* Tự cuộn tab active vào giữa khung nhìn — cần thiết khi nhiều tab tràn ngang */
        if (active) t.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
    });

    /* Render sub-tab tuần nếu category này có chia tuần */
    renderWeekTabs(fileName);

    let base = [...getByCategory(fileName)]; /* O(1) index lookup thay vì O(n) filter() */

    if      (currentSort === 'random') filteredDb = shuffleArray(base);
    else if (currentSort === 'az')     filteredDb = [...base].sort((a,b) => a.q.localeCompare(b.q,'vi'));
    else if (currentSort === 'za')     filteredDb = [...base].sort((a,b) => b.q.localeCompare(a.q,'vi'));
    else                               filteredDb = base;

    renderGrid();
    if (fileName !== 'ALL') toast('info', `📂 ${fileName} · ${filteredDb.length} câu`);
};


/* ============================================================
   SUB-TAB TUẦN — chỉ hiện khi category đang chọn có field week
============================================================ */
function renderWeekTabs(fileName) {
    const wrap = document.getElementById('weekTabsWrap');
    if (!wrap) return;

    if (fileName === 'ALL' || !categoryHasWeeks(fileName)) {
        wrap.innerHTML = '';
        wrap.classList.add('hidden');
        return;
    }

    const weeks = getWeeksForCategory(fileName);
    const totalCount = getByCategory(fileName).length;

    wrap.classList.remove('hidden');
    wrap.innerHTML = '';

    const frag = document.createDocumentFragment();

    /* Tab "Tất cả tuần" */
    const allBtn = document.createElement('button');
    allBtn.className = 'week-tab active';
    allBtn.dataset.week = 'ALL';
    allBtn.innerHTML = `<i class="bi bi-collection-fill" aria-hidden="true"></i> Tất cả <span class="week-badge">${totalCount}</span>`;
    allBtn.addEventListener('click', () => filterByWeek('ALL'));
    frag.appendChild(allBtn);

    weeks.forEach(w => {
        const btn = document.createElement('button');
        btn.className = 'week-tab';
        btn.dataset.week = w.week;
        btn.innerHTML = `<i class="bi bi-calendar-week-fill" aria-hidden="true"></i> ${w.title} <span class="week-badge">${w.count}</span>`;
        btn.addEventListener('click', () => filterByWeek(w.week));
        frag.appendChild(btn);
    });

    wrap.appendChild(frag);
}

window.filterByWeek = function(week) {
    currentWeek  = week;
    currentQuery = '';

    const si = document.getElementById('mainSearch');
    const bc = document.getElementById('btnClear');
    if (si) si.value = '';
    if (bc) bc.classList.add('hidden');

    document.querySelectorAll('.week-tab').forEach(t => {
        const active = String(t.dataset.week) === String(week);
        t.classList.toggle('active', active);
        if (active) t.scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' });
    });

    let base = getByCategory(currentFile);
    if (week !== 'ALL') base = base.filter(i => i.week === week);
    base = [...base];

    if      (currentSort === 'random') filteredDb = shuffleArray(base);
    else if (currentSort === 'az')     filteredDb = [...base].sort((a,b) => a.q.localeCompare(b.q,'vi'));
    else if (currentSort === 'za')     filteredDb = [...base].sort((a,b) => b.q.localeCompare(a.q,'vi'));
    else                               filteredDb = base;

    renderGrid();
    if (week !== 'ALL') {
        const w = getWeeksForCategory(currentFile).find(x => x.week === week);
        toast('info', `📅 ${w ? w.title : 'Tuần ' + week} · ${filteredDb.length} câu`);
    }
};


/* ============================================================
   RENDER GRID
============================================================ */
function renderGrid() {
    itemsShown = 0;
    isLoading  = false;

    /* Reconnect observer cho lần scroll mới */
    if (_scrollObserver) { _scrollObserver.disconnect(); _scrollObserver = null; }
    setupInfiniteScroll();

    const grid = document.getElementById('gridDisplay');
    const end  = document.getElementById('endMessage');
    const load = document.getElementById('loadingUI');
    const rc   = document.getElementById('resultCount');

    grid.innerHTML = '';
    end.classList.add('hidden');
    load.classList.remove('hidden');

    if (rc && !currentQuery) rc.textContent = filteredDb.length ? `${filteredDb.length} câu` : '';
    if (!filteredDb.length) { showEmptyState(); return; }

    loadBatch();
}

function loadBatch() {
    if (isLoading) return;
    isLoading = true;

    const batch = filteredDb.slice(itemsShown, itemsShown + PAGE_SIZE);

    if (!batch.length) {
        document.getElementById('loadingUI').classList.add('hidden');
        if (itemsShown > 0) document.getElementById('endMessage').classList.remove('hidden');
        isLoading = false;
        return;
    }

    const frag = document.createDocumentFragment();
    batch.forEach((item, idx) => frag.appendChild(buildCard(item, idx)));
    document.getElementById('gridDisplay').appendChild(frag);

    itemsShown += batch.length;
    isLoading   = false;

    document.getElementById('loadingUI').classList.add('hidden');
    if (itemsShown >= filteredDb.length) {
        document.getElementById('endMessage').classList.remove('hidden');
        if (_scrollObserver) { _scrollObserver.disconnect(); _scrollObserver = null; }
    }

    attachDoubleTap();
}


/* ============================================================
   BUILD CARD
   - Click card → openCardPopup()
   - Nút copy → copy nội dung
   - Nút share → share link (URL ?card=ID)
   - Nút ảnh → share PNG
============================================================ */
function buildCard(item, idx) {
    const bc    = badgeClass(item.fileName);
    const delay = Math.min(idx * 0.04, 0.32).toFixed(2);
    const dispQ = hl(item.q, currentQuery);
    const dispA = hl(item.a, currentQuery);

    const card = document.createElement('div');
    card.className = 'answer-card animate__animated animate__fadeInUp';
    card.style.animationDelay = `${delay}s`;
    card.style.willChange = 'transform, opacity';
    card.addEventListener('animationend', () => {
        card.style.willChange = 'auto';
        card.classList.remove('animate__animated', 'animate__fadeInUp');
    }, { once: true });
    card.style.cursor = 'pointer';
    card.dataset.id = item.id;
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `Câu hỏi: ${item.q.substring(0, 60)}`);

    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span class="cbadge ${bc}">
                    <i class="bi bi-patch-check-fill" style="font-size:8px" aria-hidden="true"></i>
                    ${item.fileName}
                </span>
                ${item.week != null ? `
                <span class="cbadge cb-purple" title="${item.weekTitle || ''}">
                    <i class="bi bi-calendar-week-fill" style="font-size:8px" aria-hidden="true"></i>
                    Tuần ${item.week}
                </span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="dtap-hint" title="Tap để xem chi tiết">
                    <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i> tap
                </span>
                <span style="font-size:9px;font-weight:700;color:var(--muted);font-family:monospace">#${item.id}</span>
            </div>
        </div>

        <h3 style="font-size:13px;font-weight:700;color:var(--text);line-height:1.6;margin:0 0 6px">${dispQ}</h3>

        <div class="ans-box">
            <div style="display:flex;align-items:flex-start;gap:8px">
                <i class="bi bi-lightbulb-fill" style="color:#10b981;flex-shrink:0;margin-top:2px" aria-hidden="true"></i>
                <p style="font-size:13px;font-weight:800;color:#059669;font-style:italic;line-height:1.6;margin:0">${dispA}</p>
            </div>
        </div>

        <div class="card-actions"
             style="display:flex;justify-content:space-between;align-items:center;
                    margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:5px;color:var(--muted)">
                <i class="bi bi-database-fill" style="font-size:9px" aria-hidden="true"></i>
                <span style="font-size:9px;font-weight:800;text-transform:uppercase;font-style:italic;letter-spacing:.5px">TNVN Data</span>
            </div>
            <div style="display:flex;gap:6px">
                <button class="act-btn btn-copy"   title="Copy nội dung"  aria-label="Copy nội dung">
                    <i class="bi bi-clipboard2-plus" style="font-size:11px;color:var(--muted)" aria-hidden="true"></i>
                </button>
                <button class="act-btn act-btn-share btn-sharelink" title="Share link card" aria-label="Share link">
                    <i class="bi bi-link-45deg" style="font-size:13px;color:#2563eb" aria-hidden="true"></i>
                </button>
                <button class="act-btn act-btn-img btn-shareimg" title="Share ảnh card" aria-label="Share ảnh">
                    <i class="bi bi-image-fill" style="font-size:10px;color:#7c3aed" aria-hidden="true"></i>
                </button>
            </div>
        </div>`;

    /* Click toàn card → popup (trừ khi click vào nút action) */
    card.addEventListener('click', (e) => {
        if (e.target.closest('.act-btn')) return;
        openCardPopup(item.id);
    });

    card.querySelector('.btn-copy').addEventListener('click', async (e) => {
        e.stopPropagation();
        const text = `❓ ${item.q}\n✅ ${item.a}\n\n— TreXanh v2.4 —`;
        let ok = false;
        try { await navigator.clipboard.writeText(text); ok = true; }
        catch {
            try {
                const ta = document.createElement('textarea');
                ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(ta); ta.focus(); ta.select();
                ok = document.execCommand('copy');
                document.body.removeChild(ta);
            } catch {}
        }
        toast(ok ? 'success':'error', ok ? '✅ Đã copy!':'Không thể copy');
    });

    card.querySelector('.btn-sharelink').addEventListener('click', async (e) => {
        e.stopPropagation();
        const shareUrl = cardUrl(item.id);
        const ogImg    = ogImageUrl(item);

        /* Inject OG meta động */
        const setMeta = (prop, val, attr='property') => {
            let el = document.querySelector(`meta[${attr}="${prop}"]`);
            if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
            el.setAttribute('content', val);
        };
        setMeta('og:url',        shareUrl);
        setMeta('og:title',      `❓ ${item.q.substring(0,60)}…`);
        setMeta('og:description',`✅ ${item.a.substring(0,100)}`);
        setMeta('og:image',      ogImg);
        setMeta('twitter:image', ogImg, 'name');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `TreXanh · ${item.fileName}`,
                    text:  `❓ ${item.q.substring(0, 80)}…`,
                    url:   shareUrl,
                });
            } catch {}
        } else {
            let ok = false;
            try { await navigator.clipboard.writeText(shareUrl); ok = true; } catch {}
            toast('success', ok ? '🔗 Đã copy link card!' : '🔗 Copy link thất bại', 2000);
        }
    });

    card.querySelector('.btn-shareimg').addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof window.shareCardAsImage === 'function') {
            window.shareCardAsImage(card);
        } else {
            toast('warning', 'Tính năng share ảnh đang tải, thử lại…');
        }
    });

    return card;
}


/* ============================================================
   DOUBLE-TAP COPY (mobile shortcut)
   Single tap  → click event → openCardPopup()  (handled in buildCard)
   Double tap  → touchend detect → copy đáp án
   Phân biệt bằng timestamp; nếu double-tap, preventDefault() chặn click
============================================================ */
const _tapTs = new Map();

function attachDoubleTap() {
    document.querySelectorAll('.answer-card:not([data-dtap])').forEach(card => {
        card.setAttribute('data-dtap', '1');

        card.addEventListener('touchend', async (e) => {
            if (e.target.closest('.act-btn')) return;
            const id   = card.dataset.id;
            const now  = Date.now();
            const prev = _tapTs.get(id) || 0;

            if (now - prev < 350) {
                /* Double tap — copy đáp án, chặn click (tránh mở popup) */
                _tapTs.delete(id);
                e.preventDefault();

                const item = _cardData.get(id);
                const rawText = item ? item.a : '';
                let copied = false;
                try { await navigator.clipboard.writeText(rawText); copied = true; }
                catch {
                    try {
                        const ta = document.createElement('textarea');
                        ta.value = rawText; ta.style.cssText = 'position:fixed;opacity:0';
                        document.body.appendChild(ta); ta.focus(); ta.select();
                        copied = document.execCommand('copy');
                        document.body.removeChild(ta);
                    } catch {}
                }
                if (navigator.vibrate) navigator.vibrate(40);
                card.classList.remove('copied-flash');
                void card.offsetWidth;
                card.classList.add('copied-flash');
                setTimeout(() => card.classList.remove('copied-flash'), 500);
                if (copied) toast('success', '✅ Đã copy đáp án!', 1200);

            } else {
                /* First tap — ghi timestamp, để click event mở popup bình thường */
                _tapTs.set(id, now);
                setTimeout(() => { if (_tapTs.get(id) === now) _tapTs.delete(id); }, 400);
            }
        }, { passive: false });
    });
}


/* ============================================================
   ERROR STATE — hiện khi fetch file JSON thất bại
============================================================ */
function showFetchError(failedFiles) {
    /* Hiện toast cảnh báo */
    const names = failedFiles.map(f => f.name).join(', ');
    toast('warning', `⚠ Không tải được: ${names}`, 4000);

    /* Banner cảnh báo trên đầu grid */
    const grid = document.getElementById('gridDisplay');
    const banner = document.createElement('div');
    banner.id = 'fetchErrorBanner';
    banner.style.cssText = `background:rgba(239,68,68,.07);border:1.5px solid rgba(239,68,68,.2);
        border-radius:16px;padding:14px 16px;margin-bottom:14px;
        display:flex;align-items:flex-start;gap:10px`;
    banner.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill" style="color:#ef4444;font-size:18px;flex-shrink:0;margin-top:1px"></i>
        <div style="flex:1">
            <p style="font-size:12px;font-weight:800;color:#ef4444;margin:0 0 3px">
                Không tải được một số dữ liệu
            </p>
            <p style="font-size:10px;color:var(--muted);margin:0 0 8px;line-height:1.5">
                ${failedFiles.map(f =>
                    `<b>${f.name}</b>: ${f.reason === 'empty' ? 'File rỗng (0 câu)' : 'Lỗi mạng — ' + f.reason}`
                ).join('<br>')}
            </p>
            <button id="btnRetryFetch"
                style="font-size:10px;font-weight:800;padding:5px 12px;border-radius:8px;
                       background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.25);
                       color:#ef4444;cursor:pointer;display:inline-flex;align-items:center;gap:5px">
                <i class="bi bi-arrow-clockwise"></i> Thử tải lại
            </button>
        </div>
        <button id="btnDismissError"
            style="width:22px;height:22px;border-radius:6px;border:none;background:transparent;
                   cursor:pointer;color:var(--muted);font-size:13px;flex-shrink:0;display:flex;
                   align-items:center;justify-content:center">
            <i class="bi bi-x-lg"></i>
        </button>`;

    grid.insertBefore(banner, grid.firstChild);

    document.getElementById('btnRetryFetch')?.addEventListener('click', () => {
        banner.remove();
        /* Reset và tải lại toàn bộ */
        fullDb = []; filteredDb = []; _cardData.clear();
        _fuseInstance = null; _categoryFuseCache.clear();
        init();
    });

    document.getElementById('btnDismissError')?.addEventListener('click', () => banner.remove());
}


/* ============================================================
   EMPTY STATE — khi không có câu nào (search không ra hoặc JSON rỗng)
============================================================ */
function showEmptyState() {
    document.getElementById('loadingUI').classList.add('hidden');
    const grid = document.getElementById('gridDisplay');

    /* Phân biệt: rỗng do search không ra vs data thực sự rỗng */
    const isSearchEmpty = !!currentQuery;
    const isCatEmpty    = currentFile !== 'ALL' && !currentQuery && getByCategory(currentFile).length === 0;

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;padding:52px 0;text-align:center';

    if (isCatEmpty) {
        /* Danh mục này chưa có dữ liệu */
        wrap.innerHTML = `
            <div style="width:64px;height:64px;border-radius:20px;background:var(--bg);
                        display:flex;align-items:center;justify-content:center;margin-bottom:14px;
                        border:1.5px solid var(--border)">
                <i class="bi bi-inbox" style="font-size:28px;color:var(--muted)"></i>
            </div>
            <p style="font-size:13px;font-weight:800;color:var(--muted);margin-bottom:4px">Danh mục chưa có dữ liệu</p>
            <p style="font-size:11px;color:var(--muted);margin-bottom:18px;opacity:.65;line-height:1.5">
                Mục "<b>${currentFile}</b>" hiện chưa có câu hỏi nào.<br>Dữ liệu sẽ được cập nhật sớm.
            </p>`;
    } else if (isSearchEmpty) {
        /* Tìm kiếm không ra kết quả */
        wrap.innerHTML = `
            <div style="width:64px;height:64px;border-radius:20px;background:var(--bg);
                        display:flex;align-items:center;justify-content:center;margin-bottom:14px;
                        border:1.5px solid var(--border)">
                <i class="bi bi-search" style="font-size:26px;color:var(--muted)"></i>
            </div>
            <p style="font-size:13px;font-weight:800;color:var(--muted);margin-bottom:4px">Không tìm thấy kết quả</p>
            <p style="font-size:11px;color:var(--muted);margin-bottom:4px;opacity:.65">
                Không có câu hỏi nào khớp với "<b style="color:var(--text)">${currentQuery}</b>"
            </p>
            <p style="font-size:10px;color:var(--muted);margin-bottom:18px;opacity:.5">
                Thử từ khóa ngắn hơn hoặc kiểm tra chính tả
            </p>`;
        const btn = document.createElement('button');
        btn.style.cssText = 'padding:10px 22px;background:#10b981;color:white;border:none;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px';
        btn.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i> Xóa tìm kiếm';
        btn.addEventListener('click', clearSearchAndReset);
        wrap.appendChild(btn);
    } else {
        /* Fallback chung */
        wrap.innerHTML = `
            <div style="width:64px;height:64px;border-radius:20px;background:var(--bg);
                        display:flex;align-items:center;justify-content:center;margin-bottom:14px;
                        border:1.5px solid var(--border)">
                <i class="bi bi-database-x" style="font-size:26px;color:var(--muted)"></i>
            </div>
            <p style="font-size:13px;font-weight:800;color:var(--muted);margin-bottom:4px">Không có dữ liệu</p>
            <p style="font-size:11px;color:var(--muted);margin-bottom:18px;opacity:.65">Thử chọn danh mục khác</p>`;
        const btn = document.createElement('button');
        btn.style.cssText = 'padding:10px 22px;background:#10b981;color:white;border:none;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;gap:6px';
        btn.innerHTML = '<i class="bi bi-grid-fill"></i> Xem tất cả';
        btn.addEventListener('click', clearSearchAndReset);
        wrap.appendChild(btn);
    }

    grid.appendChild(wrap);
}

window.clearSearchAndReset = function() {
    currentQuery = '';
    const si = document.getElementById('mainSearch');
    const bc = document.getElementById('btnClear');
    if (si) si.value = '';
    if (bc) bc.classList.add('hidden');
    filterByFile('ALL');
};


/* ============================================================
   SKELETON LOADING
============================================================ */
function showSkeletons(n) {
    document.getElementById('gridDisplay').innerHTML = Array(n).fill(`
        <div class="answer-card" aria-hidden="true" style="pointer-events:none">
            <!-- Header: badge + id -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <span class="sk-line" style="width:110px;height:22px;border-radius:8px"></span>
                <span class="sk-line" style="width:48px;height:16px;border-radius:6px"></span>
            </div>
            <!-- Câu hỏi: 2.5 dòng -->
            <span class="sk-line" style="width:100%;height:13px;margin-bottom:7px;display:block;border-radius:6px"></span>
            <span class="sk-line" style="width:92%;height:13px;margin-bottom:7px;display:block;border-radius:6px"></span>
            <span class="sk-line" style="width:65%;height:13px;margin-bottom:12px;display:block;border-radius:6px"></span>
            <!-- Đáp án box -->
            <div style="background:rgba(16,185,129,.05);border:1px solid rgba(16,185,129,.12);border-radius:14px;padding:12px 14px">
                <div style="display:flex;align-items:flex-start;gap:8px">
                    <span class="sk-line" style="width:14px;height:14px;border-radius:50%;flex-shrink:0;margin-top:2px"></span>
                    <div style="flex:1">
                        <span class="sk-line" style="width:88%;height:13px;margin-bottom:6px;display:block;border-radius:6px"></span>
                        <span class="sk-line" style="width:55%;height:13px;display:block;border-radius:6px"></span>
                    </div>
                </div>
            </div>
            <!-- Footer: source + action buttons -->
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
                <span class="sk-line" style="width:70px;height:11px;border-radius:5px"></span>
                <div style="display:flex;gap:6px">
                    <span class="sk-line" style="width:30px;height:30px;border-radius:10px"></span>
                    <span class="sk-line" style="width:30px;height:30px;border-radius:10px"></span>
                    <span class="sk-line" style="width:30px;height:30px;border-radius:10px"></span>
                </div>
            </div>
        </div>`).join('');
}


/* ============================================================
   SYNC FOOTER STATS
============================================================ */
function syncFooter() {
    ['total','files'].forEach(k => {
        const src = document.getElementById(`stat-${k}`);
        const dst = document.getElementById(`footer-${k}`);
        if (src && dst) dst.textContent = src.textContent;
    });
}


/* ============================================================
   KHỞI ĐỘNG
============================================================ */
document.addEventListener('DOMContentLoaded', init);
