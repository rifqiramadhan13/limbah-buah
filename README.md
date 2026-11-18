# SIRKULIT

SIRKULIT adalah aplikasi React/Vite untuk menghubungkan pemasok limbah organik, mitra pengolah, dan pengguna hasil olahan. Beranda existing tetap dipertahankan; pendaftaran, direktori, peta ekosistem Malang, dan formulir kontak terhubung ke API Node.js dan SQLite.

Bagian pendaftaran menyediakan kalkulator simulasi volume limbah mingguan, bulanan, dan tahunan berdasarkan rata-rata jumlah harian serta hari operasional. Hasilnya merupakan perkiraan, bukan data aktual atau jaminan penjemputan.

## Menjalankan aplikasi lokal

Persyaratan: Node.js 22.13 atau lebih baru.

1. Salin `.env.example` menjadi `.env`.
2. Atur `ADMIN_API_KEY` dengan secret acak yang kuat. Contoh untuk menghasilkan secret:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Jalankan API dan frontend di dua terminal:

   ```sh
   npm run dev:api
   npm run dev
   ```

   Frontend Vite meneruskan permintaan `/api` ke API lokal pada port 3001. File SQLite dan data pribadi disimpan di `data/sirkulit.sqlite`; direktori tersebut tidak dilacak Git.

4. Jalankan pemeriksaan:

   ```sh
   npm test
   npm run lint
   npm run build
   ```

## Deploy publik ke Render

Repository ini menyediakan Blueprint Render di `render.yaml`. Di Render, buat **New > Blueprint Instance**, hubungkan repository ini, lalu pilih Blueprint tersebut. Blueprint membangun frontend dan menjalankan API pada satu layanan, menggunakan disk persisten 1 GB untuk SQLite, serta membuat `ADMIN_API_KEY` secara otomatis. Layanan memakai paket berbayar karena database memerlukan disk persisten; tinjau harga Render sebelum konfirmasi.

Setelah deploy selesai, URL `onrender.com` dapat dibagikan. Formulir publik dapat menyimpan data pribadi ke database; pastikan pemberitahuan privasi dan persetujuan yang diperlukan tersedia sebelum membagikan URL. Jangan mengubah `ADMIN_API_KEY` menjadi variabel `VITE_` atau menaruhnya di browser.

## API dan akses data administrator

- `POST /api/waste-registrations` menyimpan pendaftaran tanpa memerlukan akun. Status awal `pending_review` (Menunggu Peninjauan); kode registrasi dikembalikan hanya setelah penyimpanan berhasil.
- `POST /api/ecosystem/registrations` menyimpan pendaftaran pemasok (`supplier`), mitra pengolah (`processor`), dan pengguna hasil olahan (`buyer`) pada tabel tambahan, tanpa menghapus data lama.
- `GET /api/ecosystem/directory` menampilkan profil yang telah diverifikasi dan disetujui untuk publikasi. Filter tersedia lewat `q`, `region`, dan `role`.
- `GET /api/admin/submissions?type=ecosystem` menampilkan pendaftaran ekosistem. `PATCH /api/admin/ecosystem-registrations/:id` memperbarui status tinjauan.
- `POST /api/contact-messages` menyimpan pesan untuk ditinjau pengelola.
- `GET /api/admin/submissions?type=registrations` menampilkan pendaftaran.
- `GET /api/admin/submissions?type=messages` menampilkan pesan kontak.
- Endpoint admin menerima `Authorization: Bearer <ADMIN_API_KEY>`, mendukung `limit` (maksimal 100) dan paginasi `beforeId`. Data pribadi tidak disertakan dalam respons publik.
- Jika `ADMIN_API_KEY` kosong, endpoint admin menolak akses dengan status 503. Jangan menaruh kunci admin di frontend atau repository.

API menggunakan validasi server, batas ukuran request, rate limit per alamat, dan respons JSON tanpa cache. Untuk deployment, gunakan HTTPS, simpan secret pada konfigurasi server, arahkan `/api` melalui reverse proxy ke API, sediakan fallback SPA ke `index.html` untuk rute `/daftar-limbah`, `/peta-ekosistem`, dan `/edukasi`, dan pastikan disk database persisten serta hanya dapat diakses akun server. Integrasi ini menggunakan kunci API admin karena project belum memiliki autentikasi; hubungkan endpoint ke autentikasi dan otorisasi berbasis role saat dashboard admin tersedia.

Kontak resmi belum disediakan. Isi objek `contactInfo` di `src/ContactSection.jsx` hanya dengan nomor WhatsApp, email, alamat, tautan peta, atau akun media sosial resmi yang telah diverifikasi.

## Ruang belajar

- Halaman topik tersedia di `/edukasi`; setiap materi terbuka di rute khusus `/edukasi/:topicId` dan dapat dibagikan atau dimuat ulang secara langsung.
- ID topik saat ini: `chemistry`, `processing`, dan `sustainable`.

