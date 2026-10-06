// Theme builder: edit a theme spec, preview it live on the demo page (iframe ?embed), copy its CSS block.
// The spec holds what the person fixed; deriveTheme() computes the rest exactly as for the built-in themes.
import { init, toast, attachTabs } from '../dist/vellum.js'
import { THEMES, deriveTheme, themeCSS, slug, contrast, normalize, parse, hex } from '../src/themes/index.js'
import { fillThemeSelect, loadCustom, saveCustom } from './themes-ui.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
const DRAFT_KEY = 'vellum-builder-draft'
const REQUIRED = ['bg', 'text', 'primary', 'secondary', 'success', 'info', 'warning', 'error']

// [key, label, contrast partner]
const GROUPS = [
  ['Fond et papier', [['bg', 'Fond de la page'], ['surface', 'Papier : cartes, champs'], ['surface-raised', 'Papier surélevé : menus, dialogues'],
    ['divider', 'Séparateurs et états désactivés', 'surface']]],
  ['Texte', [['text', 'Texte', 'surface'], ['heading', 'Titres', 'surface'], ['text-2', 'Texte secondaire', 'surface']]],
  ['Couleurs d’accent', [['primary', 'Principale', 'surface'], ['on-primary', 'Texte sur la principale', 'primary'],
    ['secondary', 'Secondaire', 'surface'], ['on-secondary', 'Texte sur la secondaire', 'secondary']]],
  ['États', [['success', 'Succès', 'surface'], ['on-success', 'Texte sur succès', 'success'], ['info', 'Information', 'surface'],
    ['on-info', 'Texte sur information', 'info'], ['warning', 'Avertissement', 'surface'], ['on-warning', 'Texte sur avertissement', 'warning'],
    ['error', 'Erreur', 'surface'], ['on-error', 'Texte sur erreur', 'error']]],
  ['Barre d’outils et onglets', [['toolbar', 'Fond'], ['on-toolbar', 'Texte', 'toolbar']]],
  ['Notification (toast)', [['inverse', 'Fond', 'bg'], ['on-inverse', 'Texte', 'inverse']]],
  ['Focus clavier', [['focus', 'Anneau de focus', 'bg']]],
]
const EFFECTS = [['shadow-key-alpha', 'Ombre portée'], ['shadow-ambient-alpha', 'Ombre ambiante'], ['shadow-umbra-alpha', 'Ombre de contact'],
  ['scrim-alpha', 'Voile des dialogues'], ['ripple-alpha', 'Encre (ripple)']]

// ---------------------------------------------------------------- state
let spec = {}
let name = 'Mon thème'
let full = THEMES[0].vars

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (d?.spec) { spec = d.spec; name = d.name || name; return d.from || '' }
  } catch { /* no draft */ }
  const c = loadCustom()
  if (c) { spec = { ...c.spec }; name = c.name; return 'custom' }
  const gg = THEMES.find((t) => t.id === 'golden-goose')
  spec = { ...gg.spec }; name = 'Mon thème'
  return 'golden-goose'
}

// ---------------------------------------------------------------- controls
const row = ([k, label, partner]) => `
  <div class="bld-row" data-key="${k}"${partner ? ` data-partner="${partner}"` : ''}>
    <input type="color" class="bld-color" id="c-${k}" aria-label="${esc(label)}">
    <div class="bld-label"><label for="c-${k}">${esc(label)}</label><code>--v-${k}</code></div>
    <input class="bld-hex" id="x-${k}" aria-label="${esc(label)}, valeur hexadécimale" spellcheck="false" autocomplete="off" maxlength="7">
    <span class="bld-ratio" title="Contraste WCAG avec ${partner ? `--v-${partner}` : ''}"></span>
    <span class="v-chip v-chip--small bld-auto" title="Valeur calculée à partir des autres">auto</span>
    ${REQUIRED.includes(k) ? '<span class="bld-reset-slot"></span>' : `<button class="v-icon-button bld-reset" type="button" aria-label="${esc(label)} : revenir à la valeur calculée" title="Revenir à la valeur calculée"><svg class="v-icon" data-v-icon="refresh"></svg></button>`}
  </div>`
const slider = ([k, label]) => `
  <div class="bld-effect" data-key="${k}">
    <label for="a-${k}">${esc(label)} <code>--v-${k}</code></label>
    <div class="v-slider"><input type="range" class="v-slider__input" id="a-${k}" min="0" max="1" step="0.01"><output class="bld-alpha" for="a-${k}"></output></div>
  </div>`

$('#bld-groups').innerHTML = GROUPS.map(([title, rows]) => `
  <section class="bld-group"><h2 class="bld-group__title">${esc(title)}</h2>${rows.map(row).join('')}</section>`).join('') + `
  <section class="bld-group"><h2 class="bld-group__title">Ombres et effets</h2>
    ${row(['shadow-rgb', 'Couleur des ombres'])}
    ${EFFECTS.map(slider).join('')}
  </section>`

const fromSelect = $('#bld-from')
function fillFrom() {
  const custom = loadCustom()
  fillThemeSelect(fromSelect, { auto: false, custom })
}
fillFrom()
init(document)

