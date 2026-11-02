import { ATTRS, AttrId } from '../data/attrs'
import { COUNTERS, Mission, PENALTY, RANKS, TIER_XP, missionsFor } from '../data/schedule'

export type OutcomeStatus = 'done' | 'failed'
export interface Outcome { s: OutcomeStatus; xp: number; attr: AttrId; tier: Mission['tier']; disc?: string; at?: number; auto?: boolean; late?: boolean }

export interface DayRecord {
  outcomes: Record<string, Outcome>
  counters: Record<string, number>
  log: { score?: number; worked?: string; failed?: string; tomorrow?: string; notes?: string }
  penalty?: boolean
}

export interface BookProgress {
  page: number
  total?: number
  status: 'pendiente' | 'leyendo' | 'terminado'
  hasPdf?: boolean
  notes?: string
  updated: number
}

export interface AgendaItem { id: string; text: string; date: string; time?: string; done: boolean }

export interface TrainingState {
  targets: Record<string, { target: number; hits: number }>
  log: Record<string, { mode: string; done: Record<string, boolean> }>
  completed: number
  tests: { date: string; values: Record<string, number> }[]
  trials: Record<string, boolean>
}

export interface State {
  version: 2
  player: string
  since: number
  redUntil: number
  days: Record<string, DayRecord>
  books: Record<string, BookProgress>
  customBooks: { id: string; title: string; author: string; attr: AttrId; discipline: string; why: string }[]
  currentBook: Partial<Record<AttrId, string>>
  practice: Partial<Record<AttrId, Record<string, string>>> // attr -> disciplina -> última fecha
  training: TrainingState
  agenda: AgendaItem[]
  why: string
  letter: string
  rankTrials: Record<string, boolean>
}

export const KEY = 'el-sistema/v2'

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const nowMin = (d: Date) => d.getHours() * 60 + d.getMinutes()
export const dayNumber = (d: Date) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5)

export function fresh(now = Date.now()): State {
  return {
    version: 2,
    player: 'Gabriel Andreescu',
    since: now,
    redUntil: 0,
    days: {},
    books: {},
    customBooks: [],
    currentBook: {},
    practice: {},
    training: { targets: {}, log: {}, completed: 0, tests: [], trials: {} },
    agenda: [],
    why: '',
    letter: '',
    rankTrials: {},
  }
}

/** Rellena campos que falten en datos guardados con versiones anteriores. */
export function migrate(raw: unknown, now = Date.now()): State {
  const base = fresh(now)
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<State>
  return {
    ...base,
    ...r,
    version: 2,
    training: { ...base.training, ...(r.training ?? {}) },
  }
}

export function load(now = Date.now()): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return migrate(JSON.parse(raw), now)
  } catch {
    /* sin almacenamiento */
  }
  return fresh(now)
}

export function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* sin almacenamiento: la sesión sigue en memoria */
  }
}

export const emptyDay = (): DayRecord => ({ outcomes: {}, counters: {}, log: {} })
const RED_MS = 48 * 3600 * 1000

/** Fin del modo rojo: 48 h desde la última crítica fallada (no se acumula). */
export function redUntil(s: State): number {
  let last = 0
  for (const day of Object.values(s.days))
    for (const o of Object.values(day.outcomes)) if (o.s === 'failed' && o.tier === 'critica' && (o.at ?? 0) > last) last = o.at ?? 0
  return last ? last + RED_MS : 0
}
export const isRed = (s: State, at: number) => redUntil(s) > at

/** Hay penalización si ese día se falló una misión normal o crítica. */
export const hasPenalty = (day?: DayRecord) =>
  !!day && Object.entries(day.outcomes).some(([id, o]) => id !== 'penalizacion' && o.s === 'failed' && (o.tier === 'critica' || o.tier === 'normal'))

export function dayMissions(s: State, date: Date): Mission[] {
  const list = missionsFor(date)
  return hasPenalty(s.days[dayKey(date)]) ? [PENALTY, ...list] : list
}

