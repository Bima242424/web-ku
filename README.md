# b-tools — katalog aplikasi gratis

Stack 100% gratis: HTML statis (Vercel Hobby) + Firebase Auth & Firestore (paket Spark).

## 1. Siapkan Firebase
1. console.firebase.google.com → Add project (Analytics boleh dimatikan).
2. Build → Authentication → Get started → aktifkan **Google** dan **Email/Password**.
3. Build → Firestore Database → Create (mode production) → tab **Rules** → tempel isi `firestore.rules` → Publish.
4. Project settings → Your apps → ikon Web `</>` → salin config ke `firebase.js`.

## 2. Buat akun admin
1. Authentication → Users → **Add user** (email + sandi kuat).
2. Salin **User UID** akun itu.
3. Firestore → Start collection `admins` → Document ID = UID tadi → isi 1 field bebas (mis. `role: "admin"`).

## 3. Deploy ke Vercel
1. Upload folder ini ke repo GitHub → vercel.com → Add New Project → Import → Deploy (tanpa konfigurasi).
2. Salin domain Vercel Anda (mis. `b-tools.vercel.app`).
3. Firebase → Authentication → Settings → **Authorized domains** → tambahkan domain itu.

## Halaman
- `/` login Google lalu katalog (wajib login)
- `/admin` login email + sandi, tambah/edit/hapus aplikasi. Klik "Isi data contoh" sekali untuk mengisi 6 aplikasi awal.

## Fitur
- Pengumuman popup (admin atur judul, gambar, teks, tombol). User bisa centang "Sembunyikan 5 jam"; tombol lonceng membuka ulang.
- Favorit tersimpan per akun, produk terlaris otomatis dari jumlah klik, mode gelap, tombol pasang (PWA), tombol WhatsApp bantuan.
- Setelah deploy, publish ulang `firestore.rules` karena ada koleksi `settings` dan `users`.

## Update: detail aplikasi, notifikasi, rating, laporan
- Klik aplikasi membuka halaman detail (download, deskripsi, kompatibilitas, key, rating, lapor link mati).
- Lonceng menampilkan daftar aplikasi baru beserta waktunya.
- Semua data (aplikasi, rating, laporan) disimpan di Firestore, bukan di perangkat, jadi sama untuk semua user.
- File APK: unggah ke Google Drive / Mediafire / GitHub Releases, lalu tempel linknya di admin.
- Publish ulang `firestore.rules` (ada aturan baru untuk rating dan laporan).

## Halaman Tanya AI (`/ai`)
Asisten AI yang menjelaskan web ini dan menjawab pertanyaan cara pakainya. Berjalan lewat Vercel Serverless Function (`api/chat.js`), jadi API key aman di server dan tidak terlihat di browser. Hanya user yang sudah login yang bisa memakainya.

Vercel > Project > Settings > Environment Variables, tambahkan (lalu Redeploy):
- `GEMINI_API_KEY` : gratis, buat di aistudio.google.com/apikey
- `ANTHROPIC_API_KEY` : opsional, untuk Claude (API berbayar)
- `OPENAI_API_KEY` : opsional, untuk ChatGPT (API berbayar)
- Opsional ganti model: `GEMINI_MODEL`, `CLAUDE_MODEL`, `OPENAI_MODEL`

Model tanpa key tampil "belum" dan tidak bisa dipilih. Admin bisa menambah penjelasan khusus lewat `/admin` bagian "Info untuk Asisten AI". AI juga otomatis tahu daftar aplikasi di katalog (key dan link tidak dikirim ke AI).

## Update: unlock unduhan, VIP, 2 domain, animasi
**Unlock per aplikasi (admin > Kelola Aplikasi > "Cara membuka unduhan"):** Langsung / Iklan AdSense (hitung mundur + iklan) / Link iklan lain (user buka link sponsor dulu, lalu hitung mundur). Member VIP otomatis melewati semua unlock.

**VIP:** aplikasi dengan centang "Khusus VIP" menyimpan link & key di koleksi `vipLinks` yang hanya bisa dibaca member VIP aktif (dijaga aturan Firestore). Admin membuat key / menambah member di bagian "Member VIP". User mengaktifkan di `vip.html` (web verifikasi).

**Setup sekali:**
1. Firebase > Project settings > Service accounts > Generate new private key. Salin seluruh isi JSON ke Vercel > Environment Variables > `FIREBASE_SERVICE_ACCOUNT`, lalu Redeploy.
2. Publish ulang `firestore.rules` di Firebase.
3. Vercel > Settings > Domains: tambahkan domain utama dan domain baru (VIP) ke project yang sama.
4. Firebase > Authentication > Settings > Authorized domains: tambahkan kedua domain.
5. `vercel.json`: ganti `vip.DOMAIN-ANDA.com` dengan domain VIP Anda (tanpa https://).
6. `config.js`: isi `MAIN_URL` dan `VIP_URL` dengan alamat lengkap kedua domain.

## Update: partikel & animasi aksi
`fx.js` menambah partikel latar halus (glow merah/oranye yang melayang pelan), efek ripple saat tombol disentuh, dan letupan kecil saat aksi (favorit, rating, salin key, unduhan terbuka, VIP berhasil). Otomatis mati jika perangkat memilih "kurangi gerak" atau mode hemat data.

## Update: suara & maskot Bobi
- `sfx.js`: efek suara kecil buatan browser (tanpa file audio), volume rendah, bisa dimatikan lewat menu (☰ > Suara) atau tombol Suara di halaman AI.
- Halaman `/ai`: maskot robot "Bobi" yang berekspresi (berpikir, bicara, senang, bingung) sesuai aktivitas chat. Jawaban AI muncul seperti diketik sambil mulut Bobi bergerak.

## Logo
Logo web memakai `logo.webp` (di dalam halaman), `favicon.png`, `apple-touch-icon.png`, serta `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (ikon saat web dipasang ke layar utama, diatur di `manifest.webmanifest`).
