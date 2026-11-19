// Vercel Serverless Function: verifikasi key VIP + pengelolaan member (khusus admin).
// Butuh env FIREBASE_SERVICE_ACCOUNT (isi JSON service account Firebase). Tidak pernah dikirim ke browser.
const admin = require("firebase-admin");
const crypto = require("crypto");
let ready = false;
const init = () => { if (!ready) { admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) }); ready = true; } };
const E = (m, s = 400) => Object.assign(new Error(m), { status: s });
const fails = new Map(); // batas percobaan key salah: 5 per 10 menit per akun
const AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rnd = n => Array.from({ length: n }, () => AL[crypto.randomInt(AL.length)]).join("");
const newKey = () => `VIP-${rnd(4)}-${rnd(4)}-${rnd(4)}`;
const norm = s => { const c = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^VIP/, ""); return c.length === 12 ? `VIP-${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}` : null; };

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak didukung." });
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return res.status(503).json({ error: "Server VIP belum dikonfigurasi (FIREBASE_SERVICE_ACCOUNT)." });
  try {
    init();
    const db = admin.firestore(), FV = admin.firestore.FieldValue, TS = admin.firestore.Timestamp;
    let b = req.body; if (typeof b === "string") b = JSON.parse(b); b = b || {};
    let u; try { u = await admin.auth().verifyIdToken((req.headers.authorization || "").replace(/^Bearer /, "")); } catch (e) { throw E("Sesi tidak valid. Masuk lagi.", 401); }
    const isAdmin = async () => (await db.doc("admins/" + u.uid).get()).exists;
    const mustAdmin = async () => { if (!(await isAdmin())) throw E("Khusus admin.", 403); };
    const days = Math.min(3650, Math.max(1, parseInt(b.days) || 30));
    const grant = async (uid, d, info) => {
      const ref = db.doc("vips/" + uid); let until;
      await db.runTransaction(async tx => {
        const s = await tx.get(ref), cur = s.exists && s.data().until ? s.data().until.toMillis() : 0;
        until = TS.fromMillis(Math.max(Date.now(), cur) + d * 864e5);
        tx.set(ref, { until, ...info }, { merge: true });
      });
      return until.toMillis();
    };

    switch (b.action) {
      case "redeem": {
        const now = Date.now(), recent = (fails.get(u.uid) || []).filter(t => now - t < 6e5);
        if (recent.length >= 5) throw E("Terlalu banyak percobaan. Coba lagi 10 menit lagi.", 429);
        let until;
        try {
          const key = norm(b.key); if (!key) throw E("Format key tidak valid.");
          await db.runTransaction(async tx => {
            const kr = db.doc("vipKeys/" + key), vr = db.doc("vips/" + u.uid);
            const ks = await tx.get(kr), vs = await tx.get(vr);
            if (!ks.exists) throw E("Key tidak ditemukan.");
            const k = ks.data(); if (k.usedBy) throw E("Key ini sudah dipakai.");
            const cur = vs.exists && vs.data().until ? vs.data().until.toMillis() : 0;
            until = TS.fromMillis(Math.max(Date.now(), cur) + (k.days || 30) * 864e5);
            tx.update(kr, { usedBy: u.uid, usedEmail: u.email || "", usedAt: FV.serverTimestamp() });
            tx.set(vr, { until, email: u.email || "", name: u.name || "", lastKey: key }, { merge: true });
          });
        } catch (e) { recent.push(now); fails.set(u.uid, recent); throw e; }
        return res.status(200).json({ ok: true, until: until.toMillis() });
      }
      case "genkey": {
        await mustAdmin();
        const n = Math.min(50, Math.max(1, parseInt(b.count) || 1)), keys = [], batch = db.batch();
        for (let i = 0; i < n; i++) { const k = newKey(); keys.push(k); batch.set(db.doc("vipKeys/" + k), { days, note: String(b.note || "").slice(0, 80), usedBy: null, createdAt: FV.serverTimestamp() }); }
        await batch.commit();
        return res.status(200).json({ keys });
      }
      case "add": {
        await mustAdmin();
        let uid = b.uid, info = {};
        if (!uid) {
          const r = await admin.auth().getUserByEmail(String(b.email || "").trim()).catch(() => null);
          if (!r) throw E("Email itu belum pernah login. Minta user login ke web dulu, lalu coba lagi.");
          uid = r.uid; info = { email: r.email || "", name: r.displayName || "" };
        }
        return res.status(200).json({ ok: true, until: await grant(uid, days, info) });
      }
      case "revoke": await mustAdmin(); await db.doc("vips/" + String(b.uid)).delete(); return res.status(200).json({ ok: true });
      case "delkey": {
        await mustAdmin(); const kr = db.doc("vipKeys/" + String(b.key)), s = await kr.get();
        if (s.exists && !s.data().usedBy) await kr.delete();
        return res.status(200).json({ ok: true });
      }
      default: throw E("Aksi tidak dikenal.");
    }
  } catch (e) {
    if (!e.status) console.error("vip api", e);
    return res.status(e.status || 500).json({ error: e.status ? e.message : "Terjadi kesalahan server." });
  }
};
