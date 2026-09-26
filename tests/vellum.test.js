import { describe, expect, it, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { waveRadius, waveOpacity, outerOpacity } from '../src/js/ripple.js'
import { attachTabs, attachMenu, attachField, validateField, toast, hideToast, setProgress, attachSlider } from '../src/js/components.js'
import { icon } from '../src/js/icons.js'

describe('ripple physics (paper-ripple)', () => {
  it('grows fast then eases toward 1.1·min(diag, 300) + 5', () => {
    const w = 100, h = 40
    const R = Math.min(Math.hypot(w, h), 300) * 1.1 + 5
    expect(waveRadius(w, h, 0)).toBe(0)
    const early = waveRadius(w, h, 0.05), later = waveRadius(w, h, 0.3)
    expect(early).toBeGreaterThan(0)
    expect(later).toBeGreaterThan(early)
    expect(waveRadius(w, h, 5)).toBeCloseTo(R, 3)
  })
  it('caps the radius for large surfaces (MAX_RADIUS 300)', () => {
    expect(waveRadius(2000, 2000, 10)).toBeCloseTo(300 * 1.1 + 5, 3)
  })
  it('keeps opacity while held, decays 0.8/s after release; background follows at 0.3/s', () => {
    expect(waveOpacity(0.25, 0, false)).toBe(0.25)
    expect(waveOpacity(0.25, 0.1, true)).toBeCloseTo(0.17, 5)
    expect(waveOpacity(0.25, 1, true)).toBe(0)
    expect(outerOpacity(0.1, 0.25)).toBeCloseTo(0.03, 5)
    expect(outerOpacity(2, 0.1)).toBe(0.1) // capped by the wave
  })
})

describe('tabs', () => {
  let list
  beforeEach(() => {
    document.body.innerHTML = `<div class="v-tabs"><button class="v-tab" aria-selected="true">A</button><button class="v-tab">B</button><button class="v-tab" disabled>C</button><button class="v-tab">D</button></div>`
    list = document.querySelector('.v-tabs')
    attachTabs(list)
  })
  it('sets roles, roving tabindex and a selection bar', () => {
    expect(list.getAttribute('role')).toBe('tablist')
    const t = [...list.querySelectorAll('.v-tab')]
    expect(t.map((x) => x.tabIndex)).toEqual([0, -1, -1, -1])
    expect(list.querySelector('.v-tabs__bar')).not.toBeNull()
  })
  it('arrows skip disabled tabs, wrap around, and emit v-tab-change', () => {
    const t = [...list.querySelectorAll('.v-tab')]
    const seen = []
    list.addEventListener('v-tab-change', (e) => seen.push(e.detail.index))
    t[0].focus()
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(t[1])
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(t[3]) // C is disabled
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(document.activeElement).toBe(t[0])
    expect(seen).toEqual([1, 3, 0])
    expect(t[0].getAttribute('aria-selected')).toBe('true')
  })
  it('is idempotent', () => {
    attachTabs(list)
    expect(list.querySelectorAll('.v-tabs__bar').length).toBe(1)
  })
})

describe('menu / listbox', () => {
  it('single select: click selects one; keyboard moves focus; typeahead', () => {
    document.body.innerHTML = `<div class="v-menu" role="listbox"><div class="v-item">Inbox</div><div class="v-item">Starred</div><div class="v-item" aria-disabled="true">Sent</div><div class="v-item">Drafts</div></div>`
    const m = document.querySelector('.v-menu'); attachMenu(m)
    const it = [...m.querySelectorAll('.v-item')]
    it[1].click()
    expect(it.map((x) => x.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false', 'false'])
    it[1].focus()
    m.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(document.activeElement).toBe(it[3]) // skips the disabled one
    m.dispatchEvent(new KeyboardEvent('keydown', { key: 'i', bubbles: true }))
    expect(document.activeElement).toBe(it[0])
  })
  it('multi select toggles independently', () => {
    document.body.innerHTML = `<div class="v-menu" role="listbox" aria-multiselectable="true"><div class="v-item">Bold</div><div class="v-item">Italic</div></div>`
    const m = document.querySelector('.v-menu'); attachMenu(m)
    const it = [...m.querySelectorAll('.v-item')]
    it[0].click(); it[1].click(); it[0].click()
    expect(it.map((x) => x.getAttribute('aria-selected'))).toEqual(['false', 'true'])
  })
})

describe('text field', () => {
  it('counts characters against maxlength and validates with native constraints', () => {
    document.body.innerHTML = `<label class="v-field" data-v-auto-validate><input class="v-field__input" placeholder=" " maxlength="10" pattern="[a-z]*"><span class="v-field__label">x</span><span class="v-field__line"></span><span class="v-field__meta"><span class="v-field__error"></span><span class="v-field__counter"></span></span></label>`
    const f = document.querySelector('.v-field'), input = f.querySelector('input')
    attachField(f)
    expect(f.querySelector('.v-field__counter').textContent).toBe('0/10')
    input.value = 'abc'; input.dispatchEvent(new Event('input'))
    expect(f.querySelector('.v-field__counter').textContent).toBe('3/10')
    expect(f.classList.contains('is-invalid')).toBe(false)
    input.value = 'ab1'; input.dispatchEvent(new Event('input'))
    expect(f.classList.contains('is-invalid')).toBe(true)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    input.value = 'ok'; expect(validateField(f)).toBe(true)
  })
})

describe('slider', () => {
  it('exposes the fill percentage and the ring state at the minimum', () => {
    document.body.innerHTML = `<div class="v-slider"><input type="range" class="v-slider__input" min="0" max="200" value="50"></div>`
    const w = document.querySelector('.v-slider'); attachSlider(w)
    expect(w.style.getPropertyValue('--v-pct')).toBe('25.000%')
    const input = w.querySelector('input'); input.value = '0'; input.dispatchEvent(new Event('input'))
    expect(w.classList.contains('is-min')).toBe(true)
  })
})

describe('toast and progress', () => {
  it('opens, then hides after its duration; one live region is reused', () => {
    vi.useFakeTimers()
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(0); return 0 })
    toast('Saved', { duration: 1000 })
    toast('Saved again', { duration: 1000 })
    const els = document.querySelectorAll('.v-toast')
    expect(els.length).toBe(1)
    expect(els[0].getAttribute('aria-live')).toBe('polite')
    expect(els[0].classList.contains('is-open')).toBe(true)
    expect(els[0].textContent).toBe('Saved again')
    vi.advanceTimersByTime(1100)
    expect(els[0].classList.contains('is-open')).toBe(false)
    raf.mockRestore(); vi.useRealTimers(); hideToast()
  })
  it('clamps progress values and keeps aria-valuenow', () => {
    const el = document.createElement('div')
    setProgress(el, 1.4, -1)
    expect(el.style.getPropertyValue('--v-value')).toBe('1')
    expect(el.style.getPropertyValue('--v-secondary-value')).toBe('0')
    expect(el.getAttribute('aria-valuenow')).toBe('100')
  })
})

describe('icons & themes', () => {
  it('renders known icons, nothing for unknown ones', () => {
    expect(icon('menu')).toContain('<path d="M3 18h18')
    expect(icon('nope')).toBe('')
  })
  it('light theme defaults have zero specificity so any [data-theme] wins', () => {
    const css = readFileSync('src/css/themes/light.css', 'utf8')
    expect(css).toMatch(/:where\(:root\), \[data-theme="light"\]/)
    const dark = readFileSync('src/css/themes/dark.css', 'utf8')
    expect(dark).toMatch(/:root:not\(\[data-theme\]\)/)
  })
  it('every theme defines the full base contract', () => {
    const contract = [...readFileSync('src/css/themes/light.css', 'utf8').matchAll(/(--v-[a-z0-9-]+):/g)].map((m) => m[1])
    for (const file of ['dark.css', 'golden-goose.css']) {
      const css = readFileSync(`src/css/themes/${file}`, 'utf8')
      for (const v of contract) expect(css, `${file} misses ${v}`).toContain(v + ':')
    }
  })
})
