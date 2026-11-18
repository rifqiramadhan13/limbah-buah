import { educationTopics } from './education-content.js'

export default function EducationTopics({ Icon, onTopicClick }) {
  return (
    <div className="education-cards" id="topik-edukasi">
      {educationTopics.map((topic) => (
        <article className="education-card" key={topic.id}>
          <span className="edu-number">{topic.number}</span>
          <span className="edu-icon"><Icon name={topic.icon} size={21} /></span>
          <h3>{topic.title}</h3>
          <p>{topic.summary}</p>
          <a
            aria-label={`Baca topik: ${topic.title}`}
            className="edu-link"
            href={`/edukasi/${topic.id}`}
            onClick={(event) => onTopicClick?.(event, topic.id)}
          >
            BACA TOPIK <Icon name="arrow" size={15} />
          </a>
        </article>
      ))}
      <p className="education-disclaimer">Materi dirangkum dari ulasan ilmiah dan panduan EPA serta PBB. Lihat sumber bacaan pada tiap topik.</p>
    </div>
  )
}
