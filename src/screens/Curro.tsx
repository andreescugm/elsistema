import { useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import { COUNTERS } from '../data/schedule'
import { bump, counterTotal, dayKey } from '../engine/core'
import { useSystem } from '../store'
import { Bar, Check, Panel } from '../ui/kit'

export function Curro() {
  const { state, now, update, toast } = useSystem()
  const key = dayKey(now)
  const day = state.days[key]
  const [text, setText] = useState('')
  const [time, setTime] = useState('')
  const today = state.agenda.filter((a) => a.date === key || (!a.done && a.date < key)).sort((a, b) => (a.time ?? '99').localeCompare(b.time ?? '99'))

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    update((s) => ({ ...s, agenda: [...s.agenda, { id: `t${Date.now()}`, text: text.trim(), time: time || undefined, date: key, done: false }] }))
    setText(''); setTime('')
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (6 - i))
    const rec = state.days[dayKey(d)]
    return { label: d.toLocaleDateString('es-ES', { weekday: 'narrow' }).toUpperCase(), calls: counterTotal(rec, 'llamadas'), visits: counterTotal(rec, 'visitas') }
  })
  const maxCalls = Math.max(COUNTERS.llamadas.target, ...week.map((w) => w.calls))

  return (
    <>
      <div className="topbar"><h1>Curro</h1><span className="sub">Objetivo 30 / 10</span></div>
      {(Object.keys(COUNTERS) as (keyof typeof COUNTERS)[]).map((g) => {
        const c = COUNTERS[g]
        const total = counterTotal(day, g)
        return (
          <Panel key={g} title={c.label} live={total < c.target} tone={total >= c.target ? 'gold' : undefined} testId={`counter-${g}`}>
            <div className="counter-head">
              <span className={`big ${total >= c.target ? 'hit' : ''}`} data-testid={`total-${g}`}>{total}</span>
              <span className="of">/ {c.target}</span>
            </div>
            <Bar value={total} max={c.target} tone={total >= c.target ? 'gold' : undefined} seg={c.target} label={`${c.label} de hoy`} />
            <ul className="counters">
              {c.types.map((t) => {
                const before = total
                return (
                  <li key={t}>
                    <span>{t}</span>
                    <button className="btn sm ghost" aria-label={`Restar ${c.label.toLowerCase()} de ${t.toLowerCase()}`} onClick={() => update((s) => bump(s, now, g, t, -1))}>-</button>
                    <b>{day?.counters[`${g}:${t}`] ?? 0}</b>
                    <button className="btn sm" aria-label={`Sumar ${c.label.toLowerCase()} de ${t.toLowerCase()}`} onClick={() => {
                      update((s) => bump(s, now, g, t, 1))
                      if (before + 1 === c.target) toast(`Objetivo de ${c.label.toLowerCase()} cumplido · +60 XP`, 'gold')
                    }}>+1</button>
                  </li>
                )
              })}
            </ul>
          </Panel>
        )
      })}

      <Panel title="Agenda" testId="agenda">
        {today.length === 0 && <p className="empty">Sin tareas. Apunta aquí lo pendiente y el Sistema te lo recuerda.</p>}
        <ul className="agenda">
          {today.map((a) => (
            <li key={a.id} className={a.done ? 'done' : ''}>
              <Check checked={a.done} label={`Hecho: ${a.text}`} onChange={() => update((s) => ({ ...s, agenda: s.agenda.map((x) => (x.id === a.id ? { ...x, done: !x.done, date: x.done ? x.date : key } : x)) }))} />
              <span className="txt">{a.time && <small>{a.time}</small>}{a.text}{a.date < key && !a.done ? <small style={{ color: 'var(--danger)' }}>Atrasada</small> : null}</span>
              <button className="icon-btn" aria-label={`Borrar ${a.text}`} onClick={() => update((s) => ({ ...s, agenda: s.agenda.filter((x) => x.id !== a.id) }))}><Trash size={18} /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={add}>
          <label className="field"><span>Nueva tarea</span><input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Llamar a la propietaria de Calle Mayor" /></label>
          <div className="inline">
            <label className="field" style={{ margin: 0 }}><span>Hora (opcional)</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
            <button className="btn" type="submit"><Plus size={18} aria-hidden /> Añadir</button>
          </div>
        </form>
      </Panel>

      <Panel title="Últimos 7 días">
        <div className="week" role="img" aria-label={`Llamadas por día: ${week.map((w) => w.calls).join(', ')}`}>
          {week.map((w, i) => (
            <div key={i}>
              <span className="num">{w.calls}</span>
              <i style={{ height: `${Math.max(2, (w.calls / maxCalls) * 80)}px` }} />
              <span>{w.label}</span>
            </div>
          ))}
        </div>
        <p className="hint" style={{ margin: '10px 0 0' }}>Llamadas por día. La línea a seguir es 30.</p>
      </Panel>
    </>
  )
}
