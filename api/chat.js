// Vercel Serverless Function (gratis di paket Hobby).
// Kunci API HANYA ada di Environment Variables Vercel, tidak pernah dikirim ke browser.
const FB_KEY = process.env.FIREBASE_API_KEY || "AIzaSyCpZVxLUBIpQqcu-9FqQr03s9D-U2pvNbg"; // kunci web Firebase (publik)
const PROJECT = process.env.FIREBASE_PROJECT_ID || "bmzmod";
const P = {
  gemini:  { env: "GEMINI_API_KEY",    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite" },
  claude:  { env: "ANTHROPIC_API_KEY", model: process.env.CLAUDE_MODEL || "claude-haiku-5-5" },
  chatgpt: { env: "OPENAI_API_KEY",    model: process.env.OPENAI_MODEL || "gpt-4o-mini" }
};
const hits = new Map(); // pembatas sederhana per akun (15 pesan / menit)

const BASE = `Kamu adalah asisten resmi website b-tools. Jawab dalam bahasa Indonesia yang santai dan sopan, singkat (maksimal sekitar 6 kalimat), tanpa format markdown dan tanpa tanda bintang.
Tugasmu: menjelaskan b-tools itu apa dan membantu pengunjung yang bingung memakai fitur-fiturnya. Hanya bahas seputar website ini. Kalau pertanyaan di luar itu, tolak dengan ramah dan arahkan kembali ke topik web. Jangan mengarang fitur yang tidak ada, jangan membagikan key, kata sandi, atau data admin. Kalau tidak tahu, sarankan menghubungi admin lewat tombol WhatsApp bantuan.

TENTANG B-TOOLS
b-tools adalah website katalog berisi kumpulan aplikasi dan alat gratis untuk kebutuhan game. Semua yang ada di katalog gratis, tanpa checkout atau pembayaran.

CARA PAKAI
- Masuk: buka halaman utama lalu ketuk "Masuk dengan Google". Katalog hanya terbuka setelah login.
- Cari: ketik di kolom pencarian. Saring dengan tab kategori di atas (Semua, Favorit, atau kategori lain).
- Favorit: ketuk ikon hati pada kartu aplikasi. Daftarnya ada di tab Favorit dan tersimpan di akun Google yang sama.
- Paling Sering Dibuka: daftar aplikasi dengan klik terbanyak.
- Detail aplikasi: ketuk kartu aplikasi. Isinya tombol unduh gratis, deskripsi, kompatibilitas, key (kalau ada), rating bintang, dan tombol lapor link rusak.
- Unduh: di halaman detail, bagian Unduh. Sebagian file langsung bisa diunduh, sebagian perlu hitung mundur (ada iklan) atau membuka link sponsor dulu, lalu tombol "Unduh sekarang" muncul. File diambil lewat link dari admin (misalnya Drive atau Mediafire).
- VIP: aplikasi berlabel VIP hanya bisa diunduh member VIP. Cara jadi VIP: menu (tiga garis) lalu "Jadi VIP", masuk dengan Google yang sama, masukkan key VIP di web verifikasi VIP. Key didapat dari admin (tombol Beli key VIP / WhatsApp). Member VIP tidak melihat iklan dan tidak ada hitung mundur.
- Key: kalau aplikasi punya key, ketuk "Salin key" di halaman detail lalu tempel di aplikasinya.
- Rating: ketuk bintang di halaman detail. Satu akun satu rating, bisa diubah.
- Link rusak: ketuk "Link rusak? Laporkan" di halaman detail. Admin akan memperbaikinya.
- Lonceng: berisi kabar terbaru, yaitu aplikasi yang baru ditambahkan beserta waktunya, dan pengumuman admin.
- Pengumuman popup: bisa disembunyikan 5 jam dengan mencentang "Sembunyikan 5 jam" lalu Tutup. Buka lagi lewat lonceng.
- Minta aplikasi: tombol di beranda untuk mengirim permintaan aplikasi baru lewat WhatsApp.
- Mode gelap: ikon bulan di pojok atas.
- Menu (tiga garis): berisi Tanya AI, Admin, dan Keluar.
- Simpan ke layar utama: kalau muncul banner "Simpan ke layar utama", ketuk Simpan agar web terbuka seperti aplikasi.
- Tanya AI: halaman ini. Pengunjung bisa memilih model Gemini, Claude, atau ChatGPT yang aktif.
- Admin: halaman khusus pengelola (login email dan kata sandi). Pengunjung biasa tidak bisa masuk ke sana.`;

const verify = async t => {
  if (!t) return null;
  try {
    const r = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FB_KEY, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: t })
    });
    if (!r.ok) return null;
    const j = await r.json();
    return (j.users && j.users[0] && j.users[0].localId) || null;
  } catch (e) { return null; }
};

