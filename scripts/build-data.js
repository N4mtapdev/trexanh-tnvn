#!/usr/bin/env node
/**
 * Build step — Đóng gói assets/json/*.json vào api/data.js
 *
 * Vì sao cần bước này:
 *   - assets/json/*.json là NGUỒN dữ liệu gốc, add-data.html vẫn đọc/ghi
 *     trực tiếp file này qua GitHub API (không đổi workflow của add-data.html).
 *   - Trên site live, request thẳng vào /assets/json/* bị vercel.json rewrite
 *     sang /api/blocked (403) — file vẫn nằm trong deploy (để build đọc được)
 *     nhưng không lấy được qua URL trực tiếp nữa.
 *   - Trang chính (load.js) giờ lấy dữ liệu qua /api/data?cat=... — dữ liệu
 *     được "đóng gói" (bake) thẳng vào api/data.js ở bước build này.
 *
 * Chạy khi nào:
 *   - Tự động: Vercel chạy script này mỗi lần deploy (xem "buildCommand" trong
 *     vercel.json) — nghĩa là mỗi lần add-data.html push JSON mới lên GitHub,
 *     Vercel tự deploy lại và api/data.js tự cập nhật theo, không cần làm gì thêm.
 *   - Thủ công: `npm run build` để tạo lại api/data.js khi test ở máy local.
 *
 * Thêm danh mục mới:
 *   - Thêm 1 dòng vào CATEGORY_FILES bên dưới (key ↔ tên file JSON trong assets/json/)
 *   - Nhớ đồng bộ thêm với `filesToLoad` trong assets/js/load.js (như comment cũ
 *     trong add-data.html đã ghi chú)
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* key dùng trong /api/data?cat=KEY  ↔  tên file trong assets/json/ */
const CATEGORY_FILES = {
    HHT:  'HHT.json',
    LLCT: 'KTHTCBHLLCT.json',
};

function loadCategory(file) {
    const filePath = path.join(ROOT, 'assets', 'json', file);
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw); /* throws rõ ràng nếu JSON lỗi, fail sớm ở bước build */
}

function build() {
    const datasets = {};
    for (const [key, file] of Object.entries(CATEGORY_FILES)) {
        datasets[key] = loadCategory(file);
        console.log(`[build-data] ${key} ← assets/json/${file} (${datasets[key].length} mục)`);
    }

    const out = `/**
 * !!! FILE ĐƯỢC SINH TỰ ĐỘNG — KHÔNG SỬA TAY !!!
 * Sinh bởi scripts/build-data.js từ assets/json/*.json
 * Sửa dữ liệu qua add-data.html, KHÔNG sửa trực tiếp file này.
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

export const config = { runtime: 'edge' };

const DATASETS = ${JSON.stringify(datasets, null, 2)};

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

    fs.writeFileSync(path.join(ROOT, 'api', 'data.js'), out);
    console.log('[build-data] Đã ghi api/data.js');
}

build();
