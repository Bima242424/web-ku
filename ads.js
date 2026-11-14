/* Iklan Google AdSense — tambahan, tidak mengubah kode lain.
   Isi 3 nilai di bawah. Selama CLIENT masih kosong, tidak ada iklan yang dimuat dan tampilan tidak berubah. */
const CLIENT = "ca-pub-3637362406938354";
const SLOT_HOME = "7118909166";
const SLOT_DETAIL = "7118909166";  // sementara pakai unit yang sama; boleh diganti unit kedua

if (/^ca-pub-\d+$/.test(CLIENT)) {
  const s = document.createElement("script");
  s.async = true; s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + CLIENT;
  document.head.append(s);

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
  }), { rootMargin: "200px" });

  const make = slot => {
    const box = document.createElement("div"); box.className = "adbox";
    const lb = document.createElement("small"); lb.textContent = "Iklan";
    const ins = document.createElement("ins"); ins.className = "adsbygoogle";
    ins.style.display = "block"; ins.dataset.adClient = CLIENT; ins.dataset.adSlot = slot;
    ins.dataset.adFormat = "auto"; ins.dataset.fullWidthResponsive = "true";
    box.append(lb, ins); io.observe(ins); return box;
  };

  // 1) Beranda: di antara "Paling Sering Dibuka" dan "Katalog Lengkap"
  if (/^\d+$/.test(SLOT_HOME)) {
    const t = setInterval(() => {
      const ph = document.getElementById("ph");
      if (ph) { clearInterval(t); ph.before(make(SLOT_HOME)); }
    }, 300);
  }
  // 2) Detail: di bawah kotak detail, jauh dari tombol unduh
  if (/^\d+$/.test(SLOT_DETAIL)) {
    const d = document.getElementById("detail");
    if (d) new MutationObserver(() => {
      const box = d.querySelector(".dbox");
      if (box && !d.querySelector(".adbox")) box.after(make(SLOT_DETAIL));
    }).observe(d, { childList: true });
  }
}
