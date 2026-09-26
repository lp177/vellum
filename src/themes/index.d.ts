// Vellum theme catalog — type declarations (dist/themes/index.js).
export type ThemeVars = Record<string, string | number>
export interface Theme { id: string; name: string; group: 'vellum' | 'polymer' | 'classic'; source?: string; spec: ThemeVars; vars: ThemeVars }
export const THEMES: Theme[]
export const GROUPS: Record<Theme['group'], string>
export function themeById(id: string): Theme | undefined
/** Every variable a theme defines, without the "--v-" prefix, in order. */
export const CONTRACT: string[]
export const INPUTS: string[]
export const ALPHAS: string[]
/** Completes a partial spec (bg, text and the six accents required) into a full theme. */
export function deriveTheme(spec: ThemeVars): ThemeVars
/** CSS block for a theme ({ id, vars } or a vars map), default selector [data-theme="id"]. */
export function themeCSS(theme: { id?: string; vars?: ThemeVars } | ThemeVars, selector?: string, indent?: string): string
export function slug(name: string): string
export function parse(color: string): [number, number, number]
export function hex(rgb: number[]): string
export function normalize(color: string): string
export function mix(a: string, b: string, t: number): string
export function gray(color: string): string
export function luminance(color: string): number
export function contrast(a: string, b: string): number
export function onColor(bg: string): string
export function isDark(color: string): boolean
export function rgbTriple(color: string): string
