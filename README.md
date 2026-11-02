# EL SISTEMA

App personal de misiones con avisos, experiencia, castigos, rangos y un plan de aprendizaje concreto por atributo. Interfaz holográfica. Funciona sin servidor: los datos y los PDF se guardan en el dispositivo.

## Comandos

- `npm install`
- `npm run dev`: desarrollo
- `npm test`: 27 tests del motor (XP, castigos, rangos, recomendaciones, entreno, calendario)
- `npm run build`: genera `public/avisos.ics` y compila en `dist/`
- `npx vite preview --port 4173` y `npm run e2e`: 89 pruebas de extremo a extremo en navegador

## Estructura

- `src/data/`: contenido (horario, atributos y disciplinas, libros, referentes, podcasts, entreno, mensajes)
- `src/engine/`: reglas puras y probadas (`core`, `recommend`, `training`, `ics`)
- `src/screens/` y `src/ui/`: interfaz
- `e2e/`: pruebas de navegador y capturas

## Avisos con la app cerrada

`avisos.ics` es un calendario con todas las misiones, su alarma y lo concreto que hay que hacer. Se suscribe desde Ajustes. `APP_URL` fija el enlace que aparece en cada aviso al compilar.

## Reloj de pruebas

`?t=2026-11-03T08:52` en la URL fija la hora de la app (solo para pruebas).
