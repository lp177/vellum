import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chromium' })
const p = await b.newPage({ viewport: { width: 400, height: 860 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto('file:///e2e/shots/artifact-sim.html', { waitUntil: 'load' }); await p.waitForTimeout(800)
console.log(JSON.stringify(await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, theme: document.body.dataset.theme,
  options: document.querySelectorAll('#theme-hero option').length, builderVisible: [...document.querySelectorAll('[data-builder-link]')].some((a) => a.offsetParent) }))), 'errors:', errors.join(' | ') || 'none')
await b.close()
