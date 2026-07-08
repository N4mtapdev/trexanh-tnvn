#!/usr/bin/env node
/**
 * Build step — Đóng gói assets/json/*.json thành lib/dataset.js (dùng chung),
 * rồi sinh api/data.js từ đó.
 *
 * Vì sao cần bước này:
 *   - assets/json/*.json là NGUỒN dữ liệu gốc, add-data.html vẫn đọc/ghi
 *     trực tiếp file này qua GitHub API (không đổi workflow của add-data.html).
 *   - Trên site live, request thẳng vào /assets/json/* bị vercel.json rewrite
 *     sang /api/blocked (403) — file vẫn nằm trong deploy (để build đọc được)
 *     nhưng không lấy được qua URL trực tiếp nữa.
 *   - Trang chính (load.js) giờ lấy dữ liệu qua /api/data?cat=... — dữ liệu
 *     được "đóng gói" (bake) vào lib/dataset.js ở bước build này.
 *   - api/og.js (ảnh share động) cũng import CHUNG module này để tra cứu
 *     đúng câu hỏi/đáp án thật theo card id — không nhận text tự do từ URL
 *     nữa (tránh giả mạo nội dung mang thương hiệu TreXanh).
 *
 * Chạy khi nào:
 *   - Tự động: Vercel chạy script này mỗi lần deploy (xem "buildCommand" trong
 *     vercel.json) — nghĩa là mỗi lần add-data.html push JSON mới lên GitHub,
 *     Vercel tự deploy lại và dữ liệu tự cập nhật theo, không cần làm gì thêm.
 *   - Thủ công: `npm run build` để tạo lại khi test ở máy local.
 *
 * Thêm danh mục mới:
 *   - Thêm 1 dòng vào CATEGORIES bên dưới (key, file JSON, tên hiển thị)
 *   - Nhớ đồng bộ thêm với `filesToLoad` trong assets/js/load.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* key dùng trong /api/data?cat=KEY  ↔  tên file trong assets/json/  ↔  tên hiển thị
   (tên hiển thị phải khớp với `name` tương ứng trong filesToLoad ở load.js,
   dùng để hiện đúng badge danh mục trên ảnh share động của api/og.js) */
const CATEGORIES = {
    HHT:  { file: 'HHT.json',          name: 'TBT Hà Huy Tập' },
    LLCT: { file: 'KTHTCBHLLCT.json',  name: 'Lý Luận Chính Trị' },
};

function loadCategory(file) {
    const filePath = path.join(ROOT, 'assets', 'json', file);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw); /* throws rõ ràng nếu JSON lỗi, fail sớm ở bước build */
}

function build() {
    const datasets = {};
    const names    = {};
    for (const [key, { file, name }] of Object.entries(CATEGORIES)) {
        datasets[key] = loadCategory(file);
        names[key]    = name;
        console.log(`[build-data] ${key} ← assets/json/${file} (${datasets[key].length} mục)`);
    }

    /* ── lib/dataset.js — module dữ liệu dùng chung, KHÔNG kèm logic HTTP ── */
    const datasetOut = `/**
 * !!! FILE ĐƯỢC SINH TỰ ĐỘNG — KHÔNG SỬA TAY !!!
 * Sinh bởi scripts/build-data.js từ assets/json/*.json
 * Sửa dữ liệu qua add-data.html, KHÔNG sửa trực tiếp file này.
 *
 * Dùng chung bởi api/data.js (trả data cho trang chính) và api/og.js
 * (tra cứu q/a thật theo card id khi render ảnh share động).
 */

export const DATASETS = ${JSON.stringify(datasets, null, 2)};

export const CATEGORY_NAMES = ${JSON.stringify(names, null, 2)};

/** Tra 1 câu hỏi theo id dạng "PREFIX-N" (khớp id dùng ở assets/js/load.js) */
export function findCard(cardId) {
    if (!cardId) return null;
    const i = cardId.lastIndexOf('-');
    if (i < 0) return null;
    const prefix = cardId.slice(0, i);
    const rawId  = cardId.slice(i + 1);
    const list   = DATASETS[prefix];
    if (!list) return null;
    const item = list.find(x => String(x.id) === rawId);
    if (!item) return null;
    return {
        q:   item.question || item.q || '',
        a:   item.answer   || item.a || '',
        cat: CATEGORY_NAMES[prefix] || prefix,
    };
}
`;
    fs.writeFileSync(path.join(ROOT, 'lib', 'dataset.js'), datasetOut);
    console.log('[build-data] Đã ghi lib/dataset.js');

    /* ── api/data.js — Edge Function trả JSON theo cat, import từ lib/dataset.js ── */
    const dataApiOut = `/**
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
`;
    fs.writeFileSync(path.join(ROOT, 'api', 'data.js'), dataApiOut);
    console.log('[build-data] Đã ghi api/data.js');
}

build();
