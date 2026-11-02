import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { House, Sword, Lightning, Phone, Notebook } from '@phosphor-icons/react'
import { AttrId, BOOKS } from './data/attrs'
import { Mission } from './data/schedule'
import { current, dayKey, dayMissions, isRed, toMin } from './engine/core'
import { allBooks } from './engine/recommend'
import { SystemProvider, useSystem } from './store'
import { Particles } from './ui/kit'
import { MissionPopup } from './ui/MissionPopup'
import { Chispa, ChispaMode } from './ui/Chispa'
import { WhatNow } from './ui/WhatNow'
import { Estado } from './screens/Estado'
import { Misiones } from './screens/Misiones'
import { AtributosList, AtributoDetalle } from './screens/Atributos'
import { Curro } from './screens/Curro'
import { Diario } from './screens/Diario'
import { Ajustes } from './screens/Ajustes'

const Reader = lazy(() => import('./ui/Reader').then((m) => ({ default: m.Reader })))

type Tab = 'estado' | 'misiones' | 'atributos' | 'curro' | 'diario'
const TABS: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: 'estado', label: 'Estado', Icon: House },
  { id: 'misiones', label: 'Misiones', Icon: Sword },
  { id: 'atributos', label: 'Atributos', Icon: Lightning },
  { id: 'curro', label: 'Curro', Icon: Phone },
  { id: 'diario', label: 'Diario', Icon: Notebook },
]

export default function App() {
  return (
    <SystemProvider>
      <Shell />
    </SystemProvider>
  )
}

function Shell() {
  const { state, now, toasts, levelUp } = useSystem()
  const [tab, setTab] = useState<Tab>('estado')
  const [attr, setAttr] = useState<{ id: AttrId; tab?: 'entreno' } | null>(null)
  const [settings, setSettings] = useState(false)
  const [popup, setPopup] = useState<{ m: Mission; date: Date } | null>(null)
  const [chispa, setChispa] = useState<ChispaMode | null>(null)
  const [reading, setReading] = useState<string | null>(null)
  const [whatNowOpen, setWhatNowOpen] = useState(false)
  const seen = useRef<string | null>(null)
  const red = isRed(state, now.getTime())

  useEffect(() => {
    document.documentElement.style.setProperty('--particle', red ? '255, 64, 96' : '60, 200, 255')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', red ? '#14040a' : '#050810')
  }, [red])

  // La misión que entra en su hora aparece sola (una vez por misión y día).
  const { active } = current(dayMissions(state, now), state, now)
  useEffect(() => {
    if (!active) return
    const started = now.getHours() * 60 + now.getMinutes() - toMin(active.start)
    if (active.kind !== 'penalizacion' && started > 15) return // solo salta sola en sus primeros 15 min
    const id = `${dayKey(now)}:${active.id}`
    if (seen.current === id) return
    seen.current = id
    if (!reading) setPopup({ m: active, date: now })
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState === 'hidden') {
      navigator.serviceWorker?.getRegistration().then((reg) =>
        reg?.showNotification(`${active.tier === 'critica' ? '[MISIÓN CRÍTICA]' : '[MISIÓN]'} ${active.title}`, { body: active.note ?? `${active.start} - ${active.end}`, tag: id, icon: 'icon.svg' }),
      ).catch(() => undefined)
    }
  }, [active, now, reading])

  const go = (t: Tab) => { setTab(t); setAttr(null); setSettings(false); window.scrollTo({ top: 0 }) }
  const openBook = (bookId: string) => {
    const b = allBooks(state).find((x) => x.id === bookId)
    if (state.books[bookId]?.hasPdf) setReading(bookId)
    else if (b) { setTab('atributos'); setSettings(false); setAttr({ id: b.attr }); setTimeout(() => document.querySelector<HTMLElement>(`[data-testid="book-${bookId}"]`)?.scrollIntoView({ block: 'center' }), 50) }
  }
  const onGo = (where: 'entreno' | 'curro' | 'diario') => {
    if (where === 'entreno') { setTab('atributos'); setSettings(false); setAttr({ id: 'FUERZA', tab: 'entreno' }) }
    else go(where)
  }
  const bookTitle = reading ? (allBooks(state).find((b) => b.id === reading) ?? BOOKS[0]).title : ''

  return (
    <div className={`app ${red ? 'is-red' : ''}`}>
      <div className="bg" aria-hidden><div className="bg-glow" /><div className="bg-grid" /><Particles /></div>
      <div className="scan" aria-hidden />
      <main className="screen" key={`${tab}-${attr?.id ?? ''}-${settings}`}>
        {settings ? (
          <Ajustes onBack={() => setSettings(false)} />
        ) : tab === 'estado' ? (
          <Estado onOpenMission={(m) => setPopup({ m, date: now })} onChispa={setChispa} onSettings={() => setSettings(true)} onWhatNow={() => setWhatNowOpen(true)} />
        ) : tab === 'misiones' ? (
          <Misiones onOpen={(m, date) => setPopup({ m, date })} />
        ) : tab === 'atributos' ? (
          attr ? <AtributoDetalle id={attr.id} initialTab={attr.tab} onBack={() => setAttr(null)} onOpenBook={openBook} /> : <AtributosList onOpen={(id) => setAttr({ id })} />
        ) : tab === 'curro' ? (
          <Curro />
        ) : (
          <Diario />
        )}
      </main>

      <nav className="dock" aria-label="Secciones">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} aria-current={tab === id && !settings ? 'page' : undefined} onClick={() => go(id)}>
            <Icon size={24} weight={tab === id ? 'fill' : 'regular'} aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {popup && <MissionPopup key={popup.m.id} m={popup.m} date={popup.date} onClose={() => setPopup(null)} onOpenBook={openBook} onGo={onGo} />}
      {whatNowOpen && <WhatNow onClose={() => setWhatNowOpen(false)} onOpenMission={(m) => setPopup({ m, date: now })} onOpenBook={openBook} />}
      {chispa && <Chispa mode={chispa} onClose={() => setChispa(null)} onOpenBook={openBook} onSettings={() => { setSettings(true) }} />}
      {reading && <Suspense fallback={<div className="reader"><p className="empty" style={{ alignSelf: 'center' }}>Abriendo el libro…</p></div>}><Reader bookId={reading} title={bookTitle} onClose={() => setReading(null)} /></Suspense>}
      {toasts.slice(-1).map((t) => <div key={t.id} className={`toast ${t.tone === 'gold' ? 'gold' : t.tone === 'bad' ? 'bad' : ''}`} role="status">{t.text}</div>)}
      {levelUp && <div className="levelup" role="status"><div>NIVEL {levelUp}<small>Has subido de nivel</small></div></div>}
    </div>
  )
}
