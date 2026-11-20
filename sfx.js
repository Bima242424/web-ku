/* sfx.js: efek suara kecil yang dibuat langsung di browser (WebAudio), tanpa file audio.
   Volume sengaja rendah + filter lembut, dan bisa dimatikan (tersimpan di perangkat). */
(function () {
  "use strict";
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, out = null, on = true, lastT = 0;
  try { on = localStorage.getItem("snd") !== "0"; } catch (e) {}
  function init() {
    if (!AC) return null;
    if (!ctx) {
      try {
        ctx = new AC(); var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2600;
        var g = ctx.createGain(); g.gain.value = .55; f.connect(g); g.connect(ctx.destination); out = f;
      } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(f, t, d, type, v, f2) {
    var o = ctx.createOscillator(), g = ctx.createGain(), t0 = ctx.currentTime + t;
    o.type = type || "sine"; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + d + .03);
  }
  var S = {
    tap: function () { tone(520, 0, .05, "sine", .05, 380); },
    pop: function () { tone(440, 0, .09, "sine", .08, 880); },
    off: function () { tone(440, 0, .09, "sine", .06, 260); },
    chime: function () { tone(784, 0, .18, "sine", .07); tone(1175, .09, .22, "sine", .06); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * .08, .2, "triangle", .06); }); },
    send: function () { tone(600, 0, .06, "sine", .06, 820); },
    recv: function () { tone(740, 0, .07, "sine", .05, 540); tone(880, .07, .09, "sine", .045); },
    err: function () { tone(220, 0, .14, "triangle", .06, 150); },
    star: function (n) { var f = 440 + (n || 1) * 90; tone(f, 0, .14, "sine", .07, f * 1.5); }
  };
  window.SFX = {
    play: function (n, a) {
      if (!on || document.hidden || !S[n] || !init()) return;
      if (n !== "tap") lastT = Date.now();
      S[n](a);
    },
    isOn: function () { return on; },
    toggle: function () { on = !on; try { localStorage.setItem("snd", on ? "1" : "0"); } catch (e) {} return on; }
  };
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest(".btn,.chip,.q,.ib,.fl a,.fl button");
    if (!t || t.disabled || t.hasAttribute("data-ns") || Date.now() - lastT < 150) return;
    lastT = Date.now(); window.SFX.play("tap");
  });
})();
