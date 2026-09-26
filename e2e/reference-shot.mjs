// Full-page screenshots of the reference page (polymerthemes.com/golden-goose), scrolling its inner scroller.
// bin/e2e reference-shot.mjs → e2e/shots/ref-*.png
import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } })
await p.goto('https://polymerthemes.com/golden-goose/', { waitUntil: 'networkidle', timeout: 60000 })
await p.waitForTimeout(2500)
// find the real scroller (deep, through shadow roots)
const n = await p.evaluate(() => {
  const all = []
  const walk = (root) => { for (const el of root.querySelectorAll('*')) { all.push(el); if (el.shadowRoot) walk(el.shadowRoot) } }
  walk(document)
  const sc = all.filter(e => e.scrollHeight > e.clientHeight + 50 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY))
    .sort((a, b) => b.scrollHeight - a.scrollHeight)[0]
  window.__sc = sc
  return sc ? Math.ceil(sc.scrollHeight / sc.clientHeight) : 0
})
console.log('pages', n)
for (let i = 0; i < Math.min(n, 8); i++) {
  await p.evaluate((i) => { window.__sc.scrollTop = i * window.__sc.clientHeight * 0.95 }, i)
  await p.waitForTimeout(400)
  await p.screenshot({ path: `/e2e/shots/ref-${i}.png` })
}
await b.close()
