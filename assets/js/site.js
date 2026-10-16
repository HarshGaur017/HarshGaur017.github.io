/* ============================================================
   Harsh Gaur — portfolio behaviour
   theme · magnetic dot grid · cursor glow · card spotlight
   scroll progress · counters · reveal
   No dependencies.
   ============================================================ */

(function () {
	"use strict";

	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer  = window.matchMedia("(pointer: fine)").matches;

	/* ---------------- footer year ---------------- */
	var yearEl = document.getElementById("year");
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	/* ---------------- theme ---------------- */
	// The initial theme is applied by an inline script in <head> so there is no
	// flash; this only handles the toggle and keeps dependents in sync.
	var themeBtn   = document.getElementById("theme-toggle");
	var themeMeta  = document.querySelector('meta[name="theme-color"]');

	function currentTheme() {
		return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
	}

	function applyTheme(theme) {
		var root = document.documentElement;
		if (theme === "light") root.setAttribute("data-theme", "light");
		else root.removeAttribute("data-theme");

		try { localStorage.setItem("theme", theme); } catch (e) { /* private mode */ }

		if (themeMeta) themeMeta.setAttribute("content", theme === "light" ? "#FCFCFD" : "#0A0E14");
		if (themeBtn)  themeBtn.setAttribute("aria-label", "Switch to " + (theme === "light" ? "dark" : "light") + " theme");
		refreshFieldColour();
	}

	if (themeBtn) {
		themeBtn.addEventListener("click", function () {
			applyTheme(currentTheme() === "light" ? "dark" : "light");
		});
		themeBtn.setAttribute("aria-label", "Switch to " + (currentTheme() === "light" ? "dark" : "light") + " theme");
	}

	/* ---------------- scroll progress + nav border ---------------- */
	var progress = document.getElementById("progress");
	var nav      = document.getElementById("nav");
	var scrollRaf = null;

	function onScroll() {
		if (scrollRaf) return;
		scrollRaf = requestAnimationFrame(function () {
			var h = document.documentElement.scrollHeight - window.innerHeight;
			var y = window.scrollY;
			if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
			if (nav) nav.classList.toggle("scrolled", y > 8);
			scrollRaf = null;
		});
	}
	window.addEventListener("scroll", onScroll, { passive: true });
	onScroll();

	/* ---------------- ambient cursor glow ---------------- */
	var glow = document.getElementById("cursor-glow");
	if (glow && finePointer) {
		var glowRaf = null, gx = 0, gy = 0;
		window.addEventListener("mousemove", function (e) {
			gx = e.clientX; gy = e.clientY;
			if (glowRaf) return;
			glowRaf = requestAnimationFrame(function () {
				// translate from the element's own centre (it is -50%/-50% in CSS)
				glow.style.transform = "translate(" + gx + "px," + gy + "px) translate(-50%,-50%)";
				glow.style.opacity = "1";
				glowRaf = null;
			});
		}, { passive: true });
		document.addEventListener("mouseleave", function () { glow.style.opacity = "0"; });
	} else if (glow) {
		glow.remove();
	}

	/* ---------------- per-card spotlight ----------------
	   One delegated pointermove for every card on the page. Each card's
	   ::before reads --mx/--my, so the gradient tracks the cursor *inside*
	   the card rather than one shared glow for the whole document.
	   Writes are coalesced into a single frame.
	------------------------------------------------------- */
	if (finePointer) {
		var pending = null, pendingRaf = null;

		document.addEventListener("pointermove", function (e) {
			var card = e.target.closest(".card");
			if (!card) return;
			pending = { card: card, x: e.clientX, y: e.clientY };
			if (pendingRaf) return;
			pendingRaf = requestAnimationFrame(function () {
				if (pending) {
					var r = pending.card.getBoundingClientRect();
					pending.card.style.setProperty("--mx", (pending.x - r.left) + "px");
					pending.card.style.setProperty("--my", (pending.y - r.top) + "px");
				}
				pendingRaf = null;
			});
		}, { passive: true });
	}

	/* ---------------- magnetic dot grid ----------------
	   A regular lattice of dots. Each one is pushed away from the cursor and
	   scales up as it gets closer, then eases back to its lattice position.
	   Unlike a scattered particle field this has no O(n^2) link pass, so it
	   stays cheap even with a dense grid.
	------------------------------------------------------- */
	var canvas = document.getElementById("field");
	var hero   = document.getElementById("hero");

	// Read from live computed styles so the grid re-tints with the theme
	// instead of hard-coding either palette.
	var fieldColour = { line: "226, 112, 94" };

	function refreshFieldColour() {
		var cs = getComputedStyle(document.documentElement);
		var line = (cs.getPropertyValue("--accent-line") || "").trim();
		if (line) fieldColour.line = line;
	}
	refreshFieldColour();

	var wantsField = canvas && hero && !reduceMotion && finePointer && window.innerWidth >= 900;

	if (canvas && !wantsField) canvas.remove();

	if (wantsField) {
		var ctx = canvas.getContext("2d", { alpha: true });
		var dpr = Math.min(window.devicePixelRatio || 1, 2);
		var dots = [], W = 0, H = 0, raf = null, visible = true;
		var mouse = { x: -9999, y: -9999 };

		var SPACING  = 30;    // lattice pitch
		var REACH    = 128;   // cursor influence radius
		var REACH_SQ = REACH * REACH;
		var PUSH     = 26;    // peak displacement away from the cursor
		var EASE     = 0.12;  // how fast a dot returns to its lattice point

		hero.addEventListener("mousemove", function (e) {
			var r = hero.getBoundingClientRect();
			mouse.x = e.clientX - r.left;
			mouse.y = e.clientY - r.top;
		}, { passive: true });
		hero.addEventListener("mouseleave", function () { mouse.x = mouse.y = -9999; });

		function resize() {
			W = hero.offsetWidth;
			H = hero.offsetHeight;
			canvas.width  = W * dpr;
			canvas.height = H * dpr;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

			dots = [];
			var cols = Math.ceil(W / SPACING);
			var rows = Math.ceil(H / SPACING);
			// centre the lattice so it never looks cropped on one side
			var ox = (W - (cols - 1) * SPACING) / 2;
			var oy = (H - (rows - 1) * SPACING) / 2;

			for (var r = 0; r < rows; r++) {
				for (var c = 0; c < cols; c++) {
					var hx = ox + c * SPACING;
					var hy = oy + r * SPACING;
					dots.push({ hx: hx, hy: hy, x: hx, y: hy, s: 1 });
				}
			}
		}

		function step() {
			ctx.clearRect(0, 0, W, H);

			for (var i = 0; i < dots.length; i++) {
				var d  = dots[i];
				var dx = d.hx - mouse.x;
				var dy = d.hy - mouse.y;
				var d2 = dx * dx + dy * dy;

				var tx = d.hx, ty = d.hy, ts = 1, near = 0;

				if (d2 < REACH_SQ) {
					var dist = Math.sqrt(d2) || 0.0001;
					near = 1 - dist / REACH;          // 1 at the cursor, 0 at the edge
					var f = near * near;               // fall off sharply, not linearly
					tx = d.hx + (dx / dist) * PUSH * f;
					ty = d.hy + (dy / dist) * PUSH * f;
					ts = 1 + f * 1.9;
				}

				// critically-damped-ish ease toward the target
				d.x += (tx - d.x) * EASE;
				d.y += (ty - d.y) * EASE;
				d.s += (ts - d.s) * EASE;

				var alpha = 0.30 + near * 0.58;
				ctx.fillStyle = "rgba(" + fieldColour.line + "," + alpha + ")";
				ctx.beginPath();
				ctx.arc(d.x, d.y, 1.35 * d.s, 0, Math.PI * 2);
				ctx.fill();
			}

			raf = requestAnimationFrame(step);
		}

		function start() { if (raf === null && visible && !document.hidden) raf = requestAnimationFrame(step); }
		function stop()  { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

		resize();
		start();

		var resizeTimer;
		window.addEventListener("resize", function () {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function () {
				if (window.innerWidth < 900) { stop(); canvas.remove(); return; }
				resize();
			}, 180);
		}, { passive: true });

		// Stop burning frames when the hero scrolls away or the tab is hidden.
		if ("IntersectionObserver" in window) {
			new IntersectionObserver(function (entries) {
				visible = entries[0].isIntersecting;
				if (visible) start(); else stop();
			}, { threshold: 0 }).observe(hero);
		}
		document.addEventListener("visibilitychange", function () {
			if (document.hidden) stop(); else start();
		});
	}

	/* ---------------- stat counters ---------------- */
	var counters = document.querySelectorAll("[data-count]");

	function runCounter(el) {
		var target = parseFloat(el.dataset.count);
		var suffix = el.dataset.suffix || "";
		var dur    = 1100;
		var t0     = performance.now();

		function frame(now) {
			var t = Math.min((now - t0) / dur, 1);
			// easeOutExpo: fast start, settles on the number
			var e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
			el.textContent = Math.round(target * e).toLocaleString("en-US") + suffix;
			if (t < 1) requestAnimationFrame(frame);
		}
		requestAnimationFrame(frame);
	}

	if (counters.length) {
		if (reduceMotion || !("IntersectionObserver" in window)) {
			counters.forEach(function (el) {
				el.textContent = parseFloat(el.dataset.count).toLocaleString("en-US") + (el.dataset.suffix || "");
			});
		} else {
			var cObs = new IntersectionObserver(function (entries) {
				entries.forEach(function (en) {
					if (!en.isIntersecting) return;
					runCounter(en.target);
					cObs.unobserve(en.target);
				});
			}, { threshold: 0.6 });
			counters.forEach(function (el) { cObs.observe(el); });
		}
	}

	/* ---------------- scroll reveal ---------------- */
	var reveals = document.querySelectorAll(".reveal");
	if (reveals.length) {
		if (reduceMotion || !("IntersectionObserver" in window)) {
			reveals.forEach(function (el) { el.classList.add("in"); });
		} else {
			var rObs = new IntersectionObserver(function (entries) {
				entries.forEach(function (en) {
					if (!en.isIntersecting) return;
					en.target.classList.add("in");
					rObs.unobserve(en.target);
				});
			}, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
			reveals.forEach(function (el) { rObs.observe(el); });
		}
	}
})();
