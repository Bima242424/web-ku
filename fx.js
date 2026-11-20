/* fx.js: partikel latar yang halus + ripple tombol + letupan kecil saat aksi.
   Ringan: satu canvas, tanpa library, berhenti saat tab tersembunyi, mati otomatis
   jika perangkat meminta "kurangi gerak" atau mode hemat data. */
(function () {
  "use strict";
  var root = document.documentElement;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var save = navigator.connection && navigator.connection.saveData;
  window.FX = { burst: function () {}, at: function () {} };
  if (RM || save) return;

  /* ---------- ripple saat tombol disentuh ---------- */
  document.addEventListener("pointerdown", function (e) {
    var t = e.target.closest && e.target.closest(".btn,.chip,.q,.fl a,.fl button");
    if (!t || t.disabled) return;
    var r = t.getBoundingClientRect(), s = Math.max(r.width, r.height) * 1.3, p = document.createElement("span");
    p.className = "rip";
    p.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (e.clientX - r.left - s / 2) + "px;top:" + (e.clientY - r.top - s / 2) + "px";
    t.appendChild(p);
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 700);
  }, { passive: true });

  /* ---------- canvas partikel ---------- */
  var cv = document.createElement("canvas");
  cv.id = "fx"; cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);
  var cx = cv.getContext("2d"), W = 0, H = 0, P = [], B = [], spr = [], run = false, last = 0, mx = -999, my = -999;
  var low = innerWidth < 720 || (navigator.hardwareConcurrency || 4) <= 4, N = low ? 22 : 40;
  var dark = function () { return root.dataset.theme === "dark"; };
  var pal = function () { return dark() ? ["255,90,77", "255,160,90", "255,210,110"] : ["217,45,32", "255,122,69", "232,169,0"]; };

  function sprites() {
    spr = pal().map(function (c) {
      var s = document.createElement("canvas"); s.width = s.height = 64;
      var g = s.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, "rgba(" + c + ",1)"); r.addColorStop(.4, "rgba(" + c + ",.3)"); r.addColorStop(1, "rgba(" + c + ",0)");
      g.fillStyle = r; g.fillRect(0, 0, 64, 64); return s;
    });
  }
  function size() {
    var d = Math.min(window.devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cx.setTransform(d, 0, 0, d, 0, 0);
  }
  function spawn(init) {
    return { x: Math.random() * W, y: init ? Math.random() * H : H + 20, r: 5 + Math.random() * 13, vy: .12 + Math.random() * .3,
      sw: .4 + Math.random() * .8, ph: Math.random() * 6.28, tw: .6 + Math.random() * 1.2, c: (Math.random() * 3) | 0 };
  }
  function frame(t) {
    if (document.hidden) { run = false; return; }
    requestAnimationFrame(frame);
    var k = Math.min(40, t - last || 16) / 16.7; last = t;
    cx.clearRect(0, 0, W, H);
    var am = dark() ? .7 : .4, i, p, a, dx, dy, d, l;
    for (i = 0; i < P.length; i++) {
      p = P[i]; p.ph += .006 * p.sw * k; p.y -= p.vy * k; p.x += Math.sin(p.ph) * .25 * k;
      dx = p.x - mx; dy = p.y - my; d = dx * dx + dy * dy;
      if (d < 14400) { l = Math.sqrt(d) || 1; a = (1 - d / 14400) * 1.4 * k; p.x += dx / l * a; p.y += dy / l * a; }
      if (p.y < -30) { P[i] = p = spawn(false); }
      a = am * (.45 + .55 * Math.sin(t / 1000 * p.tw + p.ph)) * Math.max(0, Math.min(1, p.y / 120, (H + 20 - p.y) / 80));
      cx.globalAlpha = a; cx.drawImage(spr[p.c], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    cx.globalAlpha = 1;
    for (i = B.length - 1; i >= 0; i--) {
      p = B[i]; p.vy += .07 * k; p.vx *= .985; p.x += p.vx * k; p.y += p.vy * k; p.l += k;
      if (p.l >= p.m) { B.splice(i, 1); continue; }
      cx.fillStyle = "rgba(" + p.c + "," + (1 - p.l / p.m).toFixed(2) + ")";
      if (p.ch) { cx.font = (p.r * 4 + 6) + "px sans-serif"; cx.textAlign = "center"; cx.fillText(p.ch, p.x, p.y); }
      else { cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill(); }
    }
  }
  function start() { if (!run && !document.hidden) { run = true; last = 0; requestAnimationFrame(frame); } }
  function burst(x, y, o) {
    o = o || {}; var n = o.n || 14, cols = o.c || pal(), s = o.s || 2.2, i, a, v;
    for (i = 0; i < n; i++) {
      a = Math.random() * 6.283; v = s * (.4 + Math.random() * .8);
      B.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 1), l: 0, m: 38 + Math.random() * 26, r: 1.6 + Math.random() * 2.6, c: cols[i % cols.length], ch: o.ch || "" });
    }
    start();
  }
  function at(el, o) { if (!el || !el.getBoundingClientRect) return; var r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, o); }

  sprites(); size(); for (var i = 0; i < N; i++) P.push(spawn(true));
  window.FX = { burst: burst, at: at };
  var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(size, 150); });
  addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  addEventListener("pointerup", function () { mx = my = -999; }, { passive: true });
  document.addEventListener("pointerleave", function () { mx = my = -999; });
  document.addEventListener("visibilitychange", start);
  if (window.MutationObserver) new MutationObserver(sprites).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  start();
})();
