// Contenido de aprendizaje de EL SISTEMA.
// Cada atributo tiene disciplinas concretas, libros, referentes y podcasts.
// Los vídeos y podcasts enlazan a búsquedas (YouTube / Spotify), nunca a enlaces inventados.

export type AttrId = 'FUERZA' | 'CARISMA' | 'PODER' | 'MENTE' | 'SABIDURIA' | 'LENGUA' | 'CREACION'

export interface Book {
  id: string
  title: string
  author: string
  attr: AttrId
  discipline: string
  why: string
}

export interface Person {
  id: string
  name: string
  topic: string
  query: string // búsqueda en YouTube
}

export interface Podcast {
  id: string
  name: string
  host: string
  why: string
}

export interface Discipline {
  id: string
  name: string
  goal: string
  drills: string[] // prácticas concretas de 10-20 min
  people: string[] // ids de Person
  books: string[] // ids de Book
}

export interface AttrDef {
  id: AttrId
  name: string
  tagline: string
  disciplines: Discipline[]
  podcasts: string[]
}

export const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
export const spotify = (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`

export const PEOPLE: Person[] = [
  { id: 'voss', name: 'Chris Voss', topic: 'Negociación (ex negociador de rehenes del FBI)', query: 'Chris Voss negotiation tactics' },
  { id: 'hughes', name: 'Chase Hughes', topic: 'Lectura del comportamiento e influencia', query: 'Chase Hughes body language behavior' },
  { id: 'kiriakou', name: 'John Kiriakou', topic: 'Técnicas de la CIA: obtener información y leer personas', query: 'John Kiriakou CIA interrogation elicitation' },
  { id: 'cabane', name: 'Olivia Fox Cabane', topic: 'Carisma: presencia, poder y calidez', query: 'Olivia Fox Cabane charisma' },
  { id: 'belfort', name: 'Jordan Belfort', topic: 'Venta en línea recta y tono', query: 'Jordan Belfort straight line selling' },
  { id: 'hormozi', name: 'Alex Hormozi', topic: 'Ventas, ofertas y objeciones', query: 'Alex Hormozi sales objections closing' },
  { id: 'vanedwards', name: 'Vanessa Van Edwards', topic: 'Habilidades sociales con base científica', query: 'Vanessa Van Edwards charisma body language' },
  { id: 'greene', name: 'Robert Greene', topic: 'Poder, estrategia y naturaleza humana', query: 'Robert Greene 48 laws of power interview' },
  { id: 'goggins', name: 'David Goggins', topic: 'Disciplina y mentalidad', query: 'David Goggins discipline mindset' },
  { id: 'holiday', name: 'Ryan Holiday', topic: 'Estoicismo aplicado', query: 'Ryan Holiday stoicism daily' },
  { id: 'huberman', name: 'Andrew Huberman', topic: 'Sueño, foco y dopamina', query: 'Andrew Huberman focus dopamine sleep' },
  { id: 'peterson', name: 'Jordan Peterson', topic: 'Jung explicado, responsabilidad', query: 'Jordan Peterson Carl Jung shadow' },
  { id: 'housel', name: 'Morgan Housel', topic: 'Psicología del dinero', query: 'Morgan Housel psychology of money' },
  { id: 'naval', name: 'Naval Ravikant', topic: 'Riqueza y apalancamiento', query: 'Naval Ravikant how to get rich' },
  { id: 'bbcle', name: 'BBC Learning English', topic: 'Inglés práctico', query: 'BBC Learning English 6 minute English' },
  { id: 'eng-sales', name: 'Inglés de ventas', topic: 'Vocabulario de negociación en inglés', query: 'business English negotiation phrases' },
  { id: 'harvey', name: 'Harvey Specter (Suits)', topic: 'Actitud, presencia y cierre', query: 'Harvey Specter best negotiation scenes' },
  { id: 'fl', name: 'Producción en FL Studio', topic: 'Beats de trap y rap', query: 'FL Studio dark trap beat tutorial' },
  { id: 'rap-writing', name: 'Escritura de rap', topic: 'Rimas, flow y estructura', query: 'how to write better rap lyrics flow' },
  { id: 'calisthenics', name: 'Calistenia en casa', topic: 'Técnica de flexiones, dominadas y core', query: 'calisthenics beginner routine proper form' },
]

export const BOOKS: Book[] = [
  // CARISMA
  { id: 'voss-nsd', title: 'Rompe la barrera del no', author: 'Chris Voss', attr: 'CARISMA', discipline: 'negociacion', why: 'El manual de negociación del FBI aplicado a ventas.' },
  { id: 'cabane-myth', title: 'El mito del carisma', author: 'Olivia Fox Cabane', attr: 'CARISMA', discipline: 'presencia', why: 'El carisma se entrena: presencia, poder y calidez.' },
  { id: 'carnegie', title: 'Cómo ganar amigos e influir sobre las personas', author: 'Dale Carnegie', attr: 'CARISMA', discipline: 'rapport', why: 'La base del trato con clientes.' },
  { id: 'cialdini', title: 'Influencia', author: 'Robert Cialdini', attr: 'CARISMA', discipline: 'venta', why: 'Los principios por los que la gente dice sí.' },
  { id: 'hughes-ellipsis', title: 'The Ellipsis Manual', author: 'Chase Hughes', attr: 'CARISMA', discipline: 'lectura', why: 'Análisis del comportamiento e influencia (en inglés).' },
  { id: 'belfort-wolf', title: 'Way of the Wolf', author: 'Jordan Belfort', attr: 'CARISMA', discipline: 'venta', why: 'El sistema de venta en línea recta.' },
  // PODER
  { id: 'greene-48', title: 'Las 48 leyes del poder', author: 'Robert Greene', attr: 'PODER', discipline: 'leyes', why: 'Una ley al día, aplicada a la oficina y a clientes.' },
  { id: 'greene-nature', title: 'Las leyes de la naturaleza humana', author: 'Robert Greene', attr: 'PODER', discipline: 'leyes', why: 'Por qué la gente actúa como actúa.' },
  { id: 'principe', title: 'El príncipe', author: 'Nicolás Maquiavelo', attr: 'PODER', discipline: 'estrategia', why: 'El clásico del poder real.' },
  { id: 'suntzu', title: 'El arte de la guerra', author: 'Sun Tzu', attr: 'PODER', discipline: 'estrategia', why: 'Estrategia en pocas páginas.' },
  { id: 'greene-mastery', title: 'Maestría', author: 'Robert Greene', attr: 'PODER', discipline: 'maestria', why: 'Cómo se llega a ser el mejor en algo.' },
  // MENTE
  { id: 'goggins', title: "Can't Hurt Me", author: 'David Goggins', attr: 'MENTE', discipline: 'disciplina', why: 'Disciplina cuando no hay ganas.' },
  { id: 'clear', title: 'Hábitos atómicos', author: 'James Clear', attr: 'MENTE', discipline: 'habitos', why: 'Sistemas pequeños que se acumulan.' },
  { id: 'aurelio', title: 'Meditaciones', author: 'Marco Aurelio', attr: 'MENTE', discipline: 'estoicismo', why: 'Control de lo que depende de ti.' },
  { id: 'holiday-obstacle', title: 'El obstáculo es el camino', author: 'Ryan Holiday', attr: 'MENTE', discipline: 'estoicismo', why: 'Estoicismo práctico para días malos.' },
  { id: 'newport', title: 'Céntrate (Deep Work)', author: 'Cal Newport', attr: 'MENTE', discipline: 'foco', why: 'Trabajo profundo sin distracciones.' },
  { id: 'biblia', title: 'La Biblia', author: 'Varios autores', attr: 'MENTE', discipline: 'espiritu', why: 'Lectura de cada mañana.' },
  // SABIDURÍA
  { id: 'jung-symbols', title: 'El hombre y sus símbolos', author: 'Carl G. Jung', attr: 'SABIDURIA', discipline: 'psique', why: 'La entrada más accesible a Jung.' },
  { id: 'housel', title: 'La psicología del dinero', author: 'Morgan Housel', attr: 'SABIDURIA', discipline: 'dinero', why: 'Cómo piensa la gente que conserva el dinero.' },
  { id: 'babilonia', title: 'El hombre más rico de Babilonia', author: 'George S. Clason', attr: 'SABIDURIA', discipline: 'dinero', why: 'Reglas básicas de ahorro e inversión.' },
  { id: 'kiyosaki', title: 'Padre rico, padre pobre', author: 'Robert Kiyosaki', attr: 'SABIDURIA', discipline: 'dinero', why: 'Activos frente a pasivos.' },
  { id: 'naval', title: 'El almanaque de Naval Ravikant', author: 'Eric Jorgenson', attr: 'SABIDURIA', discipline: 'dinero', why: 'Riqueza, apalancamiento y felicidad.' },
  // LENGUA
  { id: 'voss-en', title: 'Never Split the Difference (en inglés)', author: 'Chris Voss', attr: 'LENGUA', discipline: 'lectura-en', why: 'Inglés y negociación a la vez.' },
  // CREACIÓN
  { id: 'rubin', title: 'El acto creativo', author: 'Rick Rubin', attr: 'CREACION', discipline: 'marca', why: 'Cómo trabaja un productor legendario.' },
]

export const PODCASTS: Podcast[] = [
  { id: 'harbinger', name: 'The Jordan Harbinger Show', host: 'Jordan Harbinger', why: 'Habilidades sociales e influencia con expertos.' },
  { id: 'doac', name: 'The Diary of a CEO', host: 'Steven Bartlett', why: 'Mentalidad, negocio y psicología.' },
  { id: 'huberman-lab', name: 'Huberman Lab', host: 'Andrew Huberman', why: 'Sueño, foco y rendimiento.' },
  { id: 'modern-wisdom', name: 'Modern Wisdom', host: 'Chris Williamson', why: 'Psicología, disciplina y relaciones.' },
  { id: 'six-minute', name: '6 Minute English', host: 'BBC Learning English', why: 'Inglés en 6 minutos para el bus.' },
  { id: 'all-ears', name: 'All Ears English', host: 'Lindsay McMahon y Michelle Kaplan', why: 'Inglés conversacional y de negocios.' },
  { id: 'libros-emprendedores', name: 'Libros para Emprendedores', host: 'Luis Ramos', why: 'Resúmenes de libros de negocio en español.' },
  { id: 'daily-stoic', name: 'The Daily Stoic', host: 'Ryan Holiday', why: 'Una idea estoica al día.' },
]

export const ATTRS: AttrDef[] = [
  {
    id: 'FUERZA',
    name: 'Fuerza',
    tagline: 'Cuerpo de cazador. Entreno diario y desbloqueos al aire libre.',
    podcasts: ['huberman-lab'],
    disciplines: [
      { id: 'entreno', name: 'Entreno en casa', goal: 'Completar el programa del día con buena técnica.', drills: ['Haz el entreno del día en la pestaña Entreno.', 'Si hoy no toca, 10 min de movilidad de cadera y hombros.'], people: ['calisthenics'], books: [] },
      { id: 'recuperacion', name: 'Recuperación', goal: 'Dormir 7 horas y comer proteína en cada comida.', drills: ['Luz apagada a las 22:55.', 'Proteína en desayuno, táper y cena.'], people: ['huberman'], books: [] },
    ],
  },
  {
    id: 'CARISMA',
    name: 'Carisma',
    tagline: 'Venta, negociación y lectura de personas. Tu arma principal en el curro.',
    podcasts: ['harbinger', 'doac'],
    disciplines: [
      { id: 'negociacion', name: 'Negociación', goal: 'Dominar el espejo, el etiquetado y las preguntas calibradas de Voss.', drills: ['En tus próximas 5 llamadas usa una etiqueta: "Parece que…" y apunta la reacción.', 'Repite (espejo) las 3 últimas palabras del cliente en cada objeción de hoy.', 'Prepara 3 preguntas calibradas que empiecen por "¿Cómo…?" o "¿Qué…?" para tus visitas.'], people: ['voss', 'harvey'], books: ['voss-nsd'] },
      { id: 'lectura', name: 'Lectura de personas', goal: 'Detectar la línea base de alguien y sus desviaciones.', drills: ['En cada visita de hoy apunta la línea base del cliente: postura, ritmo al hablar, manos.', 'Identifica la necesidad principal del cliente (seguridad, reconocimiento, control…) antes de ofrecer nada.', 'Vídeo de 15 min de Chase Hughes o John Kiriakou y anota 1 técnica.'], people: ['hughes', 'kiriakou'], books: ['hughes-ellipsis'] },
      { id: 'presencia', name: 'Presencia y carisma', goal: 'Transmitir presencia, poder y calidez en los primeros 30 segundos.', drills: ['Antes de cada visita: 3 respiraciones, postura abierta y una sonrisa real.', 'En cada conversación de hoy, deja 2 segundos de silencio antes de responder.'], people: ['cabane', 'vanedwards'], books: ['cabane-myth'] },
      { id: 'venta', name: 'Venta y cierre', goal: 'Manejar objeciones y cerrar con seguridad.', drills: ['Escribe tus 3 objeciones más frecuentes y una respuesta para cada una.', 'Ensaya en voz alta tu apertura de llamada en frío (30 segundos) 5 veces.'], people: ['belfort', 'hormozi'], books: ['cialdini', 'belfort-wolf'] },
      { id: 'rapport', name: 'Rapport', goal: 'Que el cliente sienta que le entiendes.', drills: ['Usa el nombre del cliente 2 veces en cada llamada.', 'Haz una pregunta personal sincera en cada visita y recuerda la respuesta.'], people: ['vanedwards'], books: ['carnegie'] },
    ],
  },
  {
    id: 'PODER',
    name: 'Poder',
    tagline: 'Estrategia, juegos de poder y naturaleza humana.',
    podcasts: ['modern-wisdom'],
    disciplines: [
      { id: 'leyes', name: 'Las 48 leyes', goal: 'Una ley al día: leerla, entenderla y detectarla en tu entorno.', drills: ['Lee la siguiente ley de Las 48 leyes del poder y escribe dónde la has visto hoy.', 'Observa una reunión o conversación de hoy: ¿quién tiene el poder y por qué?'], people: ['greene'], books: ['greene-48', 'greene-nature'] },
      { id: 'estrategia', name: 'Estrategia', goal: 'Pensar dos movimientos por delante.', drills: ['Lee un capítulo corto de El arte de la guerra y aplícalo a tu cartera de clientes.', 'Escribe tu plan para tu cliente más difícil: qué quiere, qué teme, qué le das.'], people: ['greene'], books: ['suntzu', 'principe'] },
      { id: 'maestria', name: 'Maestría', goal: 'Construir el camino para ser el mejor en ventas.', drills: ['Elige a la mejor persona de la oficina y apunta 3 cosas que hace distinto.'], people: ['greene'], books: ['greene-mastery'] },
    ],
  },
  {
    id: 'MENTE',
    name: 'Mente',
    tagline: 'Disciplina, foco y mentalidad. El motor de todo lo demás.',
    podcasts: ['daily-stoic', 'huberman-lab'],
    disciplines: [
      { id: 'disciplina', name: 'Disciplina', goal: 'Hacer lo que toca aunque no apetezca.', drills: ['Haz ahora la tarea que más estás evitando, 15 min sin parar.', 'Escribe 3 cosas difíciles que has superado: es tu reserva para hoy.'], people: ['goggins'], books: ['goggins'] },
      { id: 'estoicismo', name: 'Estoicismo', goal: 'Separar lo que depende de ti de lo que no.', drills: ['Lee 2 páginas de Meditaciones y escribe una frase aplicada a tu día.', 'Ante el próximo rechazo de hoy: ¿qué parte dependía de ti?'], people: ['holiday'], books: ['aurelio', 'holiday-obstacle'] },
      { id: 'habitos', name: 'Hábitos', goal: 'Que lo importante sea automático.', drills: ['Prepara esta noche todo lo de mañana: elimina fricción.', 'Revisa qué misión fallas más y escribe cómo hacerla más fácil.'], people: ['huberman'], books: ['clear'] },
      { id: 'foco', name: 'Foco profundo', goal: 'Bloques de trabajo sin móvil.', drills: ['25 min de llamadas con el móvil personal en otra habitación.', 'Silencia todas las notificaciones menos las de EL SISTEMA.'], people: ['huberman'], books: ['newport'] },
      { id: 'espiritu', name: 'Espíritu', goal: 'Empezar el día con calma y sentido.', drills: ['Lee un capítulo corto de la Biblia y quédate con una frase para el día.'], people: [], books: ['biblia'] },
    ],
  },
  {
    id: 'SABIDURIA',
    name: 'Sabiduría',
    tagline: 'Psique y dinero. Para fines de semana y noches tranquilas.',
    podcasts: ['doac', 'libros-emprendedores'],
    disciplines: [
      { id: 'psique', name: 'Psique (Jung)', goal: 'Conocer tu sombra y tus patrones.', drills: ['Lee 10 páginas de El hombre y sus símbolos.', 'Escribe algo que te molestó hoy de otra persona: ¿qué dice de ti?'], people: ['peterson'], books: ['jung-symbols'] },
      { id: 'dinero', name: 'Dinero', goal: 'Entender el dinero para conservarlo y multiplicarlo.', drills: ['Apunta todos tus gastos de la semana.', 'Lee un capítulo de La psicología del dinero.', 'Calcula cuánto ahorras al mes llevando táper en vez de menú.'], people: ['housel', 'naval'], books: ['housel', 'babilonia', 'kiyosaki', 'naval'] },
    ],
  },
  {
    id: 'LENGUA',
    name: 'Lengua',
    tagline: 'Inglés. Primero pulirlo; otros idiomas después.',
    podcasts: ['six-minute', 'all-ears'],
    disciplines: [
      { id: 'escucha', name: 'Escucha', goal: 'Entender inglés real a velocidad normal.', drills: ['Escucha un episodio de 6 Minute English en el bus.', 'Pon un vídeo en inglés sin subtítulos 10 min y apunta 5 palabras nuevas.'], people: ['bbcle'], books: [] },
      { id: 'habla', name: 'Habla', goal: 'Hablar con soltura.', drills: ['Shadowing: repite en voz alta 5 min de un vídeo en inglés, imitando el ritmo.', 'Explica en inglés, en voz alta, cómo venderías un piso de 150.000 €.'], people: ['bbcle', 'eng-sales'], books: [] },
      { id: 'lectura-en', name: 'Lectura en inglés', goal: 'Leer libros de negocio en inglés.', drills: ['Lee 5 páginas de Never Split the Difference en inglés.'], people: ['voss'], books: ['voss-en'] },
    ],
  },
  {
    id: 'CREACION',
    name: 'Creación',
    tagline: 'Rumi Caín. Sin avisos: tu espacio creativo de la noche.',
    podcasts: [],
    disciplines: [
      { id: 'letras', name: 'Letras', goal: 'Escribir barras con identidad.', drills: ['Escribe 16 barras sobre lo que has vivido hoy en el curro.', 'Reescribe tu peor barra de la semana.'], people: ['rap-writing'], books: [] },
      { id: 'produccion', name: 'Producción', goal: 'Hacer bases propias en FL Studio.', drills: ['Haz un loop de 8 compases en FL Studio en 25 min.'], people: ['fl'], books: [] },
      { id: 'marca', name: 'Marca', goal: 'Construir la marca Rumi Caín.', drills: ['Apunta 3 ideas de contenido para la próxima semana.'], people: [], books: ['rubin'] },
    ],
  },
]

export const attrById = (id: AttrId) => ATTRS.find((a) => a.id === id)!
export const personById = (id: string) => PEOPLE.find((p) => p.id === id)
export const podcastById = (id: string) => PODCASTS.find((p) => p.id === id)
export const bookById = (id: string) => BOOKS.find((b) => b.id === id)
