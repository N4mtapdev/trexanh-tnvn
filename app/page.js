import Script from 'next/script';

export default function HomePage() {
  return (
    <>
      <div className="blob-wrap" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div id="readProgress"><div id="readBar" /></div>
      <div id="fsIndicator"><i className="bi bi-arrows-fullscreen" />Chế độ toàn màn hình</div>

      <header className="nav-glass sticky top-0 z-[100]">
        <div className="px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="logo-wrap w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span style={{ fontSize: 22 }}>🌳</span>
              </div>
              <div>
                <h1 style={{ fontSize: 15, fontWeight: 900, margin: 0, lineHeight: 1.2 }}>TreXanh</h1>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', margin: 0 }}>
                  Tra cứu dữ liệu TNVN
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="hdr-btn" id="btnSort" title="Sắp xếp" onClick={undefined} suppressHydrationWarning>
                <i className="bi bi-sliders" />
              </button>
              <button className="hdr-btn" id="btnTheme" title="Đổi giao diện">
                <i className="bi bi-moon-stars-fill" />
              </button>
              <a href="/blog" className="hdr-btn" title="Tin tức">
                <i className="bi bi-newspaper" />
              </a>
            </div>
          </div>

          <div className="search-wrap">
            <i className="bi bi-search" style={{ color: 'var(--muted)' }} />
            <input id="mainSearch" type="text" placeholder="Tìm câu hỏi, đáp án…" autoComplete="off" />
            <button id="btnClear" className="hidden" aria-label="Xóa tìm kiếm">
              <i className="bi bi-x-circle-fill" style={{ color: 'var(--muted)' }} />
            </button>
          </div>
          <p id="resultCount" style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', margin: '6px 2px 0', minHeight: 14 }} />
        </div>
      </header>

      <main className="px-4 pt-5 pb-8">
        <section className="mb-5">
          <div className="ticker-wrap">
            <div className="ticker-track">
              <span className="t-item"><i className="bi bi-lightning-charge-fill" />Cập nhật câu hỏi liên tục<span className="t-sep" /></span>
              <span className="t-item"><i className="bi bi-shield-check" />Dữ liệu chính xác, kiểm duyệt kỹ<span className="t-sep" /></span>
              <span className="t-item"><i className="bi bi-phone-fill" />Tối ưu cho di động<span className="t-sep" /></span>
              <span className="t-item"><i className="bi bi-lightning-charge-fill" />Cập nhật câu hỏi liên tục<span className="t-sep" /></span>
              <span className="t-item"><i className="bi bi-shield-check" />Dữ liệu chính xác, kiểm duyệt kỹ<span className="t-sep" /></span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 mb-5">
          <div className="stat-box s-green">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,.12)' }}>
              <i className="bi bi-collection-fill" style={{ color: '#10b981' }} />
            </div>
            <div>
              <p id="stat-total" style={{ fontSize: 18, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>0</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', margin: 0 }}>Câu hỏi</p>
            </div>
          </div>
          <div className="stat-box s-blue">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,.12)' }}>
              <i className="bi bi-folder-fill" style={{ color: '#3b82f6' }} />
            </div>
            <div>
              <p id="stat-files" style={{ fontSize: 18, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>0</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', margin: 0 }}>Danh mục</p>
            </div>
          </div>
        </section>

        <section className="cat-dd" id="catDd">
          <div className="cat-dd-backdrop" id="catDdBackdrop" />
          <button className="cat-dd-trigger" id="catDdTrigger" aria-expanded="false" aria-haspopup="listbox">
            <span className="cat-dd-icon" id="catDdIcon-wrap"><i className="bi bi-grid-fill" id="catDdIcon" /></span>
            <span className="cat-dd-label" id="catDdLabel">Tất cả danh mục</span>
            <span className="cat-dd-badge" id="catDdBadge">0</span>
            <i className="bi bi-chevron-down cat-dd-chevron" />
          </button>
          <div className="cat-dd-panel" role="listbox" id="categoryTabs">
            <button
              className="filter-tab active"
              data-file="ALL"
              role="option"
              aria-selected="true"
              onClick={undefined}
              suppressHydrationWarning
            >
              <span className="cat-dd-row-icon"><i className="bi bi-grid-fill" /></span>
              <span className="cat-dd-row-label">Tất cả danh mục</span>
              <span className="tab-badge" id="tabAllBadge">0</span>
              <i className="bi bi-check-lg cat-dd-check" />
            </button>
          </div>
        </section>

        <div id="weekTabsWrap" className="hidden flex gap-2 overflow-x-auto no-sb mb-4" style={{ paddingBottom: 2 }} />

        <section>
          <div className="sec-head">
            <span className="sec-title"><i className="bi bi-list-check" /> Danh sách câu hỏi</span>
            <span className="sec-line" />
          </div>

          <div id="gridDisplay" role="list" />

          <div id="loadingUI" className="hidden flex justify-center py-8">
            <i className="bi bi-arrow-repeat animate-spin text-lg" style={{ color: 'var(--brand)' }} />
          </div>

          <div id="loadMoreTrigger" style={{ height: 1 }} />

          <div id="endMessage" className="hidden text-center py-8">
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
              <i className="bi bi-check-circle-fill" style={{ color: 'var(--brand)' }} /> Đã hiển thị hết dữ liệu
            </p>
          </div>
        </section>
      </main>

      <footer className="px-4 py-5">
        <div className="flex items-center justify-between mb-3">
          <span className="sbadge"><i className="bi bi-patch-check-fill" /> TreXanh v1.0</span>
          <div className="flex gap-2">
            <span className="feat-chip"><span id="footer-total">0</span> câu hỏi</span>
            <span className="feat-chip"><span id="footer-files">0</span> danh mục</span>
          </div>
        </div>
        <div className="fdivider" />
        <div className="flex justify-between" style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>
          <a href="/privacy">Chính sách bảo mật</a>
          <a href="/terms">Điều khoản</a>
          <a href="/embed">Nhúng widget</a>
        </div>
      </footer>

      <button id="scrollTopBtn" className="flt-btn" aria-label="Lên đầu trang">
        <i className="bi bi-arrow-up" />
      </button>
      <button id="musicBtn" className="flt-btn" aria-label="Bật/tắt nhạc nền">
        <i className="bi bi-music-note-beamed" />
      </button>

      <div id="shareOverlay">
        <div id="shareBox" />
      </div>

      {/* Thư viện ngoài cần cho engine (Fuse.js search, SweetAlert2 popup) */}
      <Script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/sweetalert2@11" strategy="beforeInteractive" />
      <Script src="/assets/js/base.js" strategy="afterInteractive" />
      <Script src="/assets/js/load.js" strategy="afterInteractive" />
      <Script src="/assets/js/img-guard.js" strategy="afterInteractive" />
      <Script src="/assets/js/dev-notice.js" strategy="afterInteractive" />
    </>
  );
}
