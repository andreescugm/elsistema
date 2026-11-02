import { attrById } from '../data/attrs'
import { Mission, TIER_XP, missionsFor } from '../data/schedule'
import { workoutFor } from './training'
import { fresh } from './core'
import { recommend } from './recommend'

const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

/** Pliega líneas a 75 octetos como pide RFC 5545. */
function fold(line: string) {
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length
    if (bytes + b > 74) {
      out.push(cur)
      cur = ' ' + ch
      bytes = 1 + b
    } else {
      cur += ch
      bytes += b
    }
  }
  out.push(cur)
  return out.join('\r\n')
}

const VTZ = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
]

/** Texto concreto del aviso de una misión para un día de la semana. */
export function alertText(m: Mission, date: Date): string {
  const s = fresh(0)
  if (m.learn) {
    const rec = recommend(s, m.learn.attr, m.learn.minutes, date)
    const extra = [rec.book ? `Libro: ${rec.book.title} (${rec.book.author}).` : '', rec.person ? `Vídeo: busca a ${rec.person.name} en YouTube ("${rec.person.query}").` : '', rec.podcast ? `Podcast: ${rec.podcast.name}.` : '']
    return [`${m.learn.minutes} min de ${attrById(m.learn.attr).name} · ${rec.discipline.name}.`, `Haz esto: ${rec.drill}`, ...extra].filter(Boolean).join('\n')
  }
  if (m.kind === 'entreno') {
    const w = workoutFor(date)
    return w ? `Entreno de ${w.focus}: ${w.exercises.map((e) => `${e.name} ${e.sets}×${e.start}${e.unit === 's' ? ' s' : ''}`).join(', ')}.` : 'Entreno.'
  }
  if (m.kind === 'curro') return 'Modo caza. Objetivo del día: 30 llamadas y 10 visitas. Suma cada una en la pestaña Curro.'
  const parts = [m.note, m.steps?.join(' · ')].filter(Boolean)
  return parts.join('\n') || m.title
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')

/** Calendario con todas las misiones avisables, repetidas cada semana, con alarma a su hora. */
export function buildICS(appUrl: string, from: Date): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EL SISTEMA//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:EL SISTEMA', 'X-WR-TIMEZONE:Europe/Madrid', ...VTZ]
  for (let i = 0; i < 7; i++) {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    for (const m of missionsFor(d)) {
      if (m.tier === 'menor' && !m.learn) continue
      const [sh, sm] = m.start.split(':')
      const [eh, em] = m.end.split(':')
      const tag = m.tier === 'critica' ? '[MISIÓN CRÍTICA] ' : '[MISIÓN] '
      const body = `${alertText(m, d)}\n\n${TIER_XP[m.tier].label} · +${TIER_XP[m.tier].win} XP\nAbrir: ${appUrl}`
      lines.push(
        'BEGIN:VEVENT',
        `UID:${m.id}-${DAYS[d.getDay()]}@el-sistema`,
        `DTSTAMP:${stamp(from)}`,
        `DTSTART;TZID=Europe/Madrid:${ymd}T${sh}${sm}00`,
        `DTEND;TZID=Europe/Madrid:${ymd}T${eh}${em}00`,
        `RRULE:FREQ=WEEKLY;BYDAY=${DAYS[d.getDay()]}`,
        `SUMMARY:${esc(tag + m.title)}`,
        `DESCRIPTION:${esc(body)}`,
        `URL:${appUrl}`,
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(tag + m.title)}`, 'TRIGGER:PT0M', 'END:VALARM',
      )
      if (m.id === 'salida') lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:[ÚLTIMO AVISO] El bus sale en 3 minutos', `TRIGGER:PT${toMinutes(m.end) - toMinutes(m.start) - 3}M`, 'END:VALARM')
      lines.push('END:VEVENT')
    }
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
