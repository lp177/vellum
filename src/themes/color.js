// Vellum — small color helpers for the theme catalog and the theme builder (sRGB, hex in / hex out).

const NAMED = { white: '#ffffff', black: '#000000', orange: '#ffa500', red: '#ff0000', gray: '#808080', grey: '#808080' }

/** '#abc', '#aabbcc', 'rgb(1 2 3)', 'rgb(1, 2, 3)', a few names → [r, g, b] (0–255). Throws on anything else. */
export function parse(color) {
  const c = String(color).trim().toLowerCase()
  if (NAMED[c]) return parse(NAMED[c])
  let m = /^#([0-9a-f]{3})$/.exec(c)
  if (m) return [...m[1]].map((h) => parseInt(h + h, 16))
  m = /^#([0-9a-f]{6})$/.exec(c)
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16))
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/.exec(c)
  if (m) return [+m[1], +m[2], +m[3]]
  throw new Error(`unsupported color: ${color}`)
}

export const hex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
export const normalize = (color) => hex(parse(color))

/** a·t + b·(1 − t): mix('#fff', '#000', 0.3) is 30 % white. */
export function mix(a, b, t) {
  const x = parse(a), y = parse(b)
  return hex(x.map((v, i) => v * t + y[i] * (1 - t)))
}

/** The neutral grey of the same lightness (dividers and disabled states stay neutral in tinted themes). */
export function gray(color) {
  const [r, g, b] = parse(color)
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return hex([y, y, y])
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function luminance(color) {
  const [r, g, b] = parse(color).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 … 21. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** Text color for a colored surface: white when it reads well enough (Material's habit), else a dark tint of the
 *  color itself (golden-goose style), whichever contrasts more when white is poor. */
export function onColor(bg) {
  const white = '#ffffff', dark = mix(bg, '#000000', 0.22)
  if (contrast(white, bg) >= 3.2) return white
  return contrast(dark, bg) >= contrast(white, bg) ? dark : white
}

/** Dark enough that light text reads better than dark text (the WCAG crossover is L ≈ 0.18). */
export const isDark = (color) => luminance(color) < 0.18

/** '#112233' → '17 34 51' (the form --v-shadow-rgb takes). */
export const rgbTriple = (color) => parse(color).join(' ')
