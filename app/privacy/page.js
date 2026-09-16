import Script from 'next/script';

export const metadata = {
  title: 'Chính sách bảo mật',
  description: 'Chính sách bảo mật của TreXanh — hệ thống tra cứu dữ liệu học tập TNVN.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div id="page-content" role="main">
      <link rel="stylesheet" href="/assets/css/main.css" />
      <div style={{ padding: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Chính sách bảo mật</h1>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 20 }}>
          Cập nhật lần cuối: 10/09/2026
        </p>

        <div className="post-body">
          <h2>1. Dữ liệu chúng tôi thu thập</h2>
          <p>
            TreXanh là công cụ tra cứu câu hỏi &amp; đáp án phục vụ học tập, không yêu cầu đăng ký
            tài khoản để sử dụng tính năng tra cứu chính. Chúng tôi không thu thập thông tin cá nhân
            định danh (họ tên, số điện thoại, email) của người dùng khi sử dụng chức năng tra cứu.
          </p>

          <h2>2. Dữ liệu kỹ thuật</h2>
          <p>Để vận hành và cải thiện dịch vụ, hệ thống có thể ghi nhận:</p>
          <ul>
            <li>Thông tin kỹ thuật cơ bản (loại trình duyệt, thiết bị) phục vụ tối ưu hiển thị.</li>
            <li>Số liệu truy cập tổng hợp (số lượt xem trang) — không gắn với danh tính cá nhân.</li>
            <li>Tùy chọn giao diện lưu cục bộ trên trình duyệt của bạn (chế độ sáng/tối, cỡ chữ) — dữ liệu này không rời khỏi thiết bị của bạn.</li>
          </ul>

          <h2>3. Cookie</h2>
          <p>
            TreXanh chỉ sử dụng cookie kỹ thuật cần thiết cho khu vực quản trị nội bộ (không áp dụng
            cho người dùng thông thường). Chúng tôi không dùng cookie để theo dõi hành vi quảng cáo.
          </p>

          <h2>4. Chia sẻ dữ liệu với bên thứ ba</h2>
          <p>
            Chúng tôi không bán, cho thuê hoặc chia sẻ dữ liệu người dùng cho bên thứ ba vì mục đích
            thương mại. Dữ liệu câu hỏi/đáp án hiển thị công khai được lưu trữ trên hạ tầng Supabase
            và Vercel nhằm phục vụ vận hành trang.
          </p>

          <h2>5. Bảo mật</h2>
          <p>
            Các API quản trị nội bộ (thêm/sửa câu hỏi, bài viết) chỉ truy cập được sau khi đăng nhập
            bằng tài khoản Google được cấp quyền — không mở công khai. Toàn bộ kết nối tới trang đều
            qua HTTPS.
          </p>

          <h2>6. Liên hệ</h2>
          <p>
            Nếu có thắc mắc về chính sách bảo mật, vui lòng liên hệ qua các kênh mạng xã hội được
            liệt kê ở chân trang.
          </p>
        </div>
      </div>

      <Script src="/assets/js/img-guard.js" strategy="beforeInteractive" />
      <Script src="/assets/js/base.js" strategy="beforeInteractive" />
      <Script id="privacy-init" strategy="afterInteractive">
        {`if (window.TreXanh) TreXanh.init({ page: 'privacy' });`}
      </Script>
    </div>
  );
}
