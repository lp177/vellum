// Checks the repository served as a static site under a sub-path, as GitHub / GitLab Pages serve it: the root leads to
// the demo, which loads dist/ and src/themes/ with relative URLs.
// bin/e2e site-check.mjs <url of the repository root>   (e.g. http://127.0.0.1:8127/vellum/)
import { chromium } from 'playwright'
const base = process.argv[2]
const b = await chromium.launch({ channel: 'chromium' })
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const errors = [], failed = []
p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
p.on('requestfailed', (r) => failed.push(r.url())); p.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
await p.goto(base, { waitUntil: 'networkidle' })
await p.waitForURL(/\/demo\/$/)  // the root index.html redirects
await p.waitForLoadState('networkidle')
console.log('root ->', p.url(), '| library from', await p.evaluate(() => [...document.styleSheets].map((s) => s.href).filter(Boolean).map((h) => h.split('/').slice(-2).join('/')).join(', ')))
console.log('demo: themes in menu', await p.locator('#theme-hero option').count(), '| font', await p.evaluate(() => document.fonts.check('16px Roboto')))
await p.getByRole('link', { name: 'Créer un thème' }).first().click()
await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500)
console.log('builder:', p.url(), '| preview theme', await p.frameLocator('#bld-frame').locator('body').getAttribute('data-theme'))
console.log('errors:', errors.join(' | ') || 'none', '| failed:', failed.join(' ') || 'none')
await b.close()
