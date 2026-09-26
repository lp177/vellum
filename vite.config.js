import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Library build: dist/vellum.js (ESM) + dist/vellum.css. The demo is served by `npm run dev` at /demo/.
export default defineConfig({
  build: {
    target: 'es2022',
    lib: { entry: resolve(import.meta.dirname, 'src/index.js'), name: 'Vellum', formats: ['es'], fileName: () => 'vellum.js' },
    cssCodeSplit: false,
    rollupOptions: { output: { assetFileNames: (a) => (a.names?.[0]?.endsWith('.css') ? 'vellum.css' : 'assets/[name][extname]') } },
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
})
