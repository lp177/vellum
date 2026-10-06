import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// The demo (demo/) is plain static files: its tags load the built library committed in dist/ with relative URLs, so
// the repository itself is the site (GitHub Pages from the root of the branch, GitLab Pages, any static host).
// On the dev server only, the sources replace it, so that an edit under src/ shows at once: the library module comes
// from src/index.js, which brings its own CSS (hence the <link> to dist/vellum.css is dropped).
const demoFromSources = {
  name: 'vellum-demo-from-sources',
  apply: 'serve',
  config: () => ({ resolve: { alias: [{ find: /^\.\.\/dist\/vellum\.js$/, replacement: resolve(import.meta.dirname, 'src/index.js') }] } }),
  transformIndexHtml: (html) => html.replace(/^[ \t]*<link rel="stylesheet" href="\.\.\/dist\/vellum\.css">\n/m, ''),
}

// Library build: dist/vellum.js (ESM) + dist/vellum.css. The demo is served by `npm run dev` at /demo/.
export default defineConfig({
  publicDir: false, // public/ is where GitLab CI copies the site (.gitlab-ci.yml), not static files for the library
  plugins: [demoFromSources],
  build: {
    target: 'es2022',
    lib: { entry: resolve(import.meta.dirname, 'src/index.js'), name: 'Vellum', formats: ['es'], fileName: () => 'vellum.js' },
    cssCodeSplit: false,
    rollupOptions: { output: { assetFileNames: (a) => (a.names?.[0]?.endsWith('.css') ? 'vellum.css' : 'assets/[name][extname]') } },
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
})
