import type { AttrId } from './attrs'
import { PROGRAM } from './training'

export type Tier = 'critica' | 'normal' | 'menor' | 'libre'

export const TIER_XP: Record<Tier, { win: number; lose: number; label: string }> = {
  critica: { win: 80, lose: -160, label: 'Crítica' },
  normal: { win: 40, lose: -60, label: 'Normal' },
  menor: { win: 20, lose: -40, label: 'Menor' },
  libre: { win: 25, lose: 0, label: 'Opcional' },
}

export interface Mission {
  id: string
  start: string // HH:MM
  end: string
  title: string
  attr: AttrId
  tier: Tier
  steps?: string[]
  note?: string
  /** Misión de aprendizaje: el Sistema concreta qué hacer en este atributo. */
  learn?: { attr: AttrId; minutes: number }
  kind?: 'entreno' | 'curro' | 'registro' | 'penalizacion'
}

const morning = (dow: number): Mission[] => [
  { id: 'despertar', start: '05:55', end: '06:05', title: 'Despertar', attr: 'MENTE', tier: 'critica', steps: ['De pie al primer aviso', 'Vaso de agua', 'Cama hecha'] },
  { id: 'silencio', start: '05:58', end: '06:10', title: 'Silencio', attr: 'MENTE', tier: 'menor', steps: ['Biblia o reflexión', 'Escribe las 3 victorias de hoy'], learn: { attr: 'MENTE', minutes: 10 } },
  { id: 'entreno', start: '06:10', end: '06:50', title: `Entreno · ${PROGRAM[dow].focus}`, attr: 'FUERZA', tier: 'normal', kind: 'entreno' },
  { id: 'imagen', start: '06:50', end: '07:25', title: 'Protocolo Imagen', attr: 'MENTE', tier: 'menor', steps: ['Ducha (final frío)', 'Afeitado y peinado', 'Cuidado de la piel y perfume', 'Traje puesto'] },
  { id: 'combustible', start: '07:25', end: '07:45', title: 'Combustible', attr: 'FUERZA', tier: 'menor', steps: ['Desayuno con proteína', 'Táper en la mochila'] },
]

const EVENING: Mission[] = [
  { id: 'cocina', start: '21:05', end: '21:45', title: 'Protocolo Cocina', attr: 'MENTE', tier: 'normal', steps: ['Cena', 'Táper de mañana', 'Cocina recogida'] },
  { id: 'manana', start: '21:45', end: '22:05', title: 'Protocolo Mañana', attr: 'MENTE', tier: 'critica', steps: ['Camisa planchada', 'Traje y zapatos listos', 'Mochila y ropa de entreno', '10 min de orden en casa', 'Escribe las 3 misiones de mañana'], note: 'El día termina cuando el siguiente está listo.' },
  { id: 'creacion', start: '22:05', end: '22:30', title: 'Creación · Rumi Caín', attr: 'CREACION', tier: 'libre', learn: { attr: 'CREACION', minutes: 25 } },
  { id: 'registro', start: '22:30', end: '22:35', title: 'Registro del día', attr: 'MENTE', tier: 'menor', kind: 'registro' },
  { id: 'lectura', start: '22:35', end: '22:55', title: 'Lectura · 20 páginas', attr: 'PODER', tier: 'menor', learn: { attr: 'PODER', minutes: 20 } },
  { id: 'luz', start: '22:55', end: '23:05', title: 'Luz apagada', attr: 'MENTE', tier: 'normal', note: '7 horas de sueño. Sin dormir no hay bestia.' },
]

const WEEKDAY = (dow: number): Mission[] => [
  ...morning(dow),
  { id: 'oro', start: '07:45', end: '08:35', title: 'Bloque de oro', attr: 'CARISMA', tier: 'normal', learn: { attr: 'CARISMA', minutes: 30 }, note: 'Después, 20 min de inglés.' },
  { id: 'briefing', start: '08:35', end: '08:45', title: 'Briefing', attr: 'CARISMA', tier: 'menor', steps: ['Revisa las misiones de hoy', 'Objetivo: 30 llamadas y 10 visitas', 'Elige las 3 primeras llamadas'] },
  { id: 'salida', start: '08:45', end: '09:00', title: 'Salida · bus de las 9:00', attr: 'MENTE', tier: 'critica', note: 'Sin ese bus no hay curro.' },
  { id: 'trayecto', start: '09:00', end: '09:20', title: 'Trayecto', attr: 'LENGUA', tier: 'menor', learn: { attr: 'LENGUA', minutes: 20 } },
  { id: 'caza1', start: '09:30', end: '14:30', title: 'Caza I', attr: 'CARISMA', tier: 'critica', kind: 'curro' },
  { id: 'comida', start: '14:30', end: '15:10', title: 'Comida', attr: 'FUERZA', tier: 'menor', steps: ['El táper', '15 min sin pantalla'] },
  { id: 'mental', start: '15:10', end: '16:15', title: 'Entrenamiento mental', attr: 'CARISMA', tier: 'normal', learn: { attr: 'CARISMA', minutes: 45 }, note: 'Aplícalo esta misma tarde.' },
  { id: 'caza2', start: '16:30', end: '20:20', title: 'Caza II', attr: 'CARISMA', tier: 'critica', kind: 'curro' },
  { id: 'cierre', start: '20:15', end: '20:25', title: 'Cierre · bus de las 20:45', attr: 'MENTE', tier: 'critica', steps: ['Apunta llamadas y visitas', 'En la puerta a las 20:20'] },
  ...EVENING,
]

