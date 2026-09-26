// Vellum — theme contract and derivation. A theme is a map of base colors (the CONTRACT, without the "--v-" prefix).
// A spec may give only some of them: deriveTheme() completes the rest the way the built-in themes do (on-colors by
// contrast, secondary text and dividers mixed from text and surface, shadows by scheme…). Explicit values always win.
import { contrast, gray, isDark, mix, normalize, onColor } from './color.js'

/** Every variable a theme must define, in the order themes are written. */
export const CONTRACT = [
  'color-scheme', 'bg', 'surface', 'surface-raised', 'text', 'heading', 'text-2', 'divider',
  'primary', 'on-primary', 'secondary', 'on-secondary', 'success', 'on-success', 'info', 'on-info',
  'warning', 'on-warning', 'error', 'on-error', 'toolbar', 'on-toolbar', 'inverse', 'on-inverse', 'focus',
  'shadow-rgb', 'shadow-key-alpha', 'shadow-ambient-alpha', 'shadow-umbra-alpha', 'scrim-alpha', 'ripple-alpha',
]
/** The values a person picks; everything else can be derived from them. */
export const INPUTS = ['bg', 'surface', 'text', 'primary', 'secondary', 'success', 'info', 'warning', 'error', 'toolbar']
export const ALPHAS = ['shadow-key-alpha', 'shadow-ambient-alpha', 'shadow-umbra-alpha', 'scrim-alpha', 'ripple-alpha']
const ACCENTS = ['primary', 'secondary', 'success', 'info', 'warning', 'error']

/** Derivation rules, each from the already-resolved theme `t` (inputs first, then these in order). */
const RULES = {
  'color-scheme': (t) => (isDark(t.bg) ? 'dark' : 'light'),
  surface: (t) => (t['color-scheme'] === 'dark' ? mix('#ffffff', t.bg, 0.06) : '#ffffff'),
  'surface-raised': (t) => (t['color-scheme'] === 'dark' ? mix('#ffffff', t.surface, 0.05) : t.surface),
  heading: (t) => t.text,
  'text-2': (t) => mix(t.text, t.surface, 0.7),
  divider: (t) => mix(gray(t.text), t.surface, 0.18),   // neutral: disabled states derive from it (tokens.css)
  toolbar: (t) => (t['color-scheme'] === 'dark' ? mix('#000000', t.bg, 0.3) : t.primary),
  'on-toolbar': (t) => (t.toolbar === t.primary ? t['on-primary'] : best(t.toolbar, [t.heading, '#ffffff', '#000000'])),
  inverse: (t) => mix(t.text, t.bg, 0.9),
  'on-inverse': (t) => (t['color-scheme'] === 'dark' ? mix('#000000', t.bg, 0.3) : mix('#ffffff', t.bg, 0.5)),
  focus: (t) => (t['color-scheme'] === 'dark' ? mix('#ffffff', t.primary, 0.3) : t.primary),
  'shadow-rgb': () => '0 0 0',
  'shadow-key-alpha': (t) => (t['color-scheme'] === 'dark' ? 0.3 : 0.14),
  'shadow-ambient-alpha': (t) => (t['color-scheme'] === 'dark' ? 0.24 : 0.12),
  'shadow-umbra-alpha': (t) => (t['color-scheme'] === 'dark' ? 0.6 : 0.4),
  'scrim-alpha': (t) => (t['color-scheme'] === 'dark' ? 0.6 : 0.5),
  'ripple-alpha': () => 0.25,
}
for (const a of ACCENTS) RULES[`on-${a}`] = (t) => onColor(t[a])

const best = (bg, candidates) => candidates.reduce((b, c) => (contrast(c, bg) > contrast(b, bg) ? c : b))

// the order in which missing values are computed (each rule only reads values resolved before it)
const ORDER = ['color-scheme', 'surface', 'surface-raised', 'heading', 'text-2', 'divider',
  ...ACCENTS.map((a) => `on-${a}`), 'toolbar', 'on-toolbar', 'inverse', 'on-inverse', 'focus',
  'shadow-rgb', ...ALPHAS]

/** Complete a spec into a full theme (every CONTRACT key). Required: bg, text, and the six accents. */
export function deriveTheme(spec) {
  const t = {}
  for (const [k, v] of Object.entries(spec)) {
    if (!CONTRACT.includes(k)) continue
    t[k] = typeof v === 'number' || k === 'color-scheme' || k === 'shadow-rgb' ? v : normalize(v)
  }
  for (const k of ['bg', 'text', ...ACCENTS]) if (!t[k]) throw new Error(`theme spec needs "${k}"`)
  for (const k of ORDER) if (t[k] === undefined) t[k] = RULES[k](t)
  return Object.fromEntries(CONTRACT.map((k) => [k, t[k]]))
}

/** CSS block for a theme. */
export function themeCSS(theme, selector = `[data-theme="${theme.id}"]`, indent = '  ') {
  const v = theme.vars ?? theme
  const lines = CONTRACT.map((k) => `${indent}--v-${k}: ${v[k]};`)
  return `${selector} {\n${lines.join('\n')}\n}`
}

/** A theme id from a free name: "Mon thème bleu" → "mon-theme-bleu". */
export const slug = (name) => String(name).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'custom'
