import { ATTRS, AttrId, Book, BOOKS, Discipline, Person, Podcast, attrById, personById, podcastById, yt } from '../data/attrs'
import { Mission } from '../data/schedule'
import { workoutFor } from './training'
import { State, atrophied, current, dayMissions, dayNumber, idleDays } from './core'

export interface Recommendation {
  attr: AttrId
  minutes: number
  discipline: Discipline
  drill: string
  book?: Book & { page?: number; total?: number }
  person?: Person & { url: string }
  podcast?: Podcast
  headline: string // texto corto para avisos
}

export const allBooks = (s: State): Book[] => [...BOOKS, ...s.customBooks]

/** Libro en curso de un atributo: el elegido, si no el primero empezado, si no el primero de la disciplina. */
export function bookFor(s: State, attr: AttrId, disc?: Discipline): Book | undefined {
  const books = allBooks(s).filter((b) => b.attr === attr)
  const chosen = s.currentBook[attr] && books.find((b) => b.id === s.currentBook[attr])
  if (chosen && s.books[chosen.id]?.status !== 'terminado') return chosen
  const reading = books.find((b) => s.books[b.id]?.status === 'leyendo')
  if (reading) return reading
  const open = (b: Book) => s.books[b.id]?.status !== 'terminado'
  return disc?.books.map((id) => books.find((b) => b.id === id)).find((b) => b && open(b)) ?? books.find(open)
}

/**
 * Elige la disciplina menos practicada del atributo (empate: rota con el día)
 * y concreta qué hacer: ejercicio, libro con página, referente y podcast.
 */
export function recommend(s: State, attr: AttrId, minutes: number, date: Date, salt = 0): Recommendation {
  const def = attrById(attr)
  const practiced = s.practice[attr] ?? {}
  const day = dayNumber(date) + salt
  const ranked = def.disciplines
    .map((d, i) => {
      const n = def.disciplines.length
      return { d, last: practiced[d.id] ?? '', rot: (((i - day) % n) + n) % n }
    })
    .sort((a, b) => (a.last < b.last ? -1 : a.last > b.last ? 1 : a.rot - b.rot))
  const discipline = ranked[0].d
  const drill = discipline.drills[Math.abs(day) % discipline.drills.length]
  const b = bookFor(s, attr, discipline)
  const book = b ? { ...b, page: s.books[b.id]?.page, total: s.books[b.id]?.total } : undefined
  const pid = discipline.people[Math.abs(day) % Math.max(1, discipline.people.length)]
  const p = pid ? personById(pid) : undefined
  const person = p ? { ...p, url: yt(p.query) } : undefined
  const podId = def.podcasts[Math.abs(day) % Math.max(1, def.podcasts.length)]
  const podcast = podId ? podcastById(podId) : undefined

  const parts = [`${minutes} min de ${def.name.toLowerCase()} · ${discipline.name}.`]
  if (book) parts.push(`Lee ${book.title}${book.page ? ` desde la pág. ${book.page}` : ''}`)
  if (person) parts.push(`${book ? 'o busca' : 'Busca'} a ${person.name} en YouTube`)
  return { attr, minutes, discipline, drill, book, person, podcast, headline: parts.join(' ') }
}

export interface NowAdvice {
  main: { title: string; detail: string; mission?: Mission; rec?: Recommendation }
  alternatives: { title: string; detail: string; rec?: Recommendation }[]
}

/** "¿Qué hago ahora?": una misión concreta y dos alternativas, por reglas. */
export function whatNow(s: State, now: Date): NowAdvice {
  const missions = dayMissions(s, now)
  const { active, upcoming } = current(missions, s, now)
  const neglected = ATTRS.filter((a) => atrophied(s, a.id, now)).sort((a, b) => idleDays(s, b.id, now) - idleDays(s, a.id, now))
  const alt = (attr: AttrId, mins: number, salt: number) => {
    const rec = recommend(s, attr, mins, now, salt)
    return { title: `${attrById(attr).name} · ${rec.discipline.name}`, detail: rec.drill, rec }
  }
  const alternatives = [] as NowAdvice['alternatives']
  if (neglected[0]) alternatives.push({ ...alt(neglected[0].id, 15, 1), title: `${neglected[0].name} está descuidada · ${recommend(s, neglected[0].id, 15, now, 1).discipline.name}` })

  if (active) {
    const rec = active.learn ? recommend(s, active.learn.attr, active.learn.minutes, now) : undefined
    const w = active.kind === 'entreno' ? workoutFor(now) : undefined
    const detail = rec
      ? rec.drill
      : active.kind === 'curro'
        ? 'Abre Curro y suma cada llamada y visita.'
        : w
          ? `${w.exercises.map((e) => `${e.name} ${e.sets}×${e.start}${e.unit === 's' ? ' s' : ''}`).join(', ')}.`
          : active.note ?? active.steps?.join(' · ') ?? ''
    if (active.kind === 'curro') alternatives.push(alt('CARISMA', 10, 2))
    alternatives.push(alt(active.attr === 'MENTE' ? 'CARISMA' : 'MENTE', 10, 3))
    alternatives.push(alt('LENGUA', 10, 6))
    return { main: { title: active.title, detail, mission: active, rec }, alternatives: alternatives.slice(0, 2) }
  }
  const next = upcoming[0]
  alternatives.push(alt('CARISMA', 15, 4), alt('LENGUA', 10, 5))
  return {
    main: next
      ? { title: `Hueco libre hasta las ${next.start}`, detail: `Prepara "${next.title}". Mientras, usa el tiempo:`, mission: next }
      : { title: 'Día cerrado', detail: 'Revisa el Registro del día y deja mañana preparado.' },
    alternatives: alternatives.slice(0, 2),
  }
}

