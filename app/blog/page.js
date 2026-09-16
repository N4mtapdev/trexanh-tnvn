import Script from 'next/script';

export const metadata = {
  title: 'Blog',
  description:
    'Blog chia sẻ kiến thức, tin tức về lý luận chính trị, lịch sử, hoạt động thanh niên TNVN.',
  alternates: { canonical: '/blog' },
  openGraph: { title: 'Blog TreXanh', type: 'website' },
};

export default function BlogPage() {
  return (
    <div id="page-content" role="main">
      <link rel="stylesheet" href="/assets/css/main.css" />

      <div style={{ padding: 16 }}>
        <div className="hero-box" style={{ marginBottom: 20 }}>
          <div className="z1">
            <div className="hero-badge">
              <i className="bi bi-newspaper" /> Blog TNVN
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)', margin: '0 0 6px', lineHeight: 1.3 }}>
              Kiến thức &amp; Tin tức <span style={{ color: '#10b981' }}>Thanh Niên</span>
            </h1>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
              Cập nhật kiến thức lý luận chính trị, lịch sử,
              <br />
              và các hoạt động thanh niên TNVN.
            </p>
            <div className="search-box" id="blog-search-wrap">
              <i className="bi bi-search" style={{ color: '#10b981', fontSize: 13, flexShrink: 0 }} />
              <input id="blog-search" type="search" placeholder="Tìm bài viết..." autoComplete="off" />
              <button
                id="blog-search-clear"
                style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <i className="bi bi-x-circle-fill" style={{ color: 'var(--muted)', fontSize: 13 }} />
              </button>
            </div>
          </div>
        </div>

        <div className="no-sb" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 16 }}>
          <button className="quick-chip" data-kw="chính trị">
            <i className="bi bi-flag-fill" />
            Chính trị
          </button>
          <button className="quick-chip" data-kw="lịch sử">
            <i className="bi bi-clock-history" />
            Lịch sử
          </button>
          <button className="quick-chip" data-kw="đoàn">
            <i className="bi bi-people-fill" />
            Đoàn
          </button>
          <button className="quick-chip" data-kw="thanh niên">
            <i className="bi bi-person-hearts" />
            Thanh niên
          </button>
          <button className="quick-chip" id="blog-reset-chip">
            <i className="bi bi-x-lg" />
            Reset
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div className="no-sb" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, flex: 1 }} role="tablist">
            <button data-cat="all" className="filter-tab active">
              <i className="bi bi-grid-fill" /> Tất cả
            </button>
            <button data-cat="chinhTri" className="filter-tab">
              <i className="bi bi-flag-fill" /> Chính trị
            </button>
            <button data-cat="lichSu" className="filter-tab">
              <i className="bi bi-clock-history" /> Lịch sử
            </button>
            <button data-cat="hoatDong" className="filter-tab">
              <i className="bi bi-people-fill" /> Hoạt động
            </button>
            <button data-cat="tuLieu" className="filter-tab">
              <i className="bi bi-journal-bookmark-fill" /> Tư liệu
            </button>
          </div>
        </div>

        <div className="tx-sec-head">
          <span className="tx-sec-title">
            <i className="bi bi-fire" style={{ color: '#f59e0b' }} /> Bài viết
          </span>
          <div className="tx-sec-line" />
          <span id="post-count" style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', flexShrink: 0, marginLeft: 4 }} />
        </div>

        <div id="post-grid" role="list" />

        <div id="blog-empty" style={{ display: 'none' }}>
          <div className="empty-state">
            <div className="empty-icon">
              <i className="bi bi-search" style={{ fontSize: 22, color: 'var(--muted)' }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', margin: '0 0 4px' }}>Không tìm thấy bài viết</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 16px', opacity: 0.7 }}>
              Thử từ khóa khác hoặc chọn danh mục khác
            </p>
            <button id="blog-clear-btn" className="btn btn-primary btn-sm">
              <i className="bi bi-arrow-counterclockwise" /> Xem tất cả
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .post-card {
            background: var(--bg2);
            border: 1.5px solid var(--border);
            border-radius: var(--radius-lg);
            overflow: hidden; margin-bottom: 14px;
            transition: .22s; box-shadow: 0 3px 14px var(--shadow);
            cursor: pointer; position: relative;
        }
        .post-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg,#10b981,#34d399); opacity: 0; transition: opacity .2s;
        }
        .post-card:hover { border-color: rgba(16,185,129,.4); box-shadow: 0 8px 28px var(--brand-glow); transform: translateY(-2px); }
        .post-card:hover::before { opacity: 1; }
        .post-card-sk { background: var(--bg2); border: 1.5px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 14px; }
      `}</style>

      <Script src="/assets/js/img-guard.js" strategy="beforeInteractive" />
      <Script src="/assets/js/base.js" strategy="beforeInteractive" />
      <Script
        id="blog-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var CAT_COLORS = {
                emerald: { bg:'rgba(16,185,129,.1)', text:'#059669' },
                blue:    { bg:'rgba(59,130,246,.1)', text:'#2563eb' },
                amber:   { bg:'rgba(245,158,11,.1)', text:'#d97706' },
                purple:  { bg:'rgba(139,92,246,.1)', text:'#7c3aed' },
                red:     { bg:'rgba(239,68,68,.1)',  text:'#dc2626' },
              };
              var POSTS = [];
              var _cat = 'all', _q = '';

              function highlightMatch(text, query) {
                var safe = escapeHtml(text);
                if (!query) return safe;
                var lower = safe.toLowerCase();
                var q = query.toLowerCase();
                var i = lower.indexOf(q);
                if (i === -1) return safe;
                return safe.slice(0, i) + '<mark class="tx-hl">' + safe.slice(i, i + q.length) + '</mark>' + safe.slice(i + q.length);
              }

              function escapeHtml(str) {
                return String(str == null ? '' : str).replace(/[&<>"']/g, function(c) {
                  return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
                });
              }

              function getFiltered() {
                return POSTS.filter(function(p) {
                  var mc = _cat === 'all' || p.category === _cat;
                  var mq = !_q || p.title.toLowerCase().includes(_q)
                               || (p.excerpt||'').toLowerCase().includes(_q)
                               || (p.tags||[]).some(function(t){ return t.toLowerCase().includes(_q); });
                  return mc && mq;
                });
              }

              function buildCard(p, idx) {
                var delay = Math.min(idx * 0.06, 0.3).toFixed(2);
                var col = CAT_COLORS[p.catColor] || CAT_COLORS.emerald;
                var rel = window.TreXanh ? TreXanh.relativeTime(p.date) : p.date;

                var ttl = highlightMatch(p.title, _q);

                var ph = '<div style="width:100%;height:130px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(16,185,129,.1),rgba(16,185,129,.04))"><i class="bi bi-newspaper" style="font-size:32px;color:rgba(16,185,129,.35)"></i></div>';
                var th = p.thumb
                  ? '<img src="'+p.thumb+'" alt="'+escapeHtml(p.title)+'" loading="lazy" style="width:100%;height:150px;object-fit:cover;display:block">'
                  : ph;

                var tags = (p.tags||[]).slice(0,2).map(function(t){
                  return '<span class="tag-chip" style="font-size:9px;padding:2px 7px">#'+escapeHtml(t)+'</span>';
                }).join('');

                return '<article class="post-card animate__animated animate__fadeInUp" style="animation-delay:'+delay+'s" data-slug="'+p.slug+'" role="listitem">'
                  + '<div style="position:relative;overflow:hidden">'
                    + th
                    + (p.featured ? '<span class="badge badge-featured" style="position:absolute;top:10px;left:10px;backdrop-filter:blur(4px)"><i class="bi bi-star-fill" style="font-size:8px"></i> Nổi bật</span>' : '')
                    + '<span class="badge" style="position:absolute;bottom:10px;left:10px;background:rgba(255,255,255,.92);color:'+col.text+';backdrop-filter:blur(4px)">'+escapeHtml(p.catLabel)+'</span>'
                  + '</div>'
                  + '<div style="padding:14px">'
                    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">'
                      + '<span style="font-size:9px;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:3px"><i class="bi bi-clock" style="font-size:9px"></i> '+rel+'</span>'
                      + '<span style="width:3px;height:3px;border-radius:50%;background:var(--border)"></span>'
                      + '<span style="font-size:9px;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:3px"><i class="bi bi-book" style="font-size:9px"></i> '+escapeHtml(p.readTime)+'</span>'
                      + '<span style="width:3px;height:3px;border-radius:50%;background:var(--border)"></span>'
                      + '<span style="font-size:9px;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:3px"><i class="bi bi-person" style="font-size:9px"></i> '+escapeHtml(p.author)+'</span>'
                    + '</div>'
                    + '<h2 style="font-size:14px;font-weight:800;color:var(--text);margin:0 0 7px;line-height:1.45">'+ttl+'</h2>'
                    + '<p style="font-size:11px;color:var(--muted);margin:0 0 12px;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+escapeHtml(p.excerpt)+'</p>'
                    + '<div style="display:flex;justify-content:space-between;align-items:center">'
                      + '<div style="display:flex;gap:5px;flex-wrap:wrap">'+tags+'</div>'
                      + '<span style="font-size:10px;font-weight:800;color:#059669;display:flex;align-items:center;gap:3px;white-space:nowrap">Đọc thêm <i class="bi bi-arrow-right"></i></span>'
                    + '</div>'
                  + '</div>'
                + '</article>';
              }

              function renderPosts() {
                var posts = getFiltered();
                var grid = document.getElementById('post-grid');
                var empty = document.getElementById('blog-empty');
                var cnt = document.getElementById('post-count');
                if (cnt) cnt.textContent = posts.length + ' bài';

                if (!posts.length) { grid.innerHTML = ''; empty.style.display = 'block'; return; }
                empty.style.display = 'none';
                grid.innerHTML = posts.map(buildCard).join('');

                grid.querySelectorAll('.post-card').forEach(function(el) {
                  el.addEventListener('click', function() {
                    location.href = '/blog/' + el.dataset.slug;
                  });
                });
              }

              async function loadPosts() {
                document.getElementById('post-grid').innerHTML = [1,2,3].map(function(){
                  return '<div class="post-card-sk">'
                    + '<div class="sk" style="height:140px"></div>'
                    + '<div style="padding:14px">'
                      + '<div class="sk" style="height:11px;width:55%;margin-bottom:10px"></div>'
                      + '<div class="sk" style="height:15px;width:92%;margin-bottom:5px"></div>'
                      + '<div class="sk" style="height:11px;width:70%"></div>'
                    + '</div></div>';
                }).join('');

                try {
                  var res = await fetch('/api/posts');
                  POSTS = await res.json();
                } catch(e) { POSTS = []; }

                renderPosts();
                var cnt = document.getElementById('post-count');
                if (cnt && window.TreXanh) TreXanh.countUp(cnt, POSTS.length, 600);
              }

              document.querySelectorAll('.filter-tab').forEach(function(btn) {
                btn.addEventListener('click', function() {
                  _cat = btn.dataset.cat;
                  document.querySelectorAll('.filter-tab').forEach(function(b){ b.classList.toggle('active', b === btn); });
                  renderPosts();
                });
              });

              document.querySelectorAll('.quick-chip[data-kw]').forEach(function(chip) {
                chip.addEventListener('click', function() {
                  var kw = chip.dataset.kw;
                  var inp = document.getElementById('blog-search');
                  inp.value = kw; _q = kw.toLowerCase();
                  document.getElementById('blog-search-clear').style.display = 'block';
                  renderPosts();
                });
              });

              function resetSearch() {
                var inp = document.getElementById('blog-search');
                inp.value = ''; _q = '';
                document.getElementById('blog-search-clear').style.display = 'none';
                _cat = 'all';
                document.querySelectorAll('.filter-tab').forEach(function(b) {
                  b.classList.toggle('active', b.dataset.cat === 'all');
                });
                renderPosts();
              }
              document.getElementById('blog-reset-chip').addEventListener('click', resetSearch);
              document.getElementById('blog-clear-btn').addEventListener('click', resetSearch);
              document.getElementById('blog-search-clear').addEventListener('click', resetSearch);

              var input = document.getElementById('blog-search');
              input.addEventListener('input', function() {
                _q = input.value.toLowerCase().trim();
                document.getElementById('blog-search-clear').style.display = _q ? 'block' : 'none';
                renderPosts();
              });

              if (window.TreXanh) TreXanh.init({ page: 'blog' });
              loadPosts();
            })();
          `,
        }}
      />
    </div>
  );
}
