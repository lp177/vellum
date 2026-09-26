import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Static site of the demo (GitLab Pages): demo/index.html (component gallery) and demo/builder.html (theme builder),
// with the library from src/ and self-hosted Roboto. Relative URLs, so it works under any path. → public/
const demo = resolve(import.meta.dirname, 'demo')
export default defineConfig({
  root: demo,
  base: './',
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'public'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: { input: { index: resolve(demo, 'index.html'), builder: resolve(demo, 'builder.html') } },
  },
})
