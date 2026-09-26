// Vellum motion study: same interactions as the Golden Goose reference study, CSS animations slowed 10x (CDP),
// frames at the same instants. Output: shots/vm-<name>.png contact sheets.
import { chromium } from 'playwright'
const url = process.env.DEMO_URL || 'http://127.0.0.1:8126/demo/'
const b = await chromium.launch({ channel: 'chromium' })
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
await page.goto(url, { waitUntil: 'networkidle' }); await page.waitForTimeout(1000)
const cdp = await ctx.newCDPSession(page)
await cdp.send('Animation.enable')
await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 })
// the ripple is JS (rAF + performance.now): slow its clock too so frames are comparable
await page.evaluate(() => { const t0 = performance.now(); const real = performance.now.bind(performance); performance.now = () => t0 + (real() - t0) * 0.1 })
const shots = {}
async function burst(name, sel, action, pad = 20, times = [40, 150, 400, 900, 1600, 2600, 4000]) {
  try {
    const el = page.locator(sel).first()
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(400)
    const box = await el.boundingBox()
    const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1280 - Math.max(0, box.x - pad), box.width + 2 * pad), height: box.height + 2 * pad }
    const frames = [await page.screenshot({ clip })]
    await action(el, box); const t0 = Date.now()
    for (const at of times) { const w = at - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); frames.push(await page.screenshot({ clip })) }
    shots[name] = frames
  } catch (e) { console.log('FAILED', name, String(e).split('\n')[0].slice(0, 140)) }
}
await burst('input-focus', '#input .v-field >> nth=0', async (el) => { await el.click() }, 14)
await burst('input-type', '#input .v-field >> nth=0', async () => { await page.keyboard.type('Abc') }, 14)
await burst('checkbox', '#checkbox .v-checkbox >> nth=0', async (el) => { await el.click() })
await burst('radio', '#radio .v-radio >> nth=0', async (el) => { await el.click() })
await burst('switch', '#toggle .v-switch >> nth=0', async (el) => { await el.click() })
await burst('raised-hold', '#buttons .v-button--raised.v-button--primary', async (el, box) => { await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2); await page.mouse.down() }, 16)
await page.mouse.up()
await burst('raised-release', '#buttons .v-button--raised.v-button--primary', async () => {}, 16, [40, 400, 1600, 4000])
await burst('fab-hold', '#fab .v-fab >> nth=0', async (el, box) => { await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down() })
await page.mouse.up()
await burst('tabs-slide', '#tabs .v-tabs >> nth=2', async (el) => { await el.locator('.v-tab').nth(1).click() }, 8, [40, 400, 900, 1600, 2600, 4000])
await burst('tabs-ink', '#tabs .v-tabs >> nth=3', async (el) => { await el.locator('.v-tab').nth(2).click() }, 8, [40, 400, 900, 1600, 2600, 4000])
await burst('slider', '#slider .v-slider >> nth=0', async (el, box) => { await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, { steps: 5 }) }, 12)
await page.mouse.up()
await burst('slider-pin', '#slider .v-slider--pin', async (el, box) => { await page.mouse.move(box.x + box.width * 0.64, box.y + box.height / 2); await page.mouse.down() }, 40)
await page.mouse.up()
await burst('icon-button', '#icon-button .v-icon-button >> nth=1', async (el) => { await el.click() }, 16)
await burst('spinner', '#spinner .demo-spinners', async () => {}, 4, [300, 700, 1300, 2000, 3000, 4500, 6000])
try {
  await page.locator('[data-open="dlg"]').scrollIntoViewIfNeeded(); await page.waitForTimeout(300)
  const fr = [await page.screenshot()]
  await page.locator('[data-open="dlg"]').click(); const t0 = Date.now()
  for (const at of [100, 400, 1000, 2000, 3500]) { const w = at - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); fr.push(await page.screenshot()) }
  shots['dialog'] = fr
  await page.keyboard.press('Escape'); await page.waitForTimeout(3000)
} catch (e) { console.log('FAILED dialog', String(e).slice(0, 120)) }
await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 })
for (const [name, frames] of Object.entries(shots)) {
  const sheet = await ctx.newPage(); await sheet.setViewportSize({ width: 1400, height: 300 })
  const big = name === 'dialog'
  await sheet.setContent(`<body style="margin:0;background:#111;color:#ddd;font:13px sans-serif"><div style="padding:6px 10px">VELLUM ${name} (slowed 10x; #0 = before)</div>
   <div style="display:flex;flex-wrap:wrap;gap:6px;padding:6px">${frames.map((f, i) => `<div><img src="data:image/png;base64,${f.toString('base64')}" style="border:1px solid #444;display:block;${big ? 'width:420px' : 'max-width:1380px'}"><div>#${i}</div></div>`).join('')}</div></body>`)
  await sheet.screenshot({ path: `/e2e/shots/vm-${name}.png`, fullPage: true }); await sheet.close()
}
console.log('done', Object.keys(shots).join(' '))
await b.close()
