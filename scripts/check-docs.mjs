// Is the committed docs/ (the site GitHub Pages serves) what the sources build today? Builds the site aside and
// compares every file. Exit 1 with the list of differences: run `npm run build:docs` and commit docs/.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const fresh = '.cache/docs-check'
rmSync(fresh, { recursive: true, force: true })
execFileSync('node', ['scripts/gen-themes.mjs'], { stdio: 'inherit' })
execFileSync('npx', ['vite', 'build', '--config', 'vite.site.config.js', '--outDir', `../${fresh}`, '--emptyOutDir', '--logLevel', 'warn'],
  { stdio: 'inherit' })

const files = (dir) => {
  const out = []
  const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : out.push(relative(dir, p)) } }
  try { walk(dir) } catch { /* missing directory: every file differs */ }
  return out.sort()
}
const a = files('docs'), b = files(fresh)
const diff = [...new Set([...a, ...b])].filter((f) => !a.includes(f) || !b.includes(f) ||
  !readFileSync(join('docs', f)).equals(readFileSync(join(fresh, f))))
rmSync(fresh, { recursive: true, force: true })
if (diff.length) {
  console.error(`docs/ is not what the sources build (${diff.length} file(s)): ${diff.slice(0, 12).join(', ')}`)
  console.error('run `npm run build:docs` and commit docs/')
  process.exit(1)
}
console.log(`docs/ is up to date (${a.length} files)`)
