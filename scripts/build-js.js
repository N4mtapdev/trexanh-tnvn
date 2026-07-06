#!/usr/bin/env node
/**
 * Build step — Minify assets/js/load.js → assets/js/load.min.js
 *
 * index.html load file .min.js này (nhẹ hơn ~30%). Mỗi lần sửa load.js
 * (kể cả khi add-data.html sinh code filesToLoad để dán vào), chạy lại
 * bước build này (tự động khi Vercel deploy — xem "buildCommand" trong
 * vercel.json / "scripts.build" trong package.json) để load.min.js luôn
 * khớp với load.js.
 */

const esbuild = require('esbuild');
const path    = require('path');

const ROOT = path.join(__dirname, '..');

esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'assets', 'js', 'load.js')],
    outfile: path.join(ROOT, 'assets', 'js', 'load.min.js'),
    minify: true,
    target: 'es2019',
    logLevel: 'info',
});

esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'assets', 'js', 'img-guard.js')],
    outfile: path.join(ROOT, 'assets', 'js', 'img-guard.min.js'),
    minify: true,
    target: 'es2019',
    logLevel: 'info',
});
