// Vellum — component behaviors. Each attachX(el) is idempotent and returns a detach function, so the library works
// both as a static page enhancer (init(document)) and under a framework (call attachX in mounted / detach in unmount).
import { attachRipple, rippleOf } from './ripple.js'

const DONE = new WeakMap()
function once(el, key, fn) {
  let m = DONE.get(el)
  if (!m) DONE.set(el, (m = new Map()))
  if (m.has(key)) return m.get(key)
  const detach = fn() || (() => {})
  const wrapped = () => { m.delete(key); detach() }
  m.set(key, wrapped)
  return wrapped
}
const on = (el, ev, fn, opt) => { el.addEventListener(ev, fn, opt); return () => el.removeEventListener(ev, fn, opt) }
const all = (...fns) => () => fns.forEach((f) => f && f())

// ---------------------------------------------------------------- buttons
export function attachButton(btn) {
  return once(btn, 'button', () => {
    const detachRipple = btn.hasAttribute('data-v-noink') ? null : attachRipple(btn, { recenters: btn.classList.contains('v-fab') })
    const detachToggle = btn.hasAttribute('aria-pressed') && btn.hasAttribute('data-v-toggle')
      ? on(btn, 'click', () => btn.setAttribute('aria-pressed', String(btn.getAttribute('aria-pressed') !== 'true')))
      : null
    return all(detachRipple, detachToggle)
  })
}
export function attachIconButton(btn) {
  return once(btn, 'icon-button', () => attachRipple(btn, { center: true, circle: true }))
}

// ---------------------------------------------------------------- checkbox / radio / switch: inky 48px ripple
export function attachControl(label) {
  return once(label, 'control', () => {
    const input = label.querySelector('input')
    const ink = label.querySelector('.v-checkbox__ink, .v-radio__ink, .v-switch__ink')
    if (!input || !ink) return null
    const ripple = attachRipple(ink, { center: true, circle: true }, document.createElement('span'))
    const r = rippleOf(ink)
    const down = (e) => { if (!input.disabled && (e.button === undefined || e.button === 0)) r.down(null, null) }
    const up = () => r.up()
    const key = (e) => { if (e.key === ' ' && !e.repeat && !input.disabled) r.down(null, null) }
    const keyUp = (e) => { if (e.key === ' ') r.up() }
    return all(ripple, on(label, 'pointerdown', down), on(label, 'pointerup', up), on(label, 'pointerleave', up),
      on(input, 'keydown', key), on(input, 'keyup', keyUp))
  })
}

