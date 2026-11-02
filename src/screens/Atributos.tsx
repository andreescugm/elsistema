import { useRef, useState } from 'react'
import { CaretLeft, CaretRight, Warning, YoutubeLogo, Microphone, FilePdf, BookOpen, Check as CheckIcon, Plus } from '@phosphor-icons/react'
import { ATTRS, AttrId, PEOPLE, attrById, podcastById, spotify, yt } from '../data/attrs'
import { ATTR_BASE, State, atrophied, dayKey, emptyDay, idleDays, level, totals } from '../engine/core'
import { allBooks, recommend } from '../engine/recommend'
import { putPdf } from '../storage/files'
import { useSystem } from '../store'
import { AttrIcon, Bar, Panel } from '../ui/kit'
import { RecDetail } from '../ui/RecCard'
import { Entreno } from './Entreno'

export function AtributosList({ onOpen }: { onOpen: (id: AttrId) => void }) {
  const { state, now } = useSystem()
  const t = totals(state, now)
  return (
    <>
      <div className="topbar"><h1>Atributos</h1><span className="sub">Toca uno para entrenarlo</span></div>
      <div className="attr-list">
        {ATTRS.map((a) => {
          const l = level(t.attrs[a.id], ATTR_BASE)
          const atro = atrophied(state, a.id, now)
          return (
            <Panel key={a.id} float={false} tone={atro ? 'danger' : undefined}>
              <button className="attr-card" onClick={() => onOpen(a.id)} aria-label={`${a.name}, nivel ${l.lvl}`}>
                <span className="attr-ico"><AttrIcon id={a.id} /></span>
                <span>
                  <h3>{a.name}</h3>
                  <Bar value={l.into} max={l.need} label={`Experiencia de ${a.name}`} />
                  {atro && <p className="warn"><Warning size={14} weight="fill" aria-hidden /> {idleDays(state, a.id, now)} días sin entrenar. Se está atrofiando.</p>}
                </span>
                <span className="lv">Nv {l.lvl}</span>
              </button>
            </Panel>
          )
        })}
      </div>
    </>
  )
}

type DetailTab = 'hoy' | 'entreno' | 'disciplinas' | 'biblioteca' | 'referentes' | 'podcasts'

