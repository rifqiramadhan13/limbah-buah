SIRKULIT
Sistem Informasi Sirkular Limbah Kulit Buah








lifetips.alibaba.com


Product Requirements Document — AI Agent Development Reference
Identitas	Keterangan
Product Name	SIRKULIT
Product Type	Web-Based Information System
Domain	Waste Management & Circular Economy
Development Status	Planning
Document Version	1.0
Primary Users	Penghasil, Mitra, Administrator


BAB I. PRODUCT OVERVIEW
1.1 Deskripsi Produk
SIRKULIT merupakan platform informasi berbasis website yang dikembangkan untuk menghubungkan penghasil limbah kulit buah dengan mitra pengolah melalui sistem pengelolaan limbah yang terintegrasi. Platform ini berorientasi pada penerapan prinsip ekonomi sirkular dengan mengoptimalkan proses pencatatan, penyaluran, penerimaan, dan pemanfaatan limbah organik agar memiliki nilai guna lebih lanjut.

Pengembangan SIRKULIT dilatarbelakangi oleh permasalahan pengelolaan limbah kulit buah yang belum terorganisasi secara optimal, khususnya pada usaha jus buah yang menghasilkan limbah secara rutin. Salah satu hasil observasi awal menunjukkan bahwa sebuah usaha jus buah dapat menghasilkan sekitar 10 kg kulit buah setiap hari. Kondisi tersebut menunjukkan adanya potensi ketersediaan bahan organik yang dapat dimanfaatkan, tetapi belum didukung oleh sistem penyaluran dan pendataan yang terstruktur.

SIRKULIT hadir sebagai media penghubung antara pihak penghasil limbah, seperti usaha jus buah, pedagang buah, dan usaha pengolahan buah, dengan pihak yang berpotensi memanfaatkan limbah tersebut, seperti pengelola kompos, komunitas pertanian, dan pengolah bahan organik.

Melalui platform ini, pengguna dapat melakukan pencatatan jumlah limbah, mencari mitra yang sesuai, mengajukan dan menerima permintaan pengambilan, menentukan jadwal penyaluran, mengonfirmasi berat limbah yang diterima, serta mendokumentasikan hasil pengolahan.

Sistem juga menyediakan dashboard statistik untuk memantau perjalanan limbah berdasarkan data yang tercatat. Dengan demikian, setiap tahapan pengelolaan dapat didokumentasikan secara lebih transparan dan dapat dipertanggungjawabkan.
1.2 Latar Belakang dan Identifikasi Masalah
Permasalahan yang menjadi dasar pengembangan produk meliputi:
1. Belum optimalnya pemanfaatan limbah kulit buah dari aktivitas usaha.
2. Keterbatasan informasi mengenai mitra yang dapat menerima dan mengolah limbah.
3. Belum adanya sistem pencatatan jumlah limbah yang terintegrasi.
4. Belum terorganisasinya proses permintaan dan penjadwalan pengambilan.
5. Terbatasnya dokumentasi mengenai jumlah limbah yang disalurkan dan benar-benar diolah.
1.3 Product Vision
Membangun ekosistem digital yang menghubungkan penghasil dan pengolah limbah organik melalui sistem informasi yang transparan, terstruktur, dan berkelanjutan untuk mendukung penerapan ekonomi sirkular.
1.4 Product Mission
- Menyediakan platform pencatatan limbah yang mudah digunakan.
- Mempertemukan penghasil limbah dengan mitra pengolah.
- Mengorganisasi proses penyaluran dan penerimaan limbah.
- Menyediakan dokumentasi perjalanan limbah.
- Menghasilkan informasi statistik pengelolaan limbah berdasarkan data aktual.
1.5 Product Objectives
Tujuan	Hasil yang diharapkan
Digitalisasi pendataan	Data limbah tersimpan secara terintegrasi
Konektivitas pengguna	Penghasil dan mitra dapat berinteraksi
Efisiensi penyaluran	Permintaan dan jadwal lebih terorganisasi
Transparansi	Status penyaluran dapat ditelusuri
Dokumentasi	Hasil penerimaan dan pengolahan tercatat
Evaluasi	Statistik dapat digunakan untuk memantau aktivitas

