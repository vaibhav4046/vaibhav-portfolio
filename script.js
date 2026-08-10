/* Vaibhav Lalwani — interaction and procedural 3D layer */
(function () {
  "use strict";

  var root = document.documentElement;
  root.setAttribute("data-theme", "dark");

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (error) {}

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function all(selector, context) { return Array.prototype.slice.call((context || document).querySelectorAll(selector)); }

  function initYear() {
    var year = String(new Date().getFullYear());
    all("#year, #year-2").forEach(function (element) { element.textContent = year; });
  }

  function initProgress() {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;
    var frame = 0;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0).toFixed(4) + ")";
      frame = 0;
    }
    function requestUpdate() { if (!frame) frame = window.requestAnimationFrame(update); }
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    update();
  }

  function initBackToTop() {
    var button = document.getElementById("back-to-top");
    if (!button) return;
    var frame = 0;
    function update() {
      button.classList.toggle("show", window.scrollY > window.innerHeight * 0.9);
      frame = 0;
    }
    window.addEventListener("scroll", function () {
      if (!frame) frame = window.requestAnimationFrame(update);
    }, { passive: true });
    button.addEventListener("click", function () {
      window.scrollTo(0, 0);
    });
    update();
  }

  function initReveals() {
    var items = all(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-in"); });
      return;
    }
    items.forEach(function (item, index) {
      item.classList.add("will-reveal");
      item.style.setProperty("--i", String(index % 4));
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function initScrollSpy() {
    var links = all('.nav a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var targets = links.map(function (link) {
      var target = document.querySelector(link.getAttribute("href"));
      return target ? { link: link, target: target } : null;
    }).filter(Boolean);
    if (!targets.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (link) {
          link.classList.remove("is-active");
          link.removeAttribute("aria-current");
        });
        var match = targets.find(function (item) { return item.target === entry.target; });
        if (match) {
          match.link.classList.add("is-active");
          match.link.setAttribute("aria-current", "location");
        }
      });
    }, { rootMargin: "-38% 0px -56% 0px", threshold: 0 });
    targets.forEach(function (item) { observer.observe(item.target); });
  }

  function initMobileMenu() {
    var button = document.getElementById("menu-toggle");
    var menu = document.getElementById("mobile-nav");
    if (!button || !menu) return;
    function setOpen(open) {
      button.setAttribute("aria-expanded", open ? "true" : "false");
      menu.hidden = !open;
      document.body.classList.toggle("menu-open", open);
    }
    button.addEventListener("click", function () {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        button.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 820) setOpen(false);
    }, { passive: true });
  }

  function initAnchorNavigation() {
    var runningFrame = 0;
    all('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        var selector = link.getAttribute("href");
        if (!selector || selector === "#") return;
        var target = document.querySelector(selector);
        if (!target) return;
        event.preventDefault();
        if (runningFrame) window.cancelAnimationFrame(runningFrame);
        var start = window.scrollY;
        var header = document.querySelector(".topbar");
        var offset = header ? header.offsetHeight + 10 : 0;
        var end = Math.max(0, target.getBoundingClientRect().top + start - offset);
        var distance = end - start;
        if (reduceMotion || Math.abs(distance) < 80) {
          window.scrollTo(0, end);
          try { history.pushState(null, "", selector); } catch (error) {}
          return;
        }
        var duration = clamp(Math.abs(distance) * .16, 280, 520);
        var began = performance.now();
        function step(now) {
          var progress = clamp((now - began) / duration, 0, 1);
          var eased = 1 - Math.pow(1 - progress, 4);
          window.scrollTo(0, start + distance * eased);
          if (progress < 1) runningFrame = window.requestAnimationFrame(step);
          else {
            runningFrame = 0;
            try { history.pushState(null, "", selector); } catch (error) {}
          }
        }
        runningFrame = window.requestAnimationFrame(step);
      });
    });
  }

  /* A tiny, dependency-free 3D renderer. The scene is decorative, while all
     meaning and navigation stay in semantic HTML. It pauses offscreen and in
     hidden tabs, caps pixel density, and becomes a static frame for reduced
     motion or data-saver users. */
  function initSystemCore() {
    var canvas = document.getElementById("system-canvas");
    var stage = document.getElementById("hero-stage");
    if (!canvas || !stage || !canvas.getContext) return;
    var context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    var saveData = false;
    try { saveData = Boolean(navigator.connection && navigator.connection.saveData); } catch (error) {}
    var staticMode = reduceMotion || saveData;
    var mobile = window.matchMedia ? window.matchMedia("(max-width: 600px)").matches : window.innerWidth < 600;
    var pointCount = mobile ? 92 : 168;
    var points = [];
    var edges = [];
    var width = 1;
    var height = 1;
    var dpr = 1;
    var active = true;
    var frame = 0;
    var lastFrame = 0;
    var pointerX = 0;
    var pointerY = 0;
    var targetX = 0;
    var targetY = 0;

    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var index = 0; index < pointCount; index += 1) {
      var y = 1 - (index / Math.max(1, pointCount - 1)) * 2;
      var radius = Math.sqrt(Math.max(0, 1 - y * y));
      var angle = golden * index;
      points.push({
        x: Math.cos(angle) * radius,
        y: y,
        z: Math.sin(angle) * radius,
        accent: index % 13 === 0 || index % 29 === 0
      });
    }

    points.forEach(function (point, pointIndex) {
      var distances = [];
      for (var otherIndex = pointIndex + 1; otherIndex < points.length; otherIndex += 1) {
        var other = points[otherIndex];
        var dx = point.x - other.x;
        var dy = point.y - other.y;
        var dz = point.z - other.z;
        var distance = dx * dx + dy * dy + dz * dz;
        if (distance < 0.16) distances.push({ index: otherIndex, distance: distance });
      }
      distances.sort(function (a, b) { return a.distance - b.distance; });
      distances.slice(0, mobile ? 1 : 2).forEach(function (candidate) {
        edges.push([pointIndex, candidate.index]);
      });
    });

    function resize() {
      var rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(staticMode ? 4.2 : performance.now() * 0.001);
    }

    function rotate(point, rx, ry, rz) {
      var x = point.x;
      var y = point.y;
      var z = point.z;
      var cosX = Math.cos(rx), sinX = Math.sin(rx);
      var y1 = y * cosX - z * sinX;
      var z1 = y * sinX + z * cosX;
      var cosY = Math.cos(ry), sinY = Math.sin(ry);
      var x2 = x * cosY + z1 * sinY;
      var z2 = -x * sinY + z1 * cosY;
      var cosZ = Math.cos(rz), sinZ = Math.sin(rz);
      return { x: x2 * cosZ - y1 * sinZ, y: x2 * sinZ + y1 * cosZ, z: z2 };
    }

    function project(point, scale) {
      var perspective = 2.95 / (3.65 - point.z);
      return {
        x: width * 0.5 + point.x * scale * perspective,
        y: height * 0.47 + point.y * scale * perspective,
        z: point.z,
        perspective: perspective
      };
    }

    function drawOrbit(scale, rotationX, rotationY, phase, alpha) {
      var previous = null;
      context.beginPath();
      for (var step = 0; step <= 100; step += 1) {
        var theta = (step / 100) * Math.PI * 2 + phase;
        var base = { x: Math.cos(theta) * 1.25, y: Math.sin(theta) * .7, z: 0 };
        var rotated = rotate(base, rotationX, rotationY, .18);
        var projected = project(rotated, scale);
        if (!previous) context.moveTo(projected.x, projected.y);
        else context.lineTo(projected.x, projected.y);
        previous = projected;
      }
      context.strokeStyle = "rgba(255,106,26," + alpha + ")";
      context.lineWidth = 1;
      context.stroke();
    }

    function draw(time) {
      context.clearRect(0, 0, width, height);
      var scale = Math.min(width, height) * (mobile ? .34 : .36);
      var rotationX = -.18 + pointerY * .18 + Math.sin(time * .38) * .025;
      var rotationY = time * .17 + pointerX * .32;
      var rotationZ = Math.sin(time * .21) * .09;

      var glow = context.createRadialGradient(width * .5, height * .47, 0, width * .5, height * .47, scale * .88);
      glow.addColorStop(0, "rgba(255,106,26,.15)");
      glow.addColorStop(.28, "rgba(255,106,26,.05)");
      glow.addColorStop(1, "rgba(255,106,26,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      drawOrbit(scale, .62, rotationY * .55, time * .05, .28);
      drawOrbit(scale, -1.02, rotationY * .35 + 1.3, -time * .04, .17);
      if (!mobile) drawOrbit(scale, .12, rotationY * .28 - .8, time * .03, .12);

      var projected = points.map(function (point) {
        return project(rotate(point, rotationX, rotationY, rotationZ), scale);
      });

      context.lineWidth = .72;
      edges.forEach(function (edge) {
        var first = projected[edge[0]];
        var second = projected[edge[1]];
        var depth = clamp((first.z + second.z + 2) / 4, 0, 1);
        context.strokeStyle = "rgba(210,210,205," + (.035 + depth * .12).toFixed(3) + ")";
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.stroke();
      });

      projected.map(function (point, pointIndex) {
        return { point: point, data: points[pointIndex] };
      }).sort(function (a, b) { return a.point.z - b.point.z; }).forEach(function (item) {
        var depth = clamp((item.point.z + 1) / 2, 0, 1);
        var radius = (item.data.accent ? 2.1 : 1.05) * (.55 + item.point.perspective) * (mobile ? .8 : 1);
        context.beginPath();
        context.arc(item.point.x, item.point.y, radius, 0, Math.PI * 2);
        context.fillStyle = item.data.accent
          ? "rgba(255,106,26," + (.5 + depth * .5).toFixed(3) + ")"
          : "rgba(247,247,245," + (.16 + depth * .58).toFixed(3) + ")";
        context.fill();
      });

      var coreRadius = Math.max(18, scale * .12);
      var core = context.createRadialGradient(width * .5 - coreRadius * .25, height * .47 - coreRadius * .3, 2, width * .5, height * .47, coreRadius);
      core.addColorStop(0, "#ffd2b8");
      core.addColorStop(.2, "#ff812e");
      core.addColorStop(.62, "#ff5a00");
      core.addColorStop(1, "rgba(255,90,0,0)");
      context.fillStyle = core;
      context.beginPath();
      context.arc(width * .5, height * .47, coreRadius, 0, Math.PI * 2);
      context.fill();
    }

    function tick(now) {
      frame = 0;
      if (!active || document.hidden || staticMode) return;
      var minFrame = mobile ? 33 : 16;
      if (now - lastFrame >= minFrame) {
        pointerX += (targetX - pointerX) * .055;
        pointerY += (targetY - pointerY) * .055;
        draw(now * .001);
        lastFrame = now;
      }
      frame = window.requestAnimationFrame(tick);
    }

    function start() {
      if (!frame && active && !document.hidden && !staticMode) frame = window.requestAnimationFrame(tick);
    }

    stage.addEventListener("pointermove", function (event) {
      if (reduceMotion) return;
      var rect = stage.getBoundingClientRect();
      targetX = clamp(((event.clientX - rect.left) / rect.width - .5) * 2, -1, 1);
      targetY = clamp(((event.clientY - rect.top) / rect.height - .5) * 2, -1, 1);
      stage.style.setProperty("--ry", (targetX * 3.2).toFixed(2) + "deg");
      stage.style.setProperty("--rx", (-targetY * 2.5).toFixed(2) + "deg");
    }, { passive: true });
    stage.addEventListener("pointerleave", function () {
      targetX = 0;
      targetY = 0;
      stage.style.setProperty("--ry", "0deg");
      stage.style.setProperty("--rx", "0deg");
    }, { passive: true });

    if ("IntersectionObserver" in window) {
      var visibilityObserver = new IntersectionObserver(function (entries) {
        active = Boolean(entries[0] && entries[0].isIntersecting);
        if (active) start();
        else if (frame) { window.cancelAnimationFrame(frame); frame = 0; }
      }, { rootMargin: "100px", threshold: .01 });
      visibilityObserver.observe(stage);
    }
    document.addEventListener("visibilitychange", start);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener("resize", resize, { passive: true });

    resize();
    start();
    window.__portfolioDiagnostics = {
      scene: "procedural-projected-3d",
      reducedMotion: reduceMotion,
      dataSaver: saveData,
      pointCount: pointCount
    };
  }

  function boot() {
    try { initYear(); } catch (error) {}
    try { initProgress(); } catch (error) {}
    try { initBackToTop(); } catch (error) {}
    try { initReveals(); } catch (error) { all(".reveal").forEach(function (item) { item.classList.add("is-in"); }); }
    try { initScrollSpy(); } catch (error) {}
    try { initMobileMenu(); } catch (error) {}
    try { initAnchorNavigation(); } catch (error) {}
    try { initSystemCore(); } catch (error) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
