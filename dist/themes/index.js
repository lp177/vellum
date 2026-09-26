// Vellum — the theme catalog: Vellum's own light and dark, the PolymerThemes collection, and classic palettes.
//   import { THEMES, themeCSS, deriveTheme } from '@claude177/vellum/themes/index.js'
// Each entry: { id, name, group, source?, spec, vars } — `spec` as written, `vars` the full contract (derived).
// The CSS files in themes/*.css are generated from here (scripts/gen-themes.mjs).
import { deriveTheme } from './derive.js'
import { POLYMER_THEMES } from './polymer.js'
import { CLASSIC_THEMES } from './classics.js'

export * from './derive.js'
export * from './color.js'

const VELLUM_THEMES = [
  { id: 'light', name: 'Light', group: 'vellum',
    spec: { 'color-scheme': 'light', bg: '#eeeeee', surface: '#ffffff', 'surface-raised': '#ffffff', text: '#212121', heading: '#212121',
      'text-2': '#737373', divider: '#dbdbdb', primary: '#3f51b5', 'on-primary': '#ffffff', secondary: '#ff4081', 'on-secondary': '#ffffff',
      success: '#43a047', 'on-success': '#ffffff', info: '#0288d1', 'on-info': '#ffffff', warning: '#ef6c00', 'on-warning': '#ffffff',
      error: '#d32f2f', 'on-error': '#ffffff', toolbar: '#3f51b5', 'on-toolbar': '#ffffff', inverse: '#323232', 'on-inverse': '#f1f1f1',
      focus: '#3f51b5', 'shadow-rgb': '0 0 0', 'shadow-key-alpha': 0.14, 'shadow-ambient-alpha': 0.12, 'shadow-umbra-alpha': 0.4,
      'scrim-alpha': 0.5, 'ripple-alpha': 0.25 } },
  { id: 'dark', name: 'Dark', group: 'vellum',
    spec: { 'color-scheme': 'dark', bg: '#303030', surface: '#424242', 'surface-raised': '#4a4a4a', text: '#ffffff', heading: '#ffffff',
      'text-2': '#b3b3b3', divider: '#5f5f5f', primary: '#7986cb', 'on-primary': '#0d1033', secondary: '#ff80ab', 'on-secondary': '#3b0a1c',
      success: '#81c784', 'on-success': '#0e2a10', info: '#4fc3f7', 'on-info': '#002b3d', warning: '#ffb74d', 'on-warning': '#3d2400',
      error: '#ef5350', 'on-error': '#ffffff', toolbar: '#212121', 'on-toolbar': '#ffffff', inverse: '#e0e0e0', 'on-inverse': '#212121',
      focus: '#9fa8da', 'shadow-rgb': '0 0 0', 'shadow-key-alpha': 0.3, 'shadow-ambient-alpha': 0.24, 'shadow-umbra-alpha': 0.6,
      'scrim-alpha': 0.6, 'ripple-alpha': 0.25 } },
]

export const GROUPS = { vellum: 'Vellum', polymer: 'PolymerThemes', classic: 'Classiques' }
export const THEMES = [...VELLUM_THEMES, ...POLYMER_THEMES, ...CLASSIC_THEMES].map((t) => ({ ...t, vars: deriveTheme(t.spec) }))
export const themeById = (id) => THEMES.find((t) => t.id === id)
