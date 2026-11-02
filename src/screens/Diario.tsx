import { useState } from 'react'
import { CaretLeft } from '@phosphor-icons/react'
import { missionsFor } from '../data/schedule'
import { DayRecord, dayKey, emptyDay } from '../engine/core'
import { useSystem } from '../store'
import { Panel, fmtDate } from '../ui/kit'

export function Diario() {
  const { state, now } = useSystem()
  const [viewing, setViewing] = useState<string | null>(null)
  const history = Object.entries(state.days).filter(([k]) => k < dayKey(now)).sort(([a], [b]) => b.localeCompare(a)).slice(0, 30)

  if (viewing) {
    const d = new Date(viewing + 'T12:00')
    return (
      <>
        <div className="topbar"><button className="back" onClick={() => setViewing(null)}><CaretLeft size={18} /> Diario</button></div>
        <DayView date={d} readOnly />
      </>
    )
  }
  return (
    <>
      <div className="topbar"><h1>Diario</h1><span className="sub">{fmtDate(now)}</span></div>
      <DayView date={now} />
      <Panel title="Historial">
        {history.length === 0 && <p className="empty">Aquí aparecerán tus días anteriores.</p>}
        <ul className="history">
          {history.map(([k, rec]) => {
            const net = Object.values(rec.outcomes).reduce((n, o) => n + o.xp, 0)
            return (
              <li key={k}>
                <button onClick={() => setViewing(k)}>
                  <span>{fmtDate(new Date(k + 'T12:00'))}</span>
                  <span className="muted">{rec.log.score ? `${rec.log.score}/10` : ''}</span>
                  <span className={net < 0 ? 'neg' : 'pos'}>{net > 0 ? '+' : ''}{net}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}

function DayView({ date, readOnly }: { date: Date; readOnly?: boolean }) {
  const { state, update, act } = useSystem()
  const key = dayKey(date)
  const rec: DayRecord = state.days[key] ?? emptyDay()
  const outs = Object.entries(rec.outcomes)
  const won = outs.filter(([, o]) => o.s === 'done')
  const lost = outs.filter(([, o]) => o.s === 'failed')
  const net = outs.reduce((n, [, o]) => n + o.xp, 0)
  const missions = missionsFor(date)
  const name = (id: string) => missions.find((m) => m.id === id)?.title ?? (id.startsWith('objetivo-') ? 'Objetivo del curro' : id.startsWith('libro-') ? 'Libro terminado' : id === 'penalizacion' ? 'Penalización' : id)
  const set = (patch: Partial<DayRecord['log']>) =>
    update((s) => {
      const day = s.days[key] ?? emptyDay()
      return { ...s, days: { ...s.days, [key]: { ...day, log: { ...day.log, ...patch } } } }
    })
  const registro = missions.find((m) => m.kind === 'registro')
  const closed = registro ? !!rec.outcomes[registro.id] : false
  const canClose = !!rec.log.score && !!(rec.log.worked || rec.log.failed || rec.log.tomorrow)

  return (
    <>
      <Panel title={readOnly ? fmtDate(date) : 'Resumen del día'} testId="resumen">
        <div className="summary">
          <div><span className="big">{won.length}</span><span>cumplidas</span></div>
          <div><span className="big neg">{lost.length}</span><span>fallidas</span></div>
          <div><span className={`big ${net < 0 ? 'neg' : ''}`}>{net > 0 ? '+' : ''}{net}</span><span>XP neta</span></div>
        </div>
        {won.length > 0 && <p className="muted" style={{ margin: '14px 0 0' }}>Cumplidas: {won.map(([id]) => name(id)).join(', ')}.</p>}
        {lost.length > 0 && <p className="warn" style={{ margin: '8px 0 0' }}>Fallidas: {lost.map(([id]) => name(id)).join(', ')}.</p>}
      </Panel>
      <Panel title="Registro" testId="registro">
        {readOnly ? (
          <div className="stack">
            <p className="mt0">Nota: {rec.log.score ?? 'sin nota'}{rec.log.score ? '/10' : ''}</p>
            {rec.log.worked && <p className="mt0"><b>Funcionó:</b> {rec.log.worked}</p>}
            {rec.log.failed && <p className="mt0"><b>Falló:</b> {rec.log.failed}</p>}
            {rec.log.tomorrow && <p className="mt0"><b>Mejora:</b> {rec.log.tomorrow}</p>}
            {rec.log.notes && <p className="mt0"><b>Notas:</b> {rec.log.notes}</p>}
          </div>
        ) : (
          <>
            <label className="field">
              <span>Nota del día: {rec.log.score ?? 'sin nota'}{rec.log.score ? '/10' : ''}</span>
              <input type="range" min={1} max={10} value={rec.log.score ?? 5} onChange={(e) => set({ score: Number(e.target.value) })} aria-label="Nota del día del 1 al 10" />
            </label>
            <Field label="Qué ha funcionado" value={rec.log.worked} onChange={(v) => set({ worked: v })} />
            <Field label="Qué ha fallado y por qué" value={rec.log.failed} onChange={(v) => set({ failed: v })} />
            <Field label="Una mejora para mañana" value={rec.log.tomorrow} onChange={(v) => set({ tomorrow: v })} />
            <Field label="Notas" value={rec.log.notes} onChange={(v) => set({ notes: v })} rows={4} />
            {registro && (closed ? (
              <p className="result done">Registro cerrado</p>
            ) : (
              <button className="btn gold block" disabled={!canClose} onClick={() => act(registro, date, 'done')}>Cerrar el registro del día</button>
            ))}
            {registro && !closed && !canClose && <p className="hint" style={{ marginTop: 10 }}>Pon una nota y escribe al menos una respuesta para cerrarlo.</p>}
          </>
        )}
      </Panel>
    </>
  )
}

function Field({ label, value, onChange, rows = 2 }: { label: string; value?: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