export interface ResolveOpts { xpOverride?: number; disc?: string; now?: number; auto?: boolean }

/** Aplica el resultado de una misión. Inmutable. Una misión solo se resuelve una vez. */
export function resolve(s: State, date: Date, m: Mission, result: OutcomeStatus, opts: ResolveOpts = {}): State {
  const key = dayKey(date)
  const day = s.days[key] ?? emptyDay()
  if (day.outcomes[m.id]) return s
  const at = opts.now ?? Date.now()
  const base = TIER_XP[m.tier]
  let xp = result === 'done' ? (opts.xpOverride ?? base.win) : base.lose
  if (m.kind === 'penalizacion') xp = result === 'done' ? 0 : -200
  if (result === 'done' && isRed(s, at)) xp = Math.round(xp * 0.5)
  if (result === 'done' && atrophied(s, m.attr, date)) xp = Math.round(xp * 1.5)

  let practice = s.practice
  if (result === 'done' && opts.disc) {
    practice = { ...practice, [m.attr]: { ...(practice[m.attr] ?? {}), [opts.disc]: key } }
  }
  const outcome: Outcome = { s: result, xp, attr: m.attr, tier: m.tier, at, ...(opts.disc ? { disc: opts.disc } : {}), ...(opts.auto ? { auto: true } : {}) }
  return {
    ...s,
    practice,
    days: { ...s.days, [key]: { ...day, outcomes: { ...day.outcomes, [m.id]: outcome } } },
  }
}

/**
 * Corrige un fallo automático del mismo día ("la hice pero no abrí la app").
 * Cuenta como cumplida pero con la mitad de la XP: reportar tarde tiene coste.
 */
export function correct(s: State, date: Date, m: Mission, now: Date): State {
  const key = dayKey(date)
  const day = s.days[key]
  const o = day?.outcomes[m.id]
  if (!o || o.s !== 'failed' || !o.auto || key !== dayKey(now) || m.kind === 'penalizacion') return s
  const xp = Math.round(TIER_XP[m.tier].win / 2)
  return { ...s, days: { ...s.days, [key]: { ...day, outcomes: { ...day.outcomes, [m.id]: { s: 'done', xp, attr: m.attr, tier: m.tier, at: now.getTime(), late: true } } } } }
}

/** Marca como fallidas las misiones vencidas hace más de 30 minutos. */
export function sweep(s: State, now: Date): State {
  let next = s
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    for (const m of dayMissions(next, d)) {
      if (m.tier === 'libre') continue
      if (next.days[dayKey(d)]?.outcomes[m.id]) continue
      const endAt = new Date(d)
      endAt.setHours(0, toMin(m.end), 0, 0)
      if (endAt.getTime() < next.since) continue
      if (now.getTime() > endAt.getTime() + 30 * 60000) next = resolve(next, d, m, 'failed', { now: endAt.getTime() + 30 * 60000, auto: true })
    }
  }
  return next
}

/** Suma un contador del curro y concede el bonus del objetivo la primera vez que se alcanza. */
export function bump(s: State, date: Date, group: keyof typeof COUNTERS, type: string, delta: number): State {
  const key = dayKey(date)
  const day = s.days[key] ?? emptyDay()
  const k = `${group}:${type}`
  const v = Math.max(0, (day.counters[k] ?? 0) + delta)
  const counters = { ...day.counters, [k]: v }
  const total = COUNTERS[group].types.reduce((n, t) => n + (counters[`${group}:${t}`] ?? 0), 0)
  const bonusId = `objetivo-${group}`
  let outcomes = day.outcomes
  if (total >= COUNTERS[group].target && !outcomes[bonusId]) {
    outcomes = { ...outcomes, [bonusId]: { s: 'done', xp: 60, attr: 'CARISMA', tier: 'normal' } }
  }
  return { ...s, days: { ...s.days, [key]: { ...day, counters, outcomes } } }
}

