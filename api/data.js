/**
 * !!! FILE ĐƯỢC SINH TỰ ĐỘNG — KHÔNG SỬA TAY !!!
 * Sinh bởi scripts/build-data.js — sửa dữ liệu qua add-data.html.
 *
 * Vercel Edge Function — Data câu hỏi/đáp án
 * Thay cho việc để file JSON tĩnh public trong /assets/json/
 *
 * URL: /api/data?cat=HHT
 *      /api/data?cat=LLCT
 *
 * Bảo vệ nhẹ: chỉ trả data khi Referer/Origin cùng host với site
 * (chặn được truy cập trực tiếp/curl thô, không chặn được scraper cố ý
 *  giả header — với web tĩnh trên browser không có cách nào chặn tuyệt đối)
 */

import { DATASETS } from '../lib/dataset.js';

export const config = { runtime: 'edge' };

function isSameOrigin(req, host) {
    const referer = req.headers.get('referer') || '';
    const origin  = req.headers.get('origin')  || '';
    try {
        if (referer && new URL(referer).host === host) return true;
    } catch {}
    try {
        if (origin && new URL(origin).host === host) return true;
    } catch {}
    return false;
}

export default async function handler(req) {
    const url = new URL(req.url);
    const cat = (url.searchParams.get('cat') || '').toUpperCase();

    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    };

    if (!isSameOrigin(req, url.host)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
    }

    if (!DATASETS[cat]) {
        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    }

    return new Response(JSON.stringify(DATASETS[cat]), { status: 200, headers });
}
