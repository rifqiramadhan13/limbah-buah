import { useEffect, useRef, useState } from 'react'
import { educationTopics } from './education-content.js'

function EducationDialog({ topic, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  const closeDialog = () => dialogRef.current?.close()

  return (
    <dialog
      aria-labelledby={`education-title-${topic.id}`}
      className="education-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) closeDialog()
      }}
      onCancel={(event) => {
        event.preventDefault()
        closeDialog()
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="education-dialog-inner">
        <div className="education-dialog-topline">
          <p className="eyebrow"><span className="eyebrow-line" /> MATERI EDUKASI · {topic.number}</p>
          <button
            aria-label="Tutup materi"
            className="education-dialog-close"
            onClick={closeDialog}
            type="button"
          >
            Tutup <span aria-hidden="true">×</span>
          </button>
        </div>
        <h2 id={`education-title-${topic.id}`}>{topic.title}</h2>
        <p className="education-dialog-introduction">{topic.introduction}</p>

        <div className="education-dialog-sections">
          {topic.sections.map((section) => (
            <section className="education-dialog-section" key={section.title}>
              <h3>{section.title}</h3>
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
          <h3 id={`education-sources-${topic.id}`}>Sumber bacaan</h3>
          <ol>
            {topic.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} rel="noreferrer" target="_blank">{source.title}</a>
                <span>{source.authors}. {source.publisher}.</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </dialog>
  )
}

export default function EducationTopics({ Icon }) {
  const [selectedTopic, setSelectedTopic] = useState(null)

  return (
    <>
      <div className="education-cards" id="topik-edukasi">
        {educationTopics.map((topic) => (
          <article className="education-card" key={topic.id}>
            <span className="edu-number">{topic.number}</span>
            <span className="edu-icon"><Icon name={topic.icon} size={21} /></span>
            <h3>{topic.title}</h3>
            <p>{topic.summary}</p>
            <button
              aria-haspopup="dialog"
              className="edu-link"
              onClick={() => setSelectedTopic(topic)}
              type="button"
            >
              BACA TOPIK <Icon name="arrow" size={15} />
            </button>
          </article>
        ))}
        <p className="education-disclaimer">Materi dirangkum dari ulasan ilmiah dan panduan EPA serta PBB. Lihat sumber bacaan pada tiap topik.</p>
      </div>
      {selectedTopic && (
        <EducationDialog
          key={selectedTopic.id}
          onClose={() => setSelectedTopic(null)}
          topic={selectedTopic}
        />
      )}
    </>
  )
}
