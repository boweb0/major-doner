/* Dönen döner: tavuk döner dokusu kodla üretilir, silindire sarılıp gerçekten döndürülür.
 * Major.mountDoner(canvas) ile bağlanır. Görünmezken ya da sekme arka plandayken durur.
 * "Hareketi azalt" ayarında tek kare çizer. */
(function () {
  'use strict';

  function hash(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
  function h2(x, y) { return hash(x * 57.3 + y * 113.9); }
  // x ekseninde periyodik (dikişsiz) değer gürültüsü
  function vn(x, y, per) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var x0 = ((xi % per) + per) % per, x1 = (x0 + 1) % per;
    var a = h2(x0, yi), b = h2(x1, yi), c = h2(x0, yi + 1), d = h2(x1, yi + 1);
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function sstep(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function mix(a, b, t) { return a + (b - a) * t; }

  var TW = 512, TH = 320, TEX = null, SPEC = null;

  // Doku: üst üste dizilmiş tavuk dilimleri, lifler, kızarmış noktalar, yağ parlaklığı
  function buildTexture() {
    if (TEX) return;
    TEX = new Uint8ClampedArray(TW * TH * 3); SPEC = new Uint8ClampedArray(TW * TH);
    for (var v = 0; v < TH; v++) {
      for (var u = 0; u < TW; u++) {
        var uu = u / TW;
        var warp = (vn(uu * 9, v / 46, 9) - .5) * 8 + (vn(uu * 28, v / 20, 28) - .5) * 3;
        var yy = v + warp, bandH = 12, bi = Math.floor(yy / bandH), f = yy / bandH - bi;
        var seg = Math.floor(uu * 6 + h2(bi, 9) * 2);
        var tone = h2(bi * 1.7, seg);                       // dilim dilim farklı pişme
        var lump = vn(uu * 13, v / 24, 13);
        var fib = vn(uu * 170, v / 60, 170);                // dikey lifler
        var spot = vn(uu * 36, v / 15, 36);
        var t = Math.max(0, Math.min(1, .2 + .42 * tone + .3 * (lump - .5) - .3 * (fib - .5)));
        // altın sarısı → karamel kahve
        var r = mix(236, 158, t), g = mix(186, 92, t), b = mix(104, 38, t);
        // kızarmış, çıtır noktalar
        var ch = sstep(.72, .92, spot) * .42;
        r = mix(r, 74, ch); g = mix(g, 36, ch); b = mix(b, 14, ch);
        // dilim kenarı: gölge çizgisi ve hafif kızarma
        var ao = .66 + .34 * sstep(0, .22, f) * (1 - .2 * sstep(.82, 1, f));
        var edgeBrown = (1 - sstep(0, .12, f)) * .22;
        r = mix(r, 120, edgeBrown); g = mix(g, 60, edgeBrown); b = mix(b, 22, edgeBrown);
        var fibShade = .9 + .2 * fib;
        var k = (v * TW + u) * 3;
        TEX[k] = r * ao * fibShade; TEX[k + 1] = g * ao * fibShade; TEX[k + 2] = b * ao * fibShade;
        // yağ parlaklığı
        SPEC[v * TW + u] = 255 * sstep(.7, .9, vn(uu * 22, v / 11, 22)) * (.3 + .7 * sstep(.1, .45, f));
      }
    }
  }

  // Şiş silueti: yukarıdan aşağıya genişleyen dilim yığını
  var RT = 58, RB = 97, CW = 230, CH = 300, Y0 = 22, Y1 = 280, CX = CW / 2;

  function mount(cv) {
    if (!cv || !cv.getContext) return;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var S = Math.min(2, Math.max(1.25, (window.devicePixelRatio || 1) * (window.innerWidth >= 820 ? 1.3 : 1)));
    var W = Math.round(CW * S), H = Math.round(CH * S);
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var off = document.createElement('canvas'); off.width = W; off.height = H;
    var octx = off.getContext('2d'), img = octx.createImageData(W, H), px = img.data;

    // her satırın yarıçapı (dilim kenarı hafif çıkıntılı)
    var rows = new Float32Array(H), texRow = new Int16Array(H);
    for (var y = 0; y < H; y++) {
      var ly = y / S;
      if (ly < Y0 || ly > Y1) { rows[y] = 0; continue; }
      var t = (ly - Y0) / (Y1 - Y0);
      var r = mix(RT, RB, Math.pow(t, 1.08));
      r += 1.7 * (h2(Math.floor((ly - Y0) / 12), 3) - .5) + .5 * Math.sin(ly * .35);
      if (t < .035) r *= .86 + .14 * sstep(0, .035, t);          // üst kenar yuvarlak
      rows[y] = r * S;
      texRow[y] = Math.max(0, Math.min(TH - 1, Math.floor(t * (TH - 1))));
    }

    function drawMeat(rot) {
      px.fill(0);
      var cx = CX * S;
      for (var y = 0; y < H; y++) {
        var r = rows[y]; if (r <= 0) continue;
        var x0 = Math.max(0, Math.floor(cx - r - 1)), x1 = Math.min(W - 1, Math.ceil(cx + r + 1)), v = texRow[y];
        var vFade = 1 - .22 * sstep(.7, 1, (y / S - Y0) / (Y1 - Y0));   // alta doğru hafif gölge
        for (var x = x0; x <= x1; x++) {
          var dx = (x - cx) / r, ad = Math.abs(dx);
          var edge = (1 - ad) * r;                                    // kenara piksel uzaklığı
          if (edge <= -0.5) continue;
          var a = Math.max(0, Math.min(1, edge + .5));
          if (ad > 1) ad = dx = dx > 0 ? 1 : -1;
          var z = Math.sqrt(Math.max(0, 1 - dx * dx));
          var theta = Math.asin(dx) + rot;
          var u = Math.floor((((theta / 6.283185) % 1) + 1) % 1 * TW);
          var k = (v * TW + u) * 3, sp = SPEC[v * TW + u] / 255;
          var rr = TEX[k], gg = TEX[k + 1], bb = TEX[k + 2];
          // ışık: sol-önden gelir, sağda ocak ısısı turuncu yansır
          var diff = Math.max(0, -dx * .5 + z * .82), amb = .3;
          var lit = (amb + (1 - amb) * diff) * (.55 + .45 * Math.pow(z, .6)) * vFade;
          var heat = sstep(.15, 1, dx) * .6;
          rr = rr * lit + heat * 150 * (.4 + .6 * (TEX[k] / 255));
          gg = gg * lit + heat * 58;
          bb = bb * lit + heat * 8;
          // yağ parlaması
          var spec = sp * Math.pow(Math.max(0, z * .92 - dx * .4), 14) * .55;
          rr += spec * 255; gg += spec * 235; bb += spec * 190;
          var i = (y * W + x) * 4;
          px[i] = rr; px[i + 1] = gg; px[i + 2] = bb; px[i + 3] = a * 255;
        }
      }
      octx.putImageData(img, 0, 0);
    }

    function frame(rot) {
      ctx.clearRect(0, 0, W, H);
      // şiş (meat'in altında kalan ve dışarı taşan kısım)
      var rx = CX * S, rw = 7 * S, g = ctx.createLinearGradient(rx - rw / 2, 0, rx + rw / 2, 0);
      g.addColorStop(0, '#5f574b'); g.addColorStop(.45, '#f1eadb'); g.addColorStop(1, '#6d6558');
      ctx.fillStyle = g; ctx.fillRect(rx - rw / 2, 0, rw, (Y1 + 16) * S);
      drawMeat(rot);
      ctx.drawImage(off, 0, 0);
      // üst yüzey: kesilmiş et kapağı
      var ty = Y0 * S, trx = RT * S * .86;
      var tg = ctx.createRadialGradient(rx - trx * .3, ty - 1, 2, rx, ty, trx);
      tg.addColorStop(0, '#f4d89a'); tg.addColorStop(.6, '#c88a3c'); tg.addColorStop(1, '#7a4416');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(rx, ty + 1, trx, 7 * S, 0, 0, 6.283185); ctx.fill();
      // alttaki damlalık tepsisi
      var by = (Y1 + 4) * S, brx = (RB + 6) * S;
      var bg = ctx.createLinearGradient(rx - brx, 0, rx + brx, 0);
      bg.addColorStop(0, '#3a352d'); bg.addColorStop(.35, '#b9b2a4'); bg.addColorStop(.6, '#7d766a'); bg.addColorStop(1, '#2e2a24');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.ellipse(rx, by + 6 * S, brx, 11 * S, 0, 0, 6.283185); ctx.fill();
      ctx.fillStyle = 'rgba(20,10,0,.55)'; ctx.beginPath(); ctx.ellipse(rx, by + 3 * S, (RB - 2) * S, 6 * S, 0, 0, 6.283185); ctx.fill();
    }

    var rot = .7, last = 0, run = false, vis = true;
    function loop(t) {
      if (!run) return;
      if (!last) last = t;
      if (t - last >= 32) { rot += (t - last) / 1000 * .85; last = t; frame(rot); }
      requestAnimationFrame(loop);
    }
    function start() { if (run || reduce) return; run = true; last = 0; requestAnimationFrame(loop); }
    function stop() { run = false; }

    buildTexture();
    frame(rot);
    if (!reduce) {
      start();
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; vis && !document.hidden ? start() : stop(); }).observe(cv);
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (vis && start()); });
    }
  }

  window.Major = window.Major || {};
  window.Major.mountDoner = mount;
})();
