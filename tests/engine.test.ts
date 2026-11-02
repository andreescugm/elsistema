import { describe, expect, it } from 'vitest'
import { missionsFor, PENALTY } from '../src/data/schedule'
import { ATTRS, BOOKS, PEOPLE, PODCASTS } from '../src/data/attrs'
import {
  bump, correct, current, dayKey, dayMissions, fresh, isRed, level, migrate, rank, redUntil, resolve, streak, sweep, totals, atrophied,
} from '../src/engine/core'
import { recommend, whatNow } from '../src/engine/recommend'
import { finishWorkout, toggleExercise, unlockStatus, workoutFor } from '../src/engine/training'
import { buildICS, alertText } from '../src/engine/ics'

const tue = (hh: number, mm = 0) => new Date(2026, 10, 3, hh, mm) // martes 3 nov 2026
const start = tue(5, 0).getTime()
const m = (id: string, d = tue(9)) => missionsFor(d).find((x) => x.id === id)!

describe('misiones', () => {
  it('el horario de lunes a viernes empieza a las 5:55 y acaba con luz apagada', () => {
    const list = missionsFor(tue(9))
    expect(list[0].start).toBe('05:55')
    expect(list.at(-1)!.id).toBe('luz')
    expect(list.find((x) => x.id === 'salida')!.end).toBe('09:00')
  })
  it('el sábado coge el bus de las 8:00 y el domingo hay revisión', () => {
    expect(missionsFor(new Date(2026, 10, 7)).find((x) => x.id === 'salida')!.end).toBe('08:00')
    expect(missionsFor(new Date(2026, 10, 8)).some((x) => x.id === 'revision')).toBe(true)
  })
})

describe('experiencia y castigos', () => {
  it('cumplir una crítica da +80 y fallarla −160, modo rojo 48 h y penalización', () => {
    let s = fresh(start)
    s = resolve(s, tue(9), m('salida'), 'done', { now: tue(9).getTime() })
    expect(s.days[dayKey(tue(9))].outcomes.salida.xp).toBe(80)
    s = resolve(s, tue(9), m('cierre'), 'failed', { now: tue(20, 40).getTime() })
    expect(s.days[dayKey(tue(9))].outcomes.cierre.xp).toBe(-160)
    expect(isRed(s, tue(20, 41).getTime())).toBe(true)
    expect(isRed(s, tue(20, 40).getTime() + 49 * 3600e3)).toBe(false)
    expect(dayMissions(s, tue(21))[0].id).toBe(PENALTY.id)
  })
  it('varios fallos críticos no acumulan más de 48 h de modo rojo', () => {
    const s = sweep(fresh(tue(5).getTime()), tue(15, 20))
    const until = redUntil(s)
    expect(until - tue(15, 20).getTime()).toBeLessThanOrEqual(48 * 3600e3)
    expect(until).toBeGreaterThan(tue(15, 20).getTime())
  })
  it('un fallo automático se puede corregir el mismo día con la mitad de XP y quita el modo rojo', () => {
    let s = sweep(fresh(tue(8, 0).getTime()), tue(9, 40))
    expect(isRed(s, tue(9, 41).getTime())).toBe(true)
    s = correct(s, tue(9), m('salida'), tue(9, 41))
    expect(s.days[dayKey(tue(9))].outcomes.salida).toMatchObject({ s: 'done', xp: 40, late: true })
    expect(isRed(s, tue(9, 42).getTime())).toBe(false)
    // un fallo marcado a mano no se puede corregir
    const s2 = resolve(fresh(start), tue(9), m('cierre'), 'failed', { now: tue(20, 30).getTime() })
    expect(correct(s2, tue(9), m('cierre'), tue(20, 40))).toBe(s2)
  })
  it('en modo rojo la XP ganada se reduce a la mitad', () => {
    let s = fresh(start)
    s = resolve(s, tue(9), m('salida'), 'failed', { now: tue(9, 31).getTime() })
    s = resolve(s, tue(9), m('cocina'), 'done', { now: tue(21).getTime() })
    expect(s.days[dayKey(tue(9))].outcomes.cocina.xp).toBe(20)
  })
  it('una misión no se puede resolver dos veces', () => {
    let s = fresh(start)
    s = resolve(s, tue(9), m('salida'), 'done', { now: tue(9).getTime() })
    const again = resolve(s, tue(9), m('salida'), 'failed', { now: tue(9).getTime() })
    expect(again).toBe(s)
  })
  it('la penalización no cumplida resta 200', () => {
    let s = fresh(start)
    s = resolve(s, tue(9), PENALTY, 'failed', { now: tue(23, 40).getTime() })
    expect(s.days[dayKey(tue(9))].outcomes.penalizacion.xp).toBe(-200)
  })
  it('sweep falla lo vencido +30 min pero no lo anterior al primer arranque ni lo opcional', () => {
    const s = sweep(fresh(tue(8, 0).getTime()), tue(9, 40))
    const o = s.days[dayKey(tue(9))].outcomes
    expect(o.despertar).toBeUndefined() // antes de empezar
    expect(o.oro?.s).toBe('failed') // 08:35 + 30 = 09:05 < 09:40
    expect(o.salida?.s).toBe('failed') // 09:00 + 30 < 09:40
    expect(o.creacion).toBeUndefined()
  })
  it('totals nunca baja de 0 y suma por atributo', () => {
    let s = fresh(start)
    s = resolve(s, tue(9), m('salida'), 'failed', { now: tue(9, 31).getTime() })
    expect(totals(s, tue(10)).xp).toBe(0)
    s = resolve(s, tue(9), m('oro'), 'done', { now: tue(8).getTime() })
    expect(totals(s, tue(10)).attrs.CARISMA).toBe(20)
  })
})

