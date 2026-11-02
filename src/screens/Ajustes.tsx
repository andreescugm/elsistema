import { useRef, useState } from 'react'
import { CaretLeft, Bell, CalendarPlus, DownloadSimple, UploadSimple, Copy } from '@phosphor-icons/react'
import { RANKS } from '../data/schedule'
import { ATTR_BASE, GLOBAL_BASE, KEY, State, counterTotal, dayKey, fresh, level, migrate, rank, streak, totals } from '../engine/core'
import { useSystem } from '../store'
import { Panel } from '../ui/kit'
import { ATTRS } from '../data/attrs'

export function Ajustes({ onBack }: { onBack: () => void }) {
  const { state, now, update, toast } = useSystem()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState('')
  const [perm, setPerm] = useState<string>(() => (typeof Notification === 'undefined' ? 'unsupported' : Notification.permission))
  const t = totals(state, now)
  const r = rank(state, t.xp)
  const icsUrl = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}avisos.ics`

  const askNotif = async () => {
    if (typeof Notification === 'undefined') return toast('Este navegador no permite avisos. En iPhone, instala la app en la pantalla de inicio.', 'bad')
    const p = await Notification.requestPermission()
    setPerm(p)
    if (p === 'granted') toast('Avisos activados', 'gold')
  }
  const testNotif = async () => {
    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      if (reg) await reg.showNotification('[MISIÓN] Prueba del Sistema', { body: 'Así te llegarán los avisos mientras la app esté abierta.', icon: 'icon.svg' })
      else new Notification('[MISIÓN] Prueba del Sistema', { body: 'Así te llegarán los avisos mientras la app esté abierta.' })
    } catch {
      toast('No se ha podido mostrar el aviso', 'bad')
    }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `el-sistema-${dayKey(now)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    toast('Copia descargada', 'gold')
  }
  const copyJson = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(state)); toast('Copia en el portapapeles', 'gold') } catch { toast('No se ha podido copiar', 'bad') }
  }
  const importJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const data = JSON.parse(await f.text())
      if (!data || typeof data !== 'object' || !('days' in data)) throw new Error()
      update(() => migrate(data, now.getTime()))
      toast('Copia restaurada', 'gold')
    } catch {
      toast('Ese archivo no es una copia de EL SISTEMA', 'bad')
    }
  }

  // Pruebas de ascenso: D y C se comprueban solas; B, A y S las confirmas tú.
  const next = r.next
  const st = streak(state, now)
  const goodDays = Array.from({ length: 28 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - i - 1); return state.days[dayKey(d)] })
    .filter((d) => counterTotal(d, 'llamadas') >= 30 && counterTotal(d, 'visitas') >= 10).length
  const minAttr = Math.min(...ATTRS.map((a) => level(t.attrs[a.id], ATTR_BASE).lvl))
  const checks: Record<string, { label: string; ok: boolean }[]> = {
    D: [{ label: `14 días seguidos sin fallar una crítica (${st}/14)`, ok: st >= 14 }],
    C: [{ label: `30 días de racha (${st}/30)`, ok: st >= 30 }, { label: `20 días con 30/10 en las últimas 4 semanas (${goodDays}/20)`, ok: goodDays >= 20 }],
    B: [{ label: `Todos los atributos en nivel 10 (mínimo actual ${minAttr})`, ok: minAttr >= 10 }],
  }
  const trialChecks = next ? checks[next.id] : undefined
  const trialOk = !!next && t.xp >= next.xp && (trialChecks ? trialChecks.every((c) => c.ok) : true)

  return (
    <>
      <div className="topbar"><button className="back" onClick={onBack}><CaretLeft size={18} /> Estado</button><span className="sub">Ajustes</span></div>

      <Panel title="Jugador">
        <label className="field"><span>Nombre</span><input type="text" value={state.player} onChange={(e) => update((s) => ({ ...s, player: e.target.value }))} /></label>
        <label className="field"><span>Por qué haces esto</span><textarea rows={3} value={state.why} onChange={(e) => update((s) => ({ ...s, why: e.target.value }))} placeholder="Escríbelo con tus palabras. Te lo enseñaré cuando estés bajo." /></label>
        <label className="field"><span>Carta de tu yo de dentro de un año</span><textarea rows={4} value={state.letter} onChange={(e) => update((s) => ({ ...s, letter: e.target.value }))} /></label>
      </Panel>

      <Panel title="Prueba de ascenso" tone="gold" testId="trial">
        {next ? (
          <>
            <p className="mt0">Rango {r.current.id} → <b>{next.id}</b>. Necesitas {next.xp.toLocaleString('es-ES')} XP (tienes {t.xp.toLocaleString('es-ES')}).</p>
            <p className="muted">{next.trial}</p>
            {trialChecks && <ul className="list-plain">{trialChecks.map((c) => <li key={c.label} style={{ color: c.ok ? 'var(--gold)' : undefined }}>{c.label}</li>)}</ul>}
            <button className="btn gold block" style={{ marginTop: 14 }} disabled={!trialOk} onClick={() => { update((s) => ({ ...s, rankTrials: { ...s.rankTrials, [next.id]: true } })); toast(`Ascenso a rango ${next.id}`, 'gold') }}>
              {trialOk ? `Ascender a rango ${next.id}` : 'Prueba bloqueada'}
            </button>
          </>
        ) : <p className="mt0">Has alcanzado el rango S.</p>}
        <p className="hint" style={{ marginTop: 12 }}>Rangos: {RANKS.map((x) => `${x.id} ${x.xp.toLocaleString('es-ES')}`).join(' · ')} XP. Nivel global {level(t.xp, GLOBAL_BASE).lvl}.</p>
      </Panel>

      <Panel title="Avisos">
        <p className="mt0 muted">Con la app abierta, cada misión salta sola. Para que te avise con la app cerrada, añade el calendario de misiones: cada evento trae su alarma y lo concreto que tienes que hacer.</p>
        <div className="stack">
          <a className="btn block" style={{ textDecoration: 'none' }} href={icsUrl.replace(/^https?:/, 'webcal:')}><CalendarPlus size={20} aria-hidden /> Suscribirme al calendario</a>
          <a className="btn ghost block" style={{ textDecoration: 'none' }} href={icsUrl} download="el-sistema-avisos.ics"><DownloadSimple size={20} aria-hidden /> Descargar avisos (.ics)</a>
          <p className="hint" style={{ margin: 0 }}>En iPhone, si te suscribes: Ajustes · Calendario · Cuentas · Calendarios suscritos · EL SISTEMA, y desactiva "Eliminar alertas". Si lo descargas e importas, las alertas se quedan siempre.</p>
          <button className="btn ghost block" onClick={askNotif} disabled={perm === 'granted'}><Bell size={20} aria-hidden /> {perm === 'granted' ? 'Avisos del navegador activados' : 'Activar avisos del navegador'}</button>
          {perm === 'granted' && <button className="btn ghost block" onClick={testNotif}>Probar un aviso</button>}
        </div>
      </Panel>

      <Panel title="Copia de seguridad">
        <p className="mt0 muted">Tus datos viven en este dispositivo. Haz una copia cada semana.</p>
        <div className="stack">
          <button className="btn block" onClick={exportJson}><DownloadSimple size={20} aria-hidden /> Descargar copia</button>
          <button className="btn ghost block" onClick={copyJson}><Copy size={20} aria-hidden /> Copiar al portapapeles</button>
          <button className="btn ghost block" onClick={() => fileRef.current?.click()}><UploadSimple size={20} aria-hidden /> Restaurar desde archivo</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importJson} data-testid="import-input" />
        </div>
      </Panel>

      <Panel title="Empezar de cero" tone="danger">
        <p className="mt0 muted">Borra toda la experiencia, el historial y el progreso de lectura. Escribe BORRAR para confirmar.</p>
        <div className="inline">
          <label className="field" style={{ margin: 0 }}><span className="sr">Confirmación</span><input type="text" value={confirmReset} onChange={(e) => setConfirmReset(e.target.value)} aria-label="Escribe BORRAR para confirmar" /></label>
          <button className="btn danger" disabled={confirmReset !== 'BORRAR'} onClick={() => { try { localStorage.removeItem(KEY) } catch { /* nada */ } update(() => fresh(now.getTime()) as State); setConfirmReset(''); toast('Sistema reiniciado') }}>Borrar</button>
        </div>
      </Panel>
    </>
  )
}
