// Demo page wiring: builds the repetitive example lists, then enhances everything with Vellum.
import { init, openDialog, toast, setProgress, validateField, icon, setTheme } from '../dist/vellum.js'
import { CONTRACT, THEMES, themeCSS } from '../src/themes/index.js'
import { fillThemeSelect, injectThemes, loadCustom } from './themes-ui.js'

const $ = (s, r = document) => r.querySelector(s)
const $$ = (s, r = document) => [...r.querySelectorAll(s)]
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content }

// ---------------------------------------------------------------- generated lists
const VARIANTS = [['Default', ''], ['Disabled', 'disabled'], ['Noink', 'noink'], ['Icon', 'icon'], ['Primary', 'primary'], ['Secondary', 'secondary'],
  ['Success', 'success'], ['Info', 'info'], ['Warning', 'warning'], ['Error', 'error'], ['Link', 'link']]
function button(label, v, kind) {
  const cls = ['v-button', kind === 'raised' ? 'v-button--raised' : '', ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'link'].includes(v) ? 'v-button--' + v : ''].filter(Boolean).join(' ')
  const attrs = [v === 'disabled' ? 'disabled' : '', v === 'noink' ? 'data-v-noink' : '', kind === 'toggle' ? 'aria-pressed="false" data-v-toggle' : ''].join(' ')
  return `<button class="${cls}" ${attrs}>${v === 'icon' ? icon('code') : ''}${label}</button>`
}
const bcols = $('[data-demo="buttons"]')
for (const [title, kind] of [['Flat', 'flat'], ['Raised', 'raised'], ['Toggleable', 'toggle']]) {
  bcols.append(h(`<div class="demo-col"><h3>${title}</h3><div class="v-card demo-list">${VARIANTS.map(([l, v]) => button(l, v, kind)).join('')}</div></div>`))
}
const ELEMENTS = ['Oxygen', 'Carbon', 'Hydrogen', 'Nitrogen', 'Calcium']
for (const box of $$('[data-demo="checkboxes"]')) {
  const dis = box.hasAttribute('data-disabled') ? 'disabled' : ''
  box.classList.add('demo-list--left')
  box.append(h(ELEMENTS.map((e, i) => `<label class="v-checkbox"><input type="checkbox" class="v-checkbox__input" ${i >= 2 ? 'checked' : ''} ${dis}><span class="v-checkbox__box"><span class="v-checkbox__ink"></span></span><span class="v-checkbox__label">${e}</span></label>`).join('')))
}
let rn = 0
for (const box of $$('[data-demo="radios"]')) {
  const dis = box.hasAttribute('data-disabled') ? 'disabled' : ''
  box.classList.add('demo-list--left')
  box.append(h(ELEMENTS.map((e, i) => `<label class="v-radio"><input type="radio" class="v-radio__input" name="r${rn++}" ${i >= 2 ? 'checked' : ''} ${dis}><span class="v-radio__ring"><span class="v-radio__ink"></span></span><span class="v-radio__label">${e}</span></label>`).join('')))
}
for (const box of $$('[data-demo="radio-group"]')) {
  const some = box.hasAttribute('data-some-disabled')
  box.classList.add('demo-list--left')
  box.append(h(ELEMENTS.map((e, i) => `<label class="v-radio"><input type="radio" class="v-radio__input" name="${box.dataset.name}" ${some && (i === 2 || i === 3) ? 'disabled' : ''} ${some && i === 4 ? 'checked' : ''}><span class="v-radio__ring"><span class="v-radio__ink"></span></span><span class="v-radio__label">${e}</span></label>`).join('')))
}
for (const box of $$('[data-demo="switches"]')) {
  const dis = box.hasAttribute('data-disabled') ? 'disabled' : ''
  box.classList.add('demo-list--left')
  box.append(h(['Oxygen', 'Carbon', 'Hydrogen'].map((e, i) => `<label class="v-switch"><input type="checkbox" role="switch" class="v-switch__input" ${i === 1 ? 'checked' : ''} ${dis}><span class="v-switch__track"><span class="v-switch__thumb"><span class="v-switch__ink"></span></span></span><span class="v-switch__label">${e}</span></label>`).join('')))
}
const fab = (name, cls = '', mini = false, dis = false) => `<button class="v-fab ${mini ? 'v-fab--mini' : ''} ${cls}" aria-label="${name}" ${dis ? 'disabled' : ''}>${icon(name)}</button>`
$('[data-demo="fabs"]').append(h(`
  <div class="demo-col"><h3>Enabled</h3><div class="v-card demo-list">${fab('arrow_forward')}${fab('edit')}${fab('favorite')}${fab('check', '', true)}${fab('reply', '', true)}</div></div>
  <div class="demo-col"><h3>Disabled</h3><div class="v-card demo-list">${fab('arrow_forward', '', false, true)}${fab('edit', '', false, true)}${fab('favorite', '', false, true)}${fab('check', '', true, true)}${fab('reply', '', true, true)}</div></div>
  <div class="demo-col"><h3>Colors</h3><div class="v-card demo-list">${fab('arrow_forward', 'v-fab--secondary')}${fab('edit', 'v-fab--success')}${fab('favorite', 'v-fab--info')}${fab('check', 'v-fab--warning', true)}${fab('reply', 'v-fab--error', true)}</div></div>`))
