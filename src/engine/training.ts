import { PROGRAM, UNLOCKS, WorkoutDay } from '../data/training'
import { State, ATTR_BASE, dayKey, level, totals } from './core'

export function workoutFor(date: Date): WorkoutDay | undefined {
  return PROGRAM[date.getDay()]
}

export const targetOf = (s: State, exId: string, start: number) => s.training.targets[exId]?.target ?? start

/** Marca un ejercicio de hoy como completado (todas las series en el objetivo) o lo desmarca. */
export function toggleExercise(s: State, date: Date, exId: string): State {
  const key = dayKey(date)
  const entry = s.training.log[key] ?? { mode: 'casa', done: {} }
  const done = { ...entry.done, [exId]: !entry.done[exId] }
  return { ...s, training: { ...s.training, log: { ...s.training.log, [key]: { ...entry, done } } } }
}

export function setMode(s: State, date: Date, mode: string): State {
  const key = dayKey(date)
  const entry = s.training.log[key] ?? { mode: 'casa', done: {} }
  return { ...s, training: { ...s.training, log: { ...s.training.log, [key]: { ...entry, mode } } } }
}

export const modeOf = (s: State, date: Date) => s.training.log[dayKey(date)]?.mode ?? 'casa'

/**
 * Cierra el entreno del día: aplica la progresión doble
 * (2 sesiones seguidas cumpliendo el objetivo => sube el objetivo).
 */
export function finishWorkout(s: State, date: Date): State {
  const w = workoutFor(date)
  if (!w) return s
  const entry = s.training.log[dayKey(date)] ?? { mode: 'casa', done: {} }
  const targets = { ...s.training.targets }
  for (const ex of w.exercises) {
    const cur = targets[ex.id] ?? { target: ex.start, hits: 0 }
    if (entry.done[ex.id]) {
      const hits = cur.hits + 1
      targets[ex.id] = hits >= 2 ? { target: cur.target + ex.step, hits: 0 } : { ...cur, hits }
    } else {
      targets[ex.id] = { ...cur, hits: 0 }
    }
  }
  return { ...s, training: { ...s.training, targets, completed: s.training.completed + 1 } }
}

export const allExercisesDone = (s: State, date: Date) => {
  const w = workoutFor(date)
  const entry = s.training.log[dayKey(date)]
  return !!w && !!entry && w.exercises.every((e) => entry.done[e.id])
}

/** Semanas recientes con al menos el 90 % de entrenos (5 de 6 días). */
export function goodWeeks(s: State, now: Date) {
  let weeks = 0
  for (let w = 0; w < 8; w++) {
    let done = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - w * 7 - i)
      if (s.days[dayKey(d)]?.outcomes['entreno']?.s === 'done') done++
    }
    if (done >= 5) weeks++
    else break
  }
  return weeks
}

export interface UnlockStatus { id: string; unlocked: boolean; checks: { label: string; ok: boolean }[] }

export function unlockStatus(s: State, now: Date): UnlockStatus[] {
  const fuerza = level(totals(s, now).attrs.FUERZA, ATTR_BASE).lvl
  const tests = s.training.tests
  const improving = tests.length >= 3 && tests.slice(-3).every((t, i, arr) => i === 0 || Object.keys(t.values).every((k) => (t.values[k] ?? 0) > (arr[i - 1].values[k] ?? 0)))
  const res: Record<string, { label: string; ok: boolean }[]> = {
    casa: [],
    carrera: [
      { label: 'Fuerza nivel 3', ok: fuerza >= 3 },
      { label: `20 entrenos completados (${s.training.completed}/20)`, ok: s.training.completed >= 20 },
      { label: 'Prueba: 3 km a ritmo suave', ok: !!s.training.trials['carrera'] },
    ],
    parque: [
      { label: 'Fuerza nivel 5', ok: fuerza >= 5 },
      { label: `4 semanas con el 90 % de entrenos (${goodWeeks(s, now)}/4)`, ok: goodWeeks(s, now) >= 4 },
    ],
    mazmorra: [],
    avanzado: [
      { label: 'Fuerza nivel 10', ok: fuerza >= 10 },
      { label: '3 pruebas mensuales seguidas mejorando', ok: improving },
    ],
  }
  const base = UNLOCKS.map((u) => ({ id: u.id, checks: res[u.id] ?? [], unlocked: (res[u.id] ?? []).every((c) => c.ok) }))
  const by = (id: string) => base.find((b) => b.id === id)!
  by('mazmorra').checks = [
    { label: 'Carrera desbloqueada', ok: by('carrera').unlocked },
    { label: 'Parque desbloqueado', ok: by('parque').unlocked },
  ]
  by('mazmorra').unlocked = by('carrera').unlocked && by('parque').unlocked
  return base
}

export const xpForMode = (mode: string) => UNLOCKS.find((u) => u.id === mode)?.xp ?? 40
