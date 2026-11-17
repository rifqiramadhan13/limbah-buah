import EcosystemMapPanel from './EcosystemMapPanel.jsx'
import './NewFeatures.css'

export default function EcosystemMapPage({ onHomeClick }) {
  return (
    <main className="new-page">
      <header className="new-page-header">
        <div className="page-shell new-page-header-inner">
          <a className="brand" href="/" onClick={onHomeClick} aria-label="Sirkulit, beranda">
            <span className="brand-mark" aria-hidden="true">
              <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-5V2" />
                <path d="M4 17h5v5" />
                <path d="M5.6 9a7 7 0 0 1 11.7-2L20 9" />
                <path d="M18.4 15a7 7 0 0 1-11.7 2L4 15" />
              </svg>
            </span>
            <span className="brand-name">sir<span>kulit</span><small>EKONOMI SIRKULAR</small></span>
          </a>
          <a className="text-link" href="/" onClick={onHomeClick}>← Kembali ke Beranda</a>
        </div>
      </header>
      <section className="ecosystem-map-page-section section-pad">
        <div className="page-shell">
          <EcosystemMapPanel />
        </div>
      </section>
    </main>
  )
}
