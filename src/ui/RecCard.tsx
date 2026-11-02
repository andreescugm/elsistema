import { BookOpen, YoutubeLogo, Microphone, ArrowSquareOut } from '@phosphor-icons/react'
import { spotify } from '../data/attrs'
import type { Recommendation } from '../engine/recommend'

/** Lo concreto que toca hacer: ejercicio, libro (con página), vídeo y podcast. */
export function RecDetail({ rec, onOpenBook }: { rec: Recommendation; onOpenBook: (bookId: string) => void }) {
  return (
    <div className="rec">
      <p className="disc">{rec.minutes} min · {rec.discipline.name}</p>
      <p className="drill">{rec.drill}</p>
      <ul className="res">
        {rec.book && (
          <li>
            <button onClick={() => onOpenBook(rec.book!.id)}>
              <BookOpen size={26} weight="duotone" aria-hidden />
              <span>
                <span className="k">Lee</span>
                <span className="t">{rec.book.title}</span>
                <span className="muted">{rec.book.page ? `Vas por la página ${rec.book.page}` : rec.book.author}</span>
              </span>
              <ArrowSquareOut size={18} aria-hidden />
            </button>
          </li>
        )}
        {rec.person && (
          <li>
            <a href={rec.person.url} target="_blank" rel="noreferrer">
              <YoutubeLogo size={26} weight="duotone" aria-hidden />
              <span>
                <span className="k">Mira en YouTube</span>
                <span className="t">{rec.person.name}</span>
                <span className="muted">{rec.person.topic}</span>
              </span>
              <ArrowSquareOut size={18} aria-hidden />
            </a>
          </li>
        )}
        {rec.podcast && (
          <li>
            <a href={spotify(rec.podcast.name)} target="_blank" rel="noreferrer">
              <Microphone size={26} weight="duotone" aria-hidden />
              <span>
                <span className="k">Escucha</span>
                <span className="t">{rec.podcast.name}</span>
                <span className="muted">{rec.podcast.why}</span>
              </span>
              <ArrowSquareOut size={18} aria-hidden />
            </a>
          </li>
        )}
      </ul>
    </div>
  )
}