BAB II. TARGET PENGGUNA DAN USER REQUIREMENTS
2.1 User Roles
SIRKULIT memiliki tiga kelompok pengguna utama.

A. Penghasil Limbah (Waste Producer)

Pengguna yang menghasilkan limbah kulit buah dari aktivitas usaha.

Kebutuhan:
- Mengelola profil usaha.
- Mencatat jenis dan berat limbah.
- Mengunggah dokumentasi limbah.
- Menampilkan limbah yang tersedia.
- Melihat direktori mitra.
- Menerima atau menolak permintaan.
- Menentukan jadwal pengambilan.
- Mengonfirmasi proses serah terima.
- Melihat riwayat penyaluran.
B. Mitra Pengolah (Waste Processor)

Pengguna yang menerima dan memanfaatkan limbah kulit buah.

Kebutuhan:
- Mengelola profil mitra.
- Menentukan jenis limbah yang dapat diterima.
- Menentukan kapasitas penerimaan.
- Melihat daftar limbah tersedia.
- Mengajukan permintaan pengambilan.
- Mengatur jadwal.
- Mengonfirmasi berat penerimaan.
- Memperbarui status pengolahan.
- Mendokumentasikan hasil pengolahan.
C. Administrator

Pengguna yang bertanggung jawab atas pengelolaan dan pengawasan sistem.

Kebutuhan:
- Mengelola akun pengguna.
- Memverifikasi mitra.
- Memantau data limbah.
- Mengelola transaksi.
- Memantau aktivitas penyaluran.
- Mengakses laporan statistik.
- Mengelola informasi edukasi.
- Melihat catatan aktivitas sistem.
2.2 User Journey
Alur pengalaman pengguna utama:
Penghasil limbah
1. Registrasi dan melengkapi profil usaha.
2. Mencatat jumlah limbah yang dihasilkan.
3. Menawarkan limbah kepada mitra.
4. Menerima permintaan pengambilan.
5. Menyetujui permintaan dan menentukan jadwal.
6. Mengonfirmasi proses serah terima.
7. Melihat riwayat penyaluran.

Mitra pengolah
1. Registrasi dan melengkapi profil mitra.
2. Menunggu verifikasi administrator.
3. Mengatur kategori dan kapasitas penerimaan.
4. Mencari limbah yang tersedia.
5. Mengajukan permintaan pengambilan.
6. Menerima dan mengonfirmasi berat aktual.
7. Mencatat proses dan hasil pengolahan.

BAB III. PRODUCT SCOPE
3.1 Fitur Utama
No.	Modul	Fungsi
1	Landing Page	Informasi dan pengenalan platform
2	Authentication	Registrasi dan login
3	Role Management	Pengaturan hak akses
4	Producer Dashboard	Pengelolaan aktivitas penghasil
5	Partner Dashboard	Pengelolaan aktivitas mitra
6	Waste Management	Pencatatan limbah
7	Partner Directory	Pencarian mitra
8	Pickup Request	Permintaan pengambilan
9	Scheduling	Penjadwalan pengambilan
10	Waste Tracking	Pelacakan penyaluran
11	Processing Records	Dokumentasi pengolahan
12	History	Riwayat aktivitas
13	Statistics	Statistik dan visualisasi
14	Admin Dashboard	Pengelolaan sistem
15	Information Center	Informasi edukasi

3.2 Prioritas Pengembangan
Must Have
MVP

- Authentication dan role management.
- Dashboard tiga jenis pengguna.
- Pencatatan data limbah.
- Direktori mitra.
- Permintaan pengambilan.
- Persetujuan permintaan.
- Penjadwalan.
- Konfirmasi penerimaan.
- Riwayat transaksi.


