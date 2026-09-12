import Link from 'next/link';

export const metadata = {
  title: 'Không tìm thấy trang',
  robots: 'noindex, nofollow',
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: 415,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
      />

      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 24,
          background: 'linear-gradient(135deg, rgba(16,185,129,.12), rgba(16,185,129,.04))',
          border: '1.5px solid #d1fae5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          fontSize: 36,
        }}
      >
        🧭
      </div>

      <p
        style={{
          fontSize: 42,
          fontWeight: 900,
          color: '#10b981',
          margin: '0 0 4px',
          lineHeight: 1,
        }}
      >
        404
      </p>
      <h1 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
        Không tìm thấy trang này
      </h1>
      <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 28px', lineHeight: 1.6, maxWidth: 280 }}>
        Trang bạn tìm có thể đã bị xóa, đổi địa chỉ, hoặc chưa từng tồn tại.
        Kiểm tra lại đường dẫn hoặc quay về trang chủ.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '11px 22px',
            borderRadius: 12,
            background: 'linear-gradient(135deg,#10b981,#059669)',
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 3px 12px rgba(16,185,129,.3)',
          }}
        >
          <i className="bi bi-house-fill" /> Về trang chủ
        </Link>
        <Link
          href="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '11px 22px',
            borderRadius: 12,
            background: '#fff',
            border: '1.5px solid #d1fae5',
            color: '#065f46',
            fontSize: 12.5,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          <i className="bi bi-newspaper" /> Xem Blog
        </Link>
      </div>
    </div>
  );
}
