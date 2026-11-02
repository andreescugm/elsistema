// Pruebas de extremo a extremo: pulsa cada botón de EL SISTEMA en un navegador real.
// Uso: npm run build && npx vite preview --port 4173 & node e2e/run.mjs [baseUrl]
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const BASE = process.argv[2] || 'http://localhost:4173/'
const PDF = fileURLToPath(new URL('./test.pdf', import.meta.url))
const results = []
let failures = 0

function check(name, cond, detail = '') {
  results.push(`${cond ? 'OK  ' : 'FAIL'} ${name}${!cond && detail ? ` (${detail})` : ''}`)
  if (!cond) failures++
}

async function newApp(browser, time, { keep } = {}) {
  const ctx = keep ?? (await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true }))
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto(`${BASE}?t=${time}`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(900)
  return { ctx, page, errors }
}

const btn = (page, name) => page.getByRole('button', { name, exact: true })
const toastText = async (page) => (await page.locator('.toast').last().textContent({ timeout: 3000 }).catch(() => '')) ?? ''
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
const unnamedButtons = (page) => page.evaluate(() => [...document.querySelectorAll('button, a[href]')].filter((b) => !(b.getAttribute('aria-label') || b.textContent.trim())).length)
const closePopup = async (page) => { if (await page.getByTestId('mission-popup').isVisible().catch(() => false)) await btn(page, 'Entendido').click() }

