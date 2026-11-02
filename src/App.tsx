import { useEffect, useMemo, useState } from 'react'
import { ATTRS, COUNTERS, Mission, TIER_XP } from './data'
import {
  State, current, dayKey, dayMissions, emptyDay, isRed, level, load, rank, resolve, save, streak, sweep, toMin, totals,
} from './engine'

type Tab = 'estado' | 'misiones' | 'curro' | 'registro'

export default function App() {
  const [state, setState] = useState<State>(() => sweep(load(), new Date()))
  const [now, setNow] = useState(() => new Date())
  const [tab, setTab] = useState<Tab>('estado')
  const [popup, setPopup] = useState<Mission | null>(null)
  const [seen, setSeen] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => save(state), [state])
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date()
      setNow(n)
      setState((s) => sweep(s, n))
    }, 20_000)
    return () => clearInterval(t)
  }, [])

  const missions = useMemo(() => dayMissions(state, now), [state, now])
  const { active, upcoming } = current(missions, state, now)
  const red = isRed(state, now.getTime())

  // La ventana del Sistema aparece sola cuando entra una misión nueva.
  useEffect(() => {
    const id = active ? `${dayKey(now)}:${active.id}` : null
    if (active && id !== seen) {
      setPopup(active)
      setSeen(id)
    }
  }, [active, now, seen])

  const act = (m: Mission, r: 'done' | 'failed') => {
    const before = state.days[dayKey(now)]?.outcomes[m.id]
    if (before) return
    const next = resolve(state, now, m, r)
    const o = next.days[dayKey(now)].outcomes[m.id]
    setState(next)
    setPopup(null)
    setToast(r === 'done' ? `Misión completada · ${o.xp >= 0 ? '+' : ''}${o.xp} XP ${m.attr}` : `Misión fallida · ${o.xp} XP`)
    setTimeout(() => setToast(null), 2600)
  }

  return (
    <div className={`app ${red ? 'is-red' : ''}`}>
      <div className="backdrop" aria-hidden />
      <main className="screen">
        {red && (
          <div className="red-banner" role="status">
            <strong>Zona de penalización</strong>
            <span>XP ×0,5 · desbloqueos congelados · {hoursLeft(state.redUntil, now)} h</span>
          </div>
        )}
        {tab === 'estado' && <Estado state={state} now={now} />}
        {tab === 'misiones' && (
          <Misiones state={state} now={now} missions={missions} active={active} onOpen={setPopup}
            onNext={() => setPopup(active ?? upcoming[0] ?? null)} />
        )}
        {tab === 'curro' && <Curro state={state} now={now} setState={setState} />}
        {tab === 'registro' && <Registro state={state} now={now} missions={missions} setState={setState} />}
      </main>

      <nav className="dock" aria-label="Secciones">
        {(['estado', 'misiones', 'curro', 'registro'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {label(t)}
          </button>
        ))}
      </nav>

      {popup && <SystemPopup m={popup} state={state} now={now} onClose={() => setPopup(null)} onAct={act} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

const label = (t: Tab) => ({ estado: 'Estado', misiones: 'Misiones', curro: 'Curro', registro: 'Registro' })[t]
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)
const hoursLeft = (until: number, now: Date) => Math.max(0, Math.ceil((until - now.getTime()) / 3600000))

/* ---------- Ventana del Sistema ---------- */

function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      {title && <header className="panel-title"><span>{title}</span></header>}
      {children}
    </section>
  )
}

