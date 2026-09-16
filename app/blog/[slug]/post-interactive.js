'use client';

import { useEffect } from 'react';

function shareLinkCopy() {
  const url = window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(url)
      .then(() => window.TreXanh?.toast('success', '✅ Đã copy link bài viết!'))
      .catch(() => window.TreXanh?.toast('error', 'Không thể copy'));
  }
}

function shareNative() {
  const url = window.location.href;
  const title = document.title;
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    window.TreXanh?.toast('info', '📋 Đã copy link để chia sẻ');
  }
}

/**
 * @param {string} slug - dùng để gọi tăng view count đúng bài
 */
export default function PostInteractive({ slug }) {
  useEffect(() => {
    // Tăng view count 1 lần khi người dùng thực sự mở trang (client-side),
    // không tính lúc Next.js render ở server hay lúc bot/crawler ghé qua
    // vì crawler thường không chạy JS.
    fetch('/api/posts/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {});
  }, [slug]);

  const shareUrl = typeof window !== 'undefined' ? encodeURIComponent(window.location.href) : '';
  const shareTitle = typeof document !== 'undefined' ? encodeURIComponent(document.title) : '';

  return (
    <div
      style={{
        marginTop: 18,
        padding: 16,
        borderRadius: 16,
        background: 'linear-gradient(135deg,rgba(16,185,129,.07),rgba(16,185,129,.02))',
        border: '1.5px solid rgba(16,185,129,.15)',
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 10,
          letterSpacing: 0.5,
        }}
      >
        <i className="bi bi-share-fill" style={{ color: '#10b981' }} /> Chia sẻ bài viết
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          onClick={shareLinkCopy}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 12,
            background: 'var(--bg2)',
            border: '1.5px solid var(--border)',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <i className="bi bi-link-45deg" style={{ color: '#10b981' }} /> Copy link
        </button>
        <button
          onClick={shareNative}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 12,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <i className="bi bi-send-fill" /> Chia sẻ
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 12,
            background: 'var(--bg2)',
            border: '1.5px solid rgba(59,130,246,.3)',
            fontSize: 10,
            fontWeight: 700,
            color: '#3b82f6',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <i className="bi bi-facebook" /> Facebook
        </a>
        <a
          href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 12,
            background: 'var(--bg2)',
            border: '1.5px solid rgba(56,189,248,.3)',
            fontSize: 10,
            fontWeight: 700,
            color: '#38bdf8',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <i className="bi bi-telegram" /> Telegram
        </a>
      </div>
    </div>
  );
}