Should Have
Tahap berikutnya

- Dashboard statistik.
- Dokumentasi hasil pengolahan.
- Verifikasi mitra.
- Notifikasi aktivitas.
- Ekspor laporan.


Could Have
Pengembangan lanjutan

- Peta lokasi mitra.
- Rekomendasi mitra.
- Analisis tren produksi.
- Kalkulator potensi pemanfaatan.


3.3 Batasan Produk
Fitur yang tidak termasuk dalam MVP:
- Pembayaran digital.
- Pengiriman otomatis menggunakan jasa kurir terintegrasi.
- Penimbangan otomatis berbasis IoT.
- Marketplace hasil pengolahan.
- Penghitungan emisi karbon otomatis.
- Aplikasi native Android dan iOS.
BAB IV. FUNCTIONAL REQUIREMENTS
4.1 Authentication dan Role Management
Sistem harus menyediakan proses registrasi, login, logout, dan pengelolaan hak akses.

Ketentuan:
- Pengguna memilih jenis akun saat registrasi.
- Email harus unik.
- Password harus disimpan dalam bentuk hash.
- Sistem mengarahkan pengguna ke dashboard berdasarkan role.
- Pengguna tidak dapat mengakses halaman milik role lain tanpa otorisasi.
- Administrator mempunyai akses khusus sesuai kewenangannya.
4.2 Waste Management
Fitur ini menjadi salah satu modul inti SIRKULIT.

Data yang harus dicatat:
Field	Keterangan
Waste ID	Identitas data limbah
Waste Category	Jenis kulit buah
Weight	Berat limbah dalam kg
Production Date	Tanggal limbah dihasilkan
Waste Condition	Kondisi limbah
Availability	Ketersediaan limbah
Description	Keterangan tambahan
Documentation	Foto limbah

Jenis limbah awal yang dapat dimasukkan:
- Kulit jeruk.
- Kulit pisang.
- Kulit nanas.
- Kulit mangga.
- Kulit apel.
- Campuran kulit buah.
Sistem harus memungkinkan administrator menambahkan kategori baru.
4.3 Partner Directory
Direktori mitra harus menampilkan:
- Nama mitra.
- Kategori pengolahan.
- Lokasi.
- Jenis limbah yang diterima.
- Kapasitas penerimaan.
- Deskripsi aktivitas.
- Status verifikasi.
- Informasi kontak yang sesuai.
Pengguna dapat mencari mitra berdasarkan kategori limbah, lokasi, dan kapasitas.
4.4 Pickup Request
Mitra dapat mengajukan permintaan pengambilan dengan informasi:
- Identitas limbah.
- Jumlah yang diminta.
- Penghasil limbah.
- Tanggal permintaan.
- Catatan tambahan.
Penghasil kemudian dapat menyetujui atau menolak permintaan tersebut.

Sistem harus mencegah jumlah permintaan melebihi jumlah limbah yang masih tersedia.
4.5 Scheduling dan Waste Transfer
Setelah permintaan disetujui, kedua pihak menentukan jadwal pengambilan.