function Bar({ value, max, tone = 'cyan' }: { value: number; max: number; tone?: 'cyan' | 'gold' | 'red' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={`bar ${tone}`} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ---------- Estado ---------- */

function Estado({ state, now }: { state: State; now: Date }) {
  const t = totals(state)
  const lv = level(t.xp, 200)
  const r = rank(t.xp)
  const st = streak(state, now)
  return (
    <>
      <Panel title="Estado" className="status">
        <div className="status-head">
          <div className="rank-glyph" aria-label={`Rango ${r.current.id}`}><span>{r.current.id}</span></div>
          <div className="who">
            <p className="name">{state.player}</p>
            <p className="sub">Nivel <b>{lv.lvl}</b> · Racha <b>{st}</b> {st === 1 ? 'día' : 'días'}</p>
            <p className="sub">Título · <b>Recién despertado</b></p>
          </div>
        </div>
        <div className="xp-row">
          <span>XP</span>
          <Bar value={lv.into} max={lv.need} />
          <span className="num">{lv.into}/{lv.need}</span>
        </div>
        <div className="rank-next">
          <p>Siguiente rango: <b>{r.next.id}</b> · {t.xp.toLocaleString('es-ES')}/{r.next.xp.toLocaleString('es-ES')} XP</p>
          <Bar value={t.xp} max={r.next.xp} tone="gold" />
          <p className="trial">{r.trialReady ? 'Prueba de ascenso disponible: ' : 'Prueba de ascenso: '}{r.next.trial}</p>
        </div>
      </Panel>

      <Panel title="Atributos">
        <ul className="attrs">
          {ATTRS.map((a) => {
            const l = level(t.attrs[a.id], 60)
            return (
              <li key={a.id}>
                <div className="attr-top">
                  <span className="attr-name">{a.id}</span>
                  <span className="attr-lvl">Nv {l.lvl}</span>
                </div>
                <Bar value={l.into} max={l.need} />
                <span className="attr-desc">{a.desc}</span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </>
  )
}

/* ---------- Misiones ---------- */

function Misiones({ state, now, missions, active, onOpen, onNext }: {
  state: State; now: Date; missions: Mission[]; active?: Mission; onOpen: (m: Mission) => void; onNext: () => void
}) {
  const rec = state.days[dayKey(now)]
  const done = Object.values(rec?.outcomes ?? {}).filter((o) => o.s === 'done').length
  return (
    <>
      <Panel title="Misiones de hoy">
        <p className="lead">
          {cap(now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))} · {done}/{missions.length} completadas
        </p>
        <button className="cta" onClick={onNext}>¿Qué hago ahora?</button>
      </Panel>
      <ol className="timeline">
        {missions.map((m) => {
          const o = rec?.outcomes[m.id]
          const isNow = active?.id === m.id
          const status = o ? o.s : isNow ? 'now' : toMin(m.end) + 30 < now.getHours() * 60 + now.getMinutes() ? 'past' : 'todo'
          return (
            <li key={m.id} className={`q ${status} t-${m.tier}`}>
              <button onClick={() => onOpen(m)}>
                <span className="q-time">{m.id === 'penalizacion' ? '!' : m.start}</span>
                <span className="q-body">
                  <span className="q-title">{m.title}</span>
                  <span className="q-meta">{TIER_XP[m.tier].label} · {m.attr}</span>
                </span>
                <span className="q-state">
                  {o ? (o.s === 'done' ? `+${o.xp}` : `${o.xp}`) : isNow ? 'Ahora' : ''}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}

function SystemPopup({ m, state, now, onClose, onAct }: {
  m: Mission; state: State; now: Date; onClose: () => void; onAct: (m: Mission, r: 'done' | 'failed') => void
}) {
  const o = state.days[dayKey(now)]?.outcomes[m.id]
  const xp = TIER_XP[m.tier]
  const [checks, setChecks] = useState<boolean[]>(() => (m.steps ?? []).map(() => false))
  const isPenalty = m.id === 'penalizacion'
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`popup ${isPenalty || m.tier === 'critica' ? 'urgent' : ''}`} role="dialog" aria-modal="true"
        aria-label={m.title} onClick={(e) => e.stopPropagation()}>
        <Panel title={isPenalty ? 'Penalización' : m.tier === 'critica' ? 'Misión crítica' : 'Misión'}>
          <p className="popup-time">{isPenalty ? 'Hoy, antes de las 23:00' : `${m.start} – ${m.end}`}</p>
          <h2 className="popup-title">{m.title}</h2>
          {m.steps && (
            <ul className="steps">
              {m.steps.map((s, i) => (
                <li key={s}>
                  <label>
                    <input type="checkbox" checked={checks[i]} disabled={!!o}
                      onChange={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))} />
                    <span>{s}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {m.note && <p className="note">{m.note}</p>}
          <dl className="reward">
            <div><dt>Recompensa</dt><dd>{isPenalty ? '0 XP' : `+${xp.win} XP ${m.attr}`}</dd></div>
            <div><dt>Si fallas</dt><dd className="neg">{isPenalty ? '−200 XP' : xp.lose ? `${xp.lose} XP${m.tier === 'critica' ? ' · Zona de penalización' : m.tier === 'normal' ? ' · Penalización' : ''}` : 'Nada'}</dd></div>
          </dl>
          {o ? (
            <p className={`result ${o.s}`}>{o.s === 'done' ? 'Completada' : 'Fallida'} · {o.xp > 0 ? '+' : ''}{o.xp} XP</p>
          ) : (
            <div className="actions">
              <button className="cta" onClick={() => onAct(m, 'done')}>Completada</button>
              {m.tier !== 'libre' && <button className="ghost" onClick={() => onAct(m, 'failed')}>La he fallado</button>}
              <button className="ghost" onClick={onClose}>Aceptar</button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

/* ---------- Curro ---------- */

function Curro({ state, now, setState }: { state: State; now: Date; setState: (fn: (s: State) => State) => void }) {
  const key = dayKey(now)
  const rec = state.days[key] ?? emptyDay()
  const bump = (k: string, d: number) =>
    setState((s) => {
      const day = s.days[key] ?? emptyDay()
      const v = Math.max(0, (day.counters[k] ?? 0) + d)
      return { ...s, days: { ...s.days, [key]: { ...day, counters: { ...day.counters, [k]: v } } } }
    })
  return (
    <>
      {(Object.keys(COUNTERS) as (keyof typeof COUNTERS)[]).map((group) => {
        const g = COUNTERS[group]
        const total = g.types.reduce((n, t) => n + (rec.counters[`${group}:${t}`] ?? 0), 0)
        return (
          <Panel key={group} title={group === 'llamadas' ? 'Llamadas' : 'Visitas'}>
            <div className="counter-head">
              <span className={`big ${total >= g.target ? 'hit' : ''}`}>{total}</span>
              <span className="of">/ {g.target}</span>
            </div>
            <Bar value={total} max={g.target} tone={total >= g.target ? 'gold' : 'cyan'} />
            <ul className="counters">
              {g.types.map((t) => {
                const k = `${group}:${t}`
                return (
                  <li key={t}>
                    <span>{t}</span>
                    <button className="ghost sm" aria-label={`Restar ${t}`} onClick={() => bump(k, -1)}>−</button>
                    <b>{rec.counters[k] ?? 0}</b>
                    <button className="cta sm" aria-label={`Sumar ${t}`} onClick={() => bump(k, 1)}>+1</button>
                  </li>
                )
              })}
            </ul>
          </Panel>
        )
      })}
    </>
  )
}

/* ---------- Registro ---------- */

function Registro({ state, now, missions, setState }: {
  state: State; now: Date; missions: Mission[]; setState: (fn: (s: State) => State) => void
}) {
  const key = dayKey(now)
  const rec = state.days[key] ?? emptyDay()
  const outs = Object.entries(rec.outcomes)
  const won = outs.filter(([, o]) => o.s === 'done')
  const lost = outs.filter(([, o]) => o.s === 'failed')
  const net = outs.reduce((n, [, o]) => n + o.xp, 0)
  const name = (id: string) => missions.find((m) => m.id === id)?.title ?? id
  const set = (patch: Partial<typeof rec.log>) =>
    setState((s) => {
      const day = s.days[key] ?? emptyDay()
      return { ...s, days: { ...s.days, [key]: { ...day, log: { ...day.log, ...patch } } } }
    })
  return (
    <>
      <Panel title="Resumen del día">
        <div className="summary">
          <div><span className="big">{won.length}</span><span>completadas</span></div>
          <div><span className="big neg">{lost.length}</span><span>fallidas</span></div>
          <div><span className={`big ${net < 0 ? 'neg' : ''}`}>{net > 0 ? '+' : ''}{net}</span><span>XP neta</span></div>
        </div>
        {lost.length > 0 && <p className="note">Fallidas: {lost.map(([id]) => name(id)).join(', ')}</p>}
      </Panel>
      <Panel title="Registro">
        <label className="field">
          <span>Nota del día · {rec.log.score ?? '—'}/10</span>
          <input type="range" min={1} max={10} value={rec.log.score ?? 5} onChange={(e) => set({ score: Number(e.target.value) })} />
        </label>
        <Field label="Qué ha funcionado" value={rec.log.worked} onChange={(v) => set({ worked: v })} />
        <Field label="Qué ha fallado y por qué" value={rec.log.failed} onChange={(v) => set({ failed: v })} />
        <Field label="Una mejora para mañana" value={rec.log.tomorrow} onChange={(v) => set({ tomorrow: v })} />
        <Field label="Notas" value={rec.log.notes} onChange={(v) => set({ notes: v })} rows={4} />
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
