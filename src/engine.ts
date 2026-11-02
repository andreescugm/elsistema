import { ATTRS, Attr, Mission, PENALTY, RANKS, TIER_XP, missionsFor } from './data'

export type Outcome = { s: 'done' | 'failed'; xp: number; attr: Attr; tier: Mission['tier'] }

export interface DayRecord {
  outcomes: Record<string, Outcome>
  counters: Record<string, number> // "llamadas:Captación" -> n
  log: { score?: number; worked?: string; failed?: string; tomorrow?: string; notes?: string; closed?: boolean }
  penalty?: boolean // hay misión de penalización activa hoy
}

export interface State {
  player: string
  days: Record<string, DayRecord>
  redUntil: number // ms epoch
  since: number // primer arranque: lo anterior no cuenta
  version: 1
}

const KEY = 'el-sistema/v1'

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const nowMin = (d: Date) => d.getHours() * 60 + d.getMinutes()

export function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* almacenamiento no disponible */
  }
  return { player: 'Gabriel Andreescu', days: {}, redUntil: 0, since: Date.now(), version: 1 }
}

export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* sin almacenamiento: la sesión sigue en memoria */
  }
}

export const emptyDay = (): DayRecord => ({ outcomes: {}, counters: {}, log: {} })

export const isRed = (s: State, at = Date.now()) => s.redUntil > at

/** Misiones de un día, con la de penalización si toca. */
export function dayMissions(s: State, date: Date): Mission[] {
  const list = missionsFor(date)
  const rec = s.days[dayKey(date)]
  return rec?.penalty ? [PENALTY, ...list] : list
}

/** Aplica un resultado y devuelve el estado nuevo (inmutable). */
export function resolve(s: State, date: Date, m: Mission, result: 'done' | 'failed'): State {
  const key = dayKey(date)
  const day = s.days[key] ?? emptyDay()
  if (day.outcomes[m.id]) return s
  const base = TIER_XP[m.tier]
  const red = isRed(s)
  let xp = result === 'done' ? base.win : base.lose
  if (m.id === PENALTY.id) xp = result === 'done' ? 0 : -200
  if (result === 'done' && red) xp = Math.round(xp * 0.5)

  let redUntil = s.redUntil
  let penalty = day.penalty
  if (result === 'failed' && m.tier !== 'libre') {
    if (m.tier === 'critica') redUntil = Math.max(redUntil, Date.now()) + 48 * 3600 * 1000
    if (m.tier === 'critica' || m.tier === 'normal') penalty = true
  }
  const next: DayRecord = { ...day, penalty, outcomes: { ...day.outcomes, [m.id]: { s: result, xp, attr: m.attr, tier: m.tier } } }
  return { ...s, redUntil, days: { ...s.days, [key]: next } }
}

/** Marca como fallidas las misiones vencidas hace más de 30 min. */
export function sweep(s: State, now: Date): State {
  let next = s
  // hoy y los 6 días anteriores
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const past = i > 0
    for (const m of dayMissions(next, d)) {
      if (m.tier === 'libre') continue
      const rec = next.days[dayKey(d)]
      if (rec?.outcomes[m.id]) continue
      if (!rec && past) continue // días sin abrir la app no cuentan
      const endAt = new Date(d)
      endAt.setHours(0, toMin(m.end), 0, 0)
      if (endAt.getTime() < next.since) continue // antes de empezar no cuenta
      if (past || nowMin(now) > toMin(m.end) + 30) next = resolve(next, d, m, 'failed')
    }
  }
  return next
}

export function totals(s: State) {
  const attrs = Object.fromEntries(ATTRS.map((a) => [a.id, 0])) as Record<Attr, number>
  let xp = 0
  for (const day of Object.values(s.days))
    for (const o of Object.values(day.outcomes)) {
      xp += o.xp
      attrs[o.attr] = Math.max(0, attrs[o.attr] + o.xp)
    }
  return { xp: Math.max(0, xp), attrs }
}

/** Nivel con coste creciente un 15 % por nivel. */
export function level(xp: number, base: number) {
  let lvl = 1
  let need = base
  let rest = xp
  while (rest >= need) {
    rest -= need
    lvl++
    need = Math.round(need * 1.15)
  }
  return { lvl, into: rest, need }
}

export function rank(xp: number) {
  // Sin prueba de ascenso superada, el rango no sube: v1 siempre E, con la prueba señalada.
  const current = RANKS[0]
  const next = RANKS[1]
  return { current, next, trialReady: xp >= next.xp }
}

export function streak(s: State, now: Date) {
  let n = 0
  for (let i = 1; i < 400; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const rec = s.days[dayKey(d)]
    if (!rec) break
    const failedCrit = Object.values(rec.outcomes).some((o) => o.s === 'failed' && o.tier === 'critica')
    if (failedCrit) break
    n++
  }
  return n
}

export function current(missions: Mission[], s: State, now: Date) {
  const t = nowMin(now)
  const rec = s.days[dayKey(now)]
  const open = missions.filter((m) => !rec?.outcomes[m.id])
  // la más reciente de las que están en plazo: a las 8:52 manda el bus, no el briefing
  const active = open
    .filter((m) => toMin(m.start) <= t && t <= toMin(m.end) + 30)
    .sort((a, b) => toMin(b.start) - toMin(a.start))[0]
  const upcoming = open.filter((m) => toMin(m.start) > t)
  return { active, upcoming }
}
