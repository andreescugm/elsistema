// Contenido de EL SISTEMA. Todo es configurable: en la fase 4 esto vendrá del usuario.

export type Attr = 'FUERZA' | 'CARISMA' | 'PODER' | 'MENTE' | 'SABIDURÍA' | 'LENGUA' | 'CREACIÓN'
export type Tier = 'critica' | 'normal' | 'menor' | 'libre'

export const ATTRS: { id: Attr; short: string; desc: string }[] = [
  { id: 'FUERZA', short: 'FUE', desc: 'Cuerpo y entreno' },
  { id: 'CARISMA', short: 'CAR', desc: 'Venta, negociación, lectura de personas' },
  { id: 'PODER', short: 'POD', desc: 'Estrategia y juegos de poder' },
  { id: 'MENTE', short: 'MEN', desc: 'Disciplina y mentalidad' },
  { id: 'SABIDURÍA', short: 'SAB', desc: 'Psique y dinero' },
  { id: 'LENGUA', short: 'LEN', desc: 'Inglés' },
  { id: 'CREACIÓN', short: 'CRE', desc: 'Rumi Caín' },
]

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
  attr: Attr
  tier: Tier
  steps?: string[]
  note?: string
}

// Programa de entreno en casa: 1 = lunes … 6 = sábado
export const TRAINING: Record<number, { focus: string; steps: string[] }> = {
  1: { focus: 'Empuje', steps: ['Flexiones 4×máx', 'Press de hombro 4×10', 'Fondos en silla 3×12', 'Extensión de tríceps 3×12', 'Elevaciones laterales 3×15'] },
  2: { focus: 'Piernas', steps: ['Sentadilla goblet 4×12', 'Zancadas 3×10 por pierna', 'Búlgaras 3×8', 'Puente de glúteo 3×15', 'Gemelos 4×20'] },
  3: { focus: 'Tirón', steps: ['Remo con mancuerna 4×10', 'Curl de bíceps 3×12', 'Curl martillo 3×12', 'Pájaros 3×15', 'Superman 3×15'] },
  4: { focus: 'Core', steps: ['Plancha 3×45 s', 'Hollow hold 3×30 s', 'Crunch bicicleta 3×20', 'Elevación de piernas 3×12', 'Dead bug 3×10'] },
  5: { focus: 'Total + cardio', steps: ['5 rondas: burpees 10', 'Sentadillas 20', 'Flexiones 15', 'Mountain climbers 30 s', 'Plancha 30 s'] },
  6: { focus: 'Movilidad', steps: ['15 min de estiramientos y movilidad'] },
}

const morning = (dow: number): Mission[] => [
  { id: 'despertar', start: '05:55', end: '06:05', title: 'Despertar', attr: 'MENTE', tier: 'critica', steps: ['De pie al primer aviso', 'Vaso de agua', 'Cama hecha'] },
  { id: 'silencio', start: '06:00', end: '06:10', title: 'Silencio', attr: 'MENTE', tier: 'menor', steps: ['Biblia o reflexión', 'Escribe las 3 victorias de hoy'] },
  { id: 'entreno', start: '06:10', end: '06:50', title: `Entreno · ${TRAINING[dow].focus}`, attr: 'FUERZA', tier: 'normal', steps: TRAINING[dow].steps },
  { id: 'imagen', start: '06:50', end: '07:25', title: 'Protocolo Imagen', attr: 'MENTE', tier: 'menor', steps: ['Ducha (final frío)', 'Afeitado y peinado', 'Cuidado de la piel y perfume', 'Traje puesto'] },
  { id: 'combustible', start: '07:25', end: '07:45', title: 'Combustible', attr: 'FUERZA', tier: 'menor', steps: ['Desayuno con proteína', 'Táper en la mochila'] },
]

