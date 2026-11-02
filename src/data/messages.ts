// Mensajes del Sistema. Originales, tono seco y directo.

export const MSG = {
  bajo: [
    'No necesitas ganas. Necesitas empezar. Cinco minutos y decides después.',
    'Los días fáciles no construyen a nadie. Este sí.',
    'Nadie va a venir a hacerlo por ti. Por eso funciona.',
    'Estás cansado, no acabado. Hay diferencia.',
    'El que eras hace un mes no habría llegado hasta aquí.',
    'Hoy no tienes que ganar. Tienes que no rendirte.',
    'El dolor de la disciplina pesa gramos. El del arrepentimiento, toneladas.',
    'Cada "no" de hoy te acerca al "sí" que paga el mes.',
    'Si fuera fácil, todos estarían donde quieres llegar tú.',
    'Haz la siguiente cosa pequeña. Solo esa.',
    'Tu yo de dentro de un año te está mirando. Dale motivos.',
    'Bajar el ritmo vale. Parar, no.',
  ],
  aburrido: [
    'Aburrirse es tiempo sin dueño. Dale uno.',
    'Diez minutos bien usados valen más que una hora de scroll.',
    'El aburrimiento es la puerta. Lo que haces con él te define.',
  ],
  quemado: [
    'Recargar también es parte de la misión. 20 minutos y vuelves.',
    'Respira, agua, y de pie. El cuerpo manda sobre la cabeza.',
    'Descanso no es rendición. Es munición.',
  ],
  racha: [
    'Racha activa. No la regales por una noche floja.',
    'Llevas días encadenados. Así se construye un rango.',
  ],
  rojo: [
    'Zona de penalización. Aquí se demuestra quién eres cuando pierdes.',
    'Has fallado. Ahora cumple el doble de bien.',
  ],
  mañana: [
    'Buenos días, cazador. El día ya ha empezado sin pedirte permiso.',
    'Lo que hagas antes de las 9:00 decide el resto.',
  ],
  noche: [
    'El día termina cuando el siguiente está listo.',
    'Cierra bien hoy y mañana empiezas ganando.',
  ],
}

export const pick = <T,>(arr: readonly T[], seed: number) => arr[Math.abs(seed) % arr.length]
