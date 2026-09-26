// Builds dist/vellum-demo.html: the demo page with CSS and JS inlined (one self-contained file).
import { build } from 'vite'
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
await build({
  configFile: false, logLevel: 'warn', publicDir: false,
  build: {
    outDir: '.cache/demo', emptyOutDir: true, cssCodeSplit: false, minify: true, target: 'es2022',
    lib: { entry: 'demo/artifact.js', formats: ['iife'], name: 'VellumDemo', fileName: () => 'demo.js' },
  },
})
const files = readdirSync('.cache/demo')
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`.cache/demo/${f}`, 'utf8')).join('\n')
const js = readFileSync('.cache/demo/demo.js', 'utf8').replace(/<\/script/gi, '<\\/script')
let html = readFileSync('demo/index.html', 'utf8')
html = html.replace(/<!--VELLUM-HEAD-->[\s\S]*<!--\/VELLUM-HEAD-->/, [
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap">',
  `<style>\n${css}\n</style>`,
].join('\n  '))
html = html.replace('</body>', `<script>\n${js}\n</script>\n</body>`)
// the theme builder is a second page (with the demo in an iframe): it lives on the static site, not in this one file
const site = process.env.VELLUM_SITE_URL
html = site
  ? html.replaceAll('href="./builder.html"', `href="${site.replace(/\/?$/, '/')}builder.html" target="_blank" rel="noopener"`)
  : html.replace('</head>', '<style>[data-builder-link]{display:none!important}</style>\n</head>')
writeFileSync('dist/vellum-demo.html', html)
console.log('dist/vellum-demo.html', Math.round(html.length / 1024), 'KiB')

// Page fragment for hosts that supply their own <html>/<head>/<body> skeleton (e.g. a claude.ai artifact):
// title first (hosts scan the start of the file for it), then fonts, styles, the body content and the script.
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1]
const keep = head.match(/<title>[\s\S]*?<\/title>|<link rel="(?:preconnect|stylesheet)"[^>]*>|<style>[\s\S]*?<\/style>/g)
const fragment = [...keep, body.replace(/<script>\n/, `<script>\ndocument.documentElement.lang = 'fr';\n`)].join('\n')
mkdirSync('.cache/artifact', { recursive: true })
writeFileSync('.cache/artifact/vellum-ui-kit.html', fragment)
console.log('.cache/artifact/vellum-ui-kit.html', Math.round(fragment.length / 1024), 'KiB')
