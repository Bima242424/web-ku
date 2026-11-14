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
