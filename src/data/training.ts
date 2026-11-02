// Programa de entreno en casa con progresión doble.
// Cuando completas todas las series en el objetivo 2 sesiones seguidas, el objetivo sube.

export interface Exercise {
  id: string
  name: string
  sets: number
  start: number // objetivo inicial por serie
  unit: 'reps' | 's'
  step: number // cuánto sube al progresar
  cue: string // clave técnica
}

export interface WorkoutDay {
  focus: string
  exercises: Exercise[]
}

export const PROGRAM: Record<number, WorkoutDay> = {
  1: {
    focus: 'Empuje',
    exercises: [
      { id: 'flexiones', name: 'Flexiones', sets: 4, start: 12, unit: 'reps', step: 2, cue: 'Cuerpo en tabla, pecho casi al suelo.' },
      { id: 'press-hombro', name: 'Press de hombro con mancuernas', sets: 4, start: 10, unit: 'reps', step: 1, cue: 'Abdomen apretado, sin arquear la espalda.' },
      { id: 'fondos-silla', name: 'Fondos en silla', sets: 3, start: 12, unit: 'reps', step: 2, cue: 'Codos hacia atrás, bajar hasta 90°.' },
      { id: 'ext-triceps', name: 'Extensión de tríceps', sets: 3, start: 12, unit: 'reps', step: 1, cue: 'Codos fijos junto a la cabeza.' },
      { id: 'laterales', name: 'Elevaciones laterales', sets: 3, start: 15, unit: 'reps', step: 1, cue: 'Subir hasta la altura del hombro, lento al bajar.' },
    ],
  },
  2: {
    focus: 'Piernas',
    exercises: [
      { id: 'goblet', name: 'Sentadilla goblet', sets: 4, start: 12, unit: 'reps', step: 1, cue: 'Talones en el suelo, rodillas hacia fuera.' },
      { id: 'zancadas', name: 'Zancadas (por pierna)', sets: 3, start: 10, unit: 'reps', step: 1, cue: 'Rodilla de atrás casi al suelo.' },
      { id: 'bulgaras', name: 'Sentadilla búlgara (por pierna)', sets: 3, start: 8, unit: 'reps', step: 1, cue: 'Pie de atrás en una silla, torso erguido.' },
      { id: 'puente', name: 'Puente de glúteo', sets: 3, start: 15, unit: 'reps', step: 2, cue: 'Aprieta glúteo 1 s arriba.' },
      { id: 'gemelos', name: 'Elevación de gemelos', sets: 4, start: 20, unit: 'reps', step: 2, cue: 'Recorrido completo, pausa arriba.' },
    ],
  },
  3: {
    focus: 'Tirón',
    exercises: [
      { id: 'remo', name: 'Remo con mancuerna (por brazo)', sets: 4, start: 10, unit: 'reps', step: 1, cue: 'Tira con el codo hacia la cadera.' },
      { id: 'curl', name: 'Curl de bíceps', sets: 3, start: 12, unit: 'reps', step: 1, cue: 'Sin balanceo, bajada en 2 s.' },
      { id: 'martillo', name: 'Curl martillo', sets: 3, start: 12, unit: 'reps', step: 1, cue: 'Palmas mirándose entre sí.' },
      { id: 'pajaros', name: 'Pájaros', sets: 3, start: 15, unit: 'reps', step: 1, cue: 'Torso inclinado, abre hacia los lados.' },
      { id: 'superman', name: 'Superman', sets: 3, start: 15, unit: 'reps', step: 2, cue: 'Brazos y piernas arriba, 1 s de pausa.' },
    ],
  },
  4: {
    focus: 'Core',
    exercises: [
      { id: 'plancha', name: 'Plancha', sets: 3, start: 45, unit: 's', step: 5, cue: 'Glúteo apretado, sin hundir la cadera.' },
      { id: 'hollow', name: 'Hollow hold', sets: 3, start: 30, unit: 's', step: 5, cue: 'Zona lumbar pegada al suelo.' },
      { id: 'bicicleta', name: 'Crunch bicicleta', sets: 3, start: 20, unit: 'reps', step: 2, cue: 'Codo hacia la rodilla contraria, lento.' },
      { id: 'elev-piernas', name: 'Elevación de piernas', sets: 3, start: 12, unit: 'reps', step: 1, cue: 'Bajada controlada, no tocar el suelo.' },
      { id: 'deadbug', name: 'Dead bug', sets: 3, start: 10, unit: 'reps', step: 1, cue: 'Brazo y pierna contrarios, espalda pegada.' },
    ],
  },
  5: {
    focus: 'Total + cardio',
    exercises: [
      { id: 'burpees', name: 'Burpees', sets: 5, start: 10, unit: 'reps', step: 1, cue: 'Ritmo constante, salto completo.' },
      { id: 'sentadillas', name: 'Sentadillas', sets: 5, start: 20, unit: 'reps', step: 2, cue: 'Profundidad completa.' },
      { id: 'flex-circuito', name: 'Flexiones', sets: 5, start: 12, unit: 'reps', step: 1, cue: 'Sin perder la tabla.' },
      { id: 'climbers', name: 'Mountain climbers', sets: 5, start: 30, unit: 's', step: 5, cue: 'Cadera baja, rodillas al pecho.' },
    ],
  },
  6: {
    focus: 'Movilidad',
    exercises: [
      { id: 'movilidad', name: 'Movilidad de cadera, hombros y columna', sets: 1, start: 15, unit: 's', step: 0, cue: '15 minutos suaves. Cuenta en minutos, no en segundos.' },
    ],
  },
}

export interface Unlock {
  id: string
  name: string
  desc: string
  xp: number // XP por sesión de este tipo
  requirements: string[]
}

export const UNLOCKS: Unlock[] = [
  { id: 'casa', name: 'Entreno en casa', desc: 'El programa diario con mancuernas y peso corporal.', xp: 40, requirements: [] },
  { id: 'carrera', name: 'Carrera', desc: 'Salir a correr 20 minutos.', xp: 60, requirements: ['Fuerza nivel 3', '20 entrenos completados', 'Prueba: 3 km a ritmo suave'] },
  { id: 'parque', name: 'Parque', desc: 'Dominadas y fondos en paralelas al aire libre.', xp: 70, requirements: ['Fuerza nivel 5', '4 semanas con el 90 % de entrenos'] },
  { id: 'mazmorra', name: 'Mazmorra', desc: 'Ir corriendo al parque, rutina completa y volver corriendo.', xp: 120, requirements: ['Carrera desbloqueada', 'Parque desbloqueado'] },
  { id: 'avanzado', name: 'Rutinas avanzadas', desc: 'Lastre y pliometría. XP ×1,3.', xp: 52, requirements: ['Fuerza nivel 10', '3 pruebas mensuales seguidas mejorando'] },
]

export const MONTHLY_TEST = [
  { id: 'max-flexiones', name: 'Máximo de flexiones', unit: 'reps' },
  { id: 'max-plancha', name: 'Plancha máxima', unit: 's' },
  { id: 'sentadillas-2min', name: 'Sentadillas en 2 minutos', unit: 'reps' },
] as const
