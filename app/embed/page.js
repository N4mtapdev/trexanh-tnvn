import Script from 'next/script';

export const metadata = {
  title: 'Widget tra cứu',
  robots: 'noindex, nofollow',
};

/**
 * Trang widget để NHÚNG qua <iframe> vào website/blog khác.
 * Cách dùng:
 *     <iframe src="https://trexanh-tnvn.vercel.app/embed"
 *             width="100%" height="480" style="border:0;border-radius:16px"
 *             loading="lazy" title="TreXanh — Tra cứu đáp án TNVN"></iframe>
 *
 * Vì sao an toàn khi nhúng ở site khác:
 * - Iframe khác-origin: trang nhúng KHÔNG đọc được DOM/JS bên trong khung
 *   này, nên không copy được logic/code thật của TreXanh qua iframe.
 * - Trang này CHỈ chứa 1 ô tìm kiếm + kết quả — không lộ thêm gì so với
 *   việc mở thẳng trang chính, chỉ gọn hơn để nhúng.
 * - Chỉ RIÊNG trang này được phép nhúng cross-origin (xem header
 *   Content-Security-Policy: frame-ancestors cho path /embed trong
 *   next.config.mjs) — toàn bộ các trang còn lại vẫn bị chặn nhúng.
 */
export default function EmbedPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: 14, color: '#0f172a' }}>
      <style>{`
        .tx-embed-search {
            display: flex; align-items: center; gap: 8px;
            background: #f0fdf4; border: 1.5px solid #d1fae5; border-radius: 12px;
            padding: 10px 14px; margin-bottom: 10px;
        }
        .tx-embed-search input {
            flex: 1; border: none; background: transparent; outline: none;
            font-size: 14px; color: #0f172a;
        }
        .tx-embed-search input::placeholder { color: #94a3b8; }
        .tx-embed-icon { color: #10b981; font-size: 15px; flex-shrink: 0; }
        .tx-embed-results { max-height: 360px; overflow-y: auto; }
        .tx-embed-empty { text-align: center; padding: 24px 8px; color: #94a3b8; font-size: 12px; }
        .tx-embed-item {
            background: #ffffff; border: 1px solid #f1f5f9; border-radius: 10px;
            padding: 10px 12px; margin-bottom: 8px; cursor: pointer;
            transition: border-color .15s;
        }
        .tx-embed-item:hover { border-color: #10b981; }
        .tx-embed-q { font-size: 12.5px; font-weight: 700; color: #0f172a; margin: 0 0 4px; line-height: 1.4; }
        .tx-embed-a { font-size: 12px; color: #059669; font-weight: 600; margin: 0; line-height: 1.4; display: none; }
        .tx-embed-item.open .tx-embed-a { display: block; }
        .tx-embed-badge {
            display: inline-block; font-size: 9px; font-weight: 800; color: #059669;
            background: rgba(16,185,129,.1); border-radius: 5px; padding: 1px 6px; margin-bottom: 5px;
        }
        .tx-embed-footer {
            display: flex; align-items: center; justify-content: space-between;
            margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9;
        }
        .tx-embed-brand { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 800; color: #64748b; text-decoration: none; }
        .tx-embed-brand span { color: #10b981; }
        .tx-embed-link { font-size: 10px; font-weight: 700; color: #10b981; text-decoration: none; display: flex; align-items: center; gap: 4px; }
        .tx-embed-link:hover { text-decoration: underline; }
        @media (prefers-color-scheme: dark) {
            body { color: #ecfdf5; }
            .tx-embed-search { background: #0c1a2e; border-color: rgba(16,185,129,.2); }
            .tx-embed-search input { color: #ecfdf5; }
            .tx-embed-item { background: #0c1a2e; border-color: rgba(255,255,255,.06); }
            .tx-embed-q { color: #ecfdf5; }
            .tx-embed-footer { border-color: rgba(255,255,255,.06); }
            .tx-embed-brand { color: #94a3b8; }
        }
      `}</style>

      <div className="tx-embed-search">
        <span className="tx-embed-icon">🔍</span>
        <input type="text" id="txEmbedInput" placeholder="Tìm câu hỏi, từ khóa..." autoComplete="off" />
      </div>

      <div className="tx-embed-results" id="txEmbedResults">
        <p className="tx-embed-empty">Gõ từ khóa để tìm câu hỏi &amp; đáp án</p>
      </div>

      <div className="tx-embed-footer">
        <a className="tx-embed-brand" href="/" target="_blank" rel="noopener">
          🌿 <span>TreXanh</span> TNVN
        </a>
        <a className="tx-embed-link" href="/" target="_blank" rel="noopener">
          Xem đầy đủ →
        </a>
      </div>

      <Script id="embed-widget" strategy="afterInteractive">
        {`
        (function () {
            'use strict';
            var CATEGORIES = ['HHT', 'LLCT'];
            var input   = document.getElementById('txEmbedInput');
            var results = document.getElementById('txEmbedResults');
            var allItems = null;
            var loading  = false;

            async function ensureLoaded() {
                if (allItems || loading) return;
                loading = true;
                try {
                    var lists = await Promise.all(CATEGORIES.map(async function(cat) {
                        try {
                            var res = await fetch('/api/data?cat=' + cat);
                            if (!res.ok) return [];
                            var data = await res.json();
                            return data.map(function(item) {
                                return {
                                    q: (item.question || item.q || '').trim(),
                                    a: (item.answer   || item.a || '').trim(),
                                    cat: cat,
                                };
                            }).filter(function(i) { return i.q && i.a; });
                        } catch (e) { return []; }
                    }));
                    allItems = lists.flat();
                } finally {
                    loading = false;
                }
            }

            function escapeHtml(str) {
                return String(str == null ? '' : str).replace(/[&<>"']/g, function(c) {
                    return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
                });
            }

            function render(query) {
                if (!query) {
                    results.innerHTML = '<p class="tx-embed-empty">Gõ từ khóa để tìm câu hỏi &amp; đáp án</p>';
                    return;
                }
                if (!allItems) {
                    results.innerHTML = '<p class="tx-embed-empty">Đang tải dữ liệu...</p>';
                    return;
                }
                var q = query.toLowerCase();
                var matches = allItems.filter(function(i) { return i.q.toLowerCase().includes(q); }).slice(0, 15);
                if (matches.length === 0) {
                    results.innerHTML = '<p class="tx-embed-empty">Không tìm thấy câu nào khớp với "' + escapeHtml(query) + '"</p>';
                    return;
                }
                results.innerHTML = matches.map(function(item) {
                    return '<div class="tx-embed-item">' +
                        '<span class="tx-embed-badge">' + escapeHtml(item.cat) + '</span>' +
                        '<p class="tx-embed-q">' + escapeHtml(item.q) + '</p>' +
                        '<p class="tx-embed-a">💡 ' + escapeHtml(item.a) + '</p>' +
                    '</div>';
                }).join('');
                results.querySelectorAll('.tx-embed-item').forEach(function(el) {
                    el.addEventListener('click', function() { el.classList.toggle('open'); });
                });
            }

            var debounceTimer;
            input.addEventListener('input', async function(e) {
                var query = e.target.value.trim();
                clearTimeout(debounceTimer);
                if (query) await ensureLoaded();
                debounceTimer = setTimeout(function() { render(query); }, 200);
            });

            input.addEventListener('focus', function() { ensureLoaded(); }, { once: true });
        })();
        `}
      </Script>
    </div>
  );
}