Informasi yang dicatat:
- Tanggal pengambilan.
- Waktu pengambilan.
- Lokasi.
- Jumlah limbah yang direncanakan.
- Berat aktual saat penimbangan.
- Identitas pihak yang mengonfirmasi.
- Dokumentasi serah terima.
Berat aktual harus menjadi dasar pencatatan jumlah limbah yang benar-benar diterima, bukan sekadar jumlah yang diminta.
4.6 Processing Records
Mitra dapat mendokumentasikan:
- Tanggal mulai pengolahan.
- Jumlah limbah yang masuk proses.
- Metode pengolahan.
- Hasil pengolahan.
- Berat hasil pengolahan apabila relevan.
- Tanggal selesai.
- Dokumentasi kegiatan.
Sistem harus membedakan berat limbah masuk dengan berat produk hasil pengolahan.
BAB V. BUSINESS LOGIC DAN WORKFLOW
5.1 Alur Utama Transaksi
#chatgpt-mermaid-_r_1c4_{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;fill:rgb(237, 237, 237);}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#chatgpt-mermaid-_r_1c4_ .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_1c4_ .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#chatgpt-mermaid-_r_1c4_ .error-icon{fill:rgb(48, 48, 48);}#chatgpt-mermaid-_r_1c4_ .error-text{fill:rgb(237, 237, 237);stroke:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ .edge-thickness-normal{stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ .edge-thickness-thick{stroke-width:3.5px;}#chatgpt-mermaid-_r_1c4_ .edge-pattern-solid{stroke-dasharray:0;}#chatgpt-mermaid-_r_1c4_ .edge-thickness-invisible{stroke-width:0;fill:none;}#chatgpt-mermaid-_r_1c4_ .edge-pattern-dashed{stroke-dasharray:3;}#chatgpt-mermaid-_r_1c4_ .edge-pattern-dotted{stroke-dasharray:2;}#chatgpt-mermaid-_r_1c4_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_1c4_ .marker.cross{stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_1c4_ svg{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:16px;}#chatgpt-mermaid-_r_1c4_ p{margin:0;}#chatgpt-mermaid-_r_1c4_ .label{font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ .cluster-label text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ .cluster-label span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ .cluster-label span p{background-color:transparent;}#chatgpt-mermaid-_r_1c4_ .label text,#chatgpt-mermaid-_r_1c4_ span{fill:rgb(237, 237, 237);color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ .node rect,#chatgpt-mermaid-_r_1c4_ .node circle,#chatgpt-mermaid-_r_1c4_ .node ellipse,#chatgpt-mermaid-_r_1c4_ .node polygon,#chatgpt-mermaid-_r_1c4_ .node path{fill:rgb(9, 23, 44);stroke:rgb(31, 78, 148);stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ .rough-node .label text,#chatgpt-mermaid-_r_1c4_ .node .label text,#chatgpt-mermaid-_r_1c4_ .image-shape .label,#chatgpt-mermaid-_r_1c4_ .icon-shape .label{text-anchor:middle;}#chatgpt-mermaid-_r_1c4_ .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ .rough-node .label,#chatgpt-mermaid-_r_1c4_ .node .label,#chatgpt-mermaid-_r_1c4_ .image-shape .label,#chatgpt-mermaid-_r_1c4_ .icon-shape .label{text-align:center;}#chatgpt-mermaid-_r_1c4_ .node.clickable{cursor:pointer;}#chatgpt-mermaid-_r_1c4_ .root .anchor path{fill:rgb(175, 175, 175)!important;stroke-width:0;stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_1c4_ .arrowheadPath{fill:rgb(175, 175, 175);}#chatgpt-mermaid-_r_1c4_ .edgePath .path{stroke:rgb(175, 175, 175);stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ .flowchart-link{stroke:rgb(175, 175, 175);fill:none;}#chatgpt-mermaid-_r_1c4_ .edgeLabel{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_1c4_ .edgeLabel p{background-color:rgb(0, 0, 0);}#chatgpt-mermaid-_r_1c4_ .edgeLabel rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_1c4_ .labelBkg{background-color:rgba(0, 0, 0, 0.5);}#chatgpt-mermaid-_r_1c4_ .cluster rect{fill:rgb(48, 48, 48);stroke:rgba(255, 255, 255, 0.15);stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ .cluster text{fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ .cluster span{color:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";font-size:12px;background:rgb(48, 48, 48);border:1px solid rgba(255, 255, 255, 0.15);border-radius:2px;pointer-events:none;z-index:100;}#chatgpt-mermaid-_r_1c4_ .flowchartTitleText{text-anchor:middle;font-size:18px;fill:rgb(237, 237, 237);}#chatgpt-mermaid-_r_1c4_ rect.text{fill:none;stroke-width:0;}#chatgpt-mermaid-_r_1c4_ .icon-shape,#chatgpt-mermaid-_r_1c4_ .image-shape{background-color:rgb(0, 0, 0);text-align:center;}#chatgpt-mermaid-_r_1c4_ .icon-shape p,#chatgpt-mermaid-_r_1c4_ .image-shape p{background-color:rgb(0, 0, 0);padding:2px;}#chatgpt-mermaid-_r_1c4_ .icon-shape .label rect,#chatgpt-mermaid-_r_1c4_ .image-shape .label rect{opacity:0.5;background-color:rgb(0, 0, 0);fill:rgb(0, 0, 0);}#chatgpt-mermaid-_r_1c4_ .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#chatgpt-mermaid-_r_1c4_ .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#chatgpt-mermaid-_r_1c4_ .node .neo-node{stroke:rgb(31, 78, 148);}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].node rect,#chatgpt-mermaid-_r_1c4_ [data-look="neo"].cluster rect,#chatgpt-mermaid-_r_1c4_ [data-look="neo"].node polygon{stroke:url(#chatgpt-mermaid-_r_1c4_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].swimlane.cluster rect{filter:none;}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].node path{stroke:url(#chatgpt-mermaid-_r_1c4_-gradient);stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].node .neo-line path{stroke:rgb(31, 78, 148);filter:none;}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].node circle{stroke:url(#chatgpt-mermaid-_r_1c4_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].node circle .state-start{fill:#000000;}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].icon-shape .icon{fill:url(#chatgpt-mermaid-_r_1c4_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1c4_ [data-look="neo"].icon-shape .icon-neo path{stroke:url(#chatgpt-mermaid-_r_1c4_-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#chatgpt-mermaid-_r_1c4_ .node text{font-size:14px;font-weight:600;letter-spacing:normal;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_1c4_ .edgeLabels text{font-size:13px;font-weight:600;letter-spacing:-0.08px;fill:rgb(153, 206, 255);}#chatgpt-mermaid-_r_1c4_ .node tspan[font-weight="normal"],#chatgpt-mermaid-_r_1c4_ .edgeLabels tspan[font-weight="normal"]{font-weight:600;}#chatgpt-mermaid-_r_1c4_ .edgeLabel .label rect{opacity:1;rx:13px;ry:13px;fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ .node rect,#chatgpt-mermaid-_r_1c4_ .node circle,#chatgpt-mermaid-_r_1c4_ .node ellipse,#chatgpt-mermaid-_r_1c4_ .node polygon,#chatgpt-mermaid-_r_1c4_ .node path{fill:rgb(0, 40, 77);stroke:rgba(255, 255, 255, 0.1);stroke-width:1px;}#chatgpt-mermaid-_r_1c4_ .node rect{rx:16px;ry:16px;}#chatgpt-mermaid-_r_1c4_ .mermaid-decision .label-container{fill:rgb(0, 14, 26);stroke:rgb(26, 62, 95);stroke-dasharray:2,2;}#chatgpt-mermaid-_r_1c4_ .edgePaths .flowchart-link{stroke:rgb(175, 175, 175);stroke-width:1px;stroke-linecap:round;stroke-linejoin:round;}#chatgpt-mermaid-_r_1c4_ .marker{fill:rgb(175, 175, 175);stroke:rgb(175, 175, 175);}#chatgpt-mermaid-_r_1c4_ :root{--mermaid-font-family:-apple-system-body,ui-sans-serif,-apple-system,system-ui,"Segoe UI",Helvetica,"Apple Color Emoji",Arial,sans-serif,"Segoe UI Emoji","Segoe UI Symbol";}Penghasil mencatat limbahLimbah tersediaMitra melihat daftar limbahMitra mengajukan permintaanPersetujuan penghasilPermintaan ditolakPenjadwalanPengambilan limbahKonfirmasi berat aktualLimbah diterimaMitra melakukan pengolahanDokumentasi hasilSelesaiDitolakDisetujui





