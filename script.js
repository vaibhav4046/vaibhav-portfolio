/* Vaibhav Lalwani — Portfolio: theme toggle + sticky border + footer year */
(function () {
  'use strict';

  // ---- Theme ------------------------------------------------------------
  var STORAGE_KEY = 'vl-theme';
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll('[data-theme-choice]'));
  var themes = ['dark', 'light', 'graphite', 'solar'];
  var themeColors = {
    dark: '#080a0d',
    light: '#f7f8f8',
    graphite: '#0d0f12',
    solar: '#f8fafc'
  };

  function applyTheme(theme) {
    if (themes.indexOf(theme) === -1) theme = 'dark';
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', themeColors[theme] || themeColors.dark);
    themeButtons.forEach(function (themeButton) {
      var isActive = themeButton.getAttribute('data-theme-choice') === theme;
      themeButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    if (btn) btn.setAttribute('title', 'Theme: ' + theme);
  }

  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveTheme(t) {
    try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {}
  }

  function initTheme() {
    var saved = getSavedTheme();
    if (themes.indexOf(saved) !== -1) { applyTheme(saved); return; }
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
  }
  initTheme();

  if (btn) {
    btn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') || 'dark';
      var next = themes[(themes.indexOf(current) + 1) % themes.length] || 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  }
  themeButtons.forEach(function (themeButton) {
    themeButton.addEventListener('click', function () {
      var next = themeButton.getAttribute('data-theme-choice') || 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  });

  // Respond to system theme changes only when user has not chosen.
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) { if (!getSavedTheme()) applyTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  // ---- Sticky topbar border on scroll ----------------------------------
  var topbar = document.querySelector('.topbar');
  var progress = document.querySelector('.scroll-progress');
  if (topbar) {
    var setStuck = function () {
      if (window.scrollY > 4) topbar.classList.add('is-stuck');
      else topbar.classList.remove('is-stuck');
    };
    setStuck();
    window.addEventListener('scroll', setStuck, { passive: true });
  }

  // ---- Reading progress + active navigation ----------------------------
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  function updateScrollState() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var pct = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress) progress.style.setProperty('--scroll-progress', pct.toFixed(4));

    var active = sections[0];
    var offset = (topbar ? topbar.offsetHeight : 72) + 80;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= offset) active = sections[i];
      else break;
    }
    navLinks.forEach(function (link) {
      var match = active && link.getAttribute('href') === '#' + active.id;
      link.classList.toggle('is-active', !!match);
      if (match) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
  var scrollTicking = false;
  function requestScrollState() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(function () {
      updateScrollState();
      scrollTicking = false;
    });
  }
  updateScrollState();
  window.addEventListener('scroll', requestScrollState, { passive: true });
  window.addEventListener('resize', requestScrollState);

  // ---- Footer year ------------------------------------------------------
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Resume button is now a direct PDF download via <a download>; no JS needed.

  // ---- Scroll reveal ----------------------------------------------------
  // Adds .is-in to anything tagged [data-reveal] when it enters the viewport.
  // Honors prefers-reduced-motion: instantly reveals everything.
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tagReveals() {
    var sels = [
      '.hero-title', '.hero .lede', '.hero-cta',
      '.section-title', '.section-eyebrow',
      '.hero-signals li', '.hero-facts .fact',
      '.card', '.timeline-item', '.skill-col', '.principle',
      '.contact-card', '.foot p'
    ];
    var nodes = document.querySelectorAll(sels.join(','));
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n.hasAttribute('data-reveal')) n.setAttribute('data-reveal', '');
    }
    // Stagger project cards within their grid.
    var projects = document.querySelectorAll('.project');
    for (var j = 0; j < projects.length; j++) {
      projects[j].style.setProperty('--reveal-delay', (j % 4 * 60) + 'ms');
    }
  }
  tagReveals();

  if (reduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  // ---- Pointer-tracked card glow ---------------------------------------
  // Subtle radial highlight that follows cursor. Skipped under reduced motion.
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    var cards = document.querySelectorAll('.project, .contact-card');
    cards.forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      });
    });
  }

  // ---- Magnetic CTAs (pointer-tracked translate) ----------------------
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    var mag = document.querySelectorAll('.btn-primary, .topbar-cta');
    mag.forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 8;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 8;
        el.style.setProperty('--mx-off', x + 'px');
        el.style.setProperty('--my-off', y + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx-off', '0');
        el.style.setProperty('--my-off', '0');
      });
    });
  }

  // ---- Toast helper + email-link copy on click ------------------------
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    setTimeout(function () {
      t.classList.remove('is-on');
      setTimeout(function () { t.remove(); }, 280);
    }, 1800);
  }
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      var email = (a.getAttribute('href') || '').replace(/^mailto:/, '').split('?')[0];
      try { navigator.clipboard.writeText(email); toast('Email copied · ' + email); } catch (_) {}
    });
  });

  // ---- Hero glitch portrait (canvas, monochrome, pixelated) -----------
  (function heroGlitch() {
    var cvs = document.getElementById('hero-glitch');
    var img = document.querySelector('.hero-art-src');
    if (!cvs || !img) return;
    var ctx = cvs.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;

    var lowW = 84, lowH = 84;            // pixelation resolution
    var off = document.createElement('canvas');
    off.width = lowW; off.height = lowH;
    var octx = off.getContext('2d', { willReadFrequently: true });
    octx.imageSmoothingEnabled = false;

    var ready = false;
    var baseImageData = null;

    function buildBase() {
      try {
        octx.clearRect(0, 0, lowW, lowH);
        octx.drawImage(img, 0, 0, lowW, lowH);
        var id = octx.getImageData(0, 0, lowW, lowH);
        var d = id.data;
        for (var i = 0; i < d.length; i += 4) {
          // luminance
          var l = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          // boost contrast
          l = Math.max(0, Math.min(255, (l - 128) * 1.35 + 128));
          d[i] = d[i + 1] = d[i + 2] = l;
        }
        baseImageData = id;
        ready = true;
      } catch (e) {
        ready = false;
      }
    }

    function startLoop() {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var glitchUntil = 0;
      var glitchSlices = [];
      var lastTriggered = 0;

      function frame(t) {
        if (!ready) { requestAnimationFrame(frame); return; }
        // Copy base
        var work = octx.createImageData(lowW, lowH);
        work.data.set(baseImageData.data);

        // Maybe trigger a new glitch burst
        if (!reduced && t - lastTriggered > 450 + Math.random() * 900) {
          lastTriggered = t;
          glitchUntil = t + 90 + Math.random() * 140;
          glitchSlices = [];
          var burstCount = 1 + Math.floor(Math.random() * 3);
          for (var s = 0; s < burstCount; s++) {
            glitchSlices.push({
              y: Math.floor(Math.random() * lowH),
              h: 2 + Math.floor(Math.random() * 6),
              dx: Math.floor((Math.random() - 0.5) * 16)
            });
          }
        }

        // Apply slice shifts during glitch window
        if (t < glitchUntil) {
          for (var k = 0; k < glitchSlices.length; k++) {
            var sl = glitchSlices[k];
            for (var y = sl.y; y < Math.min(sl.y + sl.h, lowH); y++) {
              var srcRow = baseImageData.data.subarray(y * lowW * 4, (y + 1) * lowW * 4);
              var dstStart = y * lowW * 4;
              for (var x = 0; x < lowW; x++) {
                var sx = (x - sl.dx + lowW) % lowW;
                work.data[dstStart + x * 4]     = srcRow[sx * 4];
                work.data[dstStart + x * 4 + 1] = srcRow[sx * 4 + 1];
                work.data[dstStart + x * 4 + 2] = srcRow[sx * 4 + 2];
                work.data[dstStart + x * 4 + 3] = srcRow[sx * 4 + 3];
              }
            }
          }
        }

        // Scanline + noise tint per-pixel
        if (!reduced) {
          var data = work.data;
          for (var p = 0; p < data.length; p += 4) {
            var noise = (Math.random() - 0.5) * 18;
            data[p]     = Math.max(0, Math.min(255, data[p] + noise));
            data[p + 1] = Math.max(0, Math.min(255, data[p + 1] + noise));
            data[p + 2] = Math.max(0, Math.min(255, data[p + 2] + noise));
          }
          // every 3rd row darken (scanline)
          for (var yy = 1; yy < lowH; yy += 3) {
            var rowStart = yy * lowW * 4;
            for (var xx = 0; xx < lowW; xx++) {
              data[rowStart + xx * 4]     *= 0.78;
              data[rowStart + xx * 4 + 1] *= 0.78;
              data[rowStart + xx * 4 + 2] *= 0.78;
            }
          }
        }

        octx.putImageData(work, 0, 0);
        // upscale pixelated to display canvas
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        ctx.drawImage(off, 0, 0, cvs.width, cvs.height);

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    if (img.complete && img.naturalWidth > 0) {
      buildBase();
      startLoop();
    } else {
      img.addEventListener('load', function () { buildBase(); startLoop(); });
      img.addEventListener('error', function () { /* silent */ });
    }
  })();

  // ---- Smooth in-page anchor scroll -----------------------------------
  if (!reduced) {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', id);
      });
    });
  }
})();
