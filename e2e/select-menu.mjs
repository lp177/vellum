// Slow-motion frames (CDP playback rate 0.1) of the select menu and of navigation tabs on the demo (bin/dev up first):
// bin/e2e select-menu.mjs → e2e/shots/sel-*.png, nav-*.png
import { chromium } from 'playwright'
const url = process.env.DEMO_URL || 'http://127.0.0.1:8126/demo/'
const out = '/e2e/shots'
const b = await chromium.launch({ channel: 'chromium' })
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const p = await ctx.newPage()
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
await p.goto(url, { waitUntil: 'networkidle' })
console.log('base-select supported:', await p.evaluate(() => CSS.supports('appearance', 'base-select')))
const sel = p.locator('#input select').first()
await sel.scrollIntoViewIfNeeded()
await p.waitForTimeout(400)
const f = await sel.locator('xpath=..').boundingBox()
const clip = { x: Math.max(0, f.x - 30), y: Math.max(0, f.y - 30), width: 420, height: 300 }
const cdp = await ctx.newCDPSession(p)
await cdp.send('Animation.enable')
await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 })
await sel.click()
for (let i = 0; i < 8; i++) { await p.screenshot({ path: `${out}/sel-open-${i}.png`, clip }); await p.waitForTimeout(300) }
await p.waitForTimeout(1500)
console.log('picker open:', await p.evaluate(() => document.querySelector('#input select').matches(':open')))
await p.keyboard.press('ArrowDown')
await p.waitForTimeout(400)
await p.screenshot({ path: `${out}/sel-focus.png`, clip })
await p.keyboard.press('Enter')
for (let i = 0; i < 6; i++) { await p.screenshot({ path: `${out}/sel-close-${i}.png`, clip }); await p.waitForTimeout(300) }
await p.waitForTimeout(2500)
console.log('value after Enter:', await sel.inputValue())

const nav = p.locator('#demo-nav')
await nav.scrollIntoViewIfNeeded()
await p.waitForTimeout(300)
const n = await nav.locator('xpath=..').boundingBox()
const nclip = { x: n.x, y: n.y, width: n.width, height: n.height }
await nav.getByText('Settings').click()
for (let i = 0; i < 6; i++) { await p.screenshot({ path: `${out}/nav-${i}.png`, clip: nclip }); await p.waitForTimeout(200) }
await p.getByRole('button', { name: 'Open a session' }).click()
for (let i = 0; i < 4; i++) { await p.screenshot({ path: `${out}/nav-out-${i}.png`, clip: nclip }); await p.waitForTimeout(200) }
console.log('errors:', errors.join(' | ') || 'none')
await b.close()
