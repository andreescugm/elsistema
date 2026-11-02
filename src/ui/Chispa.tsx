import { useEffect, useState } from 'react'
import { ATTRS, AttrId, attrById } from '../data/attrs'
import { MSG, pick } from '../data/messages'
import { atrophied, dayNumber, idleDays, totals } from '../engine/core'
import { recommend } from '../engine/recommend'
import { useSystem } from '../store'
import { Panel } from './kit'
import { RecDetail } from './RecCard'

export type ChispaMode = 'bajo' | 'aburrido' | 'quemado'

export function Chispa({ mode, onClose, onOpenBook, onSettings }: {
  mode: ChispaMode; onClose: () => void; onOpenBook: (id: string) => void; onSettings: () => void
}) {
  const { now } = useSystem()
  const seed = dayNumber(now) + now.getHours()
  const titles = { bajo: 'Recupera la chispa', aburrido: 'Tiempo sin dueño', quemado: 'Recarga' }

  return (
    <div className="overlay" onClick={onClose} data-testid="chispa">
      <div className="popup" role="dialog" aria-modal="true" aria-label={titles[mode]} onClick={(e) => e.stopPropagation()}>
        <Panel title={titles[mode]} live className="sweep">
          <p className="p-title" style={{ fontSize: 24 }}>{pick(MSG[mode], seed)}</p>
          {mode === 'bajo' && <Bajo onOpenBook={(id) => { onClose(); onOpenBook(id) }} onSettings={() => { onClose(); onSettings() }} />}
          {mode === 'aburrido' && <Aburrido onOpenBook={(id) => { onClose(); onOpenBook(id) }} />}
          {mode === 'quemado' && <Quemado />}
          <div className="actions" style={{ marginTop: 14 }}>
            <button className="btn ghost block" onClick={onClose}>Volver</button>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Bajo({ onOpenBook, onSettings }: { onOpenBook: (id: string) => void; onSettings: () => void }) {
    const { state, now } = useSystem()
    const t = totals(state, now)
    const days = Math.max(1, Math.round((now.getTime() - state.since) / 864e5) + 1)
    const done = Object.values(state.days).reduce((n, d) => n + Object.values(d.outcomes).filter((o) => o.s === 'done').length, 0)
    const finished = Object.values(state.books).filter((b) => b.status === 'terminado').length
    const neglected = [...ATTRS].filter((a) => a.id !== 'CREACION').sort((a, b) => idleDays(state, b.id, now) - idleDays(state, a.id, now))[0]
    const target: AttrId = neglected && atrophied(state, neglected.id, now) ? neglected.id : 'MENTE'
    const rec = recommend(state, target, 5, now, 7)
    return (
      <div className="stack">
        <div>
          <h3 className="sec">Por qué estás aquí</h3>
          {state.why ? <p className="mt0">{state.why}</p> : <button className="btn sm ghost" onClick={onSettings}>Escribe tu porqué</button>}
        </div>
        {state.letter && (
          <div>
            <h3 className="sec">Carta de tu yo de dentro de un año</h3>
            <p className="mt0 muted">{state.letter}</p>
          </div>
        )}
        <div className="summary">
          <div><span className="big">{days}</span><span>días en el Sistema</span></div>
          <div><span className="big">{done}</span><span>misiones cumplidas</span></div>
          <div><span className="big">{finished}</span><span>libros terminados</span></div>
        </div>
        <p className="muted mt0">Has acumulado {t.xp.toLocaleString('es-ES')} XP. No lo regales hoy.</p>
        <div>
          <h3 className="sec">Misión de arranque · 5 minutos</h3>
          <RecDetail rec={rec} onOpenBook={onOpenBook} />
        </div>
      </div>
    )
  }

function Aburrido({ onOpenBook }: { onOpenBook: (id: string) => void }) {
    const { state, now } = useSystem()
    const [mins, setMins] = useState(15)
    const opts: AttrId[] = mins <= 5 ? ['CARISMA', 'LENGUA'] : mins <= 15 ? ['CARISMA', 'PODER', 'LENGUA'] : ['CARISMA', 'MENTE', 'SABIDURIA']
    return (
      <div className="stack">
        <div className="tabs" role="tablist" aria-label="Tiempo disponible">
          {[5, 15, 30].map((m) => (
            <button key={m} role="tab" aria-selected={mins === m} onClick={() => setMins(m)}>{m} min</button>
          ))}
        </div>
        {opts.map((a, i) => (
          <div key={a}>
            <h3 className="sec">{attrById(a).name}</h3>
            <RecDetail rec={recommend(state, a, mins, now, 10 + i)} onOpenBook={onOpenBook} />
          </div>
        ))}
      </div>
    )
}

function Quemado() {
  const [left, setLeft] = useState(20 * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000)
    return () => clearInterval(id)
  }, [running])
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className="stack">
      <ul className="list-plain">
        <li>Agua y algo de comer.</li>
        <li>De pie, sal 5 minutos a que te dé el aire.</li>
        <li>Música tranquila, sin redes sociales.</li>
      </ul>
      <p className="big" style={{ textAlign: 'center' }} aria-live="polite">{mm}:{ss}</p>
      {left === 0 ? (
        <p className="result done">Recarga completa. Vuelve a la misión.</p>
      ) : (
        <button className="btn block" onClick={() => setRunning((r) => !r)}>{running ? 'Pausar' : 'Empezar 20 minutos'}</button>
      )}
    </div>
  )
}
