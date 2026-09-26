// Contact sheet of slow-motion bursts: bin/shot sheet.mjs <prefix> → shots/sheet-<prefix>.png
import { chromium } from 'playwright'
import { readdirSync, readFileSync } from 'node:fs'
const dir = process.argv[2], prefix = process.argv[3], maxw = process.argv[4] || '340px'
const files = readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.png'))
const groups = {}
for (const f of files) { const k = f.replace(/-\d+\.png$/, ''); (groups[k] ||= []).push(f) }
const html = `<body style="margin:0;background:#777;font:12px sans-serif">${Object.entries(groups).map(([k, fs]) =>
  `<div style="padding:4px;color:#fff">${k}</div><div style="display:flex;gap:4px;padding:0 4px 8px;flex-wrap:wrap">${fs.sort((a, b) => parseInt(a.match(/-(\d+)\.png/)[1]) - parseInt(b.match(/-(\d+)\.png/)[1]))
    .map((f) => `<img src="data:image/png;base64,${readFileSync(dir + '/' + f).toString('base64')}" style="max-width:${maxw}">`).join('')}</div>`).join('')}</body>`
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1420, height: 400 } })
await p.setContent(html); await p.waitForTimeout(500)
await p.screenshot({ path: `${dir}/sheet-${prefix}.png`, fullPage: true })
await b.close()
console.log('sheet', `${dir}/sheet-${prefix}.png`)
