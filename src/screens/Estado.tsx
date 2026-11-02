import { Gear, Lightning, BatteryLow, Hourglass, Fire } from '@phosphor-icons/react'
import { ATTRS } from '../data/attrs'
import { MSG, pick } from '../data/messages'
import { ATTR_BASE, GLOBAL_BASE, dayNumber, isRed, redUntil, level, rank, streak, totals } from '../engine/core'
import { whatNow } from '../engine/recommend'
import { useSystem } from '../store'
import { Bar, Panel, Radar } from '../ui/kit'
import { Mission } from '../data/schedule'
import type { ChispaMode } from '../ui/Chispa'

export function Estado({ onOpenMission, onChispa, onSettings, onWhatNow }: {
  onOpenMission: (m: Mission) => void
  onChispa: (m: ChispaMode) => void
  onSettings: () => void
  onWhatNow: () => void
}) {
  const { state, now } = useSystem()
  const t = totals(state, now)
  const lv = level(t.xp, GLOBAL_BASE)
  const r = rank(state, t.xp)
  const st = streak(state, now)
  const red = isRed(state, now.getTime())
  const advice = whatNow(state, now)
  const greet = now.getHours() < 12 ? MSG.mañana : now.getHours() >= 20 ? MSG.noche : st >= 3 ? MSG.racha : MSG.bajo
  const attrLv = ATTRS.map((a) => level(t.attrs[a.id], ATTR_BASE).lvl)

  return (
    <>
      <div className="topbar">
        <div>
          <h1>EL SISTEMA</h1>
          <span className="sub">{red ? pick(MSG.rojo, dayNumber(now)) : pick(greet, dayNumber(now))}</span>
        </div>
        <button className="icon-btn" onClick={onSettings} aria-label="Ajustes"><Gear size={22} /></button>
      </div>

      {red && (
        <div className="banner" role="status">
          <strong>Zona de penalización</strong>
          <span>XP ×0,5 · desbloqueos congelados · quedan {Math.ceil((redUntil(state) - now.getTime()) / 3600000)} h</span>
        </div>
      )}

      <Panel title="Estado" live className="hover-float" testId="status">
        <div className="status-top">
          <div className="rank" aria-label={`Rango ${r.current.id}`}><span>{r.current.id}</span></div>
          <div className="who">
            <p className="name">{state.player}</p>
            <div className="who-row">
              <div className="lvl"><b>{lv.lvl}</b><small>Nivel</small></div>
              <div>
                <p className="meta">Título <b>{r.current.title}</b></p>
                <p className="meta"><Fire size={14} weight="fill" aria-hidden /> Racha <b>{st}</b> {st === 1 ? 'día' : 'días'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="xp">
          <span>XP</span>
          <Bar value={lv.into} max={lv.need} label="Experiencia hacia el siguiente nivel" />
          <span className="num">{lv.into}/{lv.need}</span>
        </div>
        <div className="next-rank">
          {r.next ? (
            <>
              <p>Siguiente rango <b>{r.next.id}</b> · {t.xp.toLocaleString('es-ES')} / {r.next.xp.toLocaleString('es-ES')} XP</p>
              <Bar value={t.xp} max={r.next.xp} tone="gold" seg={30} label="Experiencia hacia el siguiente rango" />
              <p>{r.trialReady ? 'Prueba de ascenso disponible en Ajustes: ' : 'Prueba de ascenso: '}{r.next.trial}</p>
            </>
          ) : <p>Rango máximo alcanzado.</p>}
        </div>
      </Panel>

      <Panel title="Ahora" className="now-card" testId="now">
        <p className="when">{advice.main.mission ? `${advice.main.mission.start} - ${advice.main.mission.end}` : 'Sin misión activa'}</p>
        <h2>{advice.main.title}</h2>
        <p>{advice.main.rec ? advice.main.rec.drill : advice.main.detail}</p>
        <div className="row">
          {advice.main.mission && <button className="btn" onClick={() => onOpenMission(advice.main.mission!)}>Ver misión</button>}
          <button className="btn ghost" onClick={onWhatNow}>¿Qué hago ahora?</button>
        </div>
      </Panel>

      <div className="chispa" role="group" aria-label="Cómo estás">
        <button className="btn ghost" onClick={() => onChispa('bajo')}><BatteryLow size={24} weight="duotone" aria-hidden />Estoy bajo</button>
        <button className="btn ghost" onClick={() => onChispa('aburrido')}><Hourglass size={24} weight="duotone" aria-hidden />Me aburro</button>
        <button className="btn ghost" onClick={() => onChispa('quemado')}><Lightning size={24} weight="duotone" aria-hidden />Estoy quemado</button>
      </div>

      <Panel title="Atributos">
        <div className="radar-wrap">
          <Radar values={attrLv} max={Math.max(5, ...attrLv)} labels={ATTRS.map((a) => a.name.toUpperCase())} />
        </div>
      </Panel>
    </>
  )
}
