import './globals.css';

export const metadata = {
  metadataBase: new URL('https://trexanh-tnvn.vercel.app'),
  title: {
    default: 'TreXanh v1.0 | Tra Cứu Dữ Liệu Thanh Niên TNVN',
    template: '%s | TreXanh',
  },
  description:
    'Hệ thống tra cứu đáp án học tập, lý luận chính trị, lịch sử dành cho thanh niên TNVN. Tìm kiếm thông minh, nhanh chóng, tối ưu mobile.',
  keywords: [
    'TreXanh',
    'tra cứu đáp án',
    'thanh niên TNVN',
    'lý luận chính trị',
    'Hà Huy Tập',
    'học tập',
    'thi đua',
  ],
  authors: [{ name: 'TreXanh Developer' }],
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  manifest: '/assets/favicon/site.webmanifest',
  icons: {
    icon: [
      { url: '/assets/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/assets/favicon/favicon.ico' },
    ],
    apple: '/assets/favicon/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'TreXanh TNVN',
    title: 'TreXanh v1.0 | Tra Cứu Dữ Liệu Thanh Niên TNVN',
    description:
      'Hệ thống tra cứu đáp án học tập, lý luận chính trị dành cho thanh niên TNVN. Tìm kiếm thông minh, tối ưu mobile.',
    images: ['/assets/images/og-image.png'],
    locale: 'vi_VN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TreXanh v1.0 | Tra Cứu Dữ Liệu TNVN',
    description: 'Hệ thống tra cứu đáp án thông minh cho thanh niên TNVN.',
    images: ['/assets/images/og-image.png'],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10b981',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function applyTheme() {
                var saved = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
