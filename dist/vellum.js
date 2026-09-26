//#region src/js/ripple.js
var e = () => performance.now(), t = () => typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
function n(e, t, n) {
	let r = Math.min(Math.sqrt(e * e + t * t), 300) * 1.1 + 5, i = 1.1 - r / 300 * .2;
	return Math.abs(r * (1 - 80 ** (-n / i)));
}
function r(e, t, n) {
	return n ? Math.max(0, e - t * .8) : e;
}
function i(e, t) {
	return Math.max(0, Math.min(e * .3, t));
}
var a = class {
	constructor(t, n, r) {
		this.r = t;
		let i = t.host.getBoundingClientRect();
		this.w = i.width, this.h = i.height, this.size = Math.max(this.w, this.h), this.downAt = e(), this.upAt = 0;
		let a = this.w / 2, o = this.h / 2;
		this.x0 = t.opts.center || n == null ? a : n - i.left, this.y0 = t.opts.center || r == null ? o : r - i.top, this.x1 = t.opts.recenters ? a : null, this.y1 = t.opts.recenters ? o : null, this.maxRadius = Math.max(...[
			[0, 0],
			[this.w, 0],
			[0, this.h],
			[this.w, this.h]
		].map(([e, t]) => Math.hypot(this.x0 - e, this.y0 - t))), this.container = document.createElement("span"), this.container.className = "v-ripple__wave-container", this.el = document.createElement("span"), this.el.className = "v-ripple__wave", this.container.appendChild(this.el), Object.assign(this.container.style, {
			top: (this.h - this.size) / 2 + "px",
			left: (this.w - this.size) / 2 + "px",
			width: this.size + "px",
			height: this.size + "px"
		});
	}
	get downSeconds() {
		return (e() - this.downAt) / 1e3;
	}
	get upSeconds() {
		return this.upAt ? (e() - this.upAt) / 1e3 : 0;
	}
	get radius() {
		return n(this.w, this.h, this.downSeconds);
	}
	get opacity() {
		return r(this.r.initialOpacity, this.upSeconds, !!this.upAt);
	}
	get done() {
		let e = Math.min(this.maxRadius, 300);
		return this.upAt ? this.opacity < .01 && this.radius >= e : !1;
	}
	draw() {
		let e = this.radius, t = Math.min(1, e / this.size * 2 / Math.SQRT2), n = this.x1 == null ? this.x0 : this.x0 + t * (this.x1 - this.x0), r = this.y1 == null ? this.y0 : this.y0 + t * (this.y1 - this.y0), i = e / (this.size / 2);
		this.el.style.opacity = this.opacity, this.container.style.transform = `translate3d(${n - this.w / 2}px, ${r - this.h / 2}px, 0)`, this.el.style.transform = `scale3d(${i}, ${i}, 1)`;
	}
}, o = class {
	constructor(e, t = {}) {
		this.host = e, this.opts = {
			center: !1,
			recenters: !1,
			circle: !1,
			holdDown: !1,
			...t
		}, this.waves = [], this.loop = this.loop.bind(this), this.root = document.createElement("span"), this.root.className = "v-ripple" + (this.opts.circle ? " v-ripple--circle" : ""), this.root.setAttribute("aria-hidden", "true"), this.bg = document.createElement("span"), this.bg.className = "v-ripple__bg", this.wavesEl = document.createElement("span"), this.wavesEl.className = "v-ripple__waves", this.root.append(this.bg, this.wavesEl), e.prepend(this.root), getComputedStyle(e).position === "static" && (e.style.position = "relative");
	}
	get initialOpacity() {
		let e = getComputedStyle(this.host);
		return (parseFloat(e.getPropertyValue("--v-ripple-alpha")) || .25) * (parseFloat(e.getPropertyValue("--v-ripple-alpha-scale")) || 1);
	}
	down(e, n) {
		if (this.opts.holdDown && this.waves.length) return;
		if (t()) {
			this.flash();
			return;
		}
		let r = new a(this, e, n);
		this.wavesEl.appendChild(r.container), this.waves.push(r), this.start();
	}
	up() {
		if (this.opts.holdDown) return;
		let t = e();
		for (let e of this.waves) e.upAt ||= t;
		this.start();
	}
	flash() {
		this.bg.style.transition = "none", this.bg.style.opacity = String(this.initialOpacity * .6), requestAnimationFrame(() => {
			this.bg.style.transition = "opacity 150ms linear", this.bg.style.opacity = "0";
		});
	}
	start() {
		this.running || (this.running = !0, this.root.classList.add("is-animating"), requestAnimationFrame(this.loop));
	}
	loop() {
		let e = 0;
		for (let t of [...this.waves]) t.draw(), e = Math.max(e, i(t.upSeconds, t.opacity)), t.done && (t.container.remove(), this.waves.splice(this.waves.indexOf(t), 1));
		this.bg.style.opacity = String(e);
		let t = this.waves.length > 0 && this.waves.every((e) => !e.upAt && e.radius >= Math.min(e.maxRadius, 300));
		if (this.waves.length && !t) {
			requestAnimationFrame(this.loop);
			return;
		}
		this.running = !1, this.waves.length || (this.bg.style.opacity = "0", this.root.classList.remove("is-animating"));
	}
	set holdDown(e) {
		this.opts.holdDown = !1, e ? (this.down(null, null), this.opts.holdDown = !0) : this.up();
	}
	destroy() {
		this.root.remove(), this.waves = [];
	}
}, s = /* @__PURE__ */ new WeakMap();
function c(e, t = {}, n = e) {
	if (s.has(e)) return s.get(e).detach;
	let r = new o(e, t), i = () => n.disabled || n.getAttribute("aria-disabled") === "true" || e.hasAttribute("data-v-noink"), a = (e) => {
		e.button === 0 && !i() && (r.down(e.clientX, e.clientY), n.classList.add("is-pressed"));
	}, c = () => {
		r.up(), n.classList.remove("is-pressed");
	}, l = (e) => {
		i() || e.repeat || (e.key === "Enter" ? (r.down(null, null), setTimeout(() => r.up(), 1)) : e.key === " " && (r.down(null, null), n.classList.add("is-pressed")));
	}, u = (e) => {
		e.key === " " && c();
	};
	n.addEventListener("pointerdown", a);
	for (let e of [
		"pointerup",
		"pointerleave",
		"pointercancel",
		"blur"
	]) n.addEventListener(e, c);
	n.addEventListener("keydown", l), n.addEventListener("keyup", u);
	let d = () => {
		n.removeEventListener("pointerdown", a);
		for (let e of [
			"pointerup",
			"pointerleave",
			"pointercancel",
			"blur"
		]) n.removeEventListener(e, c);
		n.removeEventListener("keydown", l), n.removeEventListener("keyup", u), r.destroy(), s.delete(e);
	};
	return s.set(e, {
		ripple: r,
		detach: d
	}), d;
}
function l(e) {
	return s.get(e)?.ripple ?? null;
}
//#endregion
//#region src/js/components.js
var u = /* @__PURE__ */ new WeakMap();
function d(e, t, n) {
	let r = u.get(e);
	if (r || u.set(e, r = /* @__PURE__ */ new Map()), r.has(t)) return r.get(t);
	let i = n() || (() => {}), a = () => {
		r.delete(t), i();
	};
	return r.set(t, a), a;
}
var f = (e, t, n, r) => (e.addEventListener(t, n, r), () => e.removeEventListener(t, n, r)), p = (...e) => () => e.forEach((e) => e && e());
function m(e) {
	return d(e, "button", () => p(e.hasAttribute("data-v-noink") ? null : c(e, { recenters: e.classList.contains("v-fab") }), e.hasAttribute("aria-pressed") && e.hasAttribute("data-v-toggle") ? f(e, "click", () => e.setAttribute("aria-pressed", String(e.getAttribute("aria-pressed") !== "true"))) : null));
}
function h(e) {
	return d(e, "icon-button", () => c(e, {
		center: !0,
		circle: !0
	}));
}
function g(e) {
	return d(e, "control", () => {
		let t = e.querySelector("input"), n = e.querySelector(".v-checkbox__ink, .v-radio__ink, .v-switch__ink");
		if (!t || !n) return null;
		let r = c(n, {
			center: !0,
			circle: !0
		}, document.createElement("span")), i = l(n), a = (e) => {
			!t.disabled && (e.button === void 0 || e.button === 0) && i.down(null, null);
		}, o = () => i.up();
		return p(r, f(e, "pointerdown", a), f(e, "pointerup", o), f(e, "pointerleave", o), f(t, "keydown", (e) => {
			e.key === " " && !e.repeat && !t.disabled && i.down(null, null);
		}), f(t, "keyup", (e) => {
			e.key === " " && i.up();
		}));
	});
}
function _(e) {
	return d(e, "slider", () => {
		let t = e.querySelector(".v-slider__input");
		if (!t) return null;
		let n = e.querySelector(".v-slider__pin"), r = e.querySelector(".v-slider__value input");
		n && !n.firstElementChild && n.appendChild(document.createElement("span"));
		let i = () => {
			let i = +t.min || 0, a = t.max === "" ? 100 : +t.max, o = +t.value, s = a > i ? (o - i) / (a - i) : 0;
			e.style.setProperty("--v-pct", (s * 100).toFixed(3) + "%");
			let c = e.dataset.secondary;
			c != null && e.style.setProperty("--v-pct2", ((Math.max(+c, o) - i) / (a - i) * 100).toFixed(3) + "%");
			let l = t.getBoundingClientRect().width, u = t.offsetLeft + 6 + s * Math.max(0, l - 12);
			e.style.setProperty("--v-pin-x", u + "px"), e.classList.toggle("is-min", o <= i), n && (n.firstElementChild.textContent = t.value), r && document.activeElement !== r && (r.value = t.value);
		}, a = () => {
			r.value === "" || Number.isNaN(+r.value) || (t.value = r.value, i(), t.dispatchEvent(new Event("input", { bubbles: !0 })));
		};
		i();
		let o = typeof ResizeObserver == "function" ? new ResizeObserver(i) : null;
		return o?.observe(t), p(f(t, "input", i), f(t, "change", i), r && f(r, "change", a), () => o?.disconnect());
	});
}
function v(e) {
	e.querySelector(".v-slider__input")?.dispatchEvent(new Event("input"));
}
function y(e) {
	return d(e, "field", () => {
		let t = e.querySelector(".v-field__input");
		if (!t) return null;
		let n = e.querySelector(".v-field__counter"), r = e.hasAttribute("data-v-auto-validate"), i = () => {
			n && (n.textContent = t.maxLength > 0 ? `${t.value.length}/${t.maxLength}` : String(t.value.length)), t.tagName === "TEXTAREA" && (t.style.height = "auto", t.style.height = t.scrollHeight + "px"), r && b(e);
		};
		return i(), p(f(t, "input", i));
	});
}
function b(e) {
	let t = e.querySelector(".v-field__input"), n = t.checkValidity();
	e.classList.toggle("is-invalid", !n), t.setAttribute("aria-invalid", String(!n));
	let r = e.querySelector(".v-field__error");
	return r && !n && !r.dataset.static && (r.textContent = t.validationMessage), n;
}
function x(e) {
	return d(e, "tabs", () => {
		let t = e.classList.contains("v-tabs--nav"), n = () => [...e.querySelectorAll(":scope > .v-tab")], r = e.querySelector(":scope > .v-tabs__bar");
		r || (r = document.createElement("span"), r.className = "v-tabs__bar", r.setAttribute("aria-hidden", "true"), e.appendChild(r));
		let i = e.classList.contains("v-tabs--no-ink") ? [] : n().map((e) => c(e, {})), a = t ? n().find((e) => e.classList.contains("is-selected") || e.getAttribute("aria-current") === "page") || null : n().find((e) => e.getAttribute("aria-selected") === "true") || n()[0], o = (t) => {
			let n = e.scrollWidth || 1;
			return {
				left: t.offsetLeft / n * 100,
				width: t.offsetWidth / n * 100
			};
		}, s = (e, t) => {
			r.style.transform = `translateX(${t}%) scaleX(${e / 100})`;
		}, l = () => {
			if (r.classList.remove("expand", "contract"), a) {
				let e = o(a);
				s(e.width, e.left);
			} else s(0, 0);
		}, u = (e) => {
			for (let r of n()) t ? r.classList.toggle("is-selected", r === e) : (r.setAttribute("aria-selected", String(r === e)), r.tabIndex = r === e ? 0 : -1);
		}, d = (t, i = !1) => {
			if (t && (t.disabled || t.getAttribute("aria-disabled") === "true") || t === a) return;
			let c = a;
			if (u(t), a = t, i && t && t.focus(), e.dispatchEvent(new CustomEvent("v-tab-change", {
				detail: {
					index: t ? n().indexOf(t) : -1,
					tab: t
				},
				bubbles: !0
			})), !t) {
				if (c) {
					let e = o(c);
					r.classList.remove("expand"), r.classList.add("contract"), s(0, e.left + e.width / 2);
				}
				return;
			}
			if (e.classList.contains("v-tabs--no-slide") || !c) {
				l();
				return;
			}
			let d = e.scrollWidth || 1, f = c.getBoundingClientRect(), p = t.getBoundingClientRect(), m = e.getBoundingClientRect();
			r.classList.remove("contract"), r.classList.add("expand"), n().indexOf(c) < n().indexOf(t) ? s((p.right - f.left) / d * 100 - 5, (f.left - m.left + e.scrollLeft) / d * 100) : s((f.right - p.left) / d * 100 - 5, (p.left - m.left + e.scrollLeft) / d * 100 + 5);
		}, m = (e) => {
			if (e.target === r) {
				if (r.classList.contains("expand") && a) {
					r.classList.replace("expand", "contract");
					let e = o(a);
					s(e.width, e.left);
				} else r.classList.remove("expand", "contract");
			}
		}, h = (n) => {
			let r = n.target.closest(".v-tab");
			r && r.parentElement === e && (t && (n.button > 0 || n.metaKey || n.ctrlKey || n.shiftKey || n.altKey) || d(r));
		}, g = (e) => {
			let t = n().filter((e) => !e.disabled), r = t.indexOf(document.activeElement);
			if (r < 0) return;
			let i = {
				ArrowRight: t[(r + 1) % t.length],
				ArrowLeft: t[(r - 1 + t.length) % t.length],
				Home: t[0],
				End: t.at(-1)
			}[e.key];
			i && (e.preventDefault(), d(i, !0));
		};
		if (t) u(a);
		else {
			for (let e of n()) e.setAttribute("role", "tab"), e.tabIndex = e === a ? 0 : -1, e.setAttribute("aria-selected", String(e === a));
			e.setAttribute("role", "tablist");
		}
		l();
		let _ = typeof ResizeObserver == "function" ? new ResizeObserver(l) : null;
		return _?.observe(e), e.vSelect = (e) => d(e >= 0 ? n()[e] ?? null : null), p(f(e, "click", h), t ? null : f(e, "keydown", g), f(r, "transitionend", m), () => _?.disconnect(), ...i);
	});
}
function S(e) {
	return d(e, "menu", () => {
		let t = e.getAttribute("aria-multiselectable") === "true", n = () => [...e.querySelectorAll(".v-item:not([aria-disabled=\"true\"])")];
		for (let t of e.querySelectorAll(".v-item")) t.hasAttribute("role") || t.setAttribute("role", "option"), t.hasAttribute("aria-selected") || t.setAttribute("aria-selected", "false");
		let r = n().find((e) => e.getAttribute("aria-selected") === "true") || n()[0];
		for (let e of n()) e.tabIndex = e === r ? 0 : -1;
		let i = (n) => {
			if (t) n.setAttribute("aria-selected", String(n.getAttribute("aria-selected") !== "true"));
			else for (let t of e.querySelectorAll(".v-item")) t.setAttribute("aria-selected", String(t === n));
			e.dispatchEvent(new CustomEvent("v-select", {
				detail: {
					item: n,
					selected: [...e.querySelectorAll("[aria-selected=\"true\"]")]
				},
				bubbles: !0
			}));
		}, a = (e) => {
			for (let t of n()) t.tabIndex = t === e ? 0 : -1;
			e.focus();
		};
		return p(f(e, "click", (t) => {
			let n = t.target.closest(".v-item");
			n && e.contains(n) && n.getAttribute("aria-disabled") !== "true" && (i(n), a(n));
		}), f(e, "keydown", (e) => {
			let t = n(), r = t.indexOf(document.activeElement), o = {
				ArrowDown: t[Math.min(t.length - 1, r + 1)],
				ArrowUp: t[Math.max(0, r - 1)],
				Home: t[0],
				End: t.at(-1)
			};
			if (o[e.key]) {
				e.preventDefault(), a(o[e.key]);
				return;
			}
			if ((e.key === "Enter" || e.key === " ") && r >= 0) {
				e.preventDefault(), i(t[r]);
				return;
			}
			if (e.key.length === 1 && /\S/.test(e.key)) {
				let n = t.slice(r + 1).concat(t.slice(0, r + 1)).find((t) => t.textContent.trim().toLowerCase().startsWith(e.key.toLowerCase()));
				n && a(n);
			}
		}));
	});
}
function C(e, { modal: t = !0 } = {}) {
	e.classList.remove("is-closing"), e.open || (t ? e.showModal() : e.show()), d(e, "dialog", () => p(f(e, "cancel", (t) => {
		t.preventDefault(), e.hasAttribute("data-v-modal") || w(e);
	}), f(e, "click", (t) => {
		if (t.target.closest("[data-v-dialog-close]")) {
			w(e, t.target.closest("[data-v-dialog-close]").getAttribute("data-v-dialog-close") || "");
			return;
		}
		if (t.target === e && !e.hasAttribute("data-v-modal")) {
			let n = e.getBoundingClientRect();
			(t.clientX < n.left || t.clientX > n.right || t.clientY < n.top || t.clientY > n.bottom) && w(e);
		}
	}))), e.querySelector("[autofocus], .v-dialog__buttons .v-button:last-child")?.focus();
}
function w(e, t = "") {
	if (!e.open || e.classList.contains("is-closing")) return;
	let n = typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches, r = () => {
		e.classList.remove("is-closing"), e.close(t);
	};
	if (n || typeof e.getAnimations != "function") {
		r();
		return;
	}
	e.classList.add("is-closing");
	let i = e.getAnimations();
	if (!i.length) {
		r();
		return;
	}
	Promise.all(i.map((e) => e.finished.catch(() => {}))).then(r);
}
var T = null, E = 0;
function D(e, { duration: t = 3e3, action: n = null, capsule: r = !1 } = {}) {
	T || (T = document.createElement("div"), T.className = "v-toast", T.setAttribute("role", "status"), T.setAttribute("aria-live", "polite"), document.body.appendChild(T)), clearTimeout(E), T.classList.toggle("v-toast--capsule", r), T.replaceChildren();
	let i = document.createElement("span");
	if (i.className = "v-toast__text", i.textContent = e, T.appendChild(i), n) {
		let e = document.createElement("button");
		e.className = "v-button v-toast__action", e.textContent = n.label, e.addEventListener("click", () => {
			n.onClick?.(), O();
		}), T.appendChild(e), m(e);
	}
	return requestAnimationFrame(() => T.classList.add("is-open")), t > 0 && t !== Infinity && (E = setTimeout(O, t)), { hide: O };
}
function O() {
	clearTimeout(E), T?.classList.remove("is-open");
}
function k(e, t, n) {
	let r = (e) => Math.max(0, Math.min(1, e));
	e.classList.add("is-transiting"), e.style.setProperty("--v-value", String(r(t))), n != null && e.style.setProperty("--v-secondary-value", String(r(n))), e.setAttribute("role", "progressbar"), e.setAttribute("aria-valuemin", "0"), e.setAttribute("aria-valuemax", "100"), e.setAttribute("aria-valuenow", String(Math.round(r(t) * 100)));
}
function A(e) {
	return d(e, "spinner", () => (e.querySelector("svg") || (e.innerHTML = "<svg viewBox=\"0 0 28 28\" aria-hidden=\"true\"><circle cx=\"14\" cy=\"14\" r=\"11\"/></svg>"), e.hasAttribute("role") || e.setAttribute("role", "progressbar"), null));
}
//#endregion
//#region src/js/icons.js
var j = {
	menu: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
	favorite: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
	arrow_back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
	arrow_forward: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z",
	close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
	check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
	edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
	reply: "M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z",
	download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
	more_vert: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
	search: "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
	mic: "M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z",
	play: "M8 5v14l11-7z",
	stop: "M6 6h12v12H6z",
	code: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z",
	settings: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z",
	info: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
};
function M(e, t = "v-icon") {
	let n = j[e];
	return n ? `<svg class="${t}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${n}"/></svg>` : "";
}
function N(e) {
	let t = j[e.getAttribute("data-v-icon")];
	t && !e.firstChild && (e.setAttribute("viewBox", "0 0 24 24"), e.setAttribute("aria-hidden", "true"), e.setAttribute("focusable", "false"), e.innerHTML = `<path d="${t}"/>`);
}
//#endregion
//#region src/index.js
var P = [
	[".v-button:not(.v-toast__action)", m],
	[".v-fab", m],
	[".v-icon-button", h],
	[".v-checkbox, .v-radio, .v-switch", g],
	[".v-slider", _],
	[".v-field", y],
	[".v-tabs", x],
	[".v-menu[role=\"listbox\"]", S],
	[".v-spinner", A],
	["svg[data-v-icon]", N]
];
function F(e = document) {
	for (let [t, n] of P) e.matches?.(t) && n(e), e.querySelectorAll(t).forEach((e) => n(e));
}
function I(e = document.body) {
	F(e);
	let t = new MutationObserver((e) => {
		for (let t of e) for (let e of t.addedNodes) e.nodeType === 1 && F(e);
	});
	return t.observe(e, {
		childList: !0,
		subtree: !0
	}), () => t.disconnect();
}
function L(e, t = document.documentElement) {
	e ? t.setAttribute("data-theme", e) : t.removeAttribute("data-theme");
}
//#endregion
export { j as ICONS, o as Ripple, m as attachButton, g as attachControl, y as attachField, h as attachIconButton, S as attachMenu, c as attachRipple, _ as attachSlider, A as attachSpinner, x as attachTabs, w as closeDialog, N as fillIcon, O as hideToast, M as icon, F as init, I as observe, C as openDialog, i as outerOpacity, v as refreshSlider, l as rippleOf, k as setProgress, L as setTheme, D as toast, b as validateField, r as waveOpacity, n as waveRadius };
