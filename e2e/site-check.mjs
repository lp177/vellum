// Checks the built static site (public/ or docs/) served under a sub-path, as GitLab / GitHub Pages serve it:
// bin/e2e site-check.mjs <url>   (e.g. docs/ served at http://127.0.0.1:8127/vellum/)
import { chromium } from 'playwright'
const base = process.argv[2]
const b = await chromium.launch({ channel: 'chromium' })
const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const errors = [], failed = []
p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
p.on('requestfailed', (r) => failed.push(r.url())); p.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))
await p.goto(base, { waitUntil: 'networkidle' })
console.log('demo: themes in menu', await p.locator('#theme-hero option').count(), '| font', await p.evaluate(() => document.fonts.check('16px Roboto')))
await p.getByRole('link', { name: 'Créer un thème' }).first().click()
await p.waitForLoadState('networkidle'); await p.waitForTimeout(1500)
console.log('builder:', p.url(), '| preview theme', await p.frameLocator('#bld-frame').locator('body').getAttribute('data-theme'))
console.log('errors:', errors.join(' | ') || 'none', '| failed:', failed.join(' ') || 'none')
await b.close()
