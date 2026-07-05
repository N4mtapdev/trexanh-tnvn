/**
 * TreXanh Service Worker v2.4
 * Chiến lược:
 *   - Shell (HTML/CSS/JS/fonts/icons): Cache First — load nhanh, update ngầm
 *   - JSON data: Network First — luôn cố lấy mới nhất, fallback cache nếu offline
 *   - API /api/*: Network Only — không cache
 *   - Ảnh: Cache First với expiry
 */

const CACHE_SHELL   = 'tx-shell-v2.4.2';
const CACHE_DATA    = 'tx-data-v2.4.2';
const CACHE_IMAGES  = 'tx-img-v2.4.2';

const SHELL_URLS = [
    '/',
    '/index.html',
    '/assets/js/load.min.js',
    '/assets/js/base.js',
    '/assets/favicon/favicon-32x32.png',
    '/assets/favicon/favicon.ico',
    '/assets/favicon/site.webmanifest',
    /* CDN — cache khi đã fetch lần đầu */
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
    'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.min.js',
    'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
];

const DATA_URLS = [
    '/api/data?cat=HHT',
    '/api/data?cat=LLCT',
];

/* ── Install: pre-cache shell ── */
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_SHELL).then(cache =>
            /* Dùng cache.add với ignore-search để không bị lỗi query string */
            Promise.allSettled(SHELL_URLS.map(url => cache.add(url).catch(() => null)))
        ).then(() => self.skipWaiting())
    );
});

/* ── Activate: xóa cache cũ ── */
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys
                .filter(k => ![CACHE_SHELL, CACHE_DATA, CACHE_IMAGES].includes(k))
                .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
    /* Pre-cache data JSON ngầm sau khi activate */
    caches.open(CACHE_DATA).then(cache =>
        Promise.allSettled(DATA_URLS.map(url => cache.add(url).catch(() => null)))
    );
});

/* ── Fetch: routing strategy ── */
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    /* Data API — Network First, fallback cache (giữ offline support cho câu hỏi/đáp án) */
    if (url.pathname === '/api/data') {
        e.respondWith(networkFirstJSON(e.request));
        return;
    }

    /* Các API khác (og, online...) — network only, không cache */
    if (url.pathname.startsWith('/api/')) return;

    /* Ảnh — Cache First */
    if (/\.(webp|png|jpg|jpeg|gif|svg|ico)$/i.test(url.pathname)) {
        e.respondWith(cacheFirstImages(e.request));
        return;
    }

    /* Audio — network only (quá nặng để cache) */
    if (/\.(mp3|ogg|wav)$/i.test(url.pathname)) return;

    /* Mọi thứ còn lại (HTML, JS, CSS, fonts) — Cache First + revalidate ngầm */
    e.respondWith(cacheFirstWithRevalidate(e.request));
});

/* ── Cache First + revalidate ngầm (Stale While Revalidate) ── */
async function cacheFirstWithRevalidate(req) {
    const cached = await caches.match(req, { ignoreSearch: true });
    const fetchPromise = fetch(req).then(res => {
        if (res.ok) caches.open(CACHE_SHELL).then(c => c.put(req, res.clone()));
        return res;
    }).catch(() => null);
    return cached || await fetchPromise || new Response('Offline', { status: 503 });
}

/* ── Network First (JSON data) ──
   Lưu ý: /api/data phân biệt category bằng query (?cat=HHT vs ?cat=LLCT),
   nên KHÔNG dùng ignoreSearch (sẽ làm 2 category lẫn cache vào nhau).
   Chỉ bỏ riêng param "v" (cache-buster) khi tạo cache key, giữ nguyên "cat". */
function dataCacheKey(req) {
    const u = new URL(req.url);
    u.searchParams.delete('v');
    return new Request(u.toString(), { method: 'GET' });
}

async function networkFirstJSON(req) {
    const key = dataCacheKey(req);
    try {
        const res = await fetch(req);
        if (res.ok) {
            const cache = await caches.open(CACHE_DATA);
            cache.put(key, res.clone());
        }
        return res;
    } catch {
        const cache  = await caches.open(CACHE_DATA);
        const cached = await cache.match(key);
        if (cached) return cached;
        /* Trả JSON rỗng thay vì lỗi, để UI hiện empty state đúng */
        return new Response('[]', {
            headers: { 'Content-Type': 'application/json', 'X-From-SW': 'offline' }
        });
    }
}

/* ── Cache First (images) ── */
async function cacheFirstImages(req) {
    const cached = await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
        const res = await fetch(req);
        if (res.ok) caches.open(CACHE_IMAGES).then(c => c.put(req, res.clone()));
        return res;
    } catch {
        return new Response('', { status: 404 });
    }
}
