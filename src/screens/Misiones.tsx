import { useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { attrById } from '../data/attrs'
import { Mission, TIER_XP } from '../data/schedule'
import { current, dayKey, dayMissions, toMin } from '../engine/core'
import { useSystem } from '../store'
import { fmtDate } from '../ui/kit'

export function Misiones({ onOpen }: { onOpen: (m: Mission, date: Date) => void }) {
  const { state, now } = useSystem()
  const [offset, setOffset] = useState(0)
  const date = new Date(now)
  date.setDate(date.getDate() + offset)
  const missions = dayMissions(state, date)
  const rec = state.days[dayKey(date)]
  const active = offset === 0 ? current(missions, state, now).active : undefined
  const done = missions.filter((m) => rec?.outcomes[m.id]?.s === 'done').length
  const t = now.getHours() * 60 + now.getMinutes()

  return (
    <>
      <div className="topbar"><h1>Misiones</h1><span className="sub">{done}/{missions.length} completadas</span></div>
      <div className="daynav">
        <button className="icon-btn" onClick={() => setOffset((o) => o - 1)} aria-label="Día anterior"><CaretLeft size={20} /></button>
        <p>{offset === 0 ? 'Hoy · ' : offset === 1 ? 'Mañana · ' : offset === -1 ? 'Ayer · ' : ''}{fmtDate(date)}</p>
        <button className="icon-btn" onClick={() => setOffset((o) => o + 1)} aria-label="Día siguiente"><CaretRight size={20} /></button>
      </div>
      <ol className="timeline">
        {missions.map((m) => {
          const o = rec?.outcomes[m.id]
          const isNow = active?.id === m.id
          const past = offset < 0 || (offset === 0 && toMin(m.end) + 30 < t)
          const cls = o ? o.s : isNow ? 'now' : past ? 'gone' : ''
          return (
            <li key={m.id} className={`q ${cls} ${m.tier}`}>
              <button onClick={() => onOpen(m, date)} aria-label={`${m.title}, ${m.start}`}>
                <span className="q-time">{m.kind === 'penalizacion' ? '!' : m.start}</span>
                <span>
                  <span className="q-title">{m.title}</span>
                  <span className="q-meta"><em>{TIER_XP[m.tier].label}</em> · {attrById(m.attr).name}{m.learn ? ' · con plan concreto' : ''}</span>
                </span>
                <span className="q-state">{o ? `${o.xp > 0 ? '+' : ''}${o.xp}` : isNow ? 'Ahora' : ''}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}
