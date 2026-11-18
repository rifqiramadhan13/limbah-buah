# SIRKULIT

SIRKULIT adalah aplikasi React/Vite untuk menghubungkan pemasok limbah organik, mitra pengolah, dan pengguna hasil olahan. Beranda existing tetap dipertahankan; pendaftaran, direktori, peta ekosistem Malang, dan formulir kontak terhubung ke API Node.js. Pengembangan lokal memakai SQLite; deployment Netlify dapat memakai Supabase Postgres.

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

   Frontend Vite meneruskan permintaan `/api` ke API lokal pada port 3001. Tanpa `DATABASE_URL`, API memakai SQLite dan menyimpan data lokal di `data/sirkulit.sqlite`; direktori tersebut tidak dilacak Git. Untuk pengujian dengan Postgres, atur `DATABASE_URL` hanya di environment server.

4. Jalankan pemeriksaan:

   ```sh
   npm test
   npm run lint
   npm run build
   ```

## Deploy Netlify + Supabase Postgres

Repository menyediakan `netlify.toml` untuk membangun frontend Vite, meneruskan `/api/*` ke Netlify Function, dan mengarahkan rute SPA ke `index.html`. Function menggunakan Postgres; tidak ada fallback ke SQLite pada runtime Netlify. Migrasi skema berversi dijalankan secara idempoten saat function pertama kali menginisialisasi database.

Konfigurasi yang perlu dilakukan sendiri sebelum deploy:

1. Pada konfigurasi environment Netlify, isi `DATABASE_URL` menggunakan connection string Postgres Supabase yang sesuai untuk serverless (disarankan pooler transaksi). Aktifkan koneksi TLS sesuai connection string Supabase. Nilai ini dipakai server saja—jangan awali dengan `VITE_`, jangan masukkan ke kode, dan jangan kirimkan ke chat.
2. Atur `ADMIN_API_KEY` sebagai secret server-side acak yang kuat (minimal 32 byte). Admin API tetap nonaktif jika secret tidak disediakan.
3. Opsional: atur `GOOGLE_GEOCODING_API_KEY` server-side untuk geocoding. Tidak diperlukan untuk build atau penggunaan peta berbasis OSM.
4. Deploy repository ke Netlify setelah environment variable tersedia. Netlify site dan environment belum dibuat atau diubah oleh perubahan ini.

Skema Postgres membuat tabel yang digunakan API saat ini dan menyimpan hasil migrasi pada `sirkulit_schema_migrations`. Tabel memiliki Row Level Security dan tidak memberikan akses kepada role API anon Supabase; akses aplikasi dilakukan melalui koneksi server. Migrasi ini **tidak menyalin rekaman yang sudah ada dari SQLite/Render**. Jika ada data produksi yang perlu dipertahankan, rencanakan ekspor/impor dan verifikasi terpisah sebelum memindahkan trafik; jangan menganggap database baru berisi data lama.

## Deployment lama ke Render (SQLite)

`render.yaml` tetap tersedia sebagai konfigurasi deployment lama yang memakai disk persisten untuk SQLite. Ini terpisah dari konfigurasi Netlify + Supabase di atas. Tinjau biaya layanan Render sebelum menggunakannya.

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

API menggunakan validasi server, batas ukuran request, rate limit per alamat, dan respons JSON tanpa cache. Netlify menangani routing API dan fallback SPA; deployment lain harus menyediakan HTTPS, menyimpan secret pada konfigurasi server, dan memastikan database hanya dapat diakses aplikasi. Integrasi ini menggunakan kunci API admin karena project belum memiliki autentikasi; hubungkan endpoint ke autentikasi dan otorisasi berbasis role saat dashboard admin tersedia.

Kontak resmi belum disediakan. Isi objek `contactInfo` di `src/ContactSection.jsx` hanya dengan nomor WhatsApp, email, alamat, tautan peta, atau akun media sosial resmi yang telah diverifikasi.

## Ruang belajar

- Halaman topik tersedia di `/edukasi`; setiap materi terbuka di rute khusus `/edukasi/:topicId` dan dapat dibagikan atau dimuat ulang secara langsung.
- ID topik saat ini: `chemistry`, `processing`, dan `sustainable`.

## Peta ekosistem Malang

- Halaman peta tersedia di `/peta-ekosistem`; direktori menghubungkan profil yang memiliki titik lokasi ke peta.
- `GET /api/ecosystem/map` menyediakan marker yang telah diverifikasi dan disetujui untuk publikasi, ringkasan statistik dari database, serta opsi filter.
- `POST /api/ecosystem/geocode` menggunakan Google Geocoding API dan cache alamat. Hanya hasil presisi `ROOFTOP` yang ditandai terverifikasi Google; hasil yang kurang presisi tidak menjadi marker.
- Formulir meminta persetujuan publikasi peta secara terpisah. Pendaftar dapat memilih titik secara manual; semua profil tetap menunggu tinjauan pengelola sebelum ditampilkan.
- Lima mitra awal tersimpan idempotent pada tabel `ecosystem_seed_locations`. Koordinatnya sengaja kosong dan lokasi tidak tampil sampai koordinat diverifikasi; admin dapat mengelolanya melalui `GET /api/admin/ecosystem-seeds` dan `PATCH /api/admin/ecosystem-seeds/:id`.
- Peta memakai Leaflet/OpenStreetMap yang sudah digunakan project. Geocoding memakai Google server-side; tanpa key, alamat dapat diverifikasi dengan memilih titik secara manual.

Untuk mengaktifkan Google Geocoding, isi `.env` lokal dengan:

```env
GOOGLE_GEOCODING_API_KEY=server-side-key
VITE_GOOGLE_MAPS_API_KEY=browser-key
```

Batasi key server ke Google Geocoding API dan penggunaan server sesuai aturan Google Cloud. Batasi key browser dengan HTTP referrer untuk domain website dan hanya izinkan Google Maps JavaScript API. Key `VITE_` tersedia pada bundle browser; jangan gunakan key server atau `ADMIN_API_KEY` di sana. Tanpa key browser, peta beralih ke Leaflet/OpenStreetMap yang sudah digunakan project.

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
