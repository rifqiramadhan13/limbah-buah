import { useEffect, useState } from 'react'
import ContactSection from './ContactSection.jsx'
import EducationTopics from './EducationTopics.jsx'
import PartnerMapSection from './PartnerMapSection.jsx'
import RegistrationPage from './RegistrationPage.jsx'
import './App.css'

const iconPaths = {
  leaf: (
    <>
      <path d="M20.2 3.8c-7.5-.3-13.4 1.1-15.7 5.2-1.6 2.8-.5 6.1 2.3 7.1 4.1 1.4 8.5-2.8 13.4-12.3Z" />
      <path d="M4.6 20c2.3-5.3 6.1-8.5 11.2-10.9" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  cycle: (
    <>
      <path d="M20 7h-5V2" />
      <path d="M4 17h5v5" />
      <path d="M5.6 9a7 7 0 0 1 11.7-2L20 9" />
      <path d="M18.4 15a7 7 0 0 1-11.7 2L4 15" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4 4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5M4 19h17" />
      <path d="m7 15 4-4 3 2 6-7" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="M3 8v9l9 5 9-5V8M12 13v9" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  flask: (
    <>
      <path d="M9 3h6M10 3v6l-5.5 9.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.8L14 9V3" />
      <path d="M8 15h8" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12C8 12 5 9 5 5c4 0 7 3 7 7Z" />
      <path d="M12 15c0-4 3-7 7-7 0 4-3 7-7 7Z" />
      <path d="M7 21h10" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  menuBook: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5v-12Z" />
      <path d="M4 16h16M8 7h8M8 11h6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  drop: (
    <>
      <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z" />
      <path d="M9 16a3 3 0 0 0 3 3" />
    </>
  ),
}

function Icon({ name, size = 22, className = '' }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  )
}

const navItems = [
  ['Tentang', '#tentang'],
  ['Cara Kerja', '#cara-kerja'],
  ['Fitur', '#fitur'],
  ['Peta Mitra', '#peta-mitra'],
  ['Edukasi', '#edukasi'],
  ['Kontak', '#kontak'],
]

const issues = [
  {
    number: '01',
    icon: 'drop',
    title: 'Belum termanfaatkan',
    text: 'Kulit buah kerap berakhir sebagai sisa, meski masih berpotensi menjadi bahan organik yang berguna.',
  },
  {
    number: '02',
    icon: 'search',
    title: 'Sulit menemukan mitra',
    text: 'Penghasil belum selalu tahu siapa yang dapat menerima dan mengolah limbahnya.',
  },
  {
    number: '03',
    icon: 'calendar',
    title: 'Penyaluran tak terjadwal',
    text: 'Koordinasi pengambilan sering belum memiliki jadwal yang jelas dan konsisten.',
  },
  {
    number: '04',
    icon: 'chart',
    title: 'Catatan belum terhubung',
    text: 'Jumlah dihasilkan, disalurkan, diterima, dan diolah perlu dibedakan serta dicatat.',
  },
]

const features = [
  ['box', 'Manajemen data limbah', 'Catat jenis, berat, kondisi, dan ketersediaan kulit buah.'],
  ['search', 'Direktori mitra', 'Temukan mitra berdasarkan jenis limbah, lokasi, dan kapasitas.'],
  ['calendar', 'Permintaan & jadwal', 'Ajukan pengambilan dan sepakati jadwal bersama.'],
  ['cycle', 'Pelacakan status', 'Ikuti proses penyaluran dari permintaan hingga pengolahan.'],
  ['chart', 'Riwayat & statistik', 'Tinjau perjalanan limbah berdasarkan catatan yang tersedia.'],
  ['menuBook', 'Pusat informasi', 'Pelajari pengelolaan limbah organik dan kimia berkelanjutan.'],
]

const steps = [
  ['01', 'Catat limbah', 'Penghasil mencatat jenis dan jumlah yang tersedia.'],
  ['02', 'Temukan kecocokan', 'Mitra melihat limbah yang sesuai kapasitasnya.'],
  ['03', 'Ajukan permintaan', 'Mitra menyampaikan jumlah yang ingin diambil.'],
  ['04', 'Sepakati jadwal', 'Kedua pihak menyetujui waktu dan lokasi.'],
  ['05', 'Konfirmasi timbang', 'Jumlah serah terima dicatat berdasarkan berat aktual.'],
  ['06', 'Dokumentasikan', 'Mitra mencatat proses serta hasil pengolahan.'],
]

const imageUrl =
  'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1400&q=85'

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [pathname, setPathname] = useState(window.location.pathname)

  const closeMenu = () => setMenuOpen(false)
  const openRegistration = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    window.history.pushState({}, '', '/daftar-limbah')
    setPathname('/daftar-limbah')
    window.scrollTo(0, 0)
  }
  const returnHome = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    window.history.pushState({}, '', '/')
    setPathname('/')
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const syncPathname = () => {
      setPathname(window.location.pathname)
      window.scrollTo(0, 0)
    }

    window.addEventListener('popstate', syncPathname)
    return () => window.removeEventListener('popstate', syncPathname)
  }, [])

  if (pathname === '/daftar-limbah') {
    return <RegistrationPage onHomeClick={returnHome} />
  }

  return (
    <>
      <header className="site-header">
        <nav className="navbar page-shell" aria-label="Navigasi utama">
          <a className="brand" href="#beranda" onClick={closeMenu} aria-label="Sirkulit, beranda">
            <span className="brand-mark"><Icon name="cycle" size={23} /></span>
            <span className="brand-name">sir<span>kulit</span><small>EKONOMI SIRKULAR</small></span>
          </a>

          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>

          <div className={`nav-content${menuOpen ? ' is-open' : ''}`}>
            <div className="nav-links">
              <a className="nav-link active" href="#beranda" onClick={closeMenu}>Beranda</a>
              {navItems.map(([label, href]) => (
                <a className="nav-link" href={href} key={href} onClick={closeMenu}>{label}</a>
              ))}
            </div>
            <div className="nav-actions">
              <a className="login-link" href="#akses-akun" onClick={closeMenu}>Masuk</a>
              <a className="button button-dark button-small" href="#bergabung" onClick={closeMenu}>
                Bergabung <Icon name="arrow" size={16} />
              </a>
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero-section" id="beranda">
          <div className="hero-layout page-shell">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-line" /> SISTEM SIRKULAR LIMBAH BUAH</p>
              <h1>Dari kulit buah,<br />menuju masa depan<br /><em>yang lebih lestari.</em></h1>
              <p className="hero-description">
                SIRKULIT mempertemukan penghasil limbah kulit buah dengan mitra pengolah melalui pencatatan, penyaluran, dan pemantauan yang lebih terstruktur.
              </p>
              <div className="hero-actions">
                <a className="button button-dark" href="#bergabung">Mulai bergabung <Icon name="arrow" size={18} /></a>
                <a className="text-link" href="#tentang">Kenali SIRKULIT <span>↓</span></a>
              </div>
              <div className="hero-note">
                <span className="note-icon"><Icon name="cycle" size={18} /></span>
                <span>Setiap langkah tercatat.<br /><strong>Setiap proses lebih terhubung.</strong></span>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
              <figure className="hero-photo">
                <img
                  src={imageUrl}
                  alt="Aneka buah segar sebagai sumber limbah kulit buah organik"
                  fetchPriority="high"
                />
              </figure>
              <div className="photo-caption"><span className="caption-dot" /> POTENSI DARI ALAM</div>
              <div className="hero-sticker">
                <Icon name="leaf" size={24} />
                <span>Nilai baru<br /><strong>dari sisa</strong></span>
              </div>
              <div className="fruit-label label-top">kulit buah <span>·</span> sumber daya</div>
              <div className="fruit-label label-bottom">catat <span>↗</span> salurkan <span>↗</span> olah</div>
            </div>
          </div>
          <div className="hero-bottom page-shell">
            <span>01 — PENGENALAN</span>
            <span className="hero-bottom-rule" />
            <span>SEBUAH LANGKAH MENUJU SIRKULARITAS</span>
          </div>
        </section>

        <section className="intro-section section-pad" id="tentang">
          <div className="intro-layout page-shell">
            <div className="intro-photo-wrap">
              <img
                className="intro-photo"
                src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1000&q=85"
                alt="Tangan merawat tanaman dan tanah untuk mendukung pemanfaatan bahan organik"
                loading="lazy"
              />
              <div className="photo-index"><span>01</span> DARI SISA MENJADI SUMBER DAYA</div>
              <div className="round-stamp"><Icon name="leaf" size={24} /><span>SIKLUS<br />YANG LEBIH<br />TERHUBUNG</span></div>
            </div>
            <div className="intro-copy">
              <p className="eyebrow"><span className="eyebrow-line" /> TENTANG SIRKULIT</p>
              <h2>Menghubungkan<br />permasalahan dengan<br /><em>peluang pemanfaatan.</em></h2>
              <p className="body-copy">
                Limbah kulit buah berasal dari kegiatan rumah tangga maupun usaha makanan dan minuman. SIRKULIT membantu menghubungkan penghasil dengan mitra pengolah agar pencatatan dan penyalurannya lebih terstruktur.
              </p>
              <a className="text-link link-underline" href="#cara-kerja">Lihat bagaimana cara kerjanya <Icon name="arrow" size={17} /></a>
              <div className="intro-footnote"><Icon name="sprout" size={19} /><span>Dirancang untuk mendukung ekonomi sirkular yang transparan.</span></div>
            </div>
          </div>
        </section>

        <section className="problem-section section-pad" id="tantangan">
          <div className="page-shell">
            <div className="section-heading problem-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-line" /> TITIK AWAL PERUBAHAN</p>
                <h2>Mengapa perlu sistem<br />yang lebih <em>terhubung?</em></h2>
              </div>
              <p className="section-aside">Potensi pemanfaatan dimulai dengan memahami tantangan dalam pengelolaan sehari-hari.</p>
            </div>
            <div className="issue-grid">
              {issues.map((item) => (
                <article className="issue-card" key={item.number}>
                  <div className="issue-card-top"><span>{item.number} / 04</span><Icon name={item.icon} size={22} /></div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <span className="card-arrow"><Icon name="arrow" size={17} /></span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="solution-section section-pad">
          <div className="page-shell solution-layout">
            <div className="solution-copy">
              <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> CARA KAMI MEMBANTU</p>
              <h2>Satu platform<br />untuk mengelola<br /><em>alur pemanfaatan.</em></h2>
              <p>SIRKULIT menyusun titik-titik penting dalam perjalanan limbah kulit buah menjadi alur yang dapat dicatat dan ditelusuri.</p>
              <a className="button button-light" href="#fitur">Jelajahi fitur <Icon name="arrow" size={18} /></a>
            </div>
            <div className="circular-flow" aria-label="Alur sirkular dari penghasil ke mitra pengolah">
              <div className="flow-ring ring-outer" />
              <div className="flow-ring ring-inner" />
              <div className="flow-center"><Icon name="cycle" size={39} /><span>ALUR<br />SIRKULAR</span></div>
              <div className="flow-node node-top"><span className="flow-node-icon"><Icon name="box" size={20} /></span><span>Catat<br />limbah</span></div>
              <div className="flow-node node-right"><span className="flow-node-icon"><Icon name="search" size={20} /></span><span>Temukan<br />mitra</span></div>
              <div className="flow-node node-bottom"><span className="flow-node-icon"><Icon name="calendar" size={20} /></span><span>Atur<br />penjemputan</span></div>
              <div className="flow-node node-left"><span className="flow-node-icon"><Icon name="sprout" size={20} /></span><span>Pantau<br />pengolahan</span></div>
              <span className="flow-arrow arrow-a">↗</span>
              <span className="flow-arrow arrow-b">↘</span>
              <span className="flow-arrow arrow-c">↙</span>
              <span className="flow-arrow arrow-d">↖</span>
            </div>
          </div>
        </section>

        <section className="steps-section section-pad" id="cara-kerja">
          <div className="page-shell">
            <div className="section-heading steps-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-line" /> ALUR YANG LEBIH JELAS</p>
                <h2>Bagaimana SIRKULIT<br /><em>bekerja?</em></h2>
              </div>
              <p className="section-aside">Dari pencatatan awal hingga dokumentasi proses pengolahan, setiap tahap memiliki peran yang jelas.</p>
            </div>
            <div className="steps-grid">
              {steps.map(([number, title, text], index) => (
                <article className="step-card" key={number}>
                  <div className="step-number">{number}<span>{index < steps.length - 1 && <Icon name="arrow" size={15} />}</span></div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
            <div className="steps-legend"><span><i className="legend-dot producer-dot" /> PENGHASIL</span><span><i className="legend-dot partner-dot" /> MITRA PENGOLAH</span></div>
          </div>
        </section>

        <section className="features-section section-pad" id="fitur">
          <div className="page-shell">
            <div className="section-heading features-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-line" /> DALAM SATU PLATFORM</p>
                <h2>Fitur untuk pengelolaan<br />yang <em>lebih terstruktur.</em></h2>
              </div>
              <p className="section-aside">Perangkat yang relevan untuk mencatat, menemukan, menyalurkan, dan memahami proses.</p>
            </div>
            <div className="features-grid">
              {features.map(([icon, title, text], index) => (
                <article className="feature-card" key={title}>
                  <div className={`feature-icon feature-icon-${index + 1}`}><Icon name={icon} size={23} /></div>
                  <span className="feature-index">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="roles-section section-pad" id="bergabung">
          <div className="page-shell">
            <div className="section-heading roles-heading">
              <div>
                <p className="eyebrow"><span className="eyebrow-line" /> BERGERAK BERSAMA</p>
                <h2>Dua peran, satu tujuan<br /><em>yang saling mendukung.</em></h2>
              </div>
              <p className="section-aside">SIRKULIT mempertemukan pihak yang memiliki limbah dengan pihak yang dapat mengolahnya.</p>
            </div>
            <div className="roles-grid">
              <article className="role-card producer-card">
                <img
                  src="https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=1000&q=85"
                  alt="Aneka buah segar yang dapat menghasilkan kulit buah organik"
                  loading="lazy"
                />
                <div className="role-overlay" />
                <div className="role-content">
                  <span className="role-label">01 / PENGHASIL LIMBAH</span>
                  <h3>Mulai dari<br />yang tersisa.</h3>
                  <p>Untuk individu dan pelaku usaha yang ingin mencatat serta menyalurkan limbah kulit buah.</p>
                  <a className="role-link" href="#akses-akun">Daftar sebagai penghasil <Icon name="arrow" size={18} /></a>
                </div>
              </article>
              <article className="role-card partner-card">
                <img
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1000&q=85"
                  alt="Aktivitas merawat tanaman dan mengelola bahan organik"
                  loading="lazy"
                />
                <div className="role-overlay" />
                <div className="role-content">
                  <span className="role-label">02 / MITRA PENGOLAH</span>
                  <h3>Temukan bahan<br />untuk diolah.</h3>
                  <p>Untuk komunitas, kelompok pertanian, dan pengelola limbah organik.</p>
                  <a className="role-link" href="#akses-akun">Daftar sebagai mitra <Icon name="arrow" size={18} /></a>
                </div>
              </article>
            </div>
            <p className="role-note" id="akses-akun"><Icon name="shield" size={16} /> Fitur masuk dan pendaftaran akun akan terhubung pada tahap pengembangan berikutnya.</p>
          </div>
        </section>

        <PartnerMapSection />

        <section className="education-section section-pad" id="edukasi">
          <div className="page-shell education-layout">
            <div className="education-intro">
              <p className="eyebrow"><span className="eyebrow-line" /> RUANG BELAJAR</p>
              <h2>Mengenal potensi kimia di balik <em>kulit buah.</em></h2>
              <p className="body-copy">Setiap jenis kulit buah memiliki karakteristik bahan organik yang berbeda. Memahaminya dapat menjadi salah satu pertimbangan dalam menentukan cara pemanfaatan.</p>
              <a className="button button-outline" href="#topik-edukasi">Jelajahi informasi <Icon name="arrow" size={17} /></a>
            </div>
            <EducationTopics Icon={Icon} />
          </div>
        </section>

        <section className="stats-section section-pad" id="statistik">
          <div className="page-shell stats-layout">
            <div className="stats-copy">
              <p className="eyebrow"><span className="eyebrow-line" /> MELIHAT PERJALANAN LIMBAH</p>
              <h2>Setiap tahapan tercatat,<br /><em>setiap proses terpantau.</em></h2>
              <p>Data akan ditampilkan sesuai catatan operasional yang tersedia. Setiap kategori menggambarkan tahap yang berbeda.</p>
            </div>
            <div className="stats-preview">
              <div className="demo-label"><span /> DEMO · PRATINJAU STATISTIK</div>
              <div className="demo-bars" aria-hidden="true">
                <span className="demo-bar bar-one" /><span className="demo-bar bar-two" /><span className="demo-bar bar-three" /><span className="demo-bar bar-four" /><span className="demo-bar bar-five" />
              </div>
              <div className="demo-categories">
                {['Dihasilkan', 'Ditawarkan', 'Disalurkan', 'Diterima', 'Diolah'].map((label) => (
                  <span key={label}><i />{label}<b>—</b></span>
                ))}
              </div>
              <p className="demo-disclaimer">Belum ada data operasional. Grafik ini hanya menggambarkan kategori, bukan angka aktual.</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-orbit cta-orbit-a" />
          <div className="cta-orbit cta-orbit-b" />
          <div className="page-shell cta-content">
            <p className="eyebrow eyebrow-light"><span className="eyebrow-line" /> LANGKAH SELANJUTNYA</p>
            <h2>Saatnya menghubungkan limbah<br />dengan peluang <em>pemanfaatannya.</em></h2>
            <p>Mulai langkah sederhana untuk mendukung pengelolaan limbah kulit buah yang lebih terstruktur.</p>
            <div className="cta-actions">
              <a className="button button-light" href="#bergabung">Bergabung bersama <Icon name="arrow" size={18} /></a>
              <a className="cta-login" href="#akses-akun">Masuk ke SIRKULIT</a>
            </div>
            <span className="cta-sprig sprig-one"><Icon name="leaf" size={43} /></span>
            <span className="cta-sprig sprig-two"><Icon name="leaf" size={26} /></span>
          </div>
        </section>

        <section className="registration-promo section-pad">
          <div className="page-shell registration-promo-content">
            <div>
              <p className="eyebrow"><span className="eyebrow-line" /> UNTUK PENGHASIL LIMBAH</p>
              <h2>Punya Limbah Kulit Buah? <em>Daftarkan Sekarang!</em></h2>
              <p>Salurkan limbah kulit buah Anda melalui SIRKULIT. Daftarkan informasi limbah yang dihasilkan agar pengelola dapat meninjau dan menghubungkan Anda dengan mitra pengolah yang sesuai.</p>
            </div>
            <a className="button button-dark" href="/daftar-limbah" onClick={openRegistration}>
              Daftarkan Limbah <Icon name="arrow" size={18} />
            </a>
          </div>
        </section>

        <ContactSection />
      </main>

      <footer className="site-footer">
        <div className="page-shell footer-main">
          <div className="footer-brand-block">
            <a className="brand brand-footer" href="#beranda">
              <span className="brand-mark"><Icon name="cycle" size={23} /></span>
              <span className="brand-name">sir<span>kulit</span><small>EKONOMI SIRKULAR</small></span>
            </a>
            <p>Sistem informasi yang mempertemukan penghasil dan mitra pengolah limbah kulit buah.</p>
          </div>
          <div className="footer-column"><h3>Jelajahi</h3><a href="#tentang">Tentang SIRKULIT</a><a href="#cara-kerja">Cara kerja</a><a href="#fitur">Fitur</a><a href="#kontak">Kontak</a></div>
          <div className="footer-column"><h3>Untuk Anda</h3><a href="#bergabung">Penghasil limbah</a><a href="#bergabung">Mitra pengolah</a><a href="#edukasi">Pusat informasi</a></div>
          <a className="back-top" href="#beranda">KEMBALI KE ATAS <span>↑</span></a>
        </div>
        <div className="page-shell footer-bottom"><span>© 2026 SIRKULIT</span><span>DARI LIMBAH MENJADI SUMBER DAYA BERNILAI</span><span>Informasi berbasis data yang tercatat</span></div>
      </footer>
    </>
  )
}

export default App