5.2 Status Transaksi
Status	Aktor yang berwenang
Tersedia	Sistem/penghasil
Menunggu permintaan	Sistem
Permintaan diajukan	Mitra
Disetujui	Penghasil
Terjadwal	Kedua pihak
Sudah diambil	Penghasil/mitra
Menunggu konfirmasi penerimaan	Sistem
Diterima	Mitra
Sedang diolah	Mitra
Selesai diolah	Mitra
Dibatalkan	Sesuai aturan pembatalan

Setiap perubahan status harus menyimpan waktu, identitas pengguna, dan keterangan perubahan.
5.3 Aturan Perhitungan Statistik
SIRKULIT harus memisahkan lima indikator utama:
1. Total limbah dihasilkan.
2. Total limbah ditawarkan.
3. Total limbah disalurkan.
4. Total limbah diterima.
5. Total limbah selesai diolah.
Masing-masing indikator harus mempunyai sumber data dan aturan agregasi yang jelas. Sistem tidak boleh menghitung satu limbah yang sama berulang kali apabila terjadi beberapa perubahan status atau beberapa transaksi.
BAB VI. NON-FUNCTIONAL REQUIREMENTS
Kategori	Persyaratan
Security	Authentication, authorization, dan validasi data
Performance	Pemuatan halaman dan pengambilan data yang efisien
Responsive	Kompatibel dengan desktop dan mobile
Accessibility	Navigasi dan teks mudah digunakan
Reliability	Konsistensi data dan transaksi
Maintainability	Struktur kode modular
Scalability	Mendukung pertumbuhan data dan pengguna
Usability	Alur penggunaan sederhana dan jelas