export function AtributoDetalle({ id, onBack, onOpenBook, initialTab }: { id: AttrId; onBack: () => void; onOpenBook: (bookId: string) => void; initialTab?: DetailTab }) {
  const { state, now, update, toast } = useSystem()
  const def = attrById(id)
  const t = totals(state, now)
  const l = level(t.attrs[id], ATTR_BASE)
  const tabs: [DetailTab, string][] = [
    ...(id === 'FUERZA' ? ([['entreno', 'Entreno']] as [DetailTab, string][]) : []),
    ['hoy', 'Hoy toca'], ['disciplinas', 'Disciplinas'], ['biblioteca', 'Biblioteca'], ['referentes', 'Referentes'], ['podcasts', 'Podcasts'],
  ]
  const [tab, setTab] = useState<DetailTab>(initialTab ?? tabs[0][0])
  const [salt, setSalt] = useState(0)
  const rec = recommend(state, id, 20, now, salt)

  const markPractice = () => {
    update((s) => ({ ...s, practice: { ...s.practice, [id]: { ...(s.practice[id] ?? {}), [rec.discipline.id]: dayKey(now) } } }))
    toast(`${rec.discipline.name}: práctica registrada`, 'gold')
    setSalt((x) => x + 1)
  }

  return (
    <>
      <div className="topbar">
        <button className="back" onClick={onBack}><CaretLeft size={18} /> Atributos</button>
        <span className="sub">Nivel {l.lvl}</span>
      </div>
      <Panel live testId="attr-head">
        <div className="attr-card" style={{ cursor: 'default' }}>
          <span className="attr-ico"><AttrIcon id={id} /></span>
          <span>
            <h3>{def.name}</h3>
            <Bar value={l.into} max={l.need} label={`Experiencia de ${def.name}`} />
          </span>
          <span className="lv">Nv {l.lvl}</span>
        </div>
        <p className="muted" style={{ margin: '12px 0 0' }}>{def.tagline}</p>
      </Panel>

      <div className="tabs" role="tablist" aria-label={`Secciones de ${def.name}`}>
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'entreno' && <Entreno />}

      {tab === 'hoy' && (
        <Panel title="Hoy toca" testId="hoy-toca">
          <RecDetail rec={rec} onOpenBook={onOpenBook} />
          <div className="row">
            <button className="btn gold" onClick={markPractice}>Práctica hecha</button>
            <button className="btn ghost" onClick={() => setSalt((x) => x + 1)}>Otra opción <CaretRight size={16} /></button>
          </div>
          <p className="hint" style={{ margin: '12px 0 0' }}>La experiencia se gana cumpliendo las misiones del día. Aquí registras qué disciplina has practicado para que el Sistema rote.</p>
        </Panel>
      )}

      {tab === 'disciplinas' && (
        <Panel title="Disciplinas">
          {def.disciplines.map((d) => (
            <div className="disc-item" key={d.id}>
              <h4>{d.name}</h4>
              <p>{d.goal}</p>
              <ul>{d.drills.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="last">{state.practice[id]?.[d.id] ? `Última práctica: ${state.practice[id]![d.id]}` : 'Sin practicar todavía'}</p>
            </div>
          ))}
        </Panel>
      )}

      {tab === 'biblioteca' && <Biblioteca id={id} onOpenBook={onOpenBook} />}

      {tab === 'referentes' && (
        <Panel title="Referentes">
          <ul className="res">
            {PEOPLE.filter((p) => def.disciplines.some((d) => d.people.includes(p.id))).map((p) => (
              <li key={p.id}>
                <a href={yt(p.query)} target="_blank" rel="noreferrer">
                  <YoutubeLogo size={26} weight="duotone" aria-hidden />
                  <span><span className="t">{p.name}</span><span className="muted">{p.topic}</span></span>
                  <span className="badge">YouTube</span>
                </a>
              </li>
            ))}
          </ul>
          {!def.disciplines.some((d) => d.people.length) && <p className="empty">Este atributo no tiene referentes todavía.</p>}
        </Panel>
      )}

      {tab === 'podcasts' && (
        <Panel title="Podcasts">
          <ul className="res">
            {def.podcasts.map((pid) => podcastById(pid)!).map((p) => (
              <li key={p.id}>
                <a href={spotify(p.name)} target="_blank" rel="noreferrer">
                  <Microphone size={26} weight="duotone" aria-hidden />
                  <span><span className="t">{p.name}</span><span className="muted">{p.host} · {p.why}</span></span>
                  <span className="badge">Spotify</span>
                </a>
              </li>
            ))}
          </ul>
          {def.podcasts.length === 0 && <p className="empty">Sin podcasts para este atributo. Usa Referentes.</p>}
        </Panel>
      )}
    </>
  )
}

