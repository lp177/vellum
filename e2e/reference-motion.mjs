// Reference study (source of Vellum's motion values): polymerthemes.com/golden-goose, a Polymer 1 (shady DOM) page.
// Dumps the transitions/animations of each paper element and records frame bursts of real interactions with CSS
// animations slowed 10x (CDP Animation.setPlaybackRate). bin/e2e reference-motion.mjs → e2e/shots/m2-*.png
import { chromium } from 'playwright'
import fs from 'node:fs'
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
for (let i = 0; i < 3; i++) { try { await page.goto('https://polymerthemes.com/golden-goose/', { waitUntil: 'load', timeout: 60000 }); break } catch { await page.waitForTimeout(3000) } }
await page.waitForTimeout(3000)
// shady DOM: internal parts are ordinary descendants
const dump = await page.evaluate(() => {
  const out = {}
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
  for (const t of ['paper-input', 'paper-textarea', 'paper-checkbox', 'paper-radio-button', 'paper-toggle-button', 'paper-button', 'paper-fab',
                   'paper-icon-button', 'paper-tabs', 'paper-tab', 'paper-slider', 'paper-dialog', 'paper-toast', 'paper-item', 'paper-menu', 'paper-progress', 'paper-toolbar', 'paper-spinner']) {
    const el = [...document.querySelectorAll(t)].find(vis) || document.querySelector(t)
    if (!el) continue
    const rows = []
    for (const e of [el, ...el.querySelectorAll('*')]) {
      const c = getComputedStyle(e), r = e.getBoundingClientRect()
      const name = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).join('.') : '')
      const row = { el: name, size: `${Math.round(r.width)}x${Math.round(r.height)}` }
      if (c.transitionDuration !== '0s') row.transition = `${c.transitionProperty} | ${c.transitionDuration} | ${c.transitionTimingFunction}`
      if (c.animationName !== 'none') row.animation = `${c.animationName} ${c.animationDuration} ${c.animationTimingFunction}`
      if (c.transform !== 'none') row.transform = c.transform
      if (c.boxShadow !== 'none') row.shadow = c.boxShadow
      if (c.borderRadius !== '0px') row.radius = c.borderRadius
      if (c.backgroundColor !== 'rgba(0, 0, 0, 0)') row.bg = c.backgroundColor
      if (c.borderBottomWidth !== '0px') row.borderBottom = `${c.borderBottomWidth} ${c.borderBottomStyle} ${c.borderBottomColor}`
      row.color = c.color; row.font = `${c.fontSize} ${c.fontWeight} ${c.textTransform} ${c.letterSpacing}`; row.opacity = c.opacity !== '1' ? c.opacity : undefined
      if (Object.keys(row).length > 4 || e === el) rows.push(row)
    }
    out[t] = rows.slice(0, 18)
  }
  return out
})
fs.writeFileSync('/e2e/shots/ref-motion2.json', JSON.stringify(dump, null, 1))
const cdp = await ctx.newCDPSession(page)
await cdp.send('Animation.enable')
await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 })
const shots = {}
async function burst(name, getEl, action, pad = 20, times = [40, 150, 400, 900, 1600, 2600, 4000]) {
  try {
    const el = await getEl()
    await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(500)
    const box = await el.boundingBox()
    const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1280 - Math.max(0, box.x - pad), box.width + 2 * pad), height: box.height + 2 * pad }
    const frames = [await page.screenshot({ clip })]
    await action(el, box); const t0 = Date.now()
    for (const at of times) { const w = at - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); frames.push(await page.screenshot({ clip })) }
    shots[name] = frames
  } catch (e) { console.log('FAILED', name, String(e).split('\n')[0].slice(0, 140)) }
}
const visible = (sel) => async () => page.locator(sel).filter({ visible: true }).first()
await burst('input-focus', visible('paper-input'), async (el) => { await el.click() }, 14)
await burst('input-type', visible('paper-input'), async () => { await page.keyboard.type('Abc') }, 14)
await burst('input-blur', visible('paper-input'), async () => { await page.mouse.click(5, 450) }, 14)
await burst('button-raised-hold', visible('paper-button[raised]'), async (el, box) => { await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2); await page.mouse.down() }, 16)
await page.mouse.up()
await burst('button-raised-release', visible('paper-button[raised]'), async () => { }, 16, [40, 400, 1600, 4000])
await burst('button-flat-hold', visible('paper-button:not([raised])'), async (el, box) => { await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2); await page.mouse.down() }, 16)
await page.mouse.up()
for (let i = 0; i < 4; i++) {
  await burst(`tabs-${i}`, async () => page.locator('paper-tabs').filter({ visible: true }).nth(i), async (el) => { await el.locator('paper-tab').nth(1).click() }, 10, [40, 400, 900, 1600, 2600, 4000])
}
await burst('icon-button', visible('paper-icon-button'), async (el) => { await el.click() }, 16)
await burst('item-hover', visible('paper-item'), async (el) => { await el.hover() }, 8, [40, 900, 2600])
await burst('toast', async () => page.locator('paper-button', { hasText: /toast/i }).filter({ visible: true }).first(), async (el) => { await el.click() }, 0, [100, 800, 2000, 3500, 6000])
// toast appears at the bottom of the viewport: capture the viewport bottom
try {
  const btn = page.locator('paper-button', { hasText: /toast/i }).filter({ visible: true }).first()
  await btn.scrollIntoViewIfNeeded(); await btn.click(); const t0 = Date.now(); const fr = []
  for (const at of [100, 800, 2000, 3500, 6000]) { const w = at - (Date.now() - t0); if (w > 0) await page.waitForTimeout(w); fr.push(await page.screenshot({ clip: { x: 0, y: 700, width: 1280, height: 200 } })) }
  shots['toast-viewport'] = fr
} catch (e) { console.log('FAILED toast viewport', String(e).slice(0, 100)) }
await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 })
for (const [name, frames] of Object.entries(shots)) {
  const sheet = await ctx.newPage(); await sheet.setViewportSize({ width: 1400, height: 300 })
  await sheet.setContent(`<body style="margin:0;background:#111;color:#ddd;font:13px sans-serif"><div style="padding:6px 10px">${name} (slowed 10x; frame 0 = before)</div>
   <div style="display:flex;flex-wrap:wrap;gap:6px;padding:6px">${frames.map((f, i) => `<div><img src="data:image/png;base64,${f.toString('base64')}" style="border:1px solid #444;display:block;max-width:1380px"><div>#${i}</div></div>`).join('')}</div></body>`)
  await sheet.screenshot({ path: `/e2e/shots/m2-${name}.png`, fullPage: true }); await sheet.close()
}
console.log('done', Object.keys(shots).join(' '))
await b.close()