const WEEKDAY = (dow: number): Mission[] => [
  ...morning(dow),
  { id: 'oro', start: '07:45', end: '08:35', title: 'Bloque de oro', attr: 'CARISMA', tier: 'normal', steps: ['30 min del libro de carisma', '20 min de inglés'] },
  { id: 'briefing', start: '08:35', end: '08:45', title: 'Briefing', attr: 'CARISMA', tier: 'menor', steps: ['Revisa las misiones de hoy', 'Objetivo: 30 llamadas · 10 visitas', 'Elige las 3 primeras llamadas'] },
  { id: 'salida', start: '08:45', end: '09:00', title: 'Salida · bus de las 9:00', attr: 'MENTE', tier: 'critica', note: 'Sin ese bus no hay curro.' },
  { id: 'trayecto', start: '09:00', end: '09:20', title: 'Trayecto', attr: 'LENGUA', tier: 'menor', steps: ['Podcast o inglés, 20 min'] },
  { id: 'caza1', start: '09:30', end: '14:30', title: 'Caza I', attr: 'CARISMA', tier: 'critica', note: 'Contadores en la pestaña Curro.' },
  { id: 'comida', start: '14:30', end: '15:10', title: 'Comida', attr: 'FUERZA', tier: 'menor', steps: ['El táper', '15 min sin pantalla'] },
  { id: 'mental', start: '15:10', end: '16:15', title: 'Entrenamiento mental', attr: 'PODER', tier: 'normal', steps: ['Una técnica concreta (Voss, Hughes, Greene)', 'Escribe cómo la aplicas esta tarde'] },
  { id: 'caza2', start: '16:30', end: '20:20', title: 'Caza II', attr: 'CARISMA', tier: 'critica', note: 'A las 19:30 revisa cuánto te falta.' },
  { id: 'cierre', start: '20:15', end: '20:25', title: 'Cierre · bus de las 20:45', attr: 'MENTE', tier: 'critica', steps: ['Apunta llamadas y visitas', 'En la puerta a las 20:20'] },
  ...EVENING,
]

const EVENING: Mission[] = [
  { id: 'cocina', start: '21:05', end: '21:45', title: 'Protocolo Cocina', attr: 'MENTE', tier: 'normal', steps: ['Cena', 'Táper de mañana', 'Cocina recogida'] },
  { id: 'manana', start: '21:45', end: '22:05', title: 'Protocolo Mañana', attr: 'MENTE', tier: 'critica', steps: ['Camisa planchada', 'Traje y zapatos listos', 'Mochila y ropa de entreno', '10 min de orden en casa', 'Escribe las 3 misiones de mañana'], note: 'El día termina cuando el siguiente está listo.' },
  { id: 'creacion', start: '22:05', end: '22:30', title: 'Creación · Rumi Caín', attr: 'CREACIÓN', tier: 'libre' },
  { id: 'registro', start: '22:30', end: '22:35', title: 'Registro del día', attr: 'MENTE', tier: 'menor', note: 'Pestaña Registro.' },
  { id: 'lectura', start: '22:35', end: '22:55', title: 'Lectura · 20 páginas', attr: 'PODER', tier: 'menor' },
  { id: 'luz', start: '22:55', end: '23:05', title: 'Luz apagada', attr: 'MENTE', tier: 'normal', note: '7 horas de sueño.' },
]

const SATURDAY: Mission[] = [
  ...morning(6),
  { id: 'salida', start: '07:40', end: '08:00', title: 'Salida · bus de las 8:00', attr: 'MENTE', tier: 'critica' },
  { id: 'caza1', start: '10:00', end: '14:30', title: 'Caza de sábado', attr: 'CARISMA', tier: 'critica' },
  { id: 'registro', start: '22:30', end: '22:35', title: 'Registro del día', attr: 'MENTE', tier: 'menor' },
  { id: 'luz', start: '23:30', end: '23:45', title: 'Luz apagada', attr: 'MENTE', tier: 'normal' },
]

const SUNDAY: Mission[] = [
  { id: 'despertar', start: '08:00', end: '08:30', title: 'Despertar antes de las 8:30', attr: 'MENTE', tier: 'menor' },
  { id: 'sabiduria', start: '11:00', end: '13:00', title: 'Sabiduría · Jung o dinero', attr: 'SABIDURÍA', tier: 'libre' },
  { id: 'batch', start: '17:00', end: '18:30', title: 'Batch cooking · 3 tápers', attr: 'MENTE', tier: 'normal' },
  { id: 'revision', start: '19:00', end: '19:30', title: 'Revisión semanal', attr: 'MENTE', tier: 'normal', steps: ['Qué conseguí', 'Qué quedó pendiente', 'Prioridades de la semana', 'Tareas y compromisos', 'Preparar el lunes'] },
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
  steps: ['100 flexiones', '100 sentadillas', '3 min de plancha acumulados'],
  note: 'Antes de las 23:00. Sin excusas.',
}

export const RANKS = [
  { id: 'E', xp: 0, trial: '—' },
  { id: 'D', xp: 3000, trial: '14 días sin fallar una misión crítica' },
  { id: 'C', xp: 15000, trial: '30 días de racha y 4 semanas cumpliendo 30/10' },
  { id: 'B', xp: 50000, trial: 'Todos los atributos en nivel 10 y Parque desbloqueado' },
  { id: 'A', xp: 120000, trial: '90 días de racha, 12 libros y 6 meses superando objetivos' },
  { id: 'S', xp: 300000, trial: '180 días sin un fallo crítico y tus hitos reales' },
] as const

export const COUNTERS = {
  llamadas: { target: 30, types: ['Captación', 'Seguimiento', 'Relación'] },
  visitas: { target: 10, types: ['Captación', 'Valoración', 'Enseñanza'] },
}
