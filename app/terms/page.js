import Script from 'next/script';

export const metadata = {
  title: 'Điều khoản sử dụng',
  description: 'Điều khoản sử dụng của TreXanh — hệ thống tra cứu dữ liệu học tập TNVN.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div id="page-content" role="main">
      <link rel="stylesheet" href="/assets/css/main.css" />
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Điều khoản sử dụng</h1>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
          Cập nhật lần cuối: 10/09/2026
        </p>

        <div className="post-body">
          <h2>1. Giới thiệu</h2>
          <p>
            TreXanh là công cụ tra cứu câu hỏi &amp; đáp án hỗ trợ học tập, cung cấp miễn phí cho
            người dùng. Khi truy cập và sử dụng trang, bạn đồng ý với các điều khoản dưới đây.
          </p>

          <h2>2. Mục đích sử dụng</h2>
          <p>
            Dữ liệu câu hỏi/đáp án trên TreXanh mang tính chất tham khảo, hỗ trợ quá trình học tập
            và ôn luyện. Người dùng chịu trách nhiệm về việc sử dụng thông tin phù hợp với quy định
            của đơn vị/cuộc thi liên quan.
          </p>

          <h2>3. Tính chính xác của dữ liệu</h2>
          <p>
            Chúng tôi cố gắng đảm bảo dữ liệu chính xác và được kiểm duyệt trước khi công khai, tuy
            nhiên không cam kết tuyệt đối về độ chính xác 100% tại mọi thời điểm. Nếu phát hiện sai
            sót, vui lòng phản hồi qua các kênh liên hệ ở chân trang.
          </p>

          <h2>4. Quyền sở hữu trí tuệ</h2>
          <p>
            Mã nguồn, giao diện và thương hiệu "TreXanh" thuộc quyền sở hữu của nhà phát triển. Nội
            dung bài viết/blog trích dẫn nguồn được ghi rõ trong từng bài.
          </p>

          <h2>5. Giới hạn trách nhiệm</h2>
          <p>
            TreXanh được cung cấp trên cơ sở "nguyên trạng". Chúng tôi không chịu trách nhiệm cho
            bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ.
          </p>

          <h2>6. Thay đổi điều khoản</h2>
          <p>
            Điều khoản này có thể được cập nhật theo thời gian. Phiên bản mới nhất luôn được đăng
            tải công khai tại trang này.
          </p>

          <h2>7. Liên hệ</h2>
          <p>Mọi thắc mắc về điều khoản sử dụng, vui lòng liên hệ qua các kênh mạng xã hội ở chân trang.</p>
        </div>
      </div>

      <Script src="/assets/js/img-guard.js" strategy="beforeInteractive" />
      <Script src="/assets/js/base.js" strategy="beforeInteractive" />
      <Script id="terms-init" strategy="afterInteractive">
        {`if (window.TreXanh) TreXanh.init({ page: 'terms' });`}
      </Script>
    </div>
  );
}
