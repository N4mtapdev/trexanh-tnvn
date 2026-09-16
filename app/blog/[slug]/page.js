import { getPostBySlug, getRelatedPosts, getAdjacentPosts, CAT_COLORS } from '@/lib/posts';
import PostInteractive from './post-interactive';
import Script from 'next/script';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // bài mới đăng qua /add-data hiện ngay, không cần rebuild

export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Không tìm thấy bài viết' };

  const imageUrl = post.thumb_url || '/assets/images/og-image.png';

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      images: [imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      images: [imageUrl],
    },
  };
}

const BADGE_CLASS = {
  emerald: 'badge-emerald',
  blue: 'badge-blue',
  amber: 'badge-amber',
  purple: 'badge-purple',
  red: 'badge-red',
};

function relativeTime(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

export default async function PostPage({ params }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const badgeClass = BADGE_CLASS[post.cat_color] || 'badge-emerald';
  const related = await getRelatedPosts(post.slug, post.category);
  const { prev, next } = await getAdjacentPosts(post.published_at);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Person', name: post.author },
    datePublished: post.published_at,
    publisher: {
      '@type': 'Organization',
      name: 'TreXanh Developer',
      logo: { '@type': 'ImageObject', url: 'https://trexanh-tnvn.vercel.app/assets/images/logo.png' },
    },
    inLanguage: 'vi-VN',
    ...(post.thumb_url ? { image: post.thumb_url } : {}),
  };

  return (
    <div id="page-content" role="main">
      <link rel="stylesheet" href="/assets/css/main.css" />

      <Script
        id="schema-article"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div style={{ padding: 16 }}>
        <article className="animate__animated animate__fadeIn">
          {post.thumb_url && (
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 16,
                border: '1.5px solid var(--border)',
                boxShadow: '0 4px 16px var(--shadow)',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.thumb_url}
                alt={post.title}
                style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className={`badge ${badgeClass}`}>{post.cat_label}</span>
            {post.featured && (
              <span className="badge badge-featured">
                <i className="bi bi-star-fill" style={{ fontSize: 8 }} /> Nổi bật
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 19, fontWeight: 900, color: 'var(--text)', margin: '0 0 12px', lineHeight: 1.38 }}>
            {post.title}
          </h1>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-person-circle" style={{ color: '#10b981' }} /> {post.author}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-calendar3" style={{ color: '#3b82f6' }} /> {formatDateTime(post.published_at)}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-clock" style={{ color: '#8b5cf6' }} /> {post.read_time}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-eye" style={{ color: '#10b981' }} /> {(post.view_count || 0).toLocaleString('vi')} lượt xem
            </span>
          </div>

          <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content_html }} />

          {(post.tags || []).length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginTop: 22,
                paddingTop: 16,
                borderTop: '1px solid var(--border)',
                alignItems: 'center',
              }}
            >
              <i className="bi bi-tags-fill" style={{ color: '#10b981', fontSize: 12 }} />
              {post.tags.map((t) => (
                <Link key={t} href="/blog" className="tag-chip">
                  <i className="bi bi-hash" style={{ fontSize: 9 }} />
                  {t}
                </Link>
              ))}
            </div>
          )}

          {post.source_name && (
            <div className="source-box">
              <i className="bi bi-link-45deg" style={{ color: '#10b981' }} />
              Nguồn:{' '}
              {post.source_url ? (
                <a href={post.source_url} target="_blank" rel="noopener noreferrer">
                  {post.source_name}
                </a>
              ) : (
                <span style={{ fontWeight: 800, color: 'var(--text)' }}>{post.source_name}</span>
              )}
            </div>
          )}

          <PostInteractive slug={post.slug} />

          {related.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="tx-sec-head">
                <span className="tx-sec-title">
                  <i className="bi bi-grid-1x2-fill" style={{ color: '#10b981' }} /> Bài viết liên quan
                </span>
                <div className="tx-sec-line" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {related.map((r) => {
                  const rBadge = BADGE_CLASS[r.cat_color] || 'badge-emerald';
                  const rColorVar = {
                    'badge-emerald': '#059669',
                    'badge-blue': '#2563eb',
                    'badge-amber': '#d97706',
                    'badge-purple': '#7c3aed',
                    'badge-red': '#dc2626',
                  }[rBadge];
                  const rBgVar = {
                    'badge-emerald': 'rgba(16,185,129,.1)',
                    'badge-blue': 'rgba(59,130,246,.1)',
                    'badge-amber': 'rgba(245,158,11,.1)',
                    'badge-purple': 'rgba(139,92,246,.1)',
                    'badge-red': 'rgba(239,68,68,.1)',
                  }[rBadge];
                  return (
                    <Link key={r.slug} href={`/blog/${r.slug}`} className="related-card">
                      <div className="related-card-icon" style={{ background: rBgVar }}>
                        <i className="bi bi-file-earmark-text-fill" style={{ fontSize: 16, color: rColorVar }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: 'var(--text)',
                            margin: '0 0 2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {r.title}
                        </p>
                        <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ color: rColorVar }}>{r.cat_label}</span>
                          <span>·</span>
                          {r.read_time}
                        </p>
                      </div>
                      <i className="bi bi-chevron-right" style={{ color: 'var(--muted)', fontSize: 12, flexShrink: 0 }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {(prev || next) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {prev ? (
                <Link href={`/blog/${prev.slug}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'flex-start', minWidth: 0 }}>
                  <i className="bi bi-arrow-left" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <div style={{ flex: 1 }} />
              )}
              {next ? (
                <Link href={`/blog/${next.slug}`} className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                    {next.title}
                  </span>
                  <i className="bi bi-arrow-right" style={{ flexShrink: 0 }} />
                </Link>
              ) : (
                <div style={{ flex: 1 }} />
              )}
            </div>
          )}

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <Link href="/blog" className="btn btn-ghost btn-sm">
              <i className="bi bi-arrow-left" /> Về danh sách Blog
            </Link>
          </div>
        </article>
      </div>

      <Script src="/assets/js/img-guard.js" strategy="beforeInteractive" />
      <Script src="/assets/js/base.js" strategy="beforeInteractive" />
      <Script id="post-nav-init" strategy="afterInteractive">
        {`if (window.TreXanh) TreXanh.init({ page: 'post' });`}
      </Script>
    </div>
  );
}
