# Vellum

A small, framework-agnostic UI library (CSS + vanilla JS) that reproduces the look, feel and motion of the
Material Design "paper" elements (Polymer, 2014–2016) without Polymer: 2px paper corners, real elevation, ink ripples,
and the original component timings.

- **No runtime dependency.** Plain CSS and ES modules, about 7 kB gzip for each file.
- **Themeable.** Every color, shadow included, derives from about 30 CSS variables per theme. The package ships
  light and dark themes; `golden-goose` is an example of a custom theme.
- **Native elements first.** Checkboxes, radios, switches, sliders and selects are real `<input>`/`<select>` elements.
  Dialogs are `<dialog>`. Forms, labels, keyboard input and screen readers work without JS. JS adds the ripple and
  a few behaviors: tabs, listbox, counters and validation, toast.
- **Motion on the compositor.** Transitions animate `transform`, `opacity` and `box-shadow` only. `prefers-reduced-motion`
  shortens every duration to 1 ms, and the ripple becomes a short flash.

The demo in `demo/` replicates the Polymer "Golden Goose" showcase element by element. `dist/vellum-demo.html` is the
same page as a single self-contained file.

## Install

The package is not published to a registry. Vendor it or install it from git:

```sh
npm install git+ssh://git@gitlab.com/claude177/vellum.git#v0.1.0
```

```js
import '@claude177/vellum/vellum.css'          // tokens + light + dark themes + all components
import '@claude177/vellum/fonts.css'           // optional: local Roboto (else falls back to Noto Sans / system-ui)
import '@claude177/vellum/themes/golden-goose.css' // optional extra theme
import { init, observe, toast, openDialog } from '@claude177/vellum'

init(document)             // static page: enhance everything once
// observe(document.body)  // or: also enhance components added later (MutationObserver)
```

Without a bundler, copy `dist/` and use `<link rel="stylesheet" href="vellum.css">` and
`<script type="module">import { init } from './vellum.js'; init(document)</script>`.

Add `class="v-app"` on `<body>` (or on the app root) for the background, text color, font and focus ring.

## Themes

A theme sets base variables only. `src/css/tokens.css` computes everything else from them: elevation shadows,
hover/pressed/selected layers, focus ring, disabled colors, tracks, scrim.

| Selector | Theme |
|---|---|
| (none) | light, or dark when the OS prefers dark |
| `data-theme="light"` | light |
| `data-theme="dark"` | dark |
| `data-theme="<name>"` | any theme file you load |

The attribute works on `<html>` or on any element, so a single panel can use another theme. Derived tokens are declared
again on every `[data-theme]` scope, so its shadows and states follow its own colors.

```js
import { setTheme } from '@claude177/vellum'
setTheme('dark')                   // on <html>
setTheme(null)                     // follow the OS again
setTheme('dark', panelElement)     // scoped
```

### Theme contract

To write a theme, copy `src/css/themes/light.css` under a new selector (`[data-theme="ocean"] { … }`) and change the values.
A test checks that every theme in `src/css/themes/` defines all of them.

| Variable | Role |
|---|---|
| `--v-color-scheme` | `light` or `dark` (native controls, scrollbars) |
| `--v-bg`, `--v-surface`, `--v-surface-raised` | page, cards, menus/raised buttons |
| `--v-text`, `--v-heading`, `--v-text-2` | body text, headings, secondary text |
| `--v-divider` | lines; also the neutral that disabled colors and tracks derive from |
| `--v-primary` / `--v-on-primary` | accent, and text on it |
| `--v-secondary`, `--v-success`, `--v-info`, `--v-warning`, `--v-error` (+ `--v-on-*`) | color variants |
| `--v-toolbar` / `--v-on-toolbar` | app bar and `--primary` tabs |
| `--v-inverse` / `--v-on-inverse` | toast |
| `--v-focus` | keyboard focus ring |
| `--v-shadow-rgb` | shadow color as `r g b` (e.g. `0 0 0`, or a tinted `20 10 40`) |
| `--v-shadow-key-alpha`, `--v-shadow-ambient-alpha`, `--v-shadow-umbra-alpha` | shadow strength (dark themes need more) |
| `--v-scrim-alpha` | dialog backdrop |
| `--v-ripple-alpha` | initial ink opacity (0.25 in paper-ripple) |

Useful derived tokens for your own CSS: `--v-elevation-0` … `--v-elevation-6` (2, 4, 6, 8, 16, 24 dp), `--v-hover`,
`--v-pressed`, `--v-selected`, `--v-focus-ring`, `--v-disabled-fg`, `--v-disabled-bg`, `--v-primary-soft`,
`--v-primary-strong`, and the motion tokens `--v-ease-*` and `--v-dur-*`.

## Components

Each CSS file in `src/css/components/` starts with its markup. Short version:

```html
<!-- buttons: flat by default; --raised; colors --primary --secondary --success --info --warning --error --link -->
<button class="v-button v-button--raised v-button--primary">Save</button>
<button class="v-button" aria-pressed="false" data-v-toggle>Bold</button>
<button class="v-fab" aria-label="Add"><svg class="v-icon" data-v-icon="edit"></svg></button>
<button class="v-icon-button" aria-label="Menu"><svg class="v-icon" data-v-icon="menu"></svg></button>

<!-- text field: placeholder=" " is required (CSS uses :placeholder-shown to float the label) -->
<label class="v-field">
  <input class="v-field__input" placeholder=" " maxlength="40">
  <span class="v-field__label">Name</span>
  <span class="v-field__line"></span>
  <span class="v-field__meta"><span class="v-field__help">Helper</span><span class="v-field__error">Required</span>
    <span class="v-field__counter"></span></span>
</label>
<!-- also: <textarea class="v-field__input"> (autogrow), .v-field--select with <select>, .v-field--no-float,
     data-v-auto-validate (validate while typing), validateField(el) -->

<label class="v-checkbox"><input type="checkbox" class="v-checkbox__input">
  <span class="v-checkbox__box"><span class="v-checkbox__ink"></span></span><span class="v-checkbox__label">Oxygen</span></label>
<label class="v-radio"><input type="radio" name="g" class="v-radio__input">
  <span class="v-radio__ring"><span class="v-radio__ink"></span></span><span class="v-radio__label">Argon</span></label>
<label class="v-switch"><input type="checkbox" role="switch" class="v-switch__input">
  <span class="v-switch__track"><span class="v-switch__thumb"><span class="v-switch__ink"></span></span></span>
  <span class="v-switch__label">Wi-Fi</span></label>

<div class="v-slider v-slider--pin"><input type="range" class="v-slider__input" aria-label="Volume">
  <span class="v-slider__pin"></span></div>

<div class="v-tabs" role="tablist"><button class="v-tab" aria-selected="true">One</button><button class="v-tab">Two</button></div>
<div class="v-menu v-menu--raised" role="listbox"><div class="v-item">Inbox</div><div class="v-item">Starred</div></div>

<header class="v-toolbar v-toolbar--raised"><span class="v-toolbar__title">Title</span></header>
<div class="v-card"><div class="v-card__header">Title</div><div class="v-card__content">…</div>
  <div class="v-card__actions"><button class="v-button">Share</button></div></div>
<span class="v-chip v-chip--primary">Live</span>
<div class="v-notice v-notice--warning">Budget not armed.</div>
<div class="v-table-wrap"><table class="v-table">…</table></div>

<div class="v-progress" style="--v-value:.4"></div>
<div class="v-progress v-progress--indeterminate" role="progressbar" aria-label="Loading"></div>
<span class="v-spinner is-active" aria-label="Loading"></span>

<dialog class="v-dialog" id="d"><h2 class="v-dialog__title">Delete?</h2><div class="v-dialog__content">…</div>
  <div class="v-dialog__buttons"><button class="v-button" data-v-dialog-close>Cancel</button>
    <button class="v-button v-button--primary" data-v-dialog-close="ok">Delete</button></div></dialog>
```

Elevation utilities: `.v-elevation-0` … `.v-elevation-6`, plus `.v-elevation-animated` to animate changes.
Typography classes: `.v-display`, `.v-headline`, `.v-title`, `.v-subhead`, `.v-body2`, `.v-body1`, `.v-caption`.

## JS API

| Function | Does |
|---|---|
| `init(root)` / `observe(root)` | enhance every component under `root`, once, or also later additions |
| `attachButton`, `attachIconButton`, `attachControl`, `attachSlider`, `attachField`, `attachTabs`, `attachMenu`, `attachSpinner` | enhance one element; idempotent; return a detach function (use them in framework `mounted`/`unmounted`) |
| `attachRipple(host, { center, circle, recenters })` | ink ripple on any element |
| `openDialog(dialog, { modal })` / `closeDialog(dialog, value)` | open, and close with the exit animation. Escape and backdrop clicks close it unless `data-v-modal` is set |
| `toast(text, { duration, action: { label, onClick }, capsule })` / `hideToast()` | one reused `role=status` live region, appended to `<body>` |
| `setProgress(el, value, secondary)` | 0–1 values, updates ARIA |
| `validateField(field)` / `refreshSlider(slider)` | re-check after programmatic changes |
| `icon(name)` / `fillIcon(svg)` / `ICONS` | inline Material icon paths (`<svg data-v-icon="name">`) |
| `setTheme(name, el)` | set or clear `data-theme` |

Events: `v-tab-change` (`detail.index`) on `.v-tabs`, `v-select` on `.v-menu`. `list.vSelect(i)` selects a tab
from code.

## Develop

Toolchains run in containers (nothing is installed on the host):

```sh
bin/dev npm install
bin/dev up            # vite dev server on 127.0.0.1:8126 (loopback only); bin/dev down to stop
bin/dev test          # vitest (jsdom)
bin/dev build         # dist/vellum.{css,js}, dist/themes, dist/fonts.css, dist/vellum-demo.html
bin/dev npm run demo:single   # only the single-file demo (+ a page fragment in .cache/artifact/)
bin/e2e motion.mjs    # Playwright: slow-motion frame bursts of each interaction, in e2e/shots/
```

## Credits

The ripple physics, elevation values and component timings come from the Polymer paper elements (BSD). Roboto is
under the SIL OFL. See `NOTICE`. Vellum is BSD-3-Clause.
