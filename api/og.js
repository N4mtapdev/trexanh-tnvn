/**
 * Vercel Edge Function — OG Image động theo từng card
 *
 * URL: /api/og?q=CÂU_HỎI&a=ĐÁP_ÁN&cat=DANH_MỤC
 *      /api/og?card=CARD_ID  (cần fetch data từ KV hoặc hardcode)
 *
 * Dùng @vercel/og để render HTML → PNG
 *
 * Setup: package.json cần có "@vercel/og": "latest"
 */

import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req) {
    const url = new URL(req.url);
    const q   = url.searchParams.get('q')   || 'TreXanh · Tra cứu đáp án TNVN';
    const a   = url.searchParams.get('a')   || 'Hệ thống tra cứu thông minh dành cho thanh niên Việt Nam';
    const cat = url.searchParams.get('cat') || 'TreXanh TNVN';

    /* Truncate nếu quá dài */
    const truncate = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;
    const qShort = truncate(q, 120);
    const aShort = truncate(a, 100);

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
                                        children: [cat]
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
        { width: 1200, height: 630 }
    );
}
