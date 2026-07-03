#!/usr/bin/env node
/**
 * ============================================================
 *  TREXANH POST CONVERTER v1.0
 *  Convert hàng loạt file .txt thành posts cho TreXanh Blog
 * ============================================================
 *
 *  CÀI ĐẶT:
 *    node convert.js              → Convert tất cả file trong /raw/
 *    node convert.js bai1.txt     → Convert 1 file cụ thể
 *
 *  CẤU TRÚC THƯ MỤC:
 *    raw/                         ← Bỏ file .txt vào đây
 *    assets/posts/                ← Output HTML nội dung bài
 *    assets/images/posts/         ← Bỏ ảnh vào đây (tên = slug)
 *    posts.json                   ← Tự động cập nhật
 *
 *  ĐỊNH DẠNG FILE .TXT:
 *  ─────────────────────────────
 *  [TITLE] Tiêu đề bài viết
 *  [DATE] 2026-05-08
 *  [TIME] 15:41
 *  [AUTHOR] Theo TPO
 *  [SOURCE] Báo Tiền Phong
 *  [CATEGORY] hoatDong
 *  [TAGS] bảo vệ trẻ em, bạo hành, gia đình
 *  [FEATURED] true
 *  [THUMB] ten-anh.jpg
 *  ---
 *  Nội dung bài viết từ đây trở xuống...
 *  Mỗi dòng trống = xuống đoạn mới
 *  ─────────────────────────────
 * ============================================================
 */

const fs   = require('fs');
const path = require('path');


/* ============================================================
   CẤU HÌNH
============================================================ */
const CONFIG = {
    rawDir:      './raw',                   // Thư mục chứa file .txt gốc
    postsDir:    './assets/posts',          // Output HTML nội dung
    imagesDir:   './assets/images/posts',  // Thư mục ảnh bài viết
    postsJson:   './posts.json',            // File JSON danh sách bài
    siteUrl:     'https://trexanh-tnvn.vercel.app',
};

/* Map category */
const CAT_MAP = {
    chinhTri:  { label: 'Chính trị',  color: 'emerald' },
    lichSu:    { label: 'Lịch sử',    color: 'blue'    },
    hoatDong:  { label: 'Hoạt động',  color: 'amber'   },
    tuLieu:    { label: 'Tư liệu',    color: 'purple'  },
    default:   { label: 'Tin tức',    color: 'emerald' },
};


/* ============================================================
   TẠO SLUG TỪ TIÊU ĐỀ TIẾNG VIỆT
============================================================ */
function toSlug(str) {
    const map = {
        'à':'a','á':'a','ả':'a','ã':'a','ạ':'a',
        'ă':'a','ắ':'a','ặ':'a','ằ':'a','ẳ':'a','ẵ':'a',
        'â':'a','ấ':'a','ậ':'a','ầ':'a','ẩ':'a','ẫ':'a',
        'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
        'ê':'e','ế':'e','ệ':'e','ề':'e','ể':'e','ễ':'e',
        'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
        'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o',
        'ô':'o','ố':'o','ộ':'o','ồ':'o','ổ':'o','ỗ':'o',
        'ơ':'o','ớ':'o','ợ':'o','ờ':'o','ở':'o','ỡ':'o',
        'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
        'ư':'u','ứ':'u','ự':'u','ừ':'u','ử':'u','ữ':'u',
        'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
        'đ':'d',
        'À':'a','Á':'a','Ả':'a','Ã':'a','Ạ':'a',
        'Ă':'a','Ắ':'a','Ặ':'a','Ằ':'a','Ẳ':'a','Ẵ':'a',
        'Â':'a','Ấ':'a','Ậ':'a','Ầ':'a','Ẩ':'a','Ẫ':'a',
        'È':'e','É':'e','Ẻ':'e','Ẽ':'e','Ẹ':'e',
        'Ê':'e','Ế':'e','Ệ':'e','Ề':'e','Ể':'e','Ễ':'e',
        'Ì':'i','Í':'i','Ỉ':'i','Ĩ':'i','Ị':'i',
        'Ò':'o','Ó':'o','Ỏ':'o','Õ':'o','Ọ':'o',
        'Ô':'o','Ố':'o','Ộ':'o','Ồ':'o','Ổ':'o','Ỗ':'o',
        'Ơ':'o','Ớ':'o','Ợ':'o','Ờ':'o','Ở':'o','Ỡ':'o',
        'Ù':'u','Ú':'u','Ủ':'u','Ũ':'u','Ụ':'u',
        'Ư':'u','Ứ':'u','Ự':'u','Ừ':'u','Ử':'u','Ữ':'u',
        'Ỳ':'y','Ý':'y','Ỷ':'y','Ỹ':'y','Ỵ':'y',
        'Đ':'d',
    };
    return str
        .split('').map(c => map[c] || c).join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80); // Giới hạn độ dài slug
}


