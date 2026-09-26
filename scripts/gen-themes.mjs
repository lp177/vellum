// Writes src/css/themes/<id>.css for every theme of the catalog (src/themes/index.js). light and dark get the special
// selectors that make them the defaults; the others apply with data-theme="<id>" on any element.
// Run: bin/dev node scripts/gen-themes.mjs (the build runs it; a test checks the files are up to date).
import { readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { THEMES, themeCSS } from '../src/themes/index.js'

export function themeFile(t) {
  const head = `/* Vellum theme "${t.name}"${t.source ? ` — ${t.source}` : ''}. Generated from src/themes (scripts/gen-themes.mjs):
 * edit the catalog, not this file. Only base colors: shadows, states, focus and disabled colors are derived (tokens.css). */\n`
  if (t.id === 'light') {
    return head + `/* :where(:root) has zero specificity, so any [data-theme] (including custom themes loaded earlier) wins over it. */\n`
      + themeCSS(t, ':where(:root), [data-theme="light"]') + '\n'
  }
  if (t.id === 'dark') {
    return head + `/* applied when the system prefers dark and no data-theme is set on the root, or with data-theme="dark" */\n`
      + `@media (prefers-color-scheme: dark) {\n${themeCSS(t, '  :root:not([data-theme])', '    ')}\n}\n` + themeCSS(t) + '\n'
  }
  return head + themeCSS(t) + '\n'
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = 'src/css/themes'
  const ids = new Set(THEMES.map((t) => t.id))
  for (const f of readdirSync(dir)) if (f.endsWith('.css') && !ids.has(f.slice(0, -4))) { unlinkSync(`${dir}/${f}`); console.log('removed', f) }
  for (const t of THEMES) writeFileSync(`${dir}/${t.id}.css`, themeFile(t))
  console.log(`${THEMES.length} themes written to ${dir}/`)
}
