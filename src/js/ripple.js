// Vellum — ink ripple, a re-implementation of Polymer's paper-ripple physics (BSD, see NOTICE):
//   radius(t) = R · (1 − 80^(−t / d)),  R = min(diag, 300)·1.1 + 5,  d = 1.1 − 0.2·R/300   (seconds)
//   wave opacity = 0.25 while held, then decays by 0.8/s after release; the background fills at 0.3/s after
//   release, capped by the wave opacity. Only `transform` and `opacity` change, in one rAF loop per host, and the
//   compositing layer (.is-animating) exists only while something animates.
// Options: center (start at the center), recenters (drift toward the center while growing), circle (round clip),
// holdDown (keep the wave, e.g. keyboard focus). Keyboard: Enter = quick ripple, Space = held while pressed.
// prefers-reduced-motion: no expanding wave, just a short background fade.

const MAX_RADIUS = 300
const now = () => performance.now()
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Pure physics, exported for tests. `down` / `up` are seconds since press / release (up = 0 while held). */
export function waveRadius(width, height, downSeconds) {
  const R = Math.min(Math.sqrt(width * width + height * height), MAX_RADIUS) * 1.1 + 5
  const duration = 1.1 - 0.2 * (R / MAX_RADIUS)
  return Math.abs(R * (1 - Math.pow(80, -downSeconds / duration)))
}
export function waveOpacity(initial, upSeconds, released) {
  return released ? Math.max(0, initial - upSeconds * 0.8) : initial
}
export function outerOpacity(upSeconds, waveOp) {
  return Math.max(0, Math.min(upSeconds * 0.3, waveOp))
}

class Wave {
  constructor(ripple, x, y) {
    this.r = ripple
    const rect = ripple.host.getBoundingClientRect()
    this.w = rect.width; this.h = rect.height; this.size = Math.max(this.w, this.h)
    this.downAt = now(); this.upAt = 0
    const cx = this.w / 2, cy = this.h / 2
    this.x0 = ripple.opts.center || x == null ? cx : x - rect.left
    this.y0 = ripple.opts.center || y == null ? cy : y - rect.top
    this.x1 = ripple.opts.recenters ? cx : null
    this.y1 = ripple.opts.recenters ? cy : null
    this.maxRadius = Math.max(...[[0, 0], [this.w, 0], [0, this.h], [this.w, this.h]].map(([a, b]) => Math.hypot(this.x0 - a, this.y0 - b)))
    this.container = document.createElement('span')
    this.container.className = 'v-ripple__wave-container'
    this.el = document.createElement('span')
    this.el.className = 'v-ripple__wave'
    this.container.appendChild(this.el)
    Object.assign(this.container.style, {
      top: (this.h - this.size) / 2 + 'px', left: (this.w - this.size) / 2 + 'px', width: this.size + 'px', height: this.size + 'px',
    })
  }
  get downSeconds() { return (now() - this.downAt) / 1000 } // paper: mouseDownElapsed + mouseUpElapsed
  get upSeconds() { return this.upAt ? (now() - this.upAt) / 1000 : 0 }
  get radius() { return waveRadius(this.w, this.h, this.downSeconds) }
  get opacity() { return waveOpacity(this.r.initialOpacity, this.upSeconds, !!this.upAt) }
  get done() {
    const cap = Math.min(this.maxRadius, MAX_RADIUS)
    return this.upAt ? this.opacity < 0.01 && this.radius >= cap : false
  }
  draw() {
    const radius = this.radius
    const f = Math.min(1, radius / this.size * 2 / Math.SQRT2)
    const x = this.x1 == null ? this.x0 : this.x0 + f * (this.x1 - this.x0)
    const y = this.y1 == null ? this.y0 : this.y0 + f * (this.y1 - this.y0)
    const scale = radius / (this.size / 2)
    this.el.style.opacity = this.opacity
    this.container.style.transform = `translate3d(${x - this.w / 2}px, ${y - this.h / 2}px, 0)`
    this.el.style.transform = `scale3d(${scale}, ${scale}, 1)`
  }
}