/* ============================================================
   ĐẾM SỐ TỪ → TÍNH THỜI GIAN ĐỌC
============================================================ */
function calcReadTime(text) {
    const words = text.trim().split(/\s+/).length;
    const mins  = Math.max(1, Math.ceil(words / 200));
    return `${mins} phút đọc`;
}


/* ============================================================
   PARSE FILE .TXT THEO ĐỊNH DẠNG
============================================================ */
function parseTxt(content) {
    const lines  = content.split('\n');
    const meta   = {};
    let bodyStart = 0;

    // Đọc các dòng [KEY] value cho đến khi gặp dòng ---
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === '---') { bodyStart = i + 1; break; }

        const match = line.match(/^\[(\w+)\]\s*(.+)$/);
        if (match) {
            meta[match[1].toUpperCase()] = match[2].trim();
        }
    }

    const bodyLines = lines.slice(bodyStart);
    return { meta, body: bodyLines.join('\n') };
}


/* ============================================================
   CONVERT NỘI DUNG TEXT → HTML
   Quy tắc:
   - Dòng trống          → ngắt đoạn <p>
   - ## Tiêu đề          → <h2>
   - ### Tiêu đề nhỏ     → <h3>
   - > Trích dẫn         → <blockquote>
   - - Mục / * Mục       → <li> trong <ul>
   - [img: src | alt]    → <figure><img><figcaption>
   - [box: nội dung]     → <div class="highlight-box">
   - [info: nội dung]    → <div class="info-box">
   - **text**            → <strong>
   - *text*              → <em>
============================================================ */
function textToHtml(text) {
    const lines  = text.split('\n');
    const result = [];
    let i = 0;
    let inList = false;
    let inBlockquote = false;
    let paraLines = [];

    function flushPara() {
        if (paraLines.length) {
            const content = paraLines.join(' ').trim();
            if (content) result.push(`<p>${inlineFormat(content)}</p>`);
            paraLines = [];
        }
    }

    function flushList() {
        if (inList) { result.push('</ul>'); inList = false; }
    }

    function flushBlockquote() {
        if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false; }
    }

    function inlineFormat(str) {
        return str
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>');
    }

    while (i < lines.length) {
        const line = lines[i];
        const trim = line.trim();

        // Dòng trống → flush paragraph / list
        if (!trim) {
            flushPara();
            flushList();
            flushBlockquote();
            i++; continue;
        }

        // ## Heading 2
        if (trim.startsWith('## ')) {
            flushPara(); flushList(); flushBlockquote();
            result.push(`<h2>${inlineFormat(trim.slice(3))}</h2>`);
            i++; continue;
        }

        // ### Heading 3
        if (trim.startsWith('### ')) {
            flushPara(); flushList(); flushBlockquote();
            result.push(`<h3>${inlineFormat(trim.slice(4))}</h3>`);
            i++; continue;
        }

        // > Blockquote
        if (trim.startsWith('> ')) {
            flushPara(); flushList();
            if (!inBlockquote) { result.push('<blockquote>'); inBlockquote = true; }
            result.push(`<p>${inlineFormat(trim.slice(2))}</p>`);
            i++; continue;
        }

        // - hoặc * List item
        if (/^[-*]\s+/.test(trim)) {
            flushPara(); flushBlockquote();
            if (!inList) { result.push('<ul>'); inList = true; }
            result.push(`<li>${inlineFormat(trim.replace(/^[-*]\s+/, ''))}</li>`);
            i++; continue;
        }

        // [img: src | alt text | caption]
        const imgMatch = trim.match(/^\[img:\s*([^|]+?)(?:\|([^|]+?))?(?:\|([^\]]+?))?\]$/i);
        if (imgMatch) {
            flushPara(); flushList(); flushBlockquote();
            const src     = imgMatch[1].trim();
            const alt     = (imgMatch[2] || '').trim();
            const caption = (imgMatch[3] || '').trim();
            result.push(`<figure>`);
            result.push(`  <img src="${src}" alt="${alt}" loading="lazy">`);
            if (caption) result.push(`  <figcaption>${caption}</figcaption>`);
            result.push(`</figure>`);
            i++; continue;
        }

        // [box: nội dung]
        const boxMatch = trim.match(/^\[box:\s*(.+)\]$/i);
        if (boxMatch) {
            flushPara(); flushList(); flushBlockquote();
            result.push(`<div class="highlight-box"><p>${inlineFormat(boxMatch[1])}</p></div>`);
            i++; continue;
        }

        // [info: nội dung]
        const infoMatch = trim.match(/^\[info:\s*(.+)\]$/i);
        if (infoMatch) {
            flushPara(); flushList(); flushBlockquote();
            result.push(`<div class="info-box"><p>${inlineFormat(infoMatch[1])}</p></div>`);
            i++; continue;
        }

        // Dòng thường → gom vào paragraph
        flushList(); flushBlockquote();
        paraLines.push(trim);
        i++;
    }

    // Flush cuối
    flushPara(); flushList(); flushBlockquote();

    return result.join('\n');
}