describe('niveles y rangos', () => {
  it('el nivel cuesta un 15 % más cada vez', () => {
    expect(level(0, 200)).toEqual({ lvl: 1, into: 0, need: 200 })
    expect(level(200, 200).lvl).toBe(2)
    expect(level(200, 200).need).toBe(230)
  })
  it('los XP no suben de rango sin superar la prueba', () => {
    const s = fresh(start)
    expect(rank(s, 5000).current.id).toBe('E')
    expect(rank(s, 5000).trialReady).toBe(true)
    expect(rank({ ...s, rankTrials: { D: true } }, 5000).current.id).toBe('D')
  })
  it('la racha se rompe con una crítica fallada', () => {
    let s = fresh(new Date(2026, 10, 1).getTime())
    for (const day of [1, 2]) {
      const d = new Date(2026, 10, day, 9)
      s = resolve(s, d, missionsFor(d)[0], 'done', { now: d.getTime() })
    }
    expect(streak(s, new Date(2026, 10, 3, 9))).toBe(2)
    const d2 = new Date(2026, 10, 2, 9)
    s = { ...s, days: { ...s.days, [dayKey(d2)]: { ...s.days[dayKey(d2)], outcomes: { ...s.days[dayKey(d2)].outcomes, salida: { s: 'failed', xp: -160, attr: 'MENTE', tier: 'critica' } } } } }
    expect(streak(s, new Date(2026, 10, 3, 9))).toBe(0)
  })
})

describe('curro', () => {
  it('llegar a 30 llamadas da un bonus una sola vez', () => {
    let s = fresh(start)
    for (let i = 0; i < 31; i++) s = bump(s, tue(10), 'llamadas', 'Captación', 1)
    const day = s.days[dayKey(tue(10))]
    expect(day.counters['llamadas:Captación']).toBe(31)
    expect(day.outcomes['objetivo-llamadas'].xp).toBe(60)
    s = bump(s, tue(10), 'llamadas', 'Captación', -40)
    expect(s.days[dayKey(tue(10))].counters['llamadas:Captación']).toBe(0)
  })
})