export class Ripple {
  constructor(host, opts = {}) {
    this.host = host
    this.opts = { center: false, recenters: false, circle: false, holdDown: false, ...opts }
    this.waves = []
    this.loop = this.loop.bind(this)
    this.root = document.createElement('span')
    this.root.className = 'v-ripple' + (this.opts.circle ? ' v-ripple--circle' : '')
    this.root.setAttribute('aria-hidden', 'true')
    this.bg = document.createElement('span'); this.bg.className = 'v-ripple__bg'
    this.wavesEl = document.createElement('span'); this.wavesEl.className = 'v-ripple__waves'
    this.root.append(this.bg, this.wavesEl)
    host.prepend(this.root)
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
  }
  get initialOpacity() {
    const cs = getComputedStyle(this.host)
    const base = parseFloat(cs.getPropertyValue('--v-ripple-alpha')) || 0.25
    const scale = parseFloat(cs.getPropertyValue('--v-ripple-alpha-scale')) || 1
    return base * scale
  }
  down(x, y) {
    if (this.opts.holdDown && this.waves.length) return
    if (reducedMotion()) { this.flash(); return }
    const w = new Wave(this, x, y)
    this.wavesEl.appendChild(w.container)
    this.waves.push(w)
    this.start()
  }
  up() {
    if (this.opts.holdDown) return
    const t = now()
    for (const w of this.waves) if (!w.upAt) w.upAt = t
    this.start()
  }
  flash() {
    this.bg.style.transition = 'none'
    this.bg.style.opacity = String(this.initialOpacity * 0.6)
    requestAnimationFrame(() => { this.bg.style.transition = 'opacity 150ms linear'; this.bg.style.opacity = '0' })
  }
  start() {
    if (this.running) return
    this.running = true
    this.root.classList.add('is-animating')
    requestAnimationFrame(this.loop)
  }
  loop() {
    let outer = 0
    for (const w of [...this.waves]) {
      w.draw()
      outer = Math.max(outer, outerOpacity(w.upSeconds, w.opacity))
      if (w.done) { w.container.remove(); this.waves.splice(this.waves.indexOf(w), 1) }
    }
    this.bg.style.opacity = String(outer)
    // held at full size: nothing moves any more, stop drawing until release (up() restarts the loop)
    const resting = this.waves.length > 0 && this.waves.every((w) => !w.upAt && w.radius >= Math.min(w.maxRadius, MAX_RADIUS))
    if (this.waves.length && !resting) { requestAnimationFrame(this.loop); return }
    this.running = false
    if (!this.waves.length) { this.bg.style.opacity = '0'; this.root.classList.remove('is-animating') }
  }
  set holdDown(v) {
    this.opts.holdDown = false
    if (v) { this.down(null, null); this.opts.holdDown = true } else { this.up() }
  }
  destroy() { this.root.remove(); this.waves = [] }
}

const REGISTRY = new WeakMap()

/** Attach a ripple to `host` (pointer + keyboard). `trigger` is the element that receives the events (defaults to host).
 *  Returns a function that removes everything. */
export function attachRipple(host, opts = {}, trigger = host) {
  if (REGISTRY.has(host)) return REGISTRY.get(host).detach
  const ripple = new Ripple(host, opts)
  const disabled = () => trigger.disabled || trigger.getAttribute('aria-disabled') === 'true' || host.hasAttribute('data-v-noink')
  const onDown = (e) => { if (e.button === 0 && !disabled()) { ripple.down(e.clientX, e.clientY); trigger.classList.add('is-pressed') } }
  const onUp = () => { ripple.up(); trigger.classList.remove('is-pressed') }
  const onKeyDown = (e) => {
    if (disabled() || e.repeat) return
    if (e.key === 'Enter') { ripple.down(null, null); setTimeout(() => ripple.up(), 1) }
    else if (e.key === ' ') { ripple.down(null, null); trigger.classList.add('is-pressed') }
  }
  const onKeyUp = (e) => { if (e.key === ' ') onUp() }
  trigger.addEventListener('pointerdown', onDown)
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'blur']) trigger.addEventListener(ev, onUp)
  trigger.addEventListener('keydown', onKeyDown)
  trigger.addEventListener('keyup', onKeyUp)
  const detach = () => {
    trigger.removeEventListener('pointerdown', onDown)
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'blur']) trigger.removeEventListener(ev, onUp)
    trigger.removeEventListener('keydown', onKeyDown)
    trigger.removeEventListener('keyup', onKeyUp)
    ripple.destroy()
    REGISTRY.delete(host)
  }
  REGISTRY.set(host, { ripple, detach })
  return detach
}
export function rippleOf(host) { return REGISTRY.get(host)?.ripple ?? null }