BAB VII. UI/UX REQUIREMENTS
7.1 Identitas Visual
Konsep desain SIRKULIT:
- Modern.
- Natural.
- Profesional.
- Minimalis.
- Berorientasi lingkungan.
- Tidak menyerupai template dashboard generik.
Palet warna yang direkomendasikan:

Forest Green#254F3A


Sage#8FA88D


Off White#F3F0E8


Earth Brown#B68B5D



7.2 Layout
Setiap dashboard harus memiliki:
- Sidebar navigasi.
- Header dengan informasi akun.
- Ringkasan statistik.
- Grafik aktivitas.
- Tabel data.
- Filter dan pencarian.
- Notifikasi.
- Empty state.
- Loading state.
- Error state.
7.3 Responsive Design
Website harus berfungsi dengan baik pada:
- Desktop.
- Laptop.
- Tablet.
- Smartphone.
Pada perangkat mobile, sidebar dapat berubah menjadi navigasi yang lebih ringkas.
BAB VIII. DATA REQUIREMENTS
8.1 Struktur Database Awal
Nama tabel	Fungsi
users	Identitas akun
producer_profiles	Profil penghasil
partner_profiles	Profil mitra
waste_categories	Kategori limbah
waste_records	Data produksi limbah
pickup_requests	Permintaan pengambilan
pickup_details	Detail permintaan
pickup_schedules	Jadwal pengambilan
waste_transfers	Data serah terima
processing_records	Dokumentasi pengolahan
notifications	Notifikasi
audit_logs	Riwayat aktivitas