// ---------------------------------------------------------------- render
const hexOf = (k, v) => (k === 'shadow-rgb' ? hex(String(v).split(/\s+/).map(Number)) : v)
const frame = $('#bld-frame')
let queued = false
function update() {
  if (queued) return
  queued = true
  requestAnimationFrame(() => { queued = false; render() })
}
function render() {
  try { full = deriveTheme(spec) } catch { /* keep the last complete theme */ }
  for (const r of $$('.bld-row')) {
    const k = r.dataset.key, v = hexOf(k, full[k])
    r.querySelector('.bld-color').value = v
    const x = r.querySelector('.bld-hex')
    if (document.activeElement !== x) x.value = v
    const derived = !(k in spec)
    r.classList.toggle('is-auto', derived)
    const reset = r.querySelector('.bld-reset')
    if (reset) reset.hidden = derived
    const p = r.dataset.partner, ratio = r.querySelector('.bld-ratio')
    if (p) {
      const c = contrast(v, full[p]), need = ['divider', 'focus'].includes(k) ? 1.3 : k.startsWith('on-') || ['text', 'heading', 'text-2'].includes(k) ? 4.5 : 3
      ratio.textContent = `${c.toFixed(1)}:1`
      ratio.className = `bld-ratio v-chip v-chip--small ${c >= need ? 'v-chip--success' : c >= need * 0.66 ? 'v-chip--warning' : 'v-chip--error'}`
    }
  }
  for (const e of $$('.bld-effect')) {
    const k = e.dataset.key, input = e.querySelector('input')
    if (document.activeElement !== input) input.value = full[k]
    input.dispatchEvent(new Event('input')) // Vellum slider fill
    e.querySelector('output').textContent = Number(full[k]).toFixed(2)
    e.classList.toggle('is-auto', !(k in spec))
  }
  $('#bld-scheme').value = spec['color-scheme'] ?? ''
  const id = slug(name)
  $('#bld-selector').textContent = `Sélecteur : [data-theme="${id}"]`
  $('#bld-usage').textContent = `data-theme="${id}"`
  $('#bld-css').textContent = css()
  frame.contentWindow?.vellumPreview?.apply(full)
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, spec, from: fromSelect.value })) } catch { /* not kept */ }
}
const css = () => `/* Vellum theme "${name.replace(/\*\//g, '')}" — made with the Vellum theme builder */\n${themeCSS({ vars: full }, `[data-theme="${slug(name)}"]`)}\n`

// ---------------------------------------------------------------- events
$('#bld-groups').addEventListener('input', (e) => {
  const r = e.target.closest('.bld-row'), fx = e.target.closest('.bld-effect')
  if (r) {
    const k = r.dataset.key
    let v = e.target.value.trim()
    if (e.target.classList.contains('bld-hex')) {
      if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return
      v = normalize(v.startsWith('#') ? v : '#' + v)
    }
    spec[k] = k === 'shadow-rgb' ? parse(v).join(' ') : v
    update()
  } else if (fx && e.isTrusted) {
    spec[fx.dataset.key] = Number(e.target.value)
    update()
  }
})
$('#bld-groups').addEventListener('change', (e) => { if (e.target.classList.contains('bld-hex')) render() }) // reformat
$('#bld-groups').addEventListener('click', (e) => {
  const b = e.target.closest('.bld-reset')
  if (!b) return
  delete spec[b.closest('.bld-row').dataset.key]
  update()
})
$('#bld-scheme').addEventListener('change', (e) => {
  if (e.target.value) spec['color-scheme'] = e.target.value
  else delete spec['color-scheme']
  // shadows and scrim follow the scheme unless they were fixed
  update()
})
fromSelect.addEventListener('change', () => {
  const id = fromSelect.value
  const t = id === 'custom' ? loadCustom() : THEMES.find((x) => x.id === id)
  if (!t) return
  spec = { ...t.spec }
  name = id === 'custom' ? t.name : `${t.name} perso`
  $('#bld-name').value = name
  update()
  toast(`Départ : ${t.name}`)
})
$('#bld-name').addEventListener('input', (e) => { name = e.target.value.trim() || 'Mon thème'; update() })

async function copy() {
  const text = css()
  try {
    await navigator.clipboard.writeText(text)
    toast('Bloc CSS copié dans le presse-papiers')
  } catch {
    const range = document.createRange()
    range.selectNodeContents($('#bld-css'))
    getSelection().removeAllRanges(); getSelection().addRange(range)
    toast('Copie automatique refusée : le bloc est sélectionné, copiez-le avec Ctrl+C', { duration: 6000 })
  }
}
function save() {
  if (!saveCustom(name, spec)) { toast('Impossible d’enregistrer dans ce navigateur (stockage désactivé)'); return }
  try { localStorage.setItem('vellum-demo-theme', 'custom') } catch { /* ignore */ }
  fillFrom(); fromSelect.value = 'custom'
  toast(`« ${name} » est enregistré : il apparaît dans le menu des thèmes de la démo`, { duration: 6000, action: { label: 'Voir', onClick: () => { location.href = './' } } })
}
for (const id of ['#bld-copy', '#bld-copy-2']) $(id).addEventListener('click', copy)
for (const id of ['#bld-save', '#bld-save-2']) $(id).addEventListener('click', save)

// narrow screens: one view at a time (colors / preview / CSS)
const views = $('.bld-views')
attachTabs(views)
views.addEventListener('v-tab-change', (e) => { $('.bld').dataset.view = e.detail.tab.dataset.view })

// live preview: the demo page announces itself when its theme hook is ready
addEventListener('message', (e) => { if (e.origin === location.origin && e.data?.type === 'vellum-preview-ready') render() })
frame.addEventListener('load', () => render())

// ---------------------------------------------------------------- start
const from = load()
$('#bld-name').value = name
if (from && [...fromSelect.options].some((o) => o.value === from)) fromSelect.value = from
render()
