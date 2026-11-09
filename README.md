# SIRKULIT

SIRKULIT adalah aplikasi React/Vite untuk menghubungkan penghasil limbah kulit buah dengan mitra pengolah. Beranda existing tetap dipertahankan; penambahan ini menyediakan pendaftaran limbah dan formulir kontak yang terhubung ke API Node.js dan SQLite.

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

## API dan akses data administrator

- `POST /api/waste-registrations` menyimpan pendaftaran tanpa memerlukan akun. Status awal `pending_review` (Menunggu Peninjauan); kode registrasi dikembalikan hanya setelah penyimpanan berhasil.
- `POST /api/contact-messages` menyimpan pesan untuk ditinjau pengelola.
- `GET /api/admin/submissions?type=registrations` menampilkan pendaftaran.
- `GET /api/admin/submissions?type=messages` menampilkan pesan kontak.
- Endpoint admin menerima `Authorization: Bearer <ADMIN_API_KEY>`, mendukung `limit` (maksimal 100) dan paginasi `beforeId`. Data pribadi tidak disertakan dalam respons publik.
- Jika `ADMIN_API_KEY` kosong, endpoint admin menolak akses dengan status 503. Jangan menaruh kunci admin di frontend atau repository.

API menggunakan validasi server, batas ukuran request, rate limit per alamat, dan respons JSON tanpa cache. Untuk deployment, gunakan HTTPS, simpan secret pada konfigurasi server, arahkan `/api` melalui reverse proxy ke API, sediakan fallback SPA ke `index.html` untuk rute `/daftar-limbah`, dan pastikan disk database persisten serta hanya dapat diakses akun server. Integrasi ini menggunakan kunci API admin karena project belum memiliki autentikasi; hubungkan endpoint ke autentikasi dan otorisasi berbasis role saat dashboard admin tersedia.

Kontak resmi belum disediakan. Isi objek `contactInfo` di `src/ContactSection.jsx` hanya dengan nomor WhatsApp, email, alamat, tautan peta, atau akun media sosial resmi yang telah diverifikasi.

## Peta mitra

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
