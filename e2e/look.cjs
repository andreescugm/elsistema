// Capturas para revisión visual: node e2e/look.cjs [hora]
const { chromium } = require('playwright')
const T = process.argv[2] || '2026-11-03T15:20'
;(async () => {
  const b = await chromium.launch()
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  await p.addInitScript(() => {
    if (!localStorage.getItem('el-sistema/v2')) localStorage.setItem('el-sistema/v2', JSON.stringify({ version: 2, since: Date.parse('2026-11-03T05:00'), days: {}, player: 'Gabriel Andreescu' }))
  })
  await p.goto(`http://localhost:4173/?t=${T}`)
  await p.waitForTimeout(1600)
  await p.screenshot({ path: '/tmp/v1-popup.png' })
  await p.getByRole('button', { name: 'Entendido' }).click()
  await p.waitForTimeout(400)
  await p.screenshot({ path: '/tmp/v1-estado.png', fullPage: true })
  await p.getByRole('button', { name: 'Atributos' }).last().click()
  await p.waitForTimeout(300)
  await p.screenshot({ path: '/tmp/v1-attrs.png', fullPage: true })
  await p.getByRole('button', { name: /Carisma, nivel/ }).click()
  await p.waitForTimeout(300)
  await p.screenshot({ path: '/tmp/v1-carisma.png', fullPage: true })
  console.log(errs.join('\n') || 'sin errores')
  await b.close()
})()