const SATURDAY: Mission[] = [
  ...morning(6),
  { id: 'salida', start: '07:40', end: '08:00', title: 'Salida · bus de las 8:00', attr: 'MENTE', tier: 'critica' },
  { id: 'trayecto', start: '08:00', end: '08:20', title: 'Trayecto', attr: 'LENGUA', tier: 'menor', learn: { attr: 'LENGUA', minutes: 20 } },
  { id: 'caza1', start: '10:00', end: '14:30', title: 'Caza de sábado', attr: 'CARISMA', tier: 'critica', kind: 'curro' },
  { id: 'sabiduria', start: '17:00', end: '18:00', title: 'Sabiduría', attr: 'SABIDURIA', tier: 'libre', learn: { attr: 'SABIDURIA', minutes: 45 } },
  { id: 'registro', start: '22:30', end: '22:35', title: 'Registro del día', attr: 'MENTE', tier: 'menor', kind: 'registro' },
  { id: 'luz', start: '23:30', end: '23:45', title: 'Luz apagada', attr: 'MENTE', tier: 'normal' },
]

const SUNDAY: Mission[] = [
  { id: 'despertar', start: '08:00', end: '08:30', title: 'Despertar antes de las 8:30', attr: 'MENTE', tier: 'menor' },
  { id: 'sabiduria', start: '11:00', end: '12:30', title: 'Sabiduría', attr: 'SABIDURIA', tier: 'libre', learn: { attr: 'SABIDURIA', minutes: 60 } },
  { id: 'batch', start: '17:00', end: '18:30', title: 'Batch cooking · 3 tápers', attr: 'MENTE', tier: 'normal' },
  { id: 'revision', start: '19:00', end: '19:30', title: 'Revisión semanal', attr: 'MENTE', tier: 'normal', steps: ['Qué he conseguido', 'Qué ha quedado pendiente', 'Prioridades de la semana', 'Tareas y compromisos', 'Preparar el lunes'] },
  { id: 'manana', start: '21:30', end: '22:00', title: 'Protocolo Mañana', attr: 'MENTE', tier: 'critica', steps: ['Camisa planchada', 'Traje y zapatos listos', 'Mochila y ropa de entreno'] },
  { id: 'luz', start: '22:55', end: '23:05', title: 'Luz apagada', attr: 'MENTE', tier: 'normal' },
]

export function missionsFor(date: Date): Mission[] {
  const dow = date.getDay()
  if (dow === 0) return SUNDAY
  if (dow === 6) return SATURDAY
  return WEEKDAY(dow)
}

export const PENALTY: Mission = {
  id: 'penalizacion',
  start: '00:00',
  end: '23:00',
  title: 'Misión de penalización',
  attr: 'MENTE',
  tier: 'normal',
  kind: 'penalizacion',
  steps: ['100 flexiones', '100 sentadillas', '3 min de plancha acumulados'],
  note: 'Antes de las 23:00. Si no la cumples: −200 XP.',
}

export const RANKS = [
  { id: 'E', xp: 0, trial: 'Ninguna', title: 'Recién despertado' },
  { id: 'D', xp: 3000, trial: '14 días seguidos sin fallar una misión crítica', title: 'Cazador' },
  { id: 'C', xp: 15000, trial: '30 días de racha y 4 semanas cumpliendo 30/10', title: 'Cazador probado' },
  { id: 'B', xp: 50000, trial: 'Todos los atributos en nivel 10 y Parque desbloqueado', title: 'Élite' },
  { id: 'A', xp: 120000, trial: '90 días de racha, 12 libros cerrados y 6 meses superando objetivos', title: 'Comandante' },
  { id: 'S', xp: 300000, trial: '180 días sin un fallo crítico y tus hitos reales', title: 'Monarca' },
] as const

export const COUNTERS = {
  llamadas: { label: 'Llamadas', target: 30, types: ['Captación', 'Seguimiento', 'Relación'] },
  visitas: { label: 'Visitas', target: 10, types: ['Captación', 'Valoración', 'Enseñanza'] },
} as const