// ---------------------------------------------------------------- slider
export function attachSlider(wrap) {
  return once(wrap, 'slider', () => {
    const input = wrap.querySelector('.v-slider__input')
    if (!input) return null
    const pin = wrap.querySelector('.v-slider__pin')
    const value = wrap.querySelector('.v-slider__value input')
    if (pin && !pin.firstElementChild) pin.appendChild(document.createElement('span'))
    const update = () => {
      const min = +input.min || 0, max = input.max === '' ? 100 : +input.max, v = +input.value
      const f = max > min ? (v - min) / (max - min) : 0
      wrap.style.setProperty('--v-pct', (f * 100).toFixed(3) + '%')
      const sec = wrap.dataset.secondary
      if (sec != null) wrap.style.setProperty('--v-pct2', ((Math.max(+sec, v) - min) / (max - min) * 100).toFixed(3) + '%')
      const thumb = 12
      const w = input.getBoundingClientRect().width
      const x = input.offsetLeft + thumb / 2 + f * Math.max(0, w - thumb)
      wrap.style.setProperty('--v-pin-x', x + 'px')
      wrap.classList.toggle('is-min', v <= min)
      if (pin) pin.firstElementChild.textContent = input.value
      if (value && document.activeElement !== value) value.value = input.value
    }
    const fromField = () => {
      if (value.value === '' || Number.isNaN(+value.value)) return
      input.value = value.value
      update()
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
    update()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    ro?.observe(input)
    return all(on(input, 'input', update), on(input, 'change', update), value && on(value, 'change', fromField), () => ro?.disconnect())
  })
}
export function refreshSlider(wrap) { wrap.querySelector('.v-slider__input')?.dispatchEvent(new Event('input')) }

// ---------------------------------------------------------------- text fields
export function attachField(field) {
  return once(field, 'field', () => {
    const input = field.querySelector('.v-field__input')
    if (!input) return null
    const counter = field.querySelector('.v-field__counter')
    const autoValidate = field.hasAttribute('data-v-auto-validate')
    const update = () => {
      if (counter) counter.textContent = input.maxLength > 0 ? `${input.value.length}/${input.maxLength}` : String(input.value.length)
      if (input.tagName === 'TEXTAREA') { input.style.height = 'auto'; input.style.height = input.scrollHeight + 'px' }
      if (autoValidate) validateField(field)
    }
    update()
    return all(on(input, 'input', update))
  })
}
/** Validate with the native constraints (+ pattern), toggle .is-invalid, fill the error text. Returns validity. */
export function validateField(field) {
  const input = field.querySelector('.v-field__input')
  const ok = input.checkValidity()
  field.classList.toggle('is-invalid', !ok)
  input.setAttribute('aria-invalid', String(!ok))
  const err = field.querySelector('.v-field__error')
  if (err && !ok && !err.dataset.static) err.textContent = input.validationMessage
  return ok
}

// ---------------------------------------------------------------- tabs (paper-tabs selection bar: expand, then contract)
// Two kinds:
//  - tabs (default): role=tablist, aria-selected, roving tabindex, arrows / Home / End;
//  - navigation (.v-tabs--nav, links): the links stay ordinary links in the tab order; the selection is visual
//    ([data-selected]: an attribute, because frameworks rewrite the class attribute of the links they render) and
//    happens on click, before the app has finished navigating, so the click is acknowledged at once. The app confirms
//    (or corrects) it afterwards with list.vSelect(index), -1 for "no section".
export function attachTabs(list) {
  return once(list, 'tabs', () => {
    const nav = list.classList.contains('v-tabs--nav')
    const tabs = () => [...list.querySelectorAll(':scope > .v-tab')]
    let bar = list.querySelector(':scope > .v-tabs__bar')
    if (!bar) { bar = document.createElement('span'); bar.className = 'v-tabs__bar'; bar.setAttribute('aria-hidden', 'true'); list.appendChild(bar) }
    const ink = !list.classList.contains('v-tabs--no-ink')
    const detachInk = ink ? tabs().map((t) => attachRipple(t, {})) : []
    let current = nav
      ? tabs().find((t) => t.hasAttribute('data-selected') || t.getAttribute('aria-current') === 'page') || null
      : tabs().find((t) => t.getAttribute('aria-selected') === 'true') || tabs()[0]
    const pos = (t) => {
      const w = list.scrollWidth || 1
      return { left: (t.offsetLeft / w) * 100, width: (t.offsetWidth / w) * 100 }
    }
    const place = (width, left) => { bar.style.transform = `translateX(${left}%) scaleX(${width / 100})` }
    const rest = () => {
      bar.classList.remove('expand', 'contract')
      if (current) { const p = pos(current); place(p.width, p.left) } else place(0, 0)
    }
    const mark = (tab) => {
      for (const t of tabs()) {
        if (nav) t.toggleAttribute('data-selected', t === tab)
        else { t.setAttribute('aria-selected', String(t === tab)); t.tabIndex = t === tab ? 0 : -1 }
      }
    }
    const select = (tab, focus = false) => {
      if (tab && (tab.disabled || tab.getAttribute('aria-disabled') === 'true')) return
      if (tab === current) { mark(tab); return } // re-mark: cheap, and repairs markup a framework re-rendered
      const old = current
      mark(tab)
      current = tab
      if (focus && tab) tab.focus()
      list.dispatchEvent(new CustomEvent('v-tab-change', { detail: { index: tab ? tabs().indexOf(tab) : -1, tab }, bubbles: true }))
      if (!tab) { // nothing selected (navigation to a page outside the tabs): the bar shrinks into its center
        if (old) { const p = pos(old); bar.classList.remove('expand'); bar.classList.add('contract'); place(0, p.left + p.width / 2) }
        return
      }
      const slide = !list.classList.contains('v-tabs--no-slide') && old
      if (!slide) { rest(); return }
      const w = list.scrollWidth || 1, m = 5
      const o = old.getBoundingClientRect(), n = tab.getBoundingClientRect(), lr = list.getBoundingClientRect()
      bar.classList.remove('contract'); bar.classList.add('expand')
      if (tabs().indexOf(old) < tabs().indexOf(tab)) place(((n.right - o.left) / w) * 100 - m, ((o.left - lr.left + list.scrollLeft) / w) * 100)
      else place(((o.right - n.left) / w) * 100 - m, ((n.left - lr.left + list.scrollLeft) / w) * 100 + m)
    }
    const onEnd = (e) => {
      if (e.target !== bar) return
      if (bar.classList.contains('expand') && current) { bar.classList.replace('expand', 'contract'); const p = pos(current); place(p.width, p.left) }
      else bar.classList.remove('expand', 'contract')
    }
    const onClick = (e) => {
      const t = e.target.closest('.v-tab')
      if (!t || t.parentElement !== list) return
      if (nav && (e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return // opens elsewhere
      select(t)
    }
    const onKey = (e) => {
      const ts = tabs().filter((t) => !t.disabled), i = ts.indexOf(document.activeElement)
      if (i < 0) return
      const next = { ArrowRight: ts[(i + 1) % ts.length], ArrowLeft: ts[(i - 1 + ts.length) % ts.length], Home: ts[0], End: ts.at(-1) }[e.key]
      if (next) { e.preventDefault(); select(next, true) }
    }
    if (!nav) {
      for (const t of tabs()) { t.setAttribute('role', 'tab'); t.tabIndex = t === current ? 0 : -1; t.setAttribute('aria-selected', String(t === current)) }
      list.setAttribute('role', 'tablist')
    } else mark(current)
    rest()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(rest) : null
    ro?.observe(list)
    list.vSelect = (i) => select(i >= 0 ? tabs()[i] ?? null : null)
    return all(on(list, 'click', onClick), nav ? null : on(list, 'keydown', onKey), on(bar, 'transitionend', onEnd), () => ro?.disconnect(), ...detachInk)
  })
}

// ---------------------------------------------------------------- menu / listbox (single or multi select, keyboard)
export function attachMenu(menu) {
  return once(menu, 'menu', () => {
    const multi = menu.getAttribute('aria-multiselectable') === 'true'
    const items = () => [...menu.querySelectorAll('.v-item:not([aria-disabled="true"])')]
    for (const it of menu.querySelectorAll('.v-item')) { if (!it.hasAttribute('role')) it.setAttribute('role', 'option'); if (!it.hasAttribute('aria-selected')) it.setAttribute('aria-selected', 'false') }
    const sel = items().find((i) => i.getAttribute('aria-selected') === 'true') || items()[0]
    for (const it of items()) it.tabIndex = it === sel ? 0 : -1
    const toggle = (it) => {
      if (multi) it.setAttribute('aria-selected', String(it.getAttribute('aria-selected') !== 'true'))
      else for (const x of menu.querySelectorAll('.v-item')) x.setAttribute('aria-selected', String(x === it))
      menu.dispatchEvent(new CustomEvent('v-select', { detail: { item: it, selected: [...menu.querySelectorAll('[aria-selected="true"]')] }, bubbles: true }))
    }
    const focusItem = (it) => { for (const x of items()) x.tabIndex = x === it ? 0 : -1; it.focus() }
    const onClick = (e) => { const it = e.target.closest('.v-item'); if (it && menu.contains(it) && it.getAttribute('aria-disabled') !== 'true') { toggle(it); focusItem(it) } }
    const onKey = (e) => {
      const list = items(), i = list.indexOf(document.activeElement)
      const map = { ArrowDown: list[Math.min(list.length - 1, i + 1)], ArrowUp: list[Math.max(0, i - 1)], Home: list[0], End: list.at(-1) }
      if (map[e.key]) { e.preventDefault(); focusItem(map[e.key]); return }
      if ((e.key === 'Enter' || e.key === ' ') && i >= 0) { e.preventDefault(); toggle(list[i]); return }
      if (e.key.length === 1 && /\S/.test(e.key)) { // typeahead
        const hit = list.slice(i + 1).concat(list.slice(0, i + 1)).find((x) => x.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()))
        if (hit) focusItem(hit)
      }
    }
    return all(on(menu, 'click', onClick), on(menu, 'keydown', onKey))
  })
}

// ---------------------------------------------------------------- dialog (native <dialog>, animated close)
export function openDialog(dialog, { modal = true } = {}) {
  dialog.classList.remove('is-closing')
  if (!dialog.open) modal ? dialog.showModal() : dialog.show()
  once(dialog, 'dialog', () => all(
    on(dialog, 'cancel', (e) => { e.preventDefault(); if (!dialog.hasAttribute('data-v-modal')) closeDialog(dialog) }),
    on(dialog, 'click', (e) => {
      if (e.target.closest('[data-v-dialog-close]')) { closeDialog(dialog, e.target.closest('[data-v-dialog-close]').getAttribute('data-v-dialog-close') || '') ; return }
      if (e.target === dialog && !dialog.hasAttribute('data-v-modal')) { // click on the backdrop
        const r = dialog.getBoundingClientRect()
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog(dialog)
      }
    }),
  ))
  const first = dialog.querySelector('[autofocus], .v-dialog__buttons .v-button:last-child')
  first?.focus()
}
export function closeDialog(dialog, returnValue = '') {
  if (!dialog.open || dialog.classList.contains('is-closing')) return
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const finish = () => { dialog.classList.remove('is-closing'); dialog.close(returnValue) }
  if (reduce || typeof dialog.getAnimations !== 'function') { finish(); return }
  dialog.classList.add('is-closing')
  const anims = dialog.getAnimations()
  if (!anims.length) { finish(); return }
  Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(finish)
}

// ---------------------------------------------------------------- toast
let toastEl = null, toastTimer = 0
/** toast("Saved", { duration: 3000, action: { label: "Undo", onClick } , capsule: false }) */
export function toast(text, { duration = 3000, action = null, capsule = false } = {}) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.className = 'v-toast'
    toastEl.setAttribute('role', 'status')
    toastEl.setAttribute('aria-live', 'polite')
    document.body.appendChild(toastEl)
  }
  clearTimeout(toastTimer)
  toastEl.classList.toggle('v-toast--capsule', capsule)
  toastEl.replaceChildren()
  const span = document.createElement('span'); span.className = 'v-toast__text'; span.textContent = text
  toastEl.appendChild(span)
  if (action) {
    const b = document.createElement('button'); b.className = 'v-button v-toast__action'; b.textContent = action.label
    b.addEventListener('click', () => { action.onClick?.(); hideToast() })
    toastEl.appendChild(b); attachButton(b)
  }
  requestAnimationFrame(() => toastEl.classList.add('is-open'))
  if (duration > 0 && duration !== Infinity) toastTimer = setTimeout(hideToast, duration)
  return { hide: hideToast }
}
export function hideToast() { clearTimeout(toastTimer); toastEl?.classList.remove('is-open') }

// ---------------------------------------------------------------- progress / spinner
export function setProgress(el, value, secondary) {
  const clamp = (v) => Math.max(0, Math.min(1, v))
  el.classList.add('is-transiting')
  el.style.setProperty('--v-value', String(clamp(value)))
  if (secondary != null) el.style.setProperty('--v-secondary-value', String(clamp(secondary)))
  el.setAttribute('role', 'progressbar')
  el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100')
  el.setAttribute('aria-valuenow', String(Math.round(clamp(value) * 100)))
}
export function attachSpinner(el) {
  return once(el, 'spinner', () => {
    if (!el.querySelector('svg')) el.innerHTML = '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11"/></svg>'
    if (!el.hasAttribute('role')) el.setAttribute('role', 'progressbar')
    return null
  })
}
