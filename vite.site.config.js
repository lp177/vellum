import { defineConfig } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Static site of the demo: demo/index.html (component gallery) and demo/builder.html (theme builder), with the
// library from src/ and self-hosted Roboto. Relative URLs, so it works under any path.
//   npm run build:site → public/   built by GitLab CI on every push (GitLab Pages; not committed)
//   npm run build:docs → docs/     committed: GitHub Pages can only serve the root or /docs of a branch
const demo = resolve(import.meta.dirname, 'demo')
let outDir
export default defineConfig({
  root: demo,
  base: './',
  publicDir: false,
  plugins: [{
    // GitHub Pages runs Jekyll on a branch unless this file exists (Jekyll would skip files starting with "_")
    name: 'nojekyll',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    closeBundle() { writeFileSync(resolve(outDir, '.nojekyll'), '') },
  }],
  build: {
    outDir: resolve(import.meta.dirname, 'public'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: { input: { index: resolve(demo, 'index.html'), builder: resolve(demo, 'builder.html') } },
  },
})
