'use strict';
/**
 * Major Döner – sıfır bağımlılıklı sunucu (Node 18+).
 *   node server.js
 * Siteyi, menüyü ve yönetim panelini sunar. Panelden yapılan değişiklikleri
 * data/site.json içine, yüklenen fotoğrafları uploads/ klasörüne kaydeder.
 *
 * Ortam değişkenleri:
 *   PORT            Dinlenecek port (varsayılan 3000)
 *   ADMIN_PASSWORD  Panel şifresi (varsayılan Major123, mutlaka değiştirin)
 *   DATA_DIR        Veri klasörü (varsayılan ./data)
 *   UPLOAD_DIR      Yüklenen görseller (varsayılan ./uploads)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const UP_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(ROOT, 'uploads'));
const SITE_FILE = path.join(DATA_DIR, 'site.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UP_DIR, { recursive: true });

/* ---------- Şifre ---------- */
const norm = (s) => String(s || '').replace(/\s+/g, ''); // "Major 123" ile "Major123" aynı sayılır
function hashPw(pw, salt) { return crypto.scryptSync(norm(pw), salt, 32); }
let auth = null;
try { auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); } catch (e) { /* ilk çalıştırma */ }
if (!auth) {
  const pw = process.env.ADMIN_PASSWORD || 'Major123';
  const salt = crypto.randomBytes(16).toString('hex');
  auth = { salt, hash: hashPw(pw, salt).toString('hex'), fromEnv: true };
  if (!process.env.ADMIN_PASSWORD) console.warn('[uyarı] ADMIN_PASSWORD tanımlı değil. Varsayılan şifre kullanılıyor. Canlıya almadan önce değiştirin.');
}
function checkPw(pw) {
  const a = hashPw(pw, auth.salt), b = Buffer.from(auth.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const tokens = new Map(); // token -> bitiş zamanı
const TOKEN_MS = 12 * 3600 * 1000;
function newToken() {
  const t = crypto.randomBytes(24).toString('hex');
  tokens.set(t, Date.now() + TOKEN_MS);
  return t;
}
function authed(req) {
  const m = /^Bearer (\w+)$/.exec(req.headers.authorization || '');
  if (!m) return false;
  const exp = tokens.get(m[1]);
  if (!exp || exp < Date.now()) { tokens.delete(m[1]); return false; }
  return true;
}
setInterval(() => { const n = Date.now(); for (const [t, e] of tokens) if (e < n) tokens.delete(t); }, 600000).unref();

const fails = new Map(); // ip -> {n, until}
function ipOf(req) { return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(); }
function blocked(ip) { const f = fails.get(ip); return f && f.n >= 8 && f.until > Date.now(); }
function fail(ip) { const f = fails.get(ip) || { n: 0, until: 0 }; f.n = f.until < Date.now() ? 1 : f.n + 1; f.until = Date.now() + 10 * 60000; fails.set(ip, f); }

/* ---------- Yardımcılar ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8'
};
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https:; frame-src https://www.google.com https://maps.google.com; connect-src 'self'; base-uri 'self'; form-action 'self'";

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Content-Security-Policy': CSP
  }, headers || {}));
  res.end(body);
}
function json(res, code, obj) { send(res, code, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); }

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error('too-large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function atomicWrite(file, data) {
  const tmp = file + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, file);
}

function sniff(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8) return { ext: '.jpg', type: 'image/jpeg' };
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: '.png', type: 'image/png' };
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return { ext: '.webp', type: 'image/webp' };
  return null;
}

/* ---------- API ---------- */
async function api(req, res, pathname) {
  const ip = ipOf(req);
  try {
    if (pathname === '/api/data' && req.method === 'GET') {
      let body = '{}';
      try { body = fs.readFileSync(SITE_FILE, 'utf8'); } catch (e) { /* henüz kayıt yok */ }
      return send(res, 200, body, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    }
    if (pathname === '/api/data' && req.method === 'PUT') {
      if (!authed(req)) return json(res, 401, { error: 'Giriş gerekli.' });
      const buf = await readBody(req, 3 * 1024 * 1024);
      let obj; try { obj = JSON.parse(buf.toString('utf8')); } catch (e) { return json(res, 400, { error: 'Geçersiz veri.' }); }
      if (!obj || !Array.isArray(obj.products) || !Array.isArray(obj.categories) || typeof obj.settings !== 'object') return json(res, 400, { error: 'Eksik veri.' });
      try { fs.copyFileSync(SITE_FILE, path.join(DATA_DIR, 'site.prev.json')); } catch (e) { /* ilk kayıt */ }
      atomicWrite(SITE_FILE, JSON.stringify(obj));
      return json(res, 200, { ok: true });
    }
    if (pathname === '/api/login' && req.method === 'POST') {
      if (blocked(ip)) return json(res, 429, { error: 'Çok fazla deneme. 10 dakika sonra tekrar deneyin.' });
      const buf = await readBody(req, 4096);
      let pw = ''; try { pw = JSON.parse(buf.toString('utf8')).password; } catch (e) { /* boş */ }
      if (!checkPw(pw)) { fail(ip); return json(res, 401, { error: 'Şifre yanlış.' }); }
      fails.delete(ip);
      return json(res, 200, { token: newToken() });
    }
    if (pathname === '/api/password' && req.method === 'POST') {
      if (!authed(req)) return json(res, 401, { error: 'Giriş gerekli.' });
      const buf = await readBody(req, 4096);
      let b = {}; try { b = JSON.parse(buf.toString('utf8')); } catch (e) { /* boş */ }
      if (!checkPw(b.old)) return json(res, 403, { error: 'Mevcut şifre yanlış.' });
      if (norm(b.next).length < 6) return json(res, 400, { error: 'Yeni şifre en az 6 karakter olmalı.' });
      const salt = crypto.randomBytes(16).toString('hex');
      auth = { salt, hash: hashPw(b.next, salt).toString('hex') };
      atomicWrite(AUTH_FILE, JSON.stringify(auth));
      tokens.clear();
      return json(res, 200, { ok: true });
    }
    if (pathname === '/api/upload' && req.method === 'POST') {
      if (!authed(req)) return json(res, 401, { error: 'Giriş gerekli.' });
      const buf = await readBody(req, 6 * 1024 * 1024);
      const kind = sniff(buf);
      if (!kind) return json(res, 400, { error: 'Yalnızca JPG, PNG veya WebP yüklenebilir.' });
      const name = crypto.randomBytes(9).toString('hex') + kind.ext;
      fs.writeFileSync(path.join(UP_DIR, name), buf);
      return json(res, 200, { url: 'uploads/' + name });
    }
    if (pathname === '/api/session' && req.method === 'GET') return json(res, authed(req) ? 200 : 401, { ok: authed(req) });
    return json(res, 404, { error: 'Bulunamadı.' });
  } catch (e) {
    if (e && e.code === 413) return json(res, 413, { error: 'Dosya çok büyük.' });
    console.error(e);
    return json(res, 500, { error: 'Sunucu hatası.' });
  }
}

/* ---------- Statik dosyalar ---------- */
const PAGES = { '/': 'index.html', '/index.html': 'index.html', '/menu': 'menu.html', '/menu.html': 'menu.html', '/admin': 'admin.html', '/admin.html': 'admin.html' };

function serveFile(req, res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Bulunamadı', { 'Content-Type': 'text/plain; charset=utf-8' });
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache };
    if (file.endsWith('admin.html')) { headers['X-Frame-Options'] = 'DENY'; headers['X-Robots-Tag'] = 'noindex'; }
    if (req.method === 'HEAD') return send(res, 200, '', headers);
    res.writeHead(200, Object.assign({ 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': CSP }, headers));
    fs.createReadStream(file).pipe(res);
  });
}

function within(dir, rel) {
  const full = path.resolve(dir, rel);
  return full === dir || full.startsWith(dir + path.sep) ? full : null;
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return send(res, 400, 'Hatalı adres'); }
  if (pathname === '/healthz') return json(res, 200, { ok: true });
  if (pathname.startsWith('/api/')) return api(req, res, pathname);
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'İzin yok');

  if (PAGES[pathname]) return serveFile(req, res, path.join(ROOT, PAGES[pathname]), 'no-cache');
  if (pathname.startsWith('/assets/')) {
    const f = within(path.join(ROOT, 'assets'), pathname.slice('/assets/'.length));
    return f ? serveFile(req, res, f, 'public, max-age=3600') : send(res, 403, 'Yasak');
  }
  if (pathname.startsWith('/uploads/')) {
    const f = within(UP_DIR, pathname.slice('/uploads/'.length));
    return f ? serveFile(req, res, f, 'public, max-age=604800') : send(res, 403, 'Yasak');
  }
  return send(res, 404, 'Bulunamadı', { 'Content-Type': 'text/plain; charset=utf-8' });
});

server.listen(PORT, () => console.log('Major Döner çalışıyor: http://localhost:' + PORT + '  (panel: /admin)'));
