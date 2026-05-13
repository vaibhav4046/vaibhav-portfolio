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

  // ---- Hero dot-portrait (particle mosaic of profile photo) -----------
  (function heroDots() {
    var cvs = document.getElementById('hero-glitch');
    var img = document.querySelector('.hero-art-src');
    if (!cvs || !img) return;
    var ctx = cvs.getContext('2d', { willReadFrequently: false });

    // Resolve CSS accent colour so dots match theme
    function accentColor() {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      return v || '#cc785c';
    }

    // Sampling grid resolution (higher = denser dots)
    var GRID = 110;         // sample image at 110 × 110 cells (denser)
    var DISPLAY = 480;      // canvas px (matches width/height attrs)
    var STEP = DISPLAY / GRID;

    // Bayer 4x4 ordered-dither threshold matrix (0..15)
    var BAYER = [
      [ 0,  8,  2, 10],
      [12,  4, 14,  6],
      [ 3, 11,  1,  9],
      [15,  7, 13,  5]
    ];

    var off = document.createElement('canvas');
    off.width = GRID; off.height = GRID;
    var octx = off.getContext('2d', { willReadFrequently: true });
    octx.imageSmoothingEnabled = true;

    var particles = [];

    function buildParticles() {
      try {
        octx.clearRect(0, 0, GRID, GRID);
        octx.drawImage(img, 0, 0, GRID, GRID);
      } catch (e) { return false; }
      var data = octx.getImageData(0, 0, GRID, GRID).data;
      particles = [];
      for (var y = 0; y < GRID; y++) {
        for (var x = 0; x < GRID; x++) {
          var k = (y * GRID + x) * 4;
          var lum = data[k] * 0.299 + data[k + 1] * 0.587 + data[k + 2] * 0.114;
          // Skip clearly light pixels (background)
          if (lum > 200) continue;
          // Darkness 0..1 from 200 down to 0
          var dark = Math.min(1, (200 - lum) / 200);
          // Bayer threshold for ordered halftone
          var bayer = BAYER[y & 3][x & 3] / 16; // 0..0.9375
          if (dark < bayer + 0.05) continue;
          var over = dark - bayer;
          var r = 0.7 + over * 3.2;             // 0.7..~3.9
          var alpha = 0.7 + Math.min(0.3, over * 0.5);
          // Slight in-cell jitter for organic feel
          var jx = (Math.random() - 0.5) * 0.5;
          var jy = (Math.random() - 0.5) * 0.5;
          var cx = (x + 0.5 + jx) * STEP;
          var cy = (y + 0.5 + jy) * STEP;
          particles.push({
            tx: cx, ty: cy,
            x: cx + (Math.random() - 0.5) * DISPLAY * 1.4,
            y: cy + (Math.random() - 0.5) * DISPLAY * 1.4,
            r: r,
            a: alpha,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      return true;
    }

    function startLoop() {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var burstUntil = 0;
      var lastBurst = 0;
      var ease = 0.12;

      function frame(t) {
        ctx.clearRect(0, 0, DISPLAY, DISPLAY);

        // Periodic scatter burst — particles fly out, then reform (less frequent)
        if (!reduced && t > 9000 && t - lastBurst > 12000 + Math.random() * 6000) {
          lastBurst = t;
          burstUntil = t + 720;
          for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var ang = Math.random() * Math.PI * 2;
            var mag = 24 + Math.random() * 60;
            p.vx = Math.cos(ang) * mag;
            p.vy = Math.sin(ang) * mag;
          }
        }

        var burstActive = t < burstUntil;
        var accent = accentColor();
        // Resolve once for performance
        ctx.fillStyle = accent;

        for (var k = 0; k < particles.length; k++) {
          var p2 = particles[k];

          if (burstActive) {
            // brief explosive offset, decays
            p2.x += (p2.vx || 0) * 0.05;
            p2.y += (p2.vy || 0) * 0.05;
            p2.vx *= 0.92;
            p2.vy *= 0.92;
          }
          // ease towards target
          p2.x += (p2.tx - p2.x) * ease;
          p2.y += (p2.ty - p2.y) * ease;

          // subtle pulse
          var pulse = reduced ? 1 : 1 + Math.sin(t * 0.0025 + p2.phase) * 0.15;
          var r = p2.r * pulse;

          ctx.globalAlpha = p2.a;
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function init() {
      if (!buildParticles()) return;
      startLoop();
    }

    if (img.complete && img.naturalWidth > 0) init();
    else { img.addEventListener('load', init); }

    // Rebuild on theme change so accent stays consistent (re-paint via existing loop)
    new MutationObserver(function () {
      // colour is read live each frame, but in case GRID/DISPLAY changes we could rebuild
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
