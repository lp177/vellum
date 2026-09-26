// Theme menu shared by the demo and the theme builder: every catalog theme as CSS, a <select> whose options carry a
// strip of the theme's main colors (page, paper, text, primary, secondary), and the custom theme saved by the builder.
import { THEMES, GROUPS, deriveTheme, themeCSS } from '../src/themes/index.js'

export const CUSTOM_KEY = 'vellum-custom-theme'
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** The custom theme saved by the builder ({ name, spec, vars }), or null. */
export function loadCustom() {
  try {
    const c = JSON.parse(localStorage.getItem(CUSTOM_KEY) || 'null')
    if (c?.spec) return { name: String(c.name || 'Mon thème'), spec: c.spec, vars: deriveTheme(c.spec) }
  } catch { /* storage unavailable, or an invalid saved theme */ }
  return null
}
export function saveCustom(name, spec) {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify({ name, spec })); return true } catch { return false }
}

/** Puts every catalog theme (light and dark are already in vellum.css) and the custom one into the document. */
export function injectThemes(doc = document, custom = null) {
  let style = doc.getElementById('vellum-themes')
  if (!style) { style = doc.createElement('style'); style.id = 'vellum-themes'; doc.head.append(style) }
  style.textContent = THEMES.filter((t) => t.id !== 'light' && t.id !== 'dark').map((t) => themeCSS(t)).join('\n')
    + (custom ? '\n' + themeCSS({ vars: custom.vars }, '[data-theme="custom"]') : '')
}

export const SWATCH_KEYS = ['bg', 'surface', 'text', 'primary', 'secondary']
export const swatch = (colors) => `<span class="demo-sw" aria-hidden="true">${colors.map((c) => `<i style="background:${c}"></i>`).join('')}</span>`
const light = THEMES[0].vars, dark = THEMES[1].vars
const AUTO = [light.bg, dark.bg, light.primary, dark.primary, light.secondary]

/** Fills a Vellum select (.v-field--select > select.v-field__input) with the catalog, grouped, with color strips. */
export function fillThemeSelect(select, { auto = true, custom = null } = {}) {
  const opt = (id, name, vars) => `<option value="${esc(id)}">${swatch(SWATCH_KEYS.map((k) => vars[k]))}<span>${esc(name)}</span></option>`
  let html = '<button><selectedcontent></selectedcontent></button>'
  if (auto) html += `<option value="">${swatch(AUTO)}<span>Auto (clair ou sombre selon le système)</span></option>`
  if (custom) html += `<optgroup label="Mon thème">${opt('custom', custom.name, custom.vars)}</optgroup>`
  for (const [group, label] of Object.entries(GROUPS)) {
    html += `<optgroup label="${esc(label)}">${THEMES.filter((t) => t.group === group).map((t) => opt(t.id, t.name, t.vars)).join('')}</optgroup>`
  }
  select.innerHTML = html
}
