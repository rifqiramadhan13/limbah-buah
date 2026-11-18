import { educationTopics } from './education-content.js'
import EducationTopics from './EducationTopics.jsx'
import './NewFeatures.css'
import './EducationPage.css'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7h-5V2" />
        <path d="M4 17h5v5" />
        <path d="M5.6 9a7 7 0 0 1 11.7-2L20 9" />
        <path d="M18.4 15a7 7 0 0 1-11.7 2L4 15" />
      </svg>
    </span>
  )
}

function EducationArticle({ topic }) {
  return (
    <article className="page-shell education-article-shell">
      <p className="eyebrow"><span className="eyebrow-line" /> MATERI EDUKASI · {topic.number}</p>
      <h1 className="education-article-title">{topic.title}</h1>
      <p className="education-article-introduction">{topic.introduction}</p>

      <div className="education-article-sections">
        {topic.sections.map((section) => (
          <section className="education-article-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && (
              <ul>
                {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>

      <aside className="education-reading-note">
        Materi ini bersifat pengantar. Ikuti ketentuan pengelola fasilitas dan peraturan yang berlaku untuk praktik pengolahan di lokasi Anda.
      </aside>

      <section aria-labelledby={`education-sources-${topic.id}`} className="education-sources">
        <h2 id={`education-sources-${topic.id}`}>Sumber bacaan</h2>
        <ol>
          {topic.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} rel="noreferrer" target="_blank">{source.title}</a>
              <span>{source.authors}. {source.publisher}.</span>
            </li>
          ))}
        </ol>
      </section>
    </article>
  )
}

export default function EducationPage({ Icon, onHomeClick, onNavigate, pathname }) {
  const topicId = pathname.startsWith('/edukasi/')
    ? pathname.slice('/edukasi/'.length).split('/')[0]
    : ''
  const topic = educationTopics.find((item) => item.id === topicId)
  const isArticle = Boolean(topicId)

  return (
    <main className="new-page">
      <header className="new-page-header">
        <div className="page-shell new-page-header-inner">
          <a className="brand" href="/" onClick={onHomeClick} aria-label="Sirkulit, beranda">
            <BrandMark />
            <span className="brand-name">sir<span>kulit</span><small>EKONOMI SIRKULAR</small></span>
          </a>
          {isArticle ? (
            <a className="text-link" href="/edukasi" onClick={(event) => onNavigate(event, '/edukasi')}>
              ← Kembali ke Ruang Belajar
            </a>
          ) : (
            <a className="text-link" href="/" onClick={onHomeClick}>← Kembali ke Beranda</a>
          )}
        </div>
      </header>

      {topic ? (
        <section className="education-page-section section-pad">
          <EducationArticle topic={topic} />
        </section>
      ) : isArticle ? (
        <section className="education-page-section section-pad">
          <div className="page-shell education-not-found">
            <p className="eyebrow"><span className="eyebrow-line" /> RUANG BELAJAR</p>
            <h1>Materi tidak ditemukan</h1>
            <p>Topik yang Anda cari tidak tersedia. Silakan pilih materi dari daftar Ruang Belajar.</p>
            <a className="button button-dark" href="/edukasi" onClick={(event) => onNavigate(event, '/edukasi')}>
              Lihat semua topik <Icon name="arrow" size={17} />
            </a>
          </div>
        </section>
      ) : (
        <section className="education-page-section section-pad">
          <div className="page-shell education-overview">
            <p className="eyebrow"><span className="eyebrow-line" /> RUANG BELAJAR</p>
            <h1>Mengenal potensi kimia di balik <em>kulit buah.</em></h1>
            <p className="education-overview-introduction">
              Setiap jenis kulit buah memiliki karakteristik bahan organik yang berbeda. Pilih topik untuk membaca materi dan sumber bacaan secara lengkap.
            </p>
            <EducationTopics
              Icon={Icon}
              onTopicClick={(event, id) => onNavigate(event, `/edukasi/${id}`)}
            />
          </div>
        </section>
      )}
    </main>
  )
}