const ib = (name, cls = '', dis = false, size = '') => `<button class="v-icon-button ${cls}" aria-label="${name}" ${dis ? 'disabled' : ''} ${size ? `style="--v-icon-button-size:${size}"` : ''}>${icon(name)}</button>`
const IB = ['menu', 'favorite', 'arrow_back', 'arrow_forward', 'close', 'code']
const COLORS = ['', 'v-icon-button--secondary', 'v-icon-button--success', 'v-icon-button--info', 'v-icon-button--warning', 'v-icon-button--error']
$('[data-demo="icon-buttons"]').append(h(`
  <div class="demo-col"><h3>Enabled</h3><div class="v-card demo-list">${IB.map((n) => ib(n)).join('')}</div></div>
  <div class="demo-col"><h3>Disabled</h3><div class="v-card demo-list">${IB.map((n) => ib(n, '', true)).join('')}</div></div>
  <div class="demo-col"><h3>Color</h3><div class="v-card demo-list">${IB.map((n, i) => ib(n, COLORS[i])).join('')}</div></div>
  <div class="demo-col"><h3>Size</h3><div class="v-card demo-list">${ib('favorite', '', false, '112px')}${ib('code', '', false, '112px')}</div></div>`))

// the theme lives on <body>: a host page (or an embedding frame) may own <html data-theme>
document.body.classList.add('v-app')
init(document)

// ---------------------------------------------------------------- themes (remembered per browser)
// ?embed: the page is the live preview of the theme builder, which drives the theme itself (window.vellumPreview).
const EMBED = new URLSearchParams(location.search).has('embed')
const THEME_KEY = 'vellum-demo-theme'
const custom = EMBED ? null : loadCustom()
injectThemes(document, custom)
const themeSelects = $$('select[data-theme-select]')
for (const s of themeSelects) fillThemeSelect(s, { custom })
const applyTheme = (name) => {
  if (name === 'custom' && !custom) name = 'golden-goose'
  if (name && name !== 'custom' && !THEMES.some((t) => t.id === name)) name = 'golden-goose'
  setTheme(name || null, document.body)
  for (const s of themeSelects) s.value = name ?? ''
  if (!EMBED) try { localStorage.setItem(THEME_KEY, name ?? '') } catch { /* storage unavailable */ }
  renderSwatches()
}
for (const s of themeSelects) s.addEventListener('change', () => applyTheme(s.value))
if (EMBED) {
  document.body.dataset.embed = ''
  let style = null
  window.vellumPreview = {
    apply(vars) {
      style ??= Object.assign(document.createElement('style'), { id: 'vellum-preview-theme' })
      if (!style.isConnected) document.head.append(style)
      style.textContent = themeCSS({ vars }, '[data-theme="custom"]')
      setTheme('custom', document.body)
      renderSwatches()
    },
  }
  window.parent?.postMessage({ type: 'vellum-preview-ready' }, location.origin)
}

// ---------------------------------------------------------------- interactions
for (const b of $$('[data-open]')) b.addEventListener('click', () => openDialog(document.getElementById(b.dataset.open)))
for (const d of $$('dialog')) d.addEventListener('close', () => d.returnValue && toast(`Dialog: ${d.returnValue}`))
$('#validate').addEventListener('click', () => validateField($('#manual-field')))
let progTimer = 0
$('#prog-start').addEventListener('click', () => {
  clearInterval(progTimer)
  let v = 0
  progTimer = setInterval(() => { v += 0.01; setProgress($('#prog'), v, Math.min(1, v + 0.25)); if (v >= 1) clearInterval(progTimer) }, 30)
})
// navigation tabs: a fake router that takes 600 ms to "load" the page; the tab is selected on click anyway
{
  const nav = $('#demo-nav')
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a'); if (!a) return
    e.preventDefault()
    setTimeout(() => { for (const l of nav.querySelectorAll('a')) l === a ? l.setAttribute('aria-current', 'page') : l.removeAttribute('aria-current') }, 600)
  })
  $('#demo-nav-out').addEventListener('click', () => nav.vSelect(-1))
}
$('#spin-toggle').addEventListener('click', () => $$('.v-spinner').forEach((s) => s.classList.toggle('is-active')))
$('#toast1').addEventListener('click', () => toast('Hello world!'))
$('#toast2').addEventListener('click', () => toast('Message archivé', { action: { label: 'Annuler', onClick: () => toast('Restauré') }, duration: 5000 }))
$('#toast3').addEventListener('click', () => toast('Capsule toast', { capsule: true }))

// ---------------------------------------------------------------- theme contract, live values
function renderSwatches() {
  const cs = getComputedStyle(document.body)
  $('#swatches').replaceChildren(h(CONTRACT.filter((k) => k !== 'color-scheme').map((k) => `--v-${k}`).map((v) => {
    const val = cs.getPropertyValue(v).trim()
    const color = v.includes('alpha') ? '' : v === '--v-shadow-rgb' ? `rgb(${val})` : val
    return `<div class="demo-swatch"><i style="background:${color || 'transparent'}"></i><span>${v}</span><code>${val}</code></div>`
  }).join('')))
}
let saved = 'golden-goose'
try { const s = localStorage.getItem(THEME_KEY); if (s !== null) saved = s } catch { /* default */ }
applyTheme(saved)
