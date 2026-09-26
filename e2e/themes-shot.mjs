// Theme menu and builder screenshots (bin/dev up first): bin/e2e themes-shot.mjs
import { chromium } from 'playwright'
const base = process.env.DEMO_URL || 'http://127.0.0.1:8126/demo/'
const out = '/e2e/shots'
const b = await chromium.launch({ channel: 'chromium' })
const errors = []
const page = async (vp, scheme = 'dark') => {
  const ctx = await b.newContext({ viewport: vp, colorScheme: scheme })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return p
}
let p = await page({ width: 1280, height: 900 })
await p.goto(base, { waitUntil: 'networkidle' }); await p.waitForTimeout(500)
await p.screenshot({ path: `${out}/th-hero.png` })
await p.locator('#theme-hero').click(); await p.waitForTimeout(700)
await p.screenshot({ path: `${out}/th-menu.png` })
await p.keyboard.press('Escape'); await p.waitForTimeout(300)
for (const id of ['candy', 'solarized-light', 'nord', 'dracula', 'the-times', 'high-contrast']) {
  await p.locator('#theme-hero').selectOption(id); await p.waitForTimeout(400)
  await p.screenshot({ path: `${out}/th-${id}.png` })
}
await p.locator('.demo-toolbar-theme select').click(); await p.waitForTimeout(700)
await p.screenshot({ path: `${out}/th-toolbar-menu.png` })
await p.keyboard.press('Escape')
p = await page({ width: 1440, height: 900 })
await p.goto(base + 'builder.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await p.screenshot({ path: `${out}/th-builder.png` })
await p.locator('#c-primary').evaluate((e) => { e.value = '#00bcd4'; e.dispatchEvent(new Event('input', { bubbles: true })) })
await p.waitForTimeout(600)
await p.screenshot({ path: `${out}/th-builder-edit.png` })
const inFrame = await p.frameLocator('#bld-frame').locator('body').evaluate((b) => [b.dataset.theme, getComputedStyle(b).getPropertyValue('--v-primary').trim()])
console.log('preview theme / primary:', inFrame.join(' '))
console.log('css head:', (await p.locator('#bld-css').textContent()).split('\n').slice(0, 4).join(' | '))
p = await page({ width: 390, height: 844 }, 'light')
await p.goto(base + 'builder.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
await p.screenshot({ path: `${out}/th-builder-mobile.png` })
await p.getByRole('tab', { name: 'Aperçu' }).click(); await p.waitForTimeout(800)
await p.screenshot({ path: `${out}/th-builder-mobile-preview.png` })
console.log('errors:', errors.join(' | ') || 'none')
await b.close()
