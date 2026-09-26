import { chromium } from 'playwright'
const url = process.env.DEMO_URL || 'http://127.0.0.1:8126/demo/'
const b = await chromium.launch({ channel: 'chromium' })
for (const theme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } })
  await ctx.addInitScript((t) => localStorage.setItem('vellum-demo-theme', t), theme)
  const p = await ctx.newPage()
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800)
  await p.screenshot({ path: `/e2e/shots/theme-${theme}-top.png` })
  for (const id of ['#checkbox', '#input', '#toggle']) {
    await p.locator(id).scrollIntoViewIfNeeded(); await p.waitForTimeout(200)
    await p.screenshot({ path: `/e2e/shots/theme-${theme}-${id.slice(1)}.png` })
  }
  await p.locator('[data-open="dlg"]').click(); await p.waitForTimeout(600)
  await p.screenshot({ path: `/e2e/shots/theme-${theme}-dialog.png` })
  await ctx.close()
}
await b.close()
console.log('ok')
