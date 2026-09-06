/* Motion layer: the Gargantua dot canvas in the hero, the interlude swell, split
   titles, magnetic controls, tilt, counters, cursor glow. 2D canvas only, no
   library, no inline script: everything here is CSP-safe under script-src 'self'. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (error) {}
  var finePointer = true;
  try { finePointer = window.matchMedia("(pointer: fine)").matches; } catch (error) {}

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  /* ---- Gargantua: the hero stage becomes a black hole ---------------------- */
  function initGargantua() {
    var canvas = document.getElementById("gargantua-canvas");
    var stage = document.getElementById("hero-stage");
    if (!canvas || !stage) return;
    import("/fx/gargantua.js").then(function (mod) {
      var scene = mod.mountGargantua(canvas, { reducedMotion: reduceMotion, accent: "#ff6a1a" });
      root.setAttribute("data-gargantua", "1");
      stage.classList.add("has-gargantua");
      if (reduceMotion) return;
      var rect = null;
      function measure() { rect = stage.getBoundingClientRect(); }
      measure();
      window.addEventListener("resize", measure, { passive: true });
      if (finePointer) {
        window.addEventListener("pointermove", function (event) {
          if (!rect) measure();
          var nx = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1.4, 1.4);
          var ny = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1.4, 1.4);
          scene.setPointer(nx, ny);
        }, { passive: true });
      }
      var frame = 0;
      function onScroll() {
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = 0;
          var hero = stage.closest(".hero") || stage;
          var span = Math.max(1, hero.offsetHeight);
          scene.setProgress(clamp(window.scrollY / span, 0, 1));
        });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }).catch(function () { /* the 2D orbit keeps the stage */ });
  }

  /* ---- Interlude: the wave rises as the section scrolls through ------------ */
  function initInterlude() {
    var section = document.getElementById("depth");
    var canvas = document.getElementById("wave-canvas");
    if (!section || !canvas) return;
    var meter = document.getElementById("swell-meter");
    import("/fx/wave.js").then(function (mod) {
      var wave = mod.mountWave(canvas, { reducedMotion: reduceMotion, accent: "#ff6a1a" });
      section.classList.add("is-live");
      if (reduceMotion) { wave.setProgress(0.6); if (meter) meter.textContent = "60%"; return; }
      var frame = 0;
      function update() {
        frame = 0;
        var top = section.getBoundingClientRect().top + window.scrollY;
        var span = Math.max(1, section.offsetHeight - window.innerHeight);
        var t = clamp((window.scrollY - top) / span, 0, 1);
        wave.setProgress(t);
        if (meter) meter.textContent = Math.round(t * 100) + "%";
        section.classList.toggle("is-live", t > 0.04);
      }
      function onScroll() { if (!frame) frame = window.requestAnimationFrame(update); }
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      update();
    }).catch(function () { section.classList.add("is-live"); });
  }

  /* ---- Split titles: words rise out of a clipped line ---------------------- */
  function splitNode(node, counter) {
    var frag = document.createDocumentFragment();
    if (node.nodeType === 3) {
      var parts = node.nodeValue.split(/(\s+)/);
      parts.forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
        var w = document.createElement("span"); w.className = "w";
        var inner = document.createElement("span"); inner.textContent = part;
        inner.style.setProperty("--wi", String(counter.i++));
        w.appendChild(inner); frag.appendChild(w);
      });
      return frag;
    }
    if (node.nodeType === 1) {
      var clone = node.cloneNode(false);
      Array.prototype.slice.call(node.childNodes).forEach(function (child) { clone.appendChild(splitNode(child, counter)); });
      if (node.tagName === "SPAN" && node.className) {
        // A styled fragment such as the accent word keeps its class on the inner span.
        var w2 = document.createElement("span"); w2.className = "w";
        var inner2 = document.createElement("span"); inner2.className = node.className; inner2.textContent = node.textContent;
        inner2.style.setProperty("--wi", String(counter.i++));
        w2.appendChild(inner2);
        return w2;
      }
      return clone;
    }
    return frag;
  }
  function initSplitTitles() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var titles = all(".section-title");
    if (!titles.length) return;
    titles.forEach(function (title) {
      var counter = { i: 0 };
      var out = document.createDocumentFragment();
      Array.prototype.slice.call(title.childNodes).forEach(function (child) { out.appendChild(splitNode(child, counter)); });
      title.textContent = "";
      title.appendChild(out);
      title.classList.add("split");
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.2 });
    titles.forEach(function (title) { observer.observe(title); });
  }

  /* ---- Magnetic controls ---------------------------------------------------- */
  function initMagnetic() {
    if (reduceMotion || !finePointer) return;
    all(".btn, .pill, .topbar-cta, .back-to-top").forEach(function (el) {
      el.classList.add("magnetic");
      el.addEventListener("pointermove", function (event) {
        var r = el.getBoundingClientRect();
        var dx = (event.clientX - (r.left + r.width / 2)) * 0.28;
        var dy = (event.clientY - (r.top + r.height / 2)) * 0.28;
        el.style.setProperty("transform", "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)");
      });
      el.addEventListener("pointerleave", function () { el.style.removeProperty("transform"); });
    });
  }

  /* ---- Figure tilt ---------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion || !finePointer) return;
    all(".work-figure").forEach(function (fig) {
      fig.addEventListener("pointermove", function (event) {
        var r = fig.getBoundingClientRect();
        var px = (event.clientX - r.left) / r.width - 0.5;
        var py = (event.clientY - r.top) / r.height - 0.5;
        fig.style.setProperty("--ty", (px * 7).toFixed(2) + "deg");
        fig.style.setProperty("--tx", (-py * 7).toFixed(2) + "deg");
      });
      fig.addEventListener("pointerleave", function () { fig.style.removeProperty("--tx"); fig.style.removeProperty("--ty"); });
    });
  }

  /* ---- Counters in the hero stats ------------------------------------------ */
  function initCounters() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var nodes = all(".hero-stats dt").filter(function (dt) { return /^\d+/.test(dt.textContent.trim()); });
    if (!nodes.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        var dt = entry.target;
        var text = dt.textContent.trim();
        var target = parseInt(text, 10);
        var suffix = text.replace(/^\d+/, "");
        var start = performance.now();
        function step(now) {
          var t = clamp((now - start) / 1100, 0, 1);
          var eased = 1 - Math.pow(1 - t, 3);
          dt.textContent = Math.round(target * eased) + suffix;
          if (t < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (dt) { observer.observe(dt); });
  }

  /* ---- Cursor glow ---------------------------------------------------------- */
  function initGlow() {
    if (reduceMotion || !finePointer) return;
    var glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    var frame = 0, x = 0, y = 0;
    window.addEventListener("pointermove", function (event) {
      x = event.clientX; y = event.clientY;
      if (frame) return;
      frame = window.requestAnimationFrame(function () {
        frame = 0;
        root.style.setProperty("--mx", x + "px");
        root.style.setProperty("--my", y + "px");
        glow.classList.add("is-on");
      });
    }, { passive: true });
    document.addEventListener("pointerleave", function () { glow.classList.remove("is-on"); });
  }

  function boot() {
    try { initGlow(); } catch (error) {}
    try { initSplitTitles(); } catch (error) {}
    try { initMagnetic(); } catch (error) {}
    try { initTilt(); } catch (error) {}
    try { initCounters(); } catch (error) {}
    try { initGargantua(); } catch (error) {}
    try { initInterlude(); } catch (error) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
