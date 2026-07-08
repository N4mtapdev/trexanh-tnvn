/**
 * Vercel Edge Function — OG Image động theo từng card
 *
 * URL: /api/og?card=PREFIX-ID   (vd: /api/og?card=HHT-12)
 *      /api/og                  (không có card → ảnh mặc định chung)
 *
 * Dùng @vercel/og để render HTML → PNG
 *
 * Bảo mật: KHÔNG nhận q/a/cat dạng text tự do từ URL nữa — chỉ nhận "card"
 * (id thật trong dữ liệu), tra cứu q/a THẬT từ lib/dataset.js. Trước đây
 * endpoint này nhận thẳng q/a/cat qua query string, nghĩa là bất kỳ ai cũng
 * tạo được ảnh mang thương hiệu TreXanh với nội dung tự chế (rủi ro giả
 * mạo/tin giả). Endpoint này PHẢI mở public không cần referer (crawler
 * Zalo/FB/Telegram cần fetch trực tiếp để render preview khi share link),
 * nên cách bảo vệ đúng là giới hạn NGUỒN DỮ LIỆU chứ không phải chặn origin.
 *
 * Setup: package.json cần có "@vercel/og": "latest"
 */

import { ImageResponse } from '@vercel/og';
import { findCard } from '../lib/dataset.js';

export const config = { runtime: 'edge' };

const DEFAULT_Q   = 'TreXanh · Tra cứu đáp án TNVN';
const DEFAULT_A   = 'Hệ thống tra cứu thông minh dành cho thanh niên Việt Nam';
const DEFAULT_CAT = 'TreXanh TNVN';

export default async function handler(req) {
    const url    = new URL(req.url);
    const cardId = url.searchParams.get('card') || '';

    /* Chỉ dùng nội dung THẬT tra được từ dataset — không có thì dùng mặc định,
       KHÔNG bao giờ dùng text do URL cung cấp trực tiếp */
    const found = findCard(cardId);
    const q   = found?.q   || DEFAULT_Q;
    const a   = found?.a   || DEFAULT_A;
    const cat = found?.cat || DEFAULT_CAT;

    /* Truncate nếu quá dài */
    const truncate = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;
    const qShort = truncate(q, 120);
    const aShort = truncate(a, 100);
    const catShort = truncate(cat, 40);

    return new ImageResponse(
        {
            type: 'div',
            props: {
                style: {
                    width:       '1200px',
                    height:      '630px',
                    display:     'flex',
                    flexDirection:'column',
                    background:  'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #d1fae5 100%)',
                    padding:     '60px',
                    fontFamily:  'sans-serif',
                    position:    'relative',
                    overflow:    'hidden',
                },
                children: [
                    /* Background accent blob */
                    {
                        type: 'div',
                        props: {
                            style: {
                                position: 'absolute', top: '-80px', right: '-80px',
                                width: '400px', height: '400px', borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(16,185,129,.25), rgba(16,185,129,0))',
                            }
                        }
                    },
                    /* Header: logo + brand */
                    {
                        type: 'div',
                        props: {
                            style: { display:'flex', alignItems:'center', gap:'16px', marginBottom:'40px' },
                            children: [
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            width:'56px', height:'56px', borderRadius:'16px',
                                            background:'linear-gradient(135deg,#10b981,#059669)',
                                            display:'flex', alignItems:'center', justifyContent:'center',
                                            fontSize:'28px', color:'white', fontWeight:900,
                                        },
                                        children: ['🌿']
                                    }
                                },
                                {
                                    type: 'div',
                                    props: {
                                        children: [
                                            { type:'p', props:{ style:{ fontSize:'22px', fontWeight:900, color:'#064e3b', margin:0 }, children:['TreXanh TNVN'] } },
                                            { type:'p', props:{ style:{ fontSize:'14px', fontWeight:600, color:'#059669', margin:0 }, children:['Tra cứu đáp án thông minh'] } },
                                        ]
                                    }
                                },
                                /* Category badge */
                                {
                                    type: 'div',
                                    props: {
                                        style: {
                                            marginLeft:'auto', padding:'6px 16px', borderRadius:'10px',
                                            background:'rgba(16,185,129,.12)', color:'#059669',
                                            fontSize:'13px', fontWeight:800, border:'1px solid rgba(16,185,129,.3)',
                                        },
                                        children: [catShort]
                                    }
                                }
                            ]
                        }
                    },
                    /* Question box */
                    {
                        type: 'div',
                        props: {
                            style: {
                                background:'white', borderRadius:'20px', padding:'28px 32px',
                                border:'2px solid rgba(16,185,129,.2)', marginBottom:'16px',
                                boxShadow:'0 8px 32px rgba(16,185,129,.1)', flex:1,
                            },
                            children: [
                                {
                                    type:'p',
                                    props:{
                                        style:{ fontSize:'12px', fontWeight:800, color:'#64748b', marginBottom:'10px',
                                                textTransform:'uppercase', letterSpacing:'1px', display:'flex', alignItems:'center', gap:'6px' },
                                        children:['❓ Câu hỏi']
                                    }
                                },
                                {
                                    type:'p',
                                    props:{
                                        style:{ fontSize:'28px', fontWeight:700, color:'#0f172a', lineHeight:1.4, margin:0 },
                                        children:[qShort]
                                    }
                                }
                            ]
                        }
                    },
                    /* Answer box */
                    {
                        type: 'div',
                        props: {
                            style: {
                                background:'linear-gradient(135deg,rgba(16,185,129,.1),rgba(16,185,129,.05))',
                                borderRadius:'16px', padding:'20px 28px',
                                border:'1.5px solid rgba(16,185,129,.25)',
                            },
                            children: [
                                {
                                    type:'p',
                                    props:{
                                        style:{ fontSize:'12px', fontWeight:800, color:'#059669', marginBottom:'8px',
                                                textTransform:'uppercase', letterSpacing:'1px' },
                                        children:['💡 Đáp án']
                                    }
                                },
                                {
                                    type:'p',
                                    props:{
                                        style:{ fontSize:'22px', fontWeight:800, color:'#059669', fontStyle:'italic', margin:0 },
                                        children:[aShort]
                                    }
                                }
                            ]
                        }
                    },
                    /* Footer URL */
                    {
                        type:'p',
                        props:{
                            style:{ fontSize:'13px', color:'#94a3b8', marginTop:'16px', fontWeight:600 },
                            children:['trexanh-tnvn.vercel.app']
                        }
                    }
                ]
            }
        },
        {
            width: 1200,
            height: 630,
            /* Nội dung xác định hoàn toàn theo card id → cache được. max-age ngắn
               cho browser, s-maxage dài hơn cho CDN, stale-while-revalidate để
               vẫn phục vụ nhanh trong lúc âm thầm làm mới nếu admin sửa đáp án */
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
            },
        }
    );
}
