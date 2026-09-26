// After `vite build`: optional themes, and a self-hosted Roboto (dist/fonts.css + dist/fonts/*.woff2).
import { cpSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
cpSync('src/vellum.d.ts', 'dist/vellum.d.ts')
mkdirSync('dist/themes', { recursive: true })
for (const f of readdirSync('src/css/themes')) cpSync(`src/css/themes/${f}`, `dist/themes/${f}`)
mkdirSync('dist/fonts', { recursive: true })
const FS = 'node_modules/@fontsource/roboto'
let css = '/* Vellum — self-hosted Roboto (SIL OFL 1.1, @fontsource/roboto). */\n'
for (const f of ['latin-300', 'latin-400', 'latin-500', 'latin-700', 'latin-ext-400', 'latin-ext-500']) {
  const src = readFileSync(`${FS}/${f}.css`, 'utf8')
  css += src.replace(/url\(\.\/files\/([^)]+)\)/g, (_, file) => {
    if (file.endsWith('.woff2')) cpSync(`${FS}/files/${file}`, `dist/fonts/${file}`)
    return `url(./fonts/${file})`
  }).replace(/,\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, '') + '\n'
}
writeFileSync('dist/fonts.css', css)
console.log('postbuild: types + themes + fonts ready')
