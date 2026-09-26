// Vellum — type declarations for the JS API (dist/vellum.js). The CSS needs none.

/** Removes what an attach call added (listeners, ripple nodes, observers). */
export type Detach = () => void

// ---------------------------------------------------------------- page-level
/** Enhance every Vellum component under `root` (idempotent). */
export function init(root?: ParentNode & Partial<Element>): void
/** Enhance components under `root` now and whenever they are added later. Returns a disconnect function. */
export function observe(root?: Element): Detach
/** Set `data-theme` on `el` (default `<html>`); `null` removes it so the OS preference applies. */
export function setTheme(name: string | null, el?: Element): void

// ---------------------------------------------------------------- components (each idempotent, returns a detach)
export function attachButton(btn: HTMLElement): Detach
export function attachIconButton(btn: HTMLElement): Detach
export function attachControl(label: HTMLElement): Detach
export function attachSlider(wrap: HTMLElement): Detach
export function refreshSlider(wrap: HTMLElement): void
export function attachField(field: HTMLElement): Detach
/** Checks the native constraints, toggles `.is-invalid` and `aria-invalid`, fills `.v-field__error`. */
export function validateField(field: HTMLElement): boolean
/** Tabs: dispatches `v-tab-change` (`detail: { index, tab }`); the list gets `vSelect(index)`. */
export function attachTabs(list: HTMLElement): Detach
/** Listbox: dispatches `v-select` (`detail: { item, selected }`). */
export function attachMenu(menu: HTMLElement): Detach
export function attachSpinner(el: HTMLElement): Detach

export interface VTabsElement extends HTMLElement { vSelect(index: number): void }
export interface VTabChangeDetail { index: number; tab: HTMLElement }
export interface VSelectDetail { item: HTMLElement; selected: HTMLElement[] }

// ---------------------------------------------------------------- dialog, toast, progress
export function openDialog(dialog: HTMLDialogElement, opts?: { modal?: boolean }): void
/** Plays the exit animation, then `dialog.close(returnValue)`. */
export function closeDialog(dialog: HTMLDialogElement, returnValue?: string): void
export interface ToastOptions {
  /** ms; 0 or Infinity keeps it open. Default 3000. */
  duration?: number
  action?: { label: string; onClick?: () => void } | null
  capsule?: boolean
}
export function toast(text: string, opts?: ToastOptions): { hide: () => void }
export function hideToast(): void
/** `value` and `secondary` in 0–1. */
export function setProgress(el: HTMLElement, value: number, secondary?: number | null): void

// ---------------------------------------------------------------- ripple
export interface RippleOptions {
  /** Waves start at the center (keyboard-like). */
  center?: boolean
  /** Waves drift toward the center while growing (paper-fab). */
  recenters?: boolean
  /** Round clip (icon buttons, controls). */
  circle?: boolean
  /** Keep the wave until `up()` even if the pointer never went down on the host. */
  holdDown?: boolean
}
export class Ripple {
  constructor(host: HTMLElement, opts?: RippleOptions)
  down(clientX: number | null, clientY: number | null): void
  up(): void
  flash(): void
  /** true: keep a wave at full size (e.g. keyboard focus); false: release it. */
  set holdDown(v: boolean)
  destroy(): void
}
/** Ink ripple on `host`; `trigger` receives the pointer and key events (default: host). */
export function attachRipple(host: HTMLElement, opts?: RippleOptions, trigger?: HTMLElement): Detach
export function rippleOf(host: HTMLElement): Ripple | null
export function waveRadius(width: number, height: number, downSeconds: number): number
export function waveOpacity(initial: number, upSeconds: number, released: boolean): number
export function outerOpacity(upSeconds: number, waveOpacity: number): number

// ---------------------------------------------------------------- icons
export const ICONS: Record<string, string>
/** Inline `<svg>` markup for a Material icon, '' for an unknown name. */
export function icon(name: string, cls?: string): string
/** Fills `<svg data-v-icon="name">` with its path. */
export function fillIcon(svg: SVGElement): void