export function counterTotal(day: DayRecord | undefined, group: keyof typeof COUNTERS) {
  return COUNTERS[group].types.reduce((n, t) => n + (day?.counters[`${group}:${t}`] ?? 0), 0)
}

/** Último día con una misión cumplida de este atributo (o el día de inicio). */
export function lastActive(s: State, attr: AttrId): string {
  let last = dayKey(new Date(s.since))
  for (const [k, day] of Object.entries(s.days))
    for (const o of Object.values(day.outcomes)) if (o.attr === attr && o.s === 'done' && k > last) last = k
  return last
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 864e5)
}

/** Días sin actividad antes de atrofiarse. Sabiduría es de fin de semana; Creación no se atrofia. */
export const ATROPHY_AFTER: Partial<Record<AttrId, number>> = { SABIDURIA: 8 }
export const idleDays = (s: State, attr: AttrId, at: Date) => daysBetween(lastActive(s, attr), dayKey(at))

export function atrophied(s: State, attr: AttrId, at: Date) {
  if (attr === 'CREACION') return false
  return idleDays(s, attr, at) > (ATROPHY_AFTER[attr] ?? 3)
}

export function totals(s: State, at: Date = new Date()) {
  const attrs = Object.fromEntries(ATTRS.map((a) => [a.id, 0])) as Record<AttrId, number>
  let xp = 0
  for (const day of Object.values(s.days))
    for (const o of Object.values(day.outcomes)) {
      xp += o.xp
      attrs[o.attr] = Math.max(0, attrs[o.attr] + o.xp)
    }
  // Atrofia: −3 % por día pasado el tercero sin actividad.
  for (const a of ATTRS) {
    if (a.id === 'CREACION') continue
    const idle = idleDays(s, a.id, at) - (ATROPHY_AFTER[a.id] ?? 3)
    if (idle > 0) attrs[a.id] = Math.round(attrs[a.id] * Math.pow(0.97, idle))
  }
  return { xp: Math.max(0, xp), attrs }
}

/** Nivel con coste creciente un 15 % por nivel. */
export function level(xp: number, base: number) {
  let lvl = 1
  let need = base
  let rest = Math.max(0, xp)
  while (rest >= need) {
    rest -= need
    lvl++
    need = Math.round(need * 1.15)
  }
  return { lvl, into: rest, need }
}

export const ATTR_BASE = 60
export const GLOBAL_BASE = 200

/** Rango actual: los XP no bastan, hay que superar la prueba de ascenso. */
export function rank(s: State, xp: number) {
  let idx = 0
  for (let i = 1; i < RANKS.length; i++) {
    if (xp >= RANKS[i].xp && s.rankTrials[RANKS[i].id]) idx = i
    else break
  }
  const current = RANKS[idx]
  const next = RANKS[idx + 1]
  return { current, next, trialReady: !!next && xp >= next.xp }
}

export function failedCritical(day?: DayRecord) {
  return !!day && Object.values(day.outcomes).some((o) => o.s === 'failed' && o.tier === 'critica')
}

/** Días seguidos (sin contar hoy) sin fallar una crítica. */
export function streak(s: State, now: Date) {
  let n = 0
  for (let i = 1; i < 400; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (d.getTime() < s.since - 864e5) break
    const rec = s.days[dayKey(d)]
    if (!rec || failedCritical(rec)) break
    n++
  }
  return n
}

/** Misión activa: la que empezó más tarde de las que siguen en plazo. */
export function current(missions: Mission[], s: State, now: Date) {
  const t = nowMin(now)
  const rec = s.days[dayKey(now)]
  const open = missions.filter((m) => !rec?.outcomes[m.id])
  const active = open
    .filter((m) => toMin(m.start) <= t && t <= toMin(m.end) + 30)
    .sort((a, b) => toMin(b.start) - toMin(a.start))[0]
  const upcoming = open.filter((m) => toMin(m.start) > t)
  return { active, upcoming }
}