8.2 Data Integrity
- Setiap transaksi memiliki ID unik.
- Data pengguna terhubung melalui foreign key.
- Berat limbah harus bernilai positif.
- Jumlah yang ditawarkan tidak boleh melebihi jumlah tersedia.
- Perubahan berat harus terdokumentasi.
- Transaksi yang selesai tidak dapat diubah tanpa mekanisme koreksi.
- Data statistik harus dihitung berdasarkan catatan transaksi yang valid.
BAB IX. SECURITY REQUIREMENTS
Sistem harus menerapkan:
1. Password hashing.
2. Session management.
3. Role-based access control.
4. Server-side input validation.
5. Proteksi terhadap akses tidak sah.
6. Validasi file gambar yang diunggah.
7. Audit log untuk aktivitas penting.
8. Pengelolaan konfigurasi dan secret melalui environment variables.
BAB X. SUCCESS METRICS DAN ACCEPTANCE CRITERIA
10.1 Indikator Keberhasilan
Indikator	Parameter
Registrasi	Pengguna dapat membuat akun
Pengelolaan limbah	Data dapat dicatat dan diperbarui
Pencarian mitra	Mitra dapat ditemukan berdasarkan kriteria
Transaksi	Permintaan dapat diproses
Penjadwalan	Jadwal dapat disepakati
Serah terima	Berat aktual tercatat
Pengolahan	Dokumentasi dapat disimpan
Statistik	Data dapat dihitung tanpa duplikasi

10.2 Acceptance Criteria MVP
MVP dinyatakan berhasil apabila ketiga jenis pengguna dapat menjalankan perannya dan alur utama dari pencatatan hingga dokumentasi pengolahan dapat dilakukan tanpa kesalahan kritis.
BAB XI. DEVELOPMENT ROADMAP
Tahap	Aktivitas	Deliverable
Fase 1	Discovery	Analisis kebutuhan
Fase 2	PRD	Dokumen spesifikasi produk
Fase 3	System Design	ERD, UML, arsitektur
Fase 4	UI/UX	Wireframe dan prototype
Fase 5	Frontend	Antarmuka website
Fase 6	Backend	API dan database
Fase 7	Integration & QA	Sistem terintegrasi dan hasil pengujian
Fase 8	Deployment	Website siap digunakan


BAB XII. INSTRUKSI EKSEKUSI UNTUK AI DEVELOPMENT AGENT
Bagian ini merupakan penghubung langsung antara PRD dengan agent yang telah didefinisikan sebelumnya.

AI Development Agent wajib:
1. Menjadikan PRD sebagai acuan utama pengembangan.
2. Tidak mengembangkan fitur di luar ruang lingkup tanpa persetujuan.
3. Menyelesaikan analisis sistem sebelum coding.
4. Memastikan setiap fitur mempunyai pengguna, fungsi, dan kriteria keberhasilan.
5. Menjaga konsistensi database dan alur bisnis.
6. Menggunakan data DEMO apabila belum tersedia data aktual.
7. Tidak membuat klaim lingkungan berdasarkan asumsi.
8. Melakukan pengujian sebelum menyatakan fitur selesai.
9. Mendokumentasikan setiap perubahan sistem.
10. Meminta persetujuan apabila terdapat perubahan besar terhadap kebutuhan produk.

3. STATUS DOKUMEN DAN LANGKAH SELANJUTNYA
Dokumentasi pengembangan SIRKULIT
Deskripsi AI Agent
Draft tersedia

PRD versi 1.0
Draft tersedia

System Architecture
Belum dirancang final

Database ERD
Belum dirancang

UI/UX Prototype
Belum dirancang

MVP Website
Belum dimulai


Rekomendasi tahap selanjutnya: FASE 3 — SYSTEM ARCHITECTURE & DATABASE DESIGN.

Pada tahap tersebut, kita akan menerjemahkan kebutuhan PRD menjadi rancangan teknis yang dapat langsung digunakan AI Development Agent untuk membangun website.

Dokumen yang akan disiapkan:
1. System Architecture Diagram.
2. Use Case Diagram untuk tiga aktor.
3. Activity Diagram proses penyaluran.
4. Entity Relationship Diagram (ERD).
5. Database Schema lengkap.
6. API Endpoint Specification.
7. Role and Permission Matrix.