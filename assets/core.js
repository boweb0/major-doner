/* Major Döner – ortak veri katmanı
 * Site, menü ve yönetim paneli aynı veriyi buradan okur.
 * Sunucu varsa (node server.js) veri sunucuda saklanır.
 * Sunucu yoksa (statik önizleme) tarayıcının localStorage'ında saklanır.
 */
(function () {
  'use strict';

  var LS_KEY = 'major_doner_data_v1';
  var TOKEN_KEY = 'major_doner_token';

  /* ---------- Yazı tipi hazır ayarları ---------- */
  var FONT_PRESETS = {
    altin: { name: 'Altın (logo gibi, zarif)', display: 'Cinzel', displayW: 700, body: 'Barlow', cond: 'Barlow Condensed', script: 'Yellowtail' },
    afis:  { name: 'Afiş (broşür gibi, kalın)', display: 'Alfa Slab One', displayW: 400, body: 'Barlow', cond: 'Barlow Condensed', script: 'Yellowtail' },
    sade:  { name: 'Sade (modern)', display: 'Barlow Condensed', displayW: 700, body: 'Barlow', cond: 'Barlow Condensed', script: 'Yellowtail' }
  };

  /* ---------- Varsayılan veri (broşürden alındı) ---------- */
  var SIZES = [
    { k: 's', label: 'Küçük', sub: '100 g' },
    { k: 'm', label: 'Orta', sub: '150 g' },
    { k: 'l', label: 'Büyük', sub: '200 g' }
  ];

  function sz(a, b, c) { return { s: a, m: b, l: c }; }
  function P(id, cat, name, desc, prices, extra) {
    var p = { id: id, cat: cat, name: name, desc: desc, mode: 'sizes', prices: prices, single: null, sale: { s: null, m: null, l: null }, saleSingle: null, onSale: false, badge: '', img: '', kind: 'wrap', soldOut: false, visible: true };
    for (var k in (extra || {})) p[k] = extra[k];
    return p;
  }
  function S(id, cat, name, desc, price, kind) {
    return P(id, cat, name, desc, sz(null, null, null), { mode: 'single', single: price, kind: kind || 'salad' });
  }

  var DEFAULTS = {
    version: 1,
    settings: {
      siteName: 'Major Döner',
      tagline: 'Majör Lezzetiyle',
      slogan: 'İyi döner, iyi mood!',
      heroText: 'Tavuk dürüm, menü ve servisler. Güzelyalı, Çukurova / Adana.',
      logo: 'assets/img/logo-mark.jpg',
      heroImage: 'assets/img/logo.jpg',
      colors: { bg: '#0e0d0b', surface: '#1b1915', text: '#f4ead3', accent: '#d9b15c', accent2: '#f2a51d' },
      fontPreset: 'altin',
      announcement: { on: false, text: '' },
      menuNote: 'Fiyatlar TL cinsindendir. Sipariş için WhatsApp’tan yazabilir ya da arayabilirsiniz.'
    },
    contact: {
      phone: '05078172888',
      whatsapp: '05078172888',
      address: 'Güzelyalı Mah. 81148 Sk. No: 1 C, Çukurova / Adana',
      hours: [
        { d: 'Pazartesi – Pazar', h: '' }
      ],
      hoursNote: 'Çalışma saatlerini yönetim panelinden ekleyin.',
      mapsLink: '',
      mapsEmbed: '',
      instagram: '',
      waGreeting: 'Merhaba Major Döner, '
    },
    about: {
      title: 'Majör lezzetiyle her zaman yanınızda',
      text: 'Major Döner, Adana Çukurova Güzelyalı’da tavuk dürüm ve menü sunar. Altı çeşit dürüm, üç boy seçeneği ve yanında patates, salata ve içecekle sipariş verebilirsiniz.\n\nSipariş için WhatsApp’tan yazın ya da hemen arayın.',
      features: [
        { t: 'Üç boy', d: 'Küçük 100 g, orta 150 g, büyük 200 g.' },
        { t: 'Altı çeşit dürüm', d: 'Classic, Fresh, Turco, White, Cheese ve Mix.' },
        { t: 'WhatsApp sipariş', d: 'Her ürün için tek dokunuşla sipariş mesajı.' }
      ],
      gallery: [
        { src: 'assets/img/foto-durum.jpg', alt: 'Major dürüm ve patates' },
        { src: 'assets/img/foto-patates.jpg', alt: 'Patates ve Major mayonez' }
      ]
    },
    categories: [
      { id: 'durum', name: 'Dürümler', note: 'Boyunu seç, WhatsApp’tan sipariş ver.', sizes: SIZES, visible: true },
      { id: 'menu', name: 'Menüler', note: 'Dürüm menü olarak da sipariş edilebilir.', sizes: SIZES, visible: true },
      { id: 'servis', name: 'Servisler', note: '', sizes: [], visible: true },
      { id: 'icecek', name: 'İçecekler', note: '', sizes: [], visible: true }
    ],
    products: [
      P('classic', 'durum', 'Major Classic', 'Tavuk, patates, Major mayonez, sos', sz(200, 250, 300), { img: 'assets/img/foto-durum.jpg', badge: 'Çok sevilen' }),
      P('fresh', 'durum', 'Major Fresh', 'Tavuk, iceberg marul, Major mayonez', sz(200, 250, 300)),
      P('turco', 'durum', 'Major Turco', 'Tavuk, soğan, maydanoz, sumak, sos', sz(200, 250, 300)),
      P('white', 'durum', 'Major White', 'Sossuz ekmek, tavuk, patates, Major mayonez', sz(200, 250, 300)),
      P('cheese', 'durum', 'Major Cheese', 'Tavuk, patates, Major mayonez, kaşar peyniri', sz(250, 300, 350)),
      P('mix', 'durum', 'Major Mix', 'Mantar, köri, krema sos, mayonez', sz(250, 300, 350)),

      P('classic-menu', 'menu', 'Major Classic Menü', 'Tavuk, patates, Major mayonez, sos', sz(400, 450, 500), { kind: 'menu' }),
      P('fresh-menu', 'menu', 'Major Fresh Menü', 'Tavuk, iceberg marul, Major mayonez', sz(400, 450, 500), { kind: 'menu' }),
      P('turco-menu', 'menu', 'Major Turco Menü', 'Tavuk, soğan, maydanoz, sumak, sos', sz(400, 450, 500), { kind: 'menu' }),
      P('white-menu', 'menu', 'Major White Menü', 'Sossuz ekmek, tavuk, patates, Major mayonez', sz(400, 450, 500), { kind: 'menu' }),
      P('cheese-menu', 'menu', 'Major Cheese Menü', 'Tavuk, patates, Major mayonez, kaşar peyniri', sz(450, 500, 550), { kind: 'menu' }),
      P('mix-menu', 'menu', 'Major Mix Menü', 'Mantar, köri, krema sos, mayonez', sz(null, null, null), { kind: 'menu', mode: 'single', single: 500 }),

      S('servis', 'servis', 'Major Servis', '', 450, 'plate'),
      S('marley-salata', 'servis', 'B. Marley Tavuklu Salata', '', 350, 'salad'),
      S('yesil-salata', 'servis', 'Bol Yeşil Salata', '', 250, 'salad'),

      S('kutu', 'icecek', 'Kutu İçecekler', '', 100, 'can'),
      S('ayran', 'icecek', 'Ayran', '', 80, 'cup'),
      S('salgam', 'icecek', 'Şalgam', '', 80, 'cup'),
      S('soda', 'icecek', 'Soda', '', 50, 'bottle'),
      S('su', 'icecek', 'Su', '', 30, 'bottle')
    ],
    content: {
      heroVisual: 'doner',
      menuButton: 'Menüyü Gör',
      marquee: ['Dürüm', 'Menü', 'Lezzet', 'Majör Lezzetiyle', 'İyi döner, iyi mood!'],
      size: { show: true, title: 'Boyunu *sen* seç', text: 'Küçükten büyüğe üç boy. Hangisi sana yeterse onu seç.', button: 'Fiyatlar menüde' },
      campaigns: { show: true, title: 'Kampanyalar' },
      steps: {
        show: true, title: 'Üç adımda *sipariş*',
        items: [
          { t: 'Menüyü aç', d: 'Masadaki QR kodu okut ya da “Menüyü Gör” düğmesine bas.' },
          { t: 'Boyunu seç', d: 'Dürümünü ve boyunu seç. Fiyat anında görünür.' },
          { t: 'WhatsApp’tan gönder', d: 'Siparişin hazır mesaj olarak açılır. Göndermen yeter. İstersen arayabilirsin.' }
        ]
      },
      aboutShow: true,
      galleryTitle: 'Fotoğraflar',
      menuBand: { show: true, title: 'Acıktın mı? *Menü* hazır', text: 'Dürümler, menüler, servisler ve içecekler tek sayfada. Telefonda hızlı açılır, siparişi WhatsApp’a taşır.', button: 'Menüyü Gör' },
      contactTitle: 'Bize ulaş',
      footerScript: 'Afiyet olsun',
      menuTitle: 'Menü',
      searchPlaceholder: 'Menüde ara…'
    },
    campaigns: []
  };

  /* ---------- Yardımcılar ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // *vurgu* yazılan kelimeyi renkli yapar. Önce güvenli hâle getirilir.
  function rich(str) { return esc(str).replace(/\*([^*]+)\*/g, '<em>$1</em>'); }
  function fmt(n) {
    if (n == null || n === '' || isNaN(n)) return '';
    return Number(n).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';
  }
  function num(v) {
    if (v === '' || v == null) return null;
    var n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  function uid(prefix) { return (prefix || 'x') + '-' + Math.random().toString(36).slice(2, 8); }
  function slug(s) {
    return String(s).toLowerCase().replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
  }

  function merge(base, over) {
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (base && typeof base === 'object') {
      var out = {};
      for (var k in base) out[k] = (over && over[k] !== undefined) ? merge(base[k], over[k]) : clone(base[k]);
      if (over && typeof over === 'object') for (var k2 in over) if (!(k2 in base)) out[k2] = over[k2];
      return out;
    }
    return over !== undefined ? over : base;
  }

  function normalizePhone(p) {
    var d = String(p || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.charAt(0) === '0') d = '90' + d.slice(1);
    else if (d.length === 10) d = '90' + d;
    return d;
  }
  function telLink(p) { var d = normalizePhone(p); return d ? 'tel:+' + d : '#'; }
  function waLink(p, text) {
    var d = normalizePhone(p);
    return 'https://wa.me/' + d + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function prettyPhone(p) {
    var d = String(p || '').replace(/\D/g, '');
    if (d.length === 11) return d.replace(/(\d{4})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    return p || '';
  }
  function mapsLink(c) {
    if (c.mapsLink) return c.mapsLink;
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.address || '');
  }

  /* ---------- Fiyat hesabı (kampanyalı fiyat dahil) ---------- */
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function campaignActive(c, t) {
    if (!c.active) return false;
    t = t || today();
    if (c.start && t < c.start) return false;
    if (c.end && t > c.end) return false;
    return true;
  }
  function activeCampaigns(data) { return (data.campaigns || []).filter(function (c) { return campaignActive(c); }); }

  function basePrice(p, key) { return p.mode === 'single' ? p.single : (p.prices || {})[key]; }

  // {price, old} döndürür. old doluysa üstü çizili eski fiyat gösterilir.
  function priceFor(p, key, data) {
    var base = basePrice(p, key);
    if (base == null) return { price: null, old: null, label: '' };
    if (p.onSale) {
      var sale = p.mode === 'single' ? p.saleSingle : (p.sale || {})[key];
      if (sale != null && sale < base) return { price: sale, old: base, label: p.badge || 'İndirim' };
    }
    var best = null;
    activeCampaigns(data).forEach(function (c) {
      if (c.type === 'info' || (c.productIds || []).indexOf(p.id) < 0) return;
      var v = base;
      if (c.type === 'percent') v = base * (1 - (c.value || 0) / 100);
      else if (c.type === 'amount') v = base - (c.value || 0);
      v = Math.max(0, Math.round(v));
      if (v < base && (!best || v < best.price)) best = { price: v, old: base, label: c.badge || c.title };
    });
    return best || { price: base, old: null, label: '' };
  }
  function lowestPrice(p, data) {
    var keys = p.mode === 'single' ? ['single'] : ['s', 'm', 'l'];
    var min = null;
    keys.forEach(function (k) {
      var pr = priceFor(p, k, data).price;
      if (pr != null && (min == null || pr < min)) min = pr;
    });
    return min;
  }

  /* ---------- Depolama ---------- */
  var state = { source: 'default', token: null };

  function timeoutFetch(url, opts, ms) {
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var t = ctl ? setTimeout(function () { ctl.abort(); }, ms || 2500) : null;
    opts = opts || {};
    if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  /* Önizleme (artifact) modunda ortak veritabanı: sayfalar ve ziyaretçiler aynı veriyi görür.
     Belge boyutu sınırı için veri 150 KB'lık parçalara bölünür. */
  var CHUNK = 150000;
  function getDb() {
    if (!(window.claude && typeof window.claude.use === 'function')) return Promise.resolve(null);
    return Promise.race([
      window.claude.use('db').catch(function () { return null; }),
      new Promise(function (res) { setTimeout(function () { res(null); }, 4000); })
    ]);
  }
  function dbRead(db) {
    return db.doc('site/meta').get().then(function (m) {
      if (!m.exists) return null;
      var n = (m.data() || {}).n || 0, ps = [];
      for (var i = 0; i < n; i++) ps.push(db.doc('site/p' + i).get());
      return Promise.all(ps).then(function (rs) {
        var str = rs.map(function (r) { return r.exists ? (r.data() || {}).t || '' : ''; }).join('');
        try { return JSON.parse(str); } catch (e) { return null; }
      });
    });
  }
  function dbWrite(db, data) {
    var str = JSON.stringify(data), parts = [];
    for (var i = 0; i < str.length; i += CHUNK) parts.push(str.slice(i, i + CHUNK));
    return parts.reduce(function (p, t, i) { return p.then(function () { return db.doc('site/p' + i).set({ t: t }); }); }, Promise.resolve())
      .then(function () { return db.doc('site/meta').set({ n: parts.length, at: Date.now() }); });
  }
  var DB = null;

  function load() {
    return timeoutFetch('api/data', { cache: 'no-store' }, 2000).then(function (r) {
      var ct = r.headers.get('content-type') || '';
      if (!r.ok || ct.indexOf('json') < 0) throw new Error('no-server');
      return r.json().then(function (j) {
        state.source = 'server';
        return merge(DEFAULTS, j && Object.keys(j).length ? j : {});
      });
    }).catch(function () {
      return getDb().then(function (db) {
        if (!db) throw new Error('no-db');
        DB = db;
        return dbRead(db).then(function (j) { state.source = 'db'; return merge(DEFAULTS, j || {}); });
      });
    }).catch(function () {
      if (state.source === 'server' || state.source === 'db') return merge(DEFAULTS, {});
      var raw = lsGet(LS_KEY), j = null;
      if (raw) { try { j = JSON.parse(raw); } catch (e) { j = null; } }
      state.source = j ? 'local' : 'default';
      return merge(DEFAULTS, j || {});
    });
  }

  function save(data) {
    if (state.source === 'server') {
      return fetch('api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (getToken() || '') },
        body: JSON.stringify(data)
      }).then(function (r) {
        if (r.status === 401) { var e = new Error('auth'); e.auth = true; throw e; }
        if (!r.ok) throw new Error('save-failed');
        return true;
      });
    }
    if (state.source === 'db' && DB) {
      return dbWrite(DB, data).then(function () { return dbRead(DB); }).then(function (back) {
        if (!back || JSON.stringify(back) !== JSON.stringify(data)) throw new Error('Kayıt doğrulanamadı. Yazma izniniz olmayabilir (yalnızca yayının sahibi kaydedebilir).');
        return true;
      }, function (e) { throw new Error('Kaydedilemedi: ' + ((e && e.message) || 'yazma izni yok') + '. Yalnızca yayının sahibi kaydedebilir.'); });
    }
    var ok = lsSet(LS_KEY, JSON.stringify(data));
    if (ok && lsGet(LS_KEY) === JSON.stringify(data)) return Promise.resolve(true);
    return Promise.reject(new Error('Bu sayfa tarayıcıya kayıt yapamıyor. Siteyle panel aynı depoyu paylaşamıyor.'));
  }

  function getToken() { try { return sessionStorage.getItem(TOKEN_KEY); } catch (e) { return state.token; } }
  function setToken(t) { state.token = t; try { if (t) sessionStorage.setItem(TOKEN_KEY, t); else sessionStorage.removeItem(TOKEN_KEY); } catch (e) { } }

  function resetLocal() { try { localStorage.removeItem(LS_KEY); } catch (e) { } }

  /* ---------- Görsel yükleme (küçültüp saklar) ---------- */
  function resizeImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onerror = function () { reject(new Error('Dosya okunamadı.')); };
      fr.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Bu dosya görsel olarak açılamadı.')); };
        img.onload = function () {
          var w = img.width, h = img.height, r = Math.min(1, maxSide / Math.max(w, h));
          var c = document.createElement('canvas');
          c.width = Math.round(w * r); c.height = Math.round(h * r);
          var ctx = c.getContext('2d');
          var png = file.type === 'image/png';
          if (!png) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height); }
          ctx.drawImage(img, 0, 0, c.width, c.height);
          var type = png ? 'image/png' : 'image/jpeg';
          c.toBlob(function (blob) { resolve({ blob: blob, dataUrl: c.toDataURL(type, quality || 0.82), type: type }); }, type, quality || 0.82);
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function uploadImage(file, maxSide) {
    return resizeImage(file, maxSide || 1000, 0.82).then(function (res) {
      if (state.source !== 'server') return res.dataUrl;
      return fetch('api/upload', {
        method: 'POST',
        headers: { 'Content-Type': res.type, Authorization: 'Bearer ' + (getToken() || '') },
        body: res.blob
      }).then(function (r) {
        if (!r.ok) throw new Error('Görsel sunucuya yüklenemedi.');
        return r.json();
      }).then(function (j) { return j.url; });
    });
  }

  /* ---------- Tema ---------- */
  function applyTheme(s) {
    var root = document.documentElement, c = s.colors || {};
    root.style.setProperty('--bg', c.bg); root.style.setProperty('--surface', c.surface);
    root.style.setProperty('--text', c.text); root.style.setProperty('--accent', c.accent); root.style.setProperty('--accent2', c.accent2);
    var f = FONT_PRESETS[s.fontPreset] || FONT_PRESETS.altin;
    root.style.setProperty('--f-display', '"' + f.display + '", Georgia, serif');
    root.style.setProperty('--f-display-w', f.displayW);
    root.style.setProperty('--f-body', '"' + f.body + '", system-ui, sans-serif');
    root.style.setProperty('--f-cond', '"' + f.cond + '", "Arial Narrow", sans-serif');
    root.style.setProperty('--f-script', '"' + f.script + '", cursive');
    root.style.setProperty('--f-poster', '"Alfa Slab One", Georgia, serif');
    var fam = {};
    [f.display, f.body, f.cond, f.script, 'Alfa Slab One'].forEach(function (n) { fam[n] = 1; });
    var want = { 'Cinzel': 'Cinzel:wght@700', 'Alfa Slab One': 'Alfa+Slab+One', 'Barlow': 'Barlow:wght@400;500;600', 'Barlow Condensed': 'Barlow+Condensed:wght@500;600;700', 'Yellowtail': 'Yellowtail' };
    var q = Object.keys(fam).map(function (n) { return 'family=' + want[n]; }).join('&');
    var href = 'https://fonts.googleapis.com/css2?' + q + '&display=swap';
    var el = document.getElementById('major-fonts');
    if (!el) { el = document.createElement('link'); el.id = 'major-fonts'; el.rel = 'stylesheet'; document.head.appendChild(el); }
    if (el.getAttribute('href') !== href) el.setAttribute('href', href);
    var ic = document.querySelector('link[rel="icon"]');
    if (!ic) { ic = document.createElement('link'); ic.rel = 'icon'; document.head.appendChild(ic); }
    ic.href = s.logo || 'assets/img/icon-192.png';
  }

  /* ---------- Ürün görseli yoksa çizim ---------- */
  var INK = '#1b1915';
  function art(kind) {
    var g = 'var(--accent)', a = 'var(--accent2)', k = INK;
    var body = '';
    if (kind === 'wrap') {
      body = '<g transform="rotate(-28 50 50)"><rect x="22" y="38" width="56" height="26" rx="13" fill="' + a + '"/><rect x="22" y="38" width="30" height="26" rx="13" fill="' + g + '"/><ellipse cx="50" cy="38" rx="20" ry="6" fill="' + k + '" opacity=".55"/><circle cx="40" cy="36" r="3" fill="#7ab55c"/><circle cx="52" cy="35" r="3" fill="#d9573a"/><circle cx="61" cy="37" r="2.6" fill="#f4ead3"/></g><path d="M23 82h54" stroke="' + g + '" stroke-width="3" stroke-linecap="round" opacity=".5"/>';
    } else if (kind === 'menu') {
      body = '<g transform="rotate(-24 36 56)"><rect x="10" y="48" width="44" height="20" rx="10" fill="' + a + '"/><rect x="10" y="48" width="24" height="20" rx="10" fill="' + g + '"/></g><path d="M62 38l3 34h18l3-34z" fill="' + g + '"/><path d="M60 36h30" stroke="' + a + '" stroke-width="4" stroke-linecap="round"/><rect x="66" y="22" width="3" height="14" rx="1.5" fill="' + a + '"/><g fill="' + a + '"><rect x="44" y="58" width="4" height="22" rx="2" transform="rotate(14 46 69)"/><rect x="50" y="56" width="4" height="24" rx="2" transform="rotate(4 52 68)"/><rect x="56" y="60" width="4" height="20" rx="2" transform="rotate(-8 58 70)"/></g>';
    } else if (kind === 'plate') {
      body = '<ellipse cx="50" cy="58" rx="38" ry="14" fill="' + g + '"/><ellipse cx="50" cy="54" rx="30" ry="9" fill="' + k + '" opacity=".6"/><rect x="26" y="40" width="48" height="12" rx="6" fill="' + a + '"/><circle cx="38" cy="44" r="3" fill="#7ab55c"/><circle cx="52" cy="42" r="3" fill="#d9573a"/><circle cx="64" cy="45" r="3" fill="#f4ead3"/>';
    } else if (kind === 'salad') {
      body = '<path d="M16 50h68a34 22 0 0 1-68 0z" fill="' + g + '"/><circle cx="34" cy="46" r="9" fill="#7ab55c"/><circle cx="50" cy="42" r="10" fill="#8cc66b"/><circle cx="66" cy="46" r="9" fill="#7ab55c"/><circle cx="44" cy="40" r="3.5" fill="#d9573a"/><circle cx="58" cy="38" r="3" fill="' + a + '"/>';
    } else if (kind === 'can') {
      body = '<rect x="34" y="20" width="32" height="62" rx="6" fill="' + g + '"/><rect x="34" y="34" width="32" height="22" fill="' + a + '"/><ellipse cx="50" cy="20" rx="16" ry="4" fill="' + k + '" opacity=".5"/><path d="M42 44h16" stroke="' + k + '" stroke-width="3" stroke-linecap="round"/>';
    } else if (kind === 'cup') {
      body = '<path d="M30 28h40l-5 54H35z" fill="' + g + '"/><path d="M32 40h36l-1.6 18H33.6z" fill="' + a + '"/><rect x="28" y="24" width="44" height="6" rx="3" fill="' + a + '"/>';
    } else {
      body = '<rect x="42" y="14" width="16" height="12" rx="3" fill="' + a + '"/><path d="M42 26h16c6 8 10 14 10 24v28a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V50c0-10 4-16 10-24z" fill="' + g + '"/><rect x="34" y="52" width="32" height="20" fill="' + a + '" opacity=".85"/>';
    }
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + body + '</svg>';
  }

  var ICONS = {
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    wa: '<path d="M20 11.5A8.5 8.5 0 0 1 7.6 19L3 20.5l1.5-4.4A8.5 8.5 0 1 1 20 11.5z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .7c-1-.4-2-1.4-2.4-2.4l.7-1-1-2z"/>',
    pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    menu: '<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    insta: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".6"/>',
    crown: '<path d="M4 18h16M5 18L4 7l5 4 3-6 3 6 5-4-1 11"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>'
  };
  function icon(n, s) {
    s = s || 20;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';
  }

  // Sayfadaki logo rozetine tıklayınca tam logoyu büyütür
  function zoomImage(src, alt) {
    var lb = document.createElement('div'), prev = document.activeElement;
    lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', alt || 'Logo');
    lb.innerHTML = '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '"><button type="button" aria-label="Kapat">' + icon('x', 22) + '</button>';
    function close() { lb.remove(); document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); }
    function key(e) { if (e.key === 'Escape') close(); }
    lb.addEventListener('click', close); document.addEventListener('keydown', key);
    document.body.appendChild(lb); lb.querySelector('button').focus();
  }
  function bindLogoZoom(sel, getSrc) {
    [].forEach.call(document.querySelectorAll(sel), function (el) {
      el.classList.add('zoomable'); el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-label', 'Logoyu büyüt');
      function go(e) { e.preventDefault(); e.stopPropagation(); zoomImage(getSrc(), 'Logo'); }
      el.addEventListener('click', go);
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go(e); });
    });
  }

  window.Major = {
    zoomImage: zoomImage, bindLogoZoom: bindLogoZoom,
    icon: icon,
    DEFAULTS: DEFAULTS, SIZES: SIZES, FONT_PRESETS: FONT_PRESETS, state: state,
    load: load, save: save, merge: merge, clone: clone, esc: esc, rich: rich, fmt: fmt, num: num, uid: uid, slug: slug,
    telLink: telLink, waLink: waLink, prettyPhone: prettyPhone, normalizePhone: normalizePhone, mapsLink: mapsLink,
    priceFor: priceFor, lowestPrice: lowestPrice, basePrice: basePrice, activeCampaigns: activeCampaigns, campaignActive: campaignActive, today: today,
    getToken: getToken, setToken: setToken, resetLocal: resetLocal, uploadImage: uploadImage, resizeImage: resizeImage,
    applyTheme: applyTheme, art: art, timeoutFetch: timeoutFetch
  };
})();