## Peta ekosistem Malang

- Halaman peta tersedia di `/peta-ekosistem`; direktori menghubungkan profil yang memiliki titik lokasi ke peta.
- `GET /api/ecosystem/map` menyediakan marker yang telah diverifikasi dan disetujui untuk publikasi, ringkasan statistik dari database, serta opsi filter.
- `POST /api/ecosystem/geocode` menggunakan Google Geocoding API dan cache alamat. Hanya hasil presisi `ROOFTOP` yang ditandai terverifikasi Google; hasil yang kurang presisi tidak menjadi marker.
- Formulir meminta persetujuan publikasi peta secara terpisah. Pendaftar dapat memilih titik secara manual; semua profil tetap menunggu tinjauan pengelola sebelum ditampilkan.
- Lima mitra awal memiliki koordinat dan status publikasi pada data referensi proyek. Backend lokal menyimpannya secara idempotent pada tabel `ecosystem_seed_locations`.
- Peta memakai Leaflet/OpenStreetMap yang sudah digunakan project. Geocoding memakai Google server-side; tanpa key, alamat dapat diverifikasi dengan memilih titik secara manual.

Untuk mengaktifkan Google Geocoding, isi `.env` lokal dengan:

```env
GOOGLE_GEOCODING_API_KEY=server-side-key
```

Batasi key server ke Google Geocoding API dan penggunaan server sesuai aturan Google Cloud. Peta di browser menggunakan Leaflet/OpenStreetMap tanpa kunci API. Tautan Google Maps tetap tersedia untuk petunjuk arah. Jangan masukkan key server atau `ADMIN_API_KEY` ke bundle browser.

## Peta mitra lama

- `GET /api/partners` mengembalikan hanya mitra berstatus `verified`, lokasi berstatus publik, dan koordinat yang tersedia. Filter database: `q` (nama), `region`, dan `fruitType`.
- `GET /api/admin/partners` menampilkan seluruh data mitra untuk integrasi pengelolaan admin.
- `POST /api/admin/partners` membuat atau memperbarui mitra. Kirim `id` untuk memperbarui data yang sudah ada; tanpa `id`, server membuat mitra baru. Endpoint admin menggunakan `Authorization: Bearer <ADMIN_API_KEY>`.
- Data admin yang dibutuhkan: `name`, `address`, `region`, `latitude`, `longitude`, `googleMapsUrl`, `acceptedFruitTypes` (array), `capacityKg` (angka atau `null`), `verificationStatus` (`pending`, `verified`, atau `rejected`), dan `isLocationPublic` (boolean).
- Contoh body (ganti dengan data mitra yang benar-benar terdaftar; contoh ini bukan data mitra SIRKULIT):

  ```json
  {
    "name": "Nama mitra",
    "address": "Alamat lengkap mitra",
    "region": "Kabupaten/Kota",
    "latitude": -6.9,
    "longitude": 107.6,
    "googleMapsUrl": "https://www.google.com/maps?q=-6.9,107.6",
    "acceptedFruitTypes": ["Kulit jeruk"],
    "capacityKg": null,
    "verificationStatus": "pending",
    "isLocationPublic": false
  }
  ```

- Peta memakai Leaflet dan ubin OpenStreetMap. Untuk tampil sebagai marker, mitra harus memiliki latitude/longitude yang valid selain status terverifikasi dan persetujuan publikasi. Tautan Google Maps dapat disimpan sebagai alternatif untuk membuka petunjuk arah.
- Repository ini belum memiliki dashboard admin atau autentikasi akun. Karena itu pengelolaan mitra tersedia sebagai API terlindungi yang dapat dipanggil dari dashboard admin setelah autentikasi berbasis role tersedia; jangan menaruh `ADMIN_API_KEY` pada bundle frontend.

## Peta pada Netlify

Netlify Server di `netlify/server/index.mjs` melayani `GET /api/ecosystem/map` dan `GET /api/partners` pada domain situs yang sama. Endpoint ini membaca lima lokasi referensi publik yang telah tersedia di proyek, lengkap dengan koordinat, kontak, tautan petunjuk arah, dan opsi filter. Data jenis kulit buah yang diterima tidak diasumsikan jika belum dicantumkan.

Layanan peta ini hanya menerbitkan data referensi; layanan ini tidak menyimpan pendaftaran baru atau membaca database SQLite backend lokal/Render. Direktori pendaftaran tidak dimuat pada sumber data referensi. Statistik pada Netlify menghitung lokasi referensi publik. Penyimpanan pendaftaran dan integrasi direktori dinamis memerlukan pekerjaan backend terpisah.

Konfigurasi `netlify.toml` memakai Node.js 24 untuk Netlify Server serta rewrite khusus rute halaman React. Permintaan API tidak diarahkan ke `index.html`. Peta dasar OpenStreetMap tidak memerlukan Google API key.