function Biblioteca({ id, onOpenBook }: { id: AttrId; onOpenBook: (bookId: string) => void }) {
  const { state, now, update, toast } = useSystem()
  const books = allBooks(state).filter((b) => b.attr === id)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadFor, setUploadFor] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const def = attrById(id)

  const setBook = (bookId: string, patch: Partial<State['books'][string]>) =>
    update((s) => ({ ...s, books: { ...s.books, [bookId]: Object.assign({ page: 0, status: 'pendiente' as const, updated: 0 }, s.books[bookId], patch, { updated: Date.now() }) } }))

  const finish = (bookId: string) => {
    update((s) => {
      const key = dayKey(now)
      const day = s.days[key] ?? emptyDay()
      const bonusId = `libro-${bookId}`
      const already = Object.values(s.days).some((d) => d.outcomes[bonusId])
      const outcomes = already ? day.outcomes : { ...day.outcomes, [bonusId]: { s: 'done' as const, xp: 300, attr: id, tier: 'normal' as const } }
      return {
        ...s,
        books: { ...s.books, [bookId]: Object.assign({ page: 0, updated: 0 }, s.books[bookId], { page: s.books[bookId]?.total ?? s.books[bookId]?.page ?? 0, status: 'terminado' as const, updated: Date.now() }) },
        days: { ...s.days, [key]: { ...day, outcomes } },
      }
    })
    toast('Libro cerrado · +300 XP', 'gold')
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    const target = uploadFor
    e.target.value = ''
    if (!f || !target) return
    if (f.type && f.type !== 'application/pdf') return toast('Solo se pueden subir PDF', 'bad')
    try {
      await putPdf(target, f)
      setBook(target, { hasPdf: true, status: 'leyendo', page: Math.max(1, state.books[target]?.page ?? 1) })
      update((s) => ({ ...s, currentBook: { ...s.currentBook, [id]: target } }))
      toast('PDF guardado en este dispositivo', 'gold')
    } catch {
      toast('No se ha podido guardar el PDF', 'bad')
    }
  }

  const addBook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const bid = `custom-${Date.now()}`
    update((s) => ({ ...s, customBooks: [...s.customBooks, { id: bid, title: title.trim(), author: author.trim() || 'Sin autor', attr: id, discipline: def.disciplines[0].id, why: 'Añadido por ti.' }] }))
    setTitle(''); setAuthor('')
    toast('Libro añadido', 'gold')
  }

  return (
    <Panel title="Biblioteca" testId="biblioteca">
      <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onFile} data-testid="pdf-input" />
      {books.length === 0 && <p className="empty">Sin libros todavía. Añade el primero abajo.</p>}
      {books.map((b) => {
        const p = state.books[b.id]
        const current = state.currentBook[id] === b.id
        const status = p?.status ?? 'pendiente'
        return (
          <div className="book" key={b.id} data-testid={`book-${b.id}`}>
            <div>
              <h4>{b.title}</h4>
              <p className="by">{b.author}</p>
            </div>
            <span className={`badge ${status === 'terminado' ? 'gold' : current ? 'on' : ''}`}>{status === 'terminado' ? 'Terminado' : current ? 'Libro actual' : status === 'leyendo' ? 'Leyendo' : 'Pendiente'}</span>
            <p className="why">{b.why}</p>
            {(p?.total || p?.page) ? (
              <div className="prog">
                <Bar value={p.page ?? 0} max={p.total ?? Math.max(p.page ?? 1, 1)} label={`Progreso de ${b.title}`} seg={24} />
                <span className="num">Página {p.page ?? 0}{p.total ? ` de ${p.total}` : ''}</span>
              </div>
            ) : null}
            <div className="acts">
              {p?.hasPdf ? (
                <button className="btn sm" onClick={() => onOpenBook(b.id)}><BookOpen size={18} aria-hidden /> Leer aquí</button>
              ) : (
                <button className="btn sm" onClick={() => { setUploadFor(b.id); fileRef.current?.click() }}><FilePdf size={18} aria-hidden /> Subir PDF</button>
              )}
              {!current && status !== 'terminado' && (
                <button className="btn sm ghost" onClick={() => { update((s) => ({ ...s, currentBook: { ...s.currentBook, [id]: b.id } })); setBook(b.id, { status: 'leyendo' }); toast(`Libro actual: ${b.title}`) }}>Libro actual</button>
              )}
              {status !== 'terminado' && <PageInput value={p?.page ?? 0} onSave={(v) => setBook(b.id, { page: v, status: 'leyendo' })} label={b.title} />}
              {status !== 'terminado' && (p?.page ?? 0) > 0 && <button className="btn sm gold" onClick={() => finish(b.id)}><CheckIcon size={18} aria-hidden /> Terminado</button>}
            </div>
          </div>
        )
      })}
      <form onSubmit={addBook} style={{ marginTop: 18 }}>
        <h3 className="sec">Añadir un libro</h3>
        <label className="field"><span>Título</span><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label className="field"><span>Autor</span><input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
        <button className="btn block" type="submit"><Plus size={18} aria-hidden /> Añadir a {def.name}</button>
      </form>
      <p className="hint" style={{ marginTop: 12 }}>Los PDF se guardan solo en este dispositivo. Si lees en papel o Kindle, apunta la página a mano.</p>
    </Panel>
  )
}

function PageInput({ value, onSave, label }: { value: number; onSave: (v: number) => void; label: string }) {
  const [v, setV] = useState(String(value || ''))
  return (
    <form className="inline" onSubmit={(e) => { e.preventDefault(); const n = parseInt(v, 10); if (n >= 0) onSave(n) }} style={{ flex: '1 1 200px' }}>
      <label className="field" style={{ margin: 0 }}>
        <span className="sr">Página actual de {label}</span>
        <input type="number" inputMode="numeric" min={0} placeholder="Página" value={v} onChange={(e) => setV(e.target.value)} aria-label={`Página actual de ${label}`} />
      </label>
      <button className="btn sm ghost" type="submit">Guardar</button>
    </form>
  )
}
