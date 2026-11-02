// Genera public/avisos.ics con todas las misiones y sus alarmas.
import { writeFileSync } from 'node:fs'
import { buildICS } from '../src/engine/ics'

const url = process.env.APP_URL || 'https://elsistema.vercel.app'
const monday = new Date()
monday.setHours(0, 0, 0, 0)
monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
writeFileSync(new URL('../public/avisos.ics', import.meta.url), buildICS(url, monday))
console.log('avisos.ics generado para', url)