/* ============================================================
   CONVERT 1 FILE TXT → POSTS ENTRY + HTML
============================================================ */
function convertFile(txtPath) {
    const raw     = fs.readFileSync(txtPath, 'utf8');
    const { meta, body } = parseTxt(raw);

    // Lấy meta hoặc dùng default
    const title    = meta.TITLE    || path.basename(txtPath, '.txt');
    const slug     = meta.SLUG     || toSlug(title);
    const date     = meta.DATE     || new Date().toISOString().slice(0,10);
    const time     = meta.TIME     || '';
    const author   = meta.AUTHOR   || 'TreXanh Team';
    const source   = meta.SOURCE   || '';
    const sourceUrl= meta.SOURCEURL|| '';
    const catKey   = meta.CATEGORY || 'default';
    const cat      = CAT_MAP[catKey] || CAT_MAP.default;
    const featured = meta.FEATURED === 'true';
    const thumb    = meta.THUMB
        ? `assets/images/posts/${slug}/${meta.THUMB}`
        : null;
    const tags     = (meta.TAGS || '').split(',').map(t => t.trim()).filter(Boolean);

    // Tạo excerpt từ 200 ký tự đầu của nội dung
    const plainText = body.replace(/\[.*?\]/g, '').replace(/[#>*\-`]/g, '').trim();
    const excerpt   = plainText.substring(0, 200).replace(/\n/g, ' ').trim() + '...';

    // Convert nội dung → HTML
    const contentHtml = textToHtml(body);
    const readTime    = calcReadTime(plainText);

    // Tạo thư mục nếu chưa có
    if (!fs.existsSync(CONFIG.postsDir)) fs.mkdirSync(CONFIG.postsDir, { recursive: true });

    // Ghi file HTML nội dung
    const outHtmlPath = path.join(CONFIG.postsDir, `${slug}.html`);
    fs.writeFileSync(outHtmlPath, contentHtml, 'utf8');

    // Entry cho posts.json
    const entry = {
        id:          `post-${Date.now()}`,
        slug,
        title,
        excerpt,
        category:    catKey,
        catLabel:    cat.label,
        catColor:    cat.color,
        author,
        date,
        time,
        readTime,
        thumb,
        tags,
        featured,
        source,
        sourceUrl,
        contentFile: `assets/posts/${slug}.html`,
    };

    console.log(`✅ Converted: ${path.basename(txtPath)} → ${slug}`);
    return entry;
}


/* ============================================================
   CẬP NHẬT posts.json
============================================================ */
function updatePostsJson(newEntries) {
    let existing = [];
    if (fs.existsSync(CONFIG.postsJson)) {
        try { existing = JSON.parse(fs.readFileSync(CONFIG.postsJson, 'utf8')); }
        catch { existing = []; }
    }

    // Merge: nếu slug đã tồn tại thì cập nhật, chưa có thì thêm mới
    newEntries.forEach(entry => {
        const idx = existing.findIndex(e => e.slug === entry.slug);
        if (idx >= 0) existing[idx] = entry;
        else existing.unshift(entry); // Thêm mới lên đầu
    });

    // Sắp xếp theo ngày mới nhất
    existing.sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(CONFIG.postsJson, JSON.stringify(existing, null, 2), 'utf8');
    console.log(`📝 Updated posts.json: ${existing.length} bài viết`);
}


/* ============================================================
   MAIN
============================================================ */
function main() {
    const args = process.argv.slice(2);

    // Tạo thư mục raw nếu chưa có
    if (!fs.existsSync(CONFIG.rawDir)) {
        fs.mkdirSync(CONFIG.rawDir, { recursive: true });
        console.log(`📁 Tạo thư mục ${CONFIG.rawDir}/ — Bỏ file .txt vào đây rồi chạy lại`);

        // Tạo file mẫu
        const sample = `[TITLE] Tiêu đề bài viết mẫu
[DATE] ${new Date().toISOString().slice(0,10)}
[TIME] 08:00
[AUTHOR] TreXanh Team
[SOURCE] Báo Thanh Niên
[CATEGORY] hoatDong
[TAGS] tag1, tag2, tag3
[FEATURED] false
[THUMB] thumb.jpg
---
## Tiêu đề section đầu tiên

Đây là đoạn văn bản bình thường. Mỗi dòng trống là xuống đoạn mới.
Bạn có thể dùng **in đậm** và *in nghiêng*.

> Đây là dòng trích dẫn, sẽ thành blockquote

- Mục danh sách 1
- Mục danh sách 2
- Mục danh sách 3

## Tiêu đề section tiếp theo

[img: assets/images/posts/slug-bai/anh.jpg | Mô tả ảnh | Chú thích ảnh]

[box: Nội dung hộp highlight màu xanh lá quan trọng]

[info: Nội dung hộp thông tin màu xanh dương]

### Tiêu đề nhỏ h3

Đoạn cuối bài viết...
`;
        fs.writeFileSync(path.join(CONFIG.rawDir, 'mau.txt'), sample, 'utf8');
        console.log(`📄 Tạo file mẫu: ${CONFIG.rawDir}/mau.txt`);
        return;
    }

    let filesToConvert = [];

    if (args.length > 0) {
        // Convert file chỉ định
        filesToConvert = args.map(f => {
            const p = path.isAbsolute(f) ? f : path.join(CONFIG.rawDir, f);
            if (!fs.existsSync(p)) { console.error(`❌ Không tìm thấy: ${p}`); return null; }
            return p;
        }).filter(Boolean);
    } else {
        // Convert tất cả .txt trong /raw/
        filesToConvert = fs.readdirSync(CONFIG.rawDir)
            .filter(f => f.endsWith('.txt'))
            .map(f => path.join(CONFIG.rawDir, f));
    }

    if (!filesToConvert.length) {
        console.log('⚠️  Không có file .txt nào trong thư mục raw/');
        return;
    }

    console.log(`\n🔄 Bắt đầu convert ${filesToConvert.length} file...\n`);

    const entries = filesToConvert.map(f => {
        try { return convertFile(f); }
        catch(e) { console.error(`❌ Lỗi khi convert ${f}:`, e.message); return null; }
    }).filter(Boolean);

    if (entries.length) updatePostsJson(entries);

    console.log(`\n✨ Hoàn thành! ${entries.length}/${filesToConvert.length} file thành công.`);
    console.log(`\n📂 Cấu trúc output:`);
    console.log(`   posts.json                          ← Danh sách bài viết`);
    console.log(`   assets/posts/[slug].html            ← Nội dung HTML`);
    console.log(`   assets/images/posts/[slug]/         ← Bỏ ảnh vào đây`);
}

main();