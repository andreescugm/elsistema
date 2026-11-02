import { Mission } from '../data/schedule'
import { whatNow } from '../engine/recommend'
import { useSystem } from '../store'
import { Decode, Panel } from './kit'
import { RecDetail } from './RecCard'

/** "¿Qué hago ahora?": una orden concreta y dos alternativas. */
export function WhatNow({ onClose, onOpenMission, onOpenBook }: { onClose: () => void; onOpenMission: (m: Mission) => void; onOpenBook: (id: string) => void }) {
  const { state, now } = useSystem()
  const a = whatNow(state, now)
  return (
    <div className="overlay" onClick={onClose} data-testid="what-now">
      <div className="popup" role="dialog" aria-modal="true" aria-label="Qué hago ahora" onClick={(e) => e.stopPropagation()}>
        <Panel title="Orden del Sistema" live className="sweep">
          <p className="p-time">{a.main.mission ? `${a.main.mission.start} - ${a.main.mission.end}` : 'Ahora'}</p>
          <h2 className="p-title"><Decode text={a.main.title} /></h2>
          {a.main.rec ? <RecDetail rec={a.main.rec} onOpenBook={(id) => { onClose(); onOpenBook(id) }} /> : <p className="note">{a.main.detail}</p>}
          {a.main.mission && <button className="btn block" onClick={() => { onClose(); onOpenMission(a.main.mission!) }}>Abrir la misión</button>}
          <h3 className="sec" style={{ marginTop: 18 }}>Si no te apetece, tienes estas dos</h3>
          {a.alternatives.map((alt) => (
            <div key={alt.title} style={{ marginBottom: 8 }}>
              <p className="mt0" style={{ fontWeight: 600 }}>{alt.title}</p>
              {alt.rec ? <RecDetail rec={alt.rec} onOpenBook={(id) => { onClose(); onOpenBook(id) }} /> : <p className="note">{alt.detail}</p>}
            </div>
          ))}
          <button className="btn ghost block" onClick={onClose}>Entendido</button>
        </Panel>
      </div>
    </div>
  )
}
