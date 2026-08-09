/* ============================================================
   Vaibhav Lalwani — portfolio motion layer
   CSP-safe: external file, individual .style props only.
   Never uses .style.cssText or setAttribute('style', ...).
   Every module is isolated; one failure never blanks the page.
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = false;
  try {
    reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- Theme toggle (persisted) ---------- */
  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem("vl-theme"); } catch (e) {}
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme");
      if (cur !== "light" && cur !== "dark") {
        var prefersDark = false;
        try { prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) {}
        cur = prefersDark ? "dark" : "light";
      }
      var next = cur === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("vl-theme", next); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent("vl:themechange")); } catch (e) {}
    });
  }

  /* ---------- Year fill ---------- */
  function initYear() {
    var y = String(new Date().getFullYear());
    $all("#year, #year-2").forEach(function (el) { el.textContent = y; });
  }

  /* ---------- Scroll progress bar ---------- */
  function initProgress() {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;
    var raf = 0;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + clamp(p, 0, 1).toFixed(4) + ")";
      raf = 0;
    }
    window.addEventListener("scroll", function () {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener("resize", function () {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ---------- Back to top ---------- */
  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    var raf = 0;
    function update() {
      if (window.scrollY > window.innerHeight * 0.9) btn.classList.add("show");
      else btn.classList.remove("show");
      raf = 0;
    }
    window.addEventListener("scroll", function () {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    btn.addEventListener("click", function () {
      try { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
      catch (e) { window.scrollTo(0, 0); }
    });
    update();
  }

  /* ---------- Reveal on scroll (hardened) ---------- */
  function revealAll(items) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }
  function initReveals() {
    var items = $all(".reveal, .reveal-line");
    if (!items.length) return;
    if (reduce || !("IntersectionObserver" in window)) { revealAll(items); return; }
    // stagger index among reveal siblings
    items.forEach(function (el) {
      var i = 0, p = el.previousElementSibling;
      while (p) {
        if (p.classList && (p.classList.contains("reveal") || p.classList.contains("reveal-line"))) i++;
        p = p.previousElementSibling;
      }
      el.style.setProperty("--i", String(Math.min(i, 6)));
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Scrollspy (nav active) ---------- */
  function initSpy() {
    var links = $all('.nav a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = id ? document.getElementById(id) : null;
      if (sec) map.push({ sec: sec, link: a });
    });
    if (!map.length) return;
    function activate(link) {
      links.forEach(function (l) { l.classList.remove("is-active"); });
      if (link) link.classList.add("is-active");
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        for (var i = 0; i < map.length; i++) {
          if (map[i].sec === e.target) { activate(map[i].link); break; }
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    map.forEach(function (m) { io.observe(m.sec); });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (reduce) return;
    var hoverable = false;
    try { hoverable = window.matchMedia("(hover: hover)").matches; } catch (e) {}
    if (!hoverable) return;
    $all(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (ev) {
        var r = btn.getBoundingClientRect();
        var mx = ev.clientX - (r.left + r.width / 2);
        var my = ev.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (mx * 0.18).toFixed(1) + "px," + (my * 0.3).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- Halftone hero canvas (scroll-scrub) ---------- */
  function initHalftone() {
    var canvas = document.getElementById("figurine-canvas");
    var src = document.getElementById("figurine-src");
    if (!canvas || !src || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var off = document.createElement("canvas");
    var octx = off.getContext("2d", { willReadFrequently: true }) || off.getContext("2d");
    if (!octx) return;

    var W = canvas.width, H = canvas.height;
    var hero = document.querySelector(".hero");
    var inkColor = "#16150f", accentColor = "#d92e20";
    var ready = false, raf = 0, lastP = -1;

    function readColors() {
      try {
        var cs = getComputedStyle(root);
        var ink = (cs.getPropertyValue("--ink") || "").trim();
        var acc = (cs.getPropertyValue("--accent") || "").trim();
        if (ink) inkColor = ink;
        if (acc) accentColor = acc;
      } catch (e) {}
    }

    function progress() {
      if (!hero) return 0;
      var h = hero.offsetHeight || window.innerHeight || 1;
      return clamp(window.scrollY / (h * 0.82), 0, 1);
    }

    function draw(p) {
      var cell = lerp(16, 6.5, p); // coarse -> fine as you scroll in
      var gw = Math.max(2, Math.round(W / cell));
      var gh = Math.max(2, Math.round(H / cell));
      off.width = gw; off.height = gh;

      var ir = (src.naturalWidth && src.naturalHeight) ? src.naturalWidth / src.naturalHeight : 1;
      var cr = gw / gh, dw, dh, dx, dy;
      if (ir > cr) { dh = gh; dw = gh * ir; dx = (gw - dw) / 2; dy = 0; }
      else { dw = gw; dh = gw / ir; dx = 0; dy = (gh - dh) / 2; }

      octx.clearRect(0, 0, gw, gh);
      try { octx.drawImage(src, dx, dy, dw, dh); } catch (e) { return; }

      var data;
      try { data = octx.getImageData(0, 0, gw, gh).data; } catch (e) { return; }

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = inkColor;
      var cw = W / gw, ch = H / gh;
      var maxR = Math.min(cw, ch) * 0.62;
      for (var y = 0; y < gh; y++) {
        for (var x = 0; x < gw; x++) {
          var i = (y * gw + x) * 4;
          if (data[i + 3] < 8) continue;
          var lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
          var r = (1 - lum) * maxR;
          if (r < 0.35) continue;
          ctx.beginPath();
          ctx.arc((x + 0.5) * cw, (y + 0.5) * ch, r, 0, 6.2831853);
          ctx.fill();
        }
      }
      // accent scan sweep, fades as it resolves
      var alpha = 0.45 * (1 - p);
      if (alpha > 0.02) {
        ctx.fillStyle = accentColor;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, p * H - 1, W, 2);
        ctx.globalAlpha = 1;
      }
      lastP = p;
    }

    function onScroll() {
      if (reduce) return;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        var p = progress();
        if (Math.abs(p - lastP) > 0.006) draw(p);
        raf = 0;
      });
    }

    function start() {
      ready = true;
      readColors();
      if (reduce) { draw(0.55); return; }
      draw(progress());
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", function () {
        if (!raf) raf = requestAnimationFrame(function () { draw(progress()); raf = 0; });
      }, { passive: true });
    }

    window.addEventListener("vl:themechange", function () {
      if (!ready) return;
      readColors();
      draw(lastP < 0 ? (reduce ? 0.55 : progress()) : lastP);
    });

    if (src.complete && src.naturalWidth) start();
    else {
      src.addEventListener("load", start, { once: true });
      src.addEventListener("error", function () { /* leave canvas blank; layout holds */ }, { once: true });
    }
  }

  /* ---------- Boot ---------- */
  function boot() {
    try { initTheme(); } catch (e) {}
    try { initYear(); } catch (e) {}
    try { initProgress(); } catch (e) {}
    try { initBackToTop(); } catch (e) {}
    try { initReveals(); } catch (e) { revealAll($all(".reveal, .reveal-line")); }
    try { initSpy(); } catch (e) {}
    try { initMagnetic(); } catch (e) {}
    try { initHalftone(); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
