import { ImageResponse } from '@vercel/og';
import { findCard } from '@/lib/find-card';

export const runtime = 'edge';

/**
 * GET /api/og?card=LLCT-5
 * Sinh ảnh chia sẻ (1200x630) cho 1 câu hỏi cụ thể — dùng khi share link
 * card lên mạng xã hội (Zalo, Facebook...). Dữ liệu tra từ Supabase qua
 * findCard() thay vì dataset tĩnh cũ.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('card');

  const card = await findCard(cardId);

  const q = card?.q || 'TreXanh — Tra cứu đáp án nhanh';
  const a = card?.a || 'Hệ thống tra cứu dữ liệu học tập TNVN';
  const cat = card?.cat || 'TreXanh';

  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #059669 100%)',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              color: 'white',
            }}
          >
            🌳
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'white', fontSize: 26, fontWeight: 800 }}>TreXanh</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600 }}>
              {cat}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              color: 'rgba(255,255,255,0.55)',
              fontSize: 18,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Câu hỏi
          </div>
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1.35,
            }}
          >
            {truncate(q, 140)}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 12,
              padding: '20px 28px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.14)',
              color: '#d1fae5',
              fontSize: 30,
              fontWeight: 700,
              fontStyle: 'italic',
              lineHeight: 1.4,
            }}
          >
            ✅ {truncate(a, 120)}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          trexanh-tnvn.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
