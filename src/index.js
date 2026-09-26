// Vellum — entry point: CSS (themes light + dark included) and behaviors.
//   import '@claude177/vellum/vellum.css'         (or let a bundler pick it up from this module)
//   import { init } from '@claude177/vellum'; init(document)          static pages
//   observe(document.body)                                             dynamic apps without a component layer
// Optional: '@claude177/vellum/fonts.css' (local Roboto), themes/golden-goose.css.
import './css/index.css'
import { attachButton, attachIconButton, attachControl, attachSlider, attachField, attachTabs, attachMenu, attachSpinner } from './js/components.js'
import { fillIcon } from './js/icons.js'

export * from './js/components.js'
export { attachRipple, Ripple, waveRadius, waveOpacity, outerOpacity } from './js/ripple.js'
export { ICONS, icon, fillIcon } from './js/icons.js'

const RULES = [
  ['.v-button:not(.v-toast__action)', attachButton],
  ['.v-fab', attachButton],
  ['.v-icon-button', attachIconButton],
  ['.v-checkbox, .v-radio, .v-switch', attachControl],
  ['.v-slider', attachSlider],
  ['.v-field', attachField],
  ['.v-tabs', attachTabs],
  ['.v-menu[role="listbox"]', attachMenu],
  ['.v-spinner', attachSpinner],
  ['svg[data-v-icon]', fillIcon],
]

/** Enhance every Vellum component under root (idempotent). */
export function init(root = document) {
  for (const [sel, fn] of RULES) {
    if (root.matches?.(sel)) fn(root)
    root.querySelectorAll(sel).forEach((el) => fn(el))
  }
}

/** Enhance components added later (MutationObserver). Returns a disconnect function. */
export function observe(root = document.body) {
  init(root)
  const mo = new MutationObserver((records) => {
    for (const r of records) for (const n of r.addedNodes) if (n.nodeType === 1) init(n)
  })
  mo.observe(root, { childList: true, subtree: true })
  return () => mo.disconnect()
}

/** Theme helper: setTheme('dark') on <html> (or on any element), null = follow the system. */
export function setTheme(name, el = document.documentElement) {
  if (name) el.setAttribute('data-theme', name)
  else el.removeAttribute('data-theme')
}
