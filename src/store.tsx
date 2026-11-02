import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Mission } from './data/schedule'
import { GLOBAL_BASE, State, dayKey, level, load, resolve, save, sweep, totals, ResolveOpts } from './engine/core'

export type Tone = 'info' | 'gold' | 'bad'
interface Toast { id: number; text: string; tone: Tone }

interface Ctx {
  state: State
  now: Date
  update: (fn: (s: State) => State) => void
  act: (m: Mission, date: Date, r: 'done' | 'failed', opts?: ResolveOpts) => void
  toast: (text: string, tone?: Tone) => void
  toasts: Toast[]
  levelUp: number | null
}

const SystemCtx = createContext<Ctx | null>(null)

/** Reloj de la app. En pruebas se puede fijar con ?t=2026-11-03T08:52. */
function clock() {
  try {
    const t = new URLSearchParams(location.search).get('t')
    if (t) {
      const base = Date.parse(t)
      const started = Date.now()
      if (!Number.isNaN(base)) return () => new Date(base + (Date.now() - started))
    }
  } catch {
    /* sin location */
  }
  return () => new Date()
}

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const getNow = useRef(clock()).current
  const [state, setState] = useState<State>(() => { const n = getNow(); return sweep(load(n.getTime()), n) })
  const [now, setNow] = useState(getNow)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const lastLevel = useRef(level(totals(state, now).xp, GLOBAL_BASE).lvl)

  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => save(state), [state])
  useEffect(() => {
    const lvl = level(totals(state, now).xp, GLOBAL_BASE).lvl
    if (lvl > lastLevel.current) {
      setLevelUp(lvl)
      setTimeout(() => setLevelUp(null), 2300)
    }
    lastLevel.current = lvl
  }, [state, now])
  useEffect(() => {
    const t = setInterval(() => {
      const n = getNow()
      setNow(n)
      setState((s) => sweep(s, n))
    }, 15000)
    return () => clearInterval(t)
  }, [getNow])

  const toast = useCallback((text: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2700)
  }, [])

  const update = useCallback((fn: (s: State) => State) => {
    const next = fn(stateRef.current)
    stateRef.current = next
    setState(next)
  }, [])

  const act = useCallback(
    (m: Mission, date: Date, r: 'done' | 'failed', opts: ResolveOpts = {}) => {
      const prev = stateRef.current
      const next = resolve(prev, date, m, r, { ...opts, now: getNow().getTime() })
      if (next === prev) return
      stateRef.current = next
      setState(next)
      const o = next.days[dayKey(date)].outcomes[m.id]
      toast(r === 'done' ? `Misión completada · ${o.xp >= 0 ? '+' : ''}${o.xp} XP` : `Misión fallida · ${o.xp} XP`, r === 'done' ? 'gold' : 'bad')
    },
    [getNow, toast],
  )

  const value = useMemo(() => ({ state, now, update, act, toast, toasts, levelUp }), [state, now, update, act, toast, toasts, levelUp])
  return <SystemCtx.Provider value={value}>{children}</SystemCtx.Provider>
}

export function useSystem() {
  const c = useContext(SystemCtx)
  if (!c) throw new Error('useSystem fuera de SystemProvider')
  return c
}
