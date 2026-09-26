import { chromium } from 'playwright'
const url = process.env.DEMO_URL || 'http://127.0.0.1:8126/demo/'
const b = await chromium.launch({ channel: 'chromium' })
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await p.goto(url, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
const h = await p.evaluate(() => document.documentElement.scrollHeight)
for (let i = 0, y = 0; y < h; i++, y += 880) {
  await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(250)
  await p.screenshot({ path: `/e2e/shots/demo-${String(i).padStart(2, '0')}.png` })
}
console.log('height', h, 'errors:', errors.join(' | ') || 'none')
await b.close()