const browser = await chromium.launch()
try {
  // ---------- 1. Misión crítica del bus a las 8:52 ----------
  let { ctx, page, errors } = await newApp(browser, '2026-11-03T08:52')
  check('Aparece sola la ventana de la misión activa', await page.getByTestId('mission-popup').isVisible())
  check('A las 8:52 la misión es el bus', (await page.locator('#popup-title > span').getAttribute('aria-label').catch(() => '')) === 'Salida · bus de las 9:00')
  check('La misión crítica se marca como urgente', await page.locator('.popup.urgent').isVisible())
  await btn(page, 'Completada').click()
  check('Completar el bus da +80 XP', (await toastText(page)).includes('+80'))
  check('La ventana se cierra tras completar', !(await page.getByTestId('mission-popup').isVisible()))

  // ---------- 2. Estado ----------
  check('Estado muestra el panel de estado', await page.getByTestId('status').isVisible())
  check('Estado sin scroll horizontal', await noHScroll(page))
  await page.getByRole('button', { name: '¿Qué hago ahora?' }).click()
  check('¿Qué hago ahora? abre la orden del Sistema', await page.getByTestId('what-now').isVisible())
  check('¿Qué hago ahora? da dos alternativas', (await page.getByTestId('what-now').locator('.rec').count()) >= 2)
  check('Las alternativas enlazan a YouTube', (await page.getByTestId('what-now').locator('a[href*="youtube.com/results"]').count()) >= 1)
  await page.getByTestId('what-now').getByRole('button', { name: 'Entendido' }).click()

  await btn(page, 'Me aburro').click()
  check('Me aburro abre la Chispa', await page.getByTestId('chispa').isVisible())
  await page.getByRole('tab', { name: '30 min' }).click()
  check('Me aburro cambia a 30 minutos', (await page.getByRole('tab', { name: '30 min' }).getAttribute('aria-selected')) === 'true')
  check('Me aburro da tres opciones concretas', (await page.getByTestId('chispa').locator('.rec').count()) === 3)
  await page.getByTestId('chispa').getByRole('button', { name: 'Volver' }).click()

  await btn(page, 'Estoy quemado').click()
  await btn(page, 'Empezar 20 minutos').click()
  await page.waitForTimeout(1200)
  check('Estoy quemado arranca la cuenta atrás', (await page.getByTestId('chispa').locator('.big').textContent()).startsWith('19:'))
  await btn(page, 'Pausar').click()
  await page.getByTestId('chispa').getByRole('button', { name: 'Volver' }).click()

  await btn(page, 'Estoy bajo').click()
  check('Estoy bajo enseña la misión de arranque', (await page.getByTestId('chispa').locator('.rec').count()) === 1)
  await btn(page, 'Escribe tu porqué').click()
  check('Escribe tu porqué lleva a Ajustes', await page.getByText('Por qué haces esto').isVisible())
  await page.getByLabel('Por qué haces esto').fill('Quiero ser el mejor vendedor de la oficina')
  await page.getByLabel('Nombre').fill('Gabriel A.')
  await page.locator('main .back').click()
  check('El nombre editado aparece en Estado', (await page.locator('.who .name').textContent()) === 'Gabriel A.')

  // ---------- 3. Misiones ----------
  await page.locator('.dock').getByRole('button', { name: 'Misiones' }).click()
  check('Misiones lista el día completo', (await page.locator('.timeline .q').count()) >= 18)
  check('El bus aparece cumplido', (await page.locator('.q.done').count()) >= 1)
  await btn(page, 'Día siguiente').click()
  check('Navegar a mañana', (await page.locator('.daynav p').textContent()).startsWith('Mañana'))
  await btn(page, 'Día anterior').click()
  await btn(page, 'Día anterior').click()
  check('Navegar a ayer', (await page.locator('.daynav p').textContent()).startsWith('Ayer'))
  await btn(page, 'Día siguiente').click()
  await page.getByRole('button', { name: /^Protocolo Cocina/ }).click()
  await btn(page, 'La he fallado').click()
  check('Fallar una normal resta 60', (await toastText(page)).includes('-60'))
  check('Fallar una normal crea la misión de penalización', await page.getByRole('button', { name: /^Misión de penalización/ }).isVisible())
  await page.getByRole('button', { name: /^Misión de penalización/ }).click()
  check('La penalización pide 100 flexiones', await page.getByText('100 flexiones').isVisible())
  await page.getByTestId('mission-popup').locator('.check').first().check()
  check('Los pasos de la misión se pueden marcar', await page.getByTestId('mission-popup').locator('.check').first().isChecked())
  await btn(page, 'Completada').click()
  check('Cumplir la penalización da 0 XP', (await toastText(page)).includes('+0'))
  check('Misiones sin scroll horizontal', await noHScroll(page))

  // ---------- 4. Atributos: los 7, todas sus pestañas ----------
  await page.locator('.dock').getByRole('button', { name: 'Atributos' }).click()
  const names = ['Fuerza', 'Carisma', 'Poder', 'Mente', 'Sabiduría', 'Lengua', 'Creación']
  for (const n of names) {
    await page.getByRole('button', { name: new RegExp(`^${n}, nivel`) }).click()
    const tabs = await page.getByRole('tab').allTextContents()
    let ok = true
    for (const t of tabs) {
      await page.getByRole('tab', { name: t }).click()
      const content = await page.locator('main').innerText()
      if (content.length < 120) ok = false
    }
    check(`${n}: ${tabs.length} pestañas con contenido`, ok && tabs.length >= 5, tabs.join(','))
    check(`${n}: sin scroll horizontal`, await noHScroll(page))
    await page.locator('main .back').click()
  }

  await page.getByRole('button', { name: /^Carisma, nivel/ }).click()
  await page.getByRole('tab', { name: 'Hoy toca' }).click()
  const drill1 = await page.locator('.drill').textContent()
  await btn(page, 'Práctica hecha').click()
  check('Práctica hecha registra la disciplina', (await toastText(page)).includes('práctica registrada'))
  check('Tras practicar, el Sistema rota a otra disciplina', (await page.locator('.drill').textContent()) !== drill1)
  await page.getByRole('button', { name: /Otra opción/ }).click()
  check('Otra opción funciona', (await page.locator('.drill').count()) === 1)

  // Biblioteca con PDF
  await page.getByRole('tab', { name: 'Biblioteca' }).click()
  const book = page.getByTestId('book-voss-nsd')
  const chooser = page.waitForEvent('filechooser')
  await book.getByRole('button', { name: 'Subir PDF' }).click()
  await (await chooser).setFiles(PDF)
  await page.waitForTimeout(600)
  check('Subir PDF lo guarda', (await toastText(page)).includes('PDF guardado'))
  check('El libro pasa a ser el libro actual', (await book.locator('.badge').textContent()) === 'Libro actual')
  await book.getByRole('button', { name: 'Leer aquí' }).click()
  await page.getByTestId('reader').waitFor()
  await page.waitForTimeout(1200)
  check('El lector abre el PDF', (await page.locator('.reader header .pg').textContent()) === '1/3')
  await btn(page, 'Página siguiente').click()
  await page.waitForTimeout(400)
  check('El lector pasa de página y la guarda', (await page.locator('.reader header .pg').textContent()) === '2/3')
  const pixels = await page.evaluate(() => { const c = document.querySelector('.reader canvas'); return c ? c.width * c.height : 0 })
  check('El lector pinta la página', pixels > 1000)
  await btn(page, 'Cerrar el lector').click()
  check('La biblioteca muestra la página 2 de 3', (await book.locator('.num').textContent()).includes('Página 2 de 3'))
  await book.getByRole('button', { name: 'Terminado' }).click()
  check('Terminar un libro da +300 XP', (await toastText(page)).includes('+300'))
  const cab = page.getByTestId('book-cabane-myth')
  await cab.getByLabel(/Página actual/).fill('45')
  await cab.getByRole('button', { name: 'Guardar' }).click()
  check('Apuntar la página a mano', (await cab.locator('.num').textContent()).includes('Página 45'))
  await page.getByLabel('Título').fill('El poder de los hábitos')
  await page.getByLabel('Autor').fill('Charles Duhigg')
  await page.getByRole('button', { name: /Añadir a Carisma/ }).click()
  check('Añadir un libro propio', (await page.locator('.book h4', { hasText: 'El poder de los hábitos' }).count()) === 1)

  // Hoy toca ahora usa el libro actual con página
  await page.getByRole('tab', { name: 'Hoy toca' }).click()
  check('Hoy toca recomienda el libro en curso con su página', /El mito del carisma[\s\S]*página 45/.test(await page.getByTestId('hoy-toca').innerText()))
  await page.locator('main .back').click()

  // Entreno
  await page.getByRole('button', { name: /^Fuerza, nivel/ }).click()
  check('Fuerza abre en Entreno', await page.getByTestId('entreno').isVisible())
  check('El martes toca piernas', /piernas/i.test(await page.getByTestId('entreno').innerText()))
  check('Carrera empieza bloqueada', await page.locator('.mode', { hasText: 'Salir a correr' }).isDisabled())
  const ex = page.getByTestId('entreno').locator('.check')
  for (let i = 0; i < (await ex.count()); i++) await ex.nth(i).check()
  await page.getByRole('button', { name: /Terminar entreno \(5\/5\)/ }).click()
  check('Terminar entreno completo da +40', (await toastText(page)).includes('+40'))
  check('El entreno queda cerrado', (await page.getByTestId('entreno').innerText()).includes('Entreno completado'))
  await page.getByLabel(/Máximo de flexiones/).fill('25')
  await page.getByLabel(/Plancha máxima/).fill('60')
  await page.getByLabel(/Sentadillas en 2 minutos/).fill('45')
  await btn(page, 'Guardar resultados').click()
  check('Guardar la prueba mensual', (await toastText(page)).includes('Prueba mensual guardada'))

  // ---------- 5. Curro ----------
  await page.locator('.dock').getByRole('button', { name: 'Curro' }).click()
  const plus = page.getByRole('button', { name: 'Sumar llamadas de captación' })
  for (let i = 0; i < 30; i++) await plus.click()
  check('30 llamadas suman el objetivo', (await page.getByTestId('total-llamadas').textContent()) === '30')
  check('Llegar a 30 avisa del bonus', (await toastText(page)).includes('+60'))
  await page.getByRole('button', { name: 'Restar llamadas de captación' }).click()
  check('Restar una llamada', (await page.getByTestId('total-llamadas').textContent()) === '29')
  await page.getByRole('button', { name: 'Sumar visitas de valoración' }).click()
  check('Sumar una visita', (await page.getByTestId('total-visitas').textContent()) === '1')
  await page.getByLabel('Nueva tarea').fill('Llamar a la propietaria de Calle Mayor')
  await page.getByLabel('Hora (opcional)').fill('11:30')
  await page.getByRole('button', { name: 'Añadir' }).click()
  check('Añadir tarea a la agenda', await page.getByText('Llamar a la propietaria de Calle Mayor').isVisible())
  await page.getByLabel('Hecho: Llamar a la propietaria de Calle Mayor').check()
  check('Marcar tarea hecha', (await page.locator('.agenda li.done').count()) === 1)
  await page.getByRole('button', { name: 'Borrar Llamar a la propietaria de Calle Mayor' }).click()
  check('Borrar tarea', (await page.locator('.agenda li').count()) === 0)
  check('Curro sin scroll horizontal', await noHScroll(page))

  // ---------- 6. Diario ----------
  await page.locator('.dock').getByRole('button', { name: 'Diario' }).click()
  check('Cerrar registro bloqueado sin rellenar', await page.getByRole('button', { name: 'Cerrar el registro del día' }).isDisabled())
  await page.getByLabel('Nota del día del 1 al 10').fill('8')
  await page.getByLabel('Qué ha funcionado').fill('El etiquetado en las llamadas')
  await page.getByRole('button', { name: 'Cerrar el registro del día' }).click()
  check('Cerrar el registro', await page.getByText('Registro cerrado').isVisible())
  check('El resumen cuenta misiones cumplidas', Number(await page.getByTestId('resumen').locator('.big').first().textContent()) >= 4)

  // ---------- 7. Ajustes ----------
  await page.locator('.dock').getByRole('button', { name: 'Estado' }).click()
  await btn(page, 'Ajustes').click()
  check('Ajustes guarda el porqué', (await page.getByLabel('Por qué haces esto').inputValue()).startsWith('Quiero ser'))
  const [dl] = await Promise.all([page.waitForEvent('download'), btn(page, 'Descargar copia').click()])
  const backupPath = '/tmp/el-sistema-backup.json'
  await dl.saveAs(backupPath)
  const backup = JSON.parse(readFileSync(backupPath, 'utf8'))
  check('La copia de seguridad contiene los días', Object.keys(backup.days).length >= 1 && backup.player === 'Gabriel A.')
  const ics = await page.evaluate(async () => (await fetch('avisos.ics')).text())
  check('El calendario de avisos se sirve', ics.startsWith('BEGIN:VCALENDAR') && ics.includes('VALARM'))
  check('El enlace de suscripción usa webcal', (await page.getByRole('link', { name: 'Suscribirme al calendario' }).getAttribute('href')).startsWith('webcal:'))
  check('La prueba de ascenso está bloqueada sin XP', await page.getByRole('button', { name: 'Prueba bloqueada' }).isDisabled())
  await page.getByLabel('Escribe BORRAR para confirmar').fill('BORRAR')
  await page.getByRole('button', { name: 'Borrar', exact: true }).click()
  await page.locator('main .back').click()
  check('Empezar de cero borra el nombre', (await page.locator('.who .name').textContent()) === 'Gabriel Andreescu')
  await btn(page, 'Ajustes').click()
  const chooser2 = page.waitForEvent('filechooser')
  await btn(page, 'Restaurar desde archivo').click()
  await (await chooser2).setFiles(backupPath)
  await page.waitForTimeout(300)
  check('Restaurar la copia', (await toastText(page)).includes('Copia restaurada'))
  await page.locator('main .back').click()
  check('Tras restaurar vuelve el nombre', (await page.locator('.who .name').textContent()) === 'Gabriel A.')

  // ---------- 8. Persistencia ----------
  await page.reload()
  await page.waitForTimeout(900)
  await closePopup(page)
  check('Los datos sobreviven a recargar', (await page.locator('.who .name').textContent()) === 'Gabriel A.')
  check('Todos los botones y enlaces tienen nombre', (await unnamedButtons(page)) === 0)
  check('Sin errores en consola (sesión 1)', errors.length === 0, errors.join(' | '))
  await ctx.close()

  // ---------- 9. Modo rojo y corrección ----------
  ;({ ctx, page, errors } = await newApp(browser, '2026-11-03T08:30'))
  await closePopup(page)
  await ctx.storageState({ path: '/tmp/state.json' })
  const p2 = await ctx.newPage()
  const errs2 = []
  p2.on('pageerror', (e) => errs2.push(e.message))
  await p2.goto(`${BASE}?t=2026-11-03T09:45`)
  await p2.waitForTimeout(900)
  await closePopup(p2)
  check('Perder el bus activa la zona de penalización', await p2.locator('.banner').isVisible())
  check('La interfaz se vuelve roja', await p2.locator('.app.is-red').count() === 1)
  await p2.locator('.dock').getByRole('button', { name: 'Misiones' }).click()
  await p2.getByRole('button', { name: /^Salida · bus de las 9:00/ }).click()
  check('Una misión vencida lo indica', await p2.getByText(/Vencida sin respuesta/).isVisible())
  await p2.getByRole('button', { name: 'Sí la hice, corregir' }).click()
  await p2.locator('.dock').getByRole('button', { name: 'Estado' }).click()
  check('Corregir el fallo quita la zona de penalización', !(await p2.locator('.banner').isVisible()))
  check('Sin errores en consola (sesión 2)', errs2.length === 0 && errors.length === 0, [...errors, ...errs2].join(' | '))
  await ctx.close()

  // ---------- 10. Escritorio ----------
  ;({ ctx, page, errors } = await newApp(browser, '2026-11-08T19:05'))
  await page.setViewportSize({ width: 1280, height: 900 })
  check('Domingo 19:05: revisión semanal', (await page.locator('#popup-title > span').getAttribute('aria-label')) === 'Revisión semanal')
  await closePopup(page)
  check('Escritorio sin scroll horizontal', await noHScroll(page))
  await ctx.close()
} catch (e) {
  check('La batería ha terminado sin excepción', false, e.message.split('\n')[0])
} finally {
  await browser.close()
}

console.log(results.join('\n'))
console.log(`\n${results.length - failures}/${results.length} pruebas superadas`)
writeFileSync('/tmp/e2e-result.txt', results.join('\n'))
process.exit(failures ? 1 : 0)
