import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chromium' })
const p = await b.newPage({ viewport: { width: 400, height: 860 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto('file:///e2e/shots/artifact-sim.html', { waitUntil: 'load' })
await p.waitForTimeout(800)
const r = await p.evaluate(() => {
  const over = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.v-table-wrap, .v-tabs'))
  return { sw: document.documentElement.scrollWidth, cw: innerWidth, theme: document.body.dataset.theme, bg: getComputedStyle(document.body).backgroundColor,
    over: over.slice(0, 8).map((e) => e.className || e.tagName) }
})
console.log(JSON.stringify(r), 'errors:', errors.join(' | ') || 'none')
await p.screenshot({ path: '/e2e/shots/phone-00.png' })
await p.evaluate(() => document.getElementById('input').scrollIntoView())
await p.screenshot({ path: '/e2e/shots/phone-01.png' })
await b.close()