describe('recomendaciones concretas', () => {
  it('cada atributo tiene disciplinas con ejercicios y referencias válidas', () => {
    for (const a of ATTRS) {
      expect(a.disciplines.length).toBeGreaterThan(0)
      for (const d of a.disciplines) {
        expect(d.drills.length).toBeGreaterThan(0)
        for (const p of d.people) expect(PEOPLE.some((x) => x.id === p)).toBe(true)
        for (const b of d.books) expect(BOOKS.some((x) => x.id === b)).toBe(true)
      }
      for (const p of a.podcasts) expect(PODCASTS.some((x) => x.id === p)).toBe(true)
    }
  })
  it('una misión de carisma dice qué disciplina, qué ejercicio, qué libro y a quién ver', () => {
    const r = recommend(fresh(start), 'CARISMA', 30, tue(8))
    expect(r.discipline.name).toBeTruthy()
    expect(r.drill.length).toBeGreaterThan(10)
    expect(r.book?.title).toBeTruthy()
    expect(r.person?.url).toMatch(/^https:\/\/www\.youtube\.com\/results\?search_query=/)
    expect(r.headline).toContain('30 min de carisma')
  })
  it('prioriza la disciplina menos practicada', () => {
    const s0 = fresh(start)
    const first = recommend(s0, 'CARISMA', 30, tue(8)).discipline.id
    const s1 = resolve(s0, tue(8), m('oro'), 'done', { disc: first, now: tue(8).getTime() })
    expect(recommend(s1, 'CARISMA', 30, tue(8)).discipline.id).not.toBe(first)
  })
  it('usa el libro en curso con su página', () => {
    const s = { ...fresh(start), currentBook: { CARISMA: 'cialdini' }, books: { cialdini: { page: 87, status: 'leyendo' as const, updated: 0 } } }
    const r = recommend(s, 'CARISMA', 30, tue(8))
    expect(r.book?.id).toBe('cialdini')
    expect(r.headline).toContain('pág. 87')
  })
  it('¿Qué hago ahora? a las 8:52 manda el bus y da 2 alternativas', () => {
    const a = whatNow(fresh(tue(5).getTime()), tue(8, 52))
    expect(a.main.mission?.id).toBe('salida')
    expect(a.alternatives).toHaveLength(2)
  })
  it('detecta atributos descuidados', () => {
    const s = fresh(new Date(2026, 9, 25).getTime())
    expect(atrophied(s, 'LENGUA', tue(9))).toBe(true)
    expect(atrophied(s, 'CREACION', tue(9))).toBe(false)
    expect(atrophied(s, 'SABIDURIA', tue(9))).toBe(true)
  })
})

describe('entreno', () => {
  it('progresión doble: dos sesiones cumplidas suben el objetivo', () => {
    let s = fresh(start)
    const mon1 = new Date(2026, 10, 2), mon2 = new Date(2026, 10, 9)
    for (const d of [mon1, mon2]) {
      for (const ex of workoutFor(d)!.exercises) s = toggleExercise(s, d, ex.id)
      s = finishWorkout(s, d)
    }
    expect(s.training.targets.flexiones.target).toBe(14)
    expect(s.training.completed).toBe(2)
  })
  it('carrera y parque empiezan bloqueados con sus requisitos', () => {
    const u = unlockStatus(fresh(start), tue(9))
    expect(u.find((x) => x.id === 'casa')!.unlocked).toBe(true)
    expect(u.find((x) => x.id === 'carrera')!.unlocked).toBe(false)
    expect(u.find((x) => x.id === 'mazmorra')!.checks).toHaveLength(2)
  })
})

describe('datos guardados', () => {
  it('migra datos antiguos sin perder días', () => {
    const s = migrate({ player: 'X', days: { '2026-11-03': { outcomes: {}, counters: {}, log: {} } } })
    expect(s.player).toBe('X')
    expect(s.training.targets).toEqual({})
    expect(Object.keys(s.days)).toEqual(['2026-11-03'])
  })
})

describe('calendario de avisos', () => {
  const ics = buildICS('https://el-sistema.example', new Date(2026, 10, 2))
  it('es un VCALENDAR válido con eventos semanales y alarma', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
    expect(ics).toContain('TRIGGER:PT0M')
    expect(ics.split('BEGIN:VEVENT').length - 1).toBe(ics.split('END:VEVENT').length - 1)
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
  })
  it('el aviso de carisma es concreto, no "haz carisma"', () => {
    const txt = alertText(m('oro'), tue(7))
    expect(txt).toMatch(/Haz esto: .{15,}/)
    expect(txt).toMatch(/YouTube/)
  })
  it('el bus tiene un último aviso 3 minutos antes', () => {
    expect(ics).toContain('TRIGGER:PT12M')
  })
})

describe('misión activa', () => {
  it('a las 8:52 la activa es la salida, no el briefing', () => {
    expect(current(missionsFor(tue(8, 52)), fresh(start), tue(8, 52)).active?.id).toBe('salida')
  })
})