const sv = f => (f && f.stringValue) || "";
async function knowledge(tok) {
  const h = { Authorization: "Bearer " + tok };
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/`;
  let info = "", list = "";
  try {
    const r = await fetch(base + "settings/main?mask.fieldPaths=aiInfo", { headers: h });
    if (r.ok) info = sv(((await r.json()).fields || {}).aiInfo);
  } catch (e) {}
  try { // hanya nama, kategori, kompatibilitas, deskripsi. Key dan link TIDAK dikirim ke AI.
    const r = await fetch(base + "apps?pageSize=100&mask.fieldPaths=name&mask.fieldPaths=category&mask.fieldPaths=compat&mask.fieldPaths=desc", { headers: h });
    if (r.ok) list = ((await r.json()).documents || []).map(d => {
      const f = d.fields || {};
      return "- " + sv(f.name) + " [" + (sv(f.category) || "Umum") + "]" + (sv(f.compat) ? " (" + sv(f.compat) + ")" : "") +
        (sv(f.desc) ? ": " + sv(f.desc).replace(/\s+/g, " ").slice(0, 120) : "");
    }).join("\n");
  } catch (e) {}
  return { info: info.slice(0, 3000), list: list.slice(0, 6000) };
}

async function ask(name, sys, msgs, mdl) {
  const env = P[name].env, model = mdl || P[name].model, key = (process.env[env] || "").trim(), sig = AbortSignal.timeout(25000);
  let r, pick;
  if (name === "gemini") {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", signal: sig, headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] },
        contents: msgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        generationConfig: { maxOutputTokens: 700, temperature: 0.5 } })
    });
    pick = j => ((j.candidates || [])[0]?.content?.parts || []).map(p => p.text || "").join("");
  } else if (name === "claude") {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: sig, headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 700, system: sys, messages: msgs })
    });
    pick = j => (j.content || []).map(c => c.text || "").join("");
  } else {
    r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: sig, headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
      body: JSON.stringify({ model, max_completion_tokens: 700, messages: [{ role: "system", content: sys }, ...msgs] })
    });
    pick = j => (j.choices || [])[0]?.message?.content || "";
  }
  if (!r.ok) { console.error(name, r.status, (await r.text()).slice(0, 300)); const e = new Error("provider"); e.status = r.status; throw e; }
  return pick(await r.json()).trim();
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") return res.status(200).json(Object.fromEntries(Object.entries(P).map(([k, v]) => [k, !!process.env[v.env]])));
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak didukung." });

  const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
  const uid = await verify(tok);
  if (!uid) return res.status(401).json({ error: "Sesi tidak valid. Muat ulang halaman lalu masuk lagi." });

  const now = Date.now(), h = (hits.get(uid) || []).filter(t => now - t < 60000);
  if (h.length >= 15) return res.status(429).json({ error: "Terlalu cepat. Tunggu sebentar lalu coba lagi." });
  h.push(now); hits.set(uid, h);

  let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  if (!P[b.model] || !process.env[P[b.model].env]) return res.status(400).json({ error: "Model ini belum diaktifkan oleh admin." });
  let m = (Array.isArray(b.messages) ? b.messages : []).slice(-11)
    .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string" && x.content.trim())
    .map(x => ({ role: x.role, content: x.content.slice(0, 1500) }));
  while (m.length && m[0].role !== "user") m.shift();
  if (!m.length || m[m.length - 1].role !== "user") return res.status(400).json({ error: "Pesan kosong." });

  try {
    const k = await knowledge(tok);
    const sys = BASE + (k.list ? "\n\nDAFTAR APLIKASI DI KATALOG SAAT INI\n" + k.list : "") +
      (k.info ? "\n\nINFO TAMBAHAN DARI ADMIN\n" + k.info : "");
    const tried = b.model === "gemini" ? [...new Set([P.gemini.model, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"])] : [undefined];
    let reply;
    for (const mdl of tried) { // jika nama model tidak ditemukan (404), coba nama cadangan
      try { reply = await ask(b.model, sys, m, mdl); break; }
      catch (e) { if (e.status !== 404 || mdl === tried[tried.length - 1]) throw e; }
    }
    return res.status(200).json({ reply: reply || "Maaf, aku belum bisa menjawab itu. Coba tanyakan dengan kalimat lain." });
  } catch (e) {
    const s = e.status;
    const msg = s === 429 ? "Kuota model ini sedang penuh atau saldo habis (429). Coba model lain atau tunggu sebentar."
      : (s === 401 || s === 403) ? "Kunci API ditolak (" + s + "). Periksa API key di Vercel."
      : s === 400 ? "Permintaan ditolak (400). Biasanya API key salah salin atau tidak valid. Cek key di Vercel lalu Redeploy."
      : s === 404 ? "Nama model tidak ditemukan (404). Isi GEMINI_MODEL / CLAUDE_MODEL / OPENAI_MODEL dengan nama model yang benar."
      : e.name === "TimeoutError" ? "Model terlalu lama menjawab. Coba lagi."
      : "Gagal menghubungi model AI (kode " + (s || e.name || "?") + "). Coba lagi nanti.";
    return res.status(502).json({ error: msg });
  }
};
