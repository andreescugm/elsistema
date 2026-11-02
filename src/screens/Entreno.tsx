import { useState } from 'react'
import { Lock, LockOpen, YoutubeLogo } from '@phosphor-icons/react'
import { MONTHLY_TEST, UNLOCKS } from '../data/training'
import { yt } from '../data/attrs'
import { missionsFor } from '../data/schedule'
import { dayKey } from '../engine/core'
import { allExercisesDone, finishWorkout, modeOf, setMode, targetOf, toggleExercise, unlockStatus, workoutFor, xpForMode } from '../engine/training'
import { useSystem } from '../store'
import { Check, Panel } from '../ui/kit'

export function Entreno() {
  const { state, now, update, act, toast } = useSystem()
  const w = workoutFor(now)
  const log = state.training.log[dayKey(now)]
  const mission = missionsFor(now).find((m) => m.kind === 'entreno')
  const outcome = mission ? state.days[dayKey(now)]?.outcomes[mission.id] : undefined
  const mode = modeOf(state, now)
  const unlocks = unlockStatus(state, now)
  const doneCount = w ? w.exercises.filter((e) => log?.done[e.id]).length : 0

  const finish = () => {
    if (!w || !mission) return
    const all = allExercisesDone(state, now)
    const base = xpForMode(mode)
    const xp = all ? base : Math.round(base / 2)
    update((s) => finishWorkout(s, now))
    act(mission, now, 'done', { xpOverride: xp })
    if (!all) toast('Entreno incompleto: la mitad de la experiencia', 'bad')
  }

  return (
    <>
      <Panel title={w ? `Hoy · ${w.focus}` : 'Hoy · Descanso'} live testId="entreno">
        {!w && <p className="empty">Domingo: descanso. Movilidad suave si te apetece.</p>}
        {w && (
          <>
            {w.exercises.map((ex) => {
              const tg = targetOf(state, ex.id, ex.start)
              return (
                <div className="ex" key={ex.id}>
                  <Check checked={!!log?.done[ex.id]} disabled={!!outcome} label={`${ex.name} completado`} onChange={() => update((s) => toggleExercise(s, now, ex.id))} />
                  <span>
                    <span className="n">{ex.name}</span>
                    <span className="cue">{ex.cue}</span>
                  </span>
                  <span className="tg">{ex.sets} × {tg}{ex.unit === 's' ? ' s' : ''}</span>
                </div>
              )
            })}
            <p className="hint" style={{ marginTop: 10 }}>Marca un ejercicio cuando completes todas sus series en el objetivo. Dos sesiones seguidas cumpliéndolo y el objetivo sube.</p>
            {outcome ? (
              <p className={`result ${outcome.s}`}>Entreno {outcome.s === 'done' ? 'completado' : 'fallado'} · {outcome.xp > 0 ? '+' : ''}{outcome.xp} XP</p>
            ) : (
              <button className="btn gold block" onClick={finish} disabled={doneCount === 0}>Terminar entreno ({doneCount}/{w.exercises.length})</button>
            )}
            <a className="btn ghost block" style={{ marginTop: 8, textDecoration: 'none' }} href={yt(`${w.focus} home workout dumbbells technique`)} target="_blank" rel="noreferrer"><YoutubeLogo size={18} aria-hidden /> Ver técnica en YouTube</a>
          </>
        )}
      </Panel>

      <Panel title="Modalidad">
        <div className="modes" role="group" aria-label="Modalidad del entreno">
          {UNLOCKS.map((u) => {
            const st = unlocks.find((x) => x.id === u.id)!
            return (
              <button key={u.id} className="mode" aria-pressed={mode === u.id} disabled={!st.unlocked || !!outcome} onClick={() => update((s) => setMode(s, now, u.id))}>
                <b>{st.unlocked ? <LockOpen size={16} aria-hidden /> : <Lock size={16} aria-hidden />} {u.name}</b>
                <span className="xpv">+{u.xp} XP</span>
                <span className="muted" style={{ gridColumn: '1 / -1', fontSize: 14 }}>{u.desc}</span>
                {st.checks.length > 0 && !st.unlocked && (
                  <ul>{st.checks.map((c) => <li key={c.label} className={c.ok ? 'ok' : 'no'}>{c.ok ? 'Cumplido' : 'Pendiente'} · {c.label}</li>)}</ul>
                )}
              </button>
            )
          })}
        </div>
        <CarreraTrial />
      </Panel>

      <MonthlyTest />
    </>
  )

  function CarreraTrial() {
    const st = unlocks.find((u) => u.id === 'carrera')!
    const others = st.checks.filter((c) => !c.label.startsWith('Prueba')).every((c) => c.ok)
    if (state.training.trials['carrera'] || !others) return null
    return (
      <button className="btn block" style={{ marginTop: 12 }} onClick={() => { update((s) => ({ ...s, training: { ...s.training, trials: { ...s.training.trials, carrera: true } } })); toast('Prueba superada: Carrera desbloqueada', 'gold') }}>
        He corrido 3 km a ritmo suave
      </button>
    )
  }
}

function MonthlyTest() {
  const { state, now, update, toast } = useSystem()
  const month = dayKey(now).slice(0, 7)
  const doneThisMonth = state.training.tests.find((t) => t.date.slice(0, 7) === month)
  const last = state.training.tests.at(-1)
  const [vals, setVals] = useState<Record<string, string>>({})
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const values = Object.fromEntries(MONTHLY_TEST.map((t) => [t.id, Number(vals[t.id] ?? 0)]))
    if (Object.values(values).some((v) => !(v > 0))) return toast('Rellena los tres resultados', 'bad')
    update((s) => ({ ...s, training: { ...s.training, tests: [...s.training.tests, { date: dayKey(now), values }] } }))
    toast('Prueba mensual guardada', 'gold')
  }
  return (
    <Panel title="Prueba mensual">
      {last && (
        <p className="muted mt0">Última ({last.date}): {MONTHLY_TEST.map((t) => `${t.name.toLowerCase()} ${last.values[t.id]}${t.unit === 's' ? ' s' : ''}`).join(', ')}.</p>
      )}
      {doneThisMonth ? (
        <p className="result done">Prueba de este mes hecha</p>
      ) : (
        <form onSubmit={save}>
          {MONTHLY_TEST.map((t) => (
            <label className="field" key={t.id}>
              <span>{t.name} ({t.unit === 's' ? 'segundos' : 'repeticiones'})</span>
              <input type="number" inputMode="numeric" min={1} value={vals[t.id] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [t.id]: e.target.value }))} />
            </label>
          ))}
          <button className="btn block" type="submit">Guardar resultados</button>
        </form>
      )}
    </Panel>
  )
}
