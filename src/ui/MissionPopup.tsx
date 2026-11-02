import { useMemo, useState } from 'react'
import { Mission, TIER_XP } from '../data/schedule'
import { attrById } from '../data/attrs'
import { correct, counterTotal, dayKey } from '../engine/core'
import { recommend } from '../engine/recommend'
import { useSystem } from '../store'
import { Check, Decode, Panel } from './kit'
import { RecDetail } from './RecCard'

export function MissionPopup({ m, date, onClose, onOpenBook, onGo }: {
  m: Mission
  date: Date
  onClose: () => void
  onOpenBook: (bookId: string) => void
  onGo: (where: 'entreno' | 'curro' | 'diario') => void
}) {
  const { state, now, act, update, toast } = useSystem()
  const o = state.days[dayKey(date)]?.outcomes[m.id]
  const xp = TIER_XP[m.tier]
  const [checks, setChecks] = useState<boolean[]>(() => (m.steps ?? []).map(() => false))
  const rec = useMemo(() => (m.learn ? recommend(state, m.learn.attr, m.learn.minutes, date) : undefined), [m, state, date])
  const isPenalty = m.kind === 'penalizacion'
  const urgent = isPenalty || m.tier === 'critica'
  const day = state.days[dayKey(date)]
  const failText = isPenalty ? '−200 XP' : xp.lose ? `${xp.lose} XP${m.tier === 'critica' ? ' y zona de penalización' : m.tier === 'normal' ? ' y penalización' : ''}` : 'Nada'

  return (
    <div className="overlay" onClick={onClose} data-testid="mission-popup">
      <div className={`popup ${urgent ? 'urgent' : ''}`} role="dialog" aria-modal="true" aria-labelledby="popup-title" onClick={(e) => e.stopPropagation()}>
        <Panel title={isPenalty ? 'Penalización' : m.tier === 'critica' ? 'Misión crítica' : 'Misión'} live className="sweep">
          <p className="p-time">{isPenalty ? 'Hoy, antes de las 23:00' : `${m.start} - ${m.end} · ${attrById(m.attr).name}`}</p>
          <h2 className="p-title" id="popup-title"><Decode text={m.title} /></h2>

          {rec && <RecDetail rec={rec} onOpenBook={(id) => { onClose(); onOpenBook(id) }} />}

          {m.steps && (
            <ul className="steps">
              {m.steps.map((s, i) => (
                <li key={s}>
                  <label>
                    <Check checked={checks[i]} disabled={!!o} label={s} onChange={() => setChecks((c) => c.map((v, j) => (j === i ? !v : v)))} />
                    <span>{s}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {m.note && <p className="note">{m.note}</p>}
          {m.kind === 'curro' && (
            <p className="note">Llevas {counterTotal(day, 'llamadas')}/30 llamadas y {counterTotal(day, 'visitas')}/10 visitas.</p>
          )}

          <dl className="reward">
            <div><dt>Recompensa</dt><dd>{isPenalty ? '0 XP' : `+${xp.win} XP`}</dd></div>
            <div><dt>Si fallas</dt><dd className="neg">{failText}</dd></div>
          </dl>

          {o ? (
            <>
              <p className={`result ${o.s}`}>{o.s === 'done' ? (o.late ? 'Cumplida (reportada tarde)' : 'Completada') : o.auto ? 'Vencida sin respuesta' : 'Fallida'} · {o.xp > 0 ? '+' : ''}{o.xp} XP</p>
              <div className="actions" style={{ marginTop: 12 }}>
                {o.s === 'failed' && o.auto && dayKey(date) === dayKey(now) && !isPenalty && (
                  <button className="btn gold block" onClick={() => { update((s) => correct(s, date, m, now)); toast(`Corregida · +${Math.round(xp.win / 2)} XP (mitad por reportar tarde)`, 'gold'); onClose() }}>Sí la hice, corregir</button>
                )}
                <button className="btn ghost block" onClick={onClose}>Cerrar</button>
              </div>
            </>
          ) : (
            <div className="actions">
              {m.kind === 'entreno' ? (
                <button className="btn block" onClick={() => { onClose(); onGo('entreno') }}>Abrir el entreno de hoy</button>
              ) : m.kind === 'curro' ? (
                <>
                  <button className="btn block" onClick={() => { onClose(); onGo('curro') }}>Abrir contadores</button>
                  <button className="btn gold block" onClick={() => { act(m, date, 'done'); onClose() }}>Bloque cumplido</button>
                </>
              ) : m.kind === 'registro' ? (
                <button className="btn block" onClick={() => { onClose(); onGo('diario') }}>Escribir el registro</button>
              ) : (
                <button className="btn gold block" onClick={() => { act(m, date, 'done', rec ? { disc: rec.discipline.id } : {}); onClose() }}>Completada</button>
              )}
              {m.tier !== 'libre' && <button className="btn danger ghost block" onClick={() => { act(m, date, 'failed'); onClose() }}>La he fallado</button>}
              <button className="btn ghost block" onClick={onClose}>Entendido</button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
