/* Vaibhav Lalwani — Portfolio: theme toggle + sticky border + footer year */
(function () {
  'use strict';

  // ---- Theme: locked to dark (toggle removed) ----------------------------
  document.documentElement.setAttribute('data-theme', 'dark');
  try { localStorage.removeItem('vl-theme'); } catch (e) {}

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

  // ---- Hero dot-portrait — edge-only halftone, interactive cursor -----
  (function heroDots() {
    var cvs = document.getElementById('hero-glitch');
    var img = document.querySelector('.hero-art-src');
    if (!cvs || !img) return;
    // Skip when canvas is display:none (current Hermes hero replaces art layer)
    if (getComputedStyle(cvs).display === 'none') return;
    var heroArt = cvs.closest('.hero-art');
    if (heroArt && getComputedStyle(heroArt).display === 'none') return;
    var ctx = cvs.getContext('2d', { willReadFrequently: false });

    function accentColor() {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      return v || '#cc785c';
    }

    var GRID = 140;          // edge detection resolution
    var DISPLAY = 480;
    var STEP = DISPLAY / GRID;

    var off = document.createElement('canvas');
    off.width = GRID; off.height = GRID;
    var octx = off.getContext('2d', { willReadFrequently: true });
    octx.imageSmoothingEnabled = true;

    var particles = [];
    var mouse = { x: -9999, y: -9999, active: false };

    function buildParticles() {
      try {
        octx.clearRect(0, 0, GRID, GRID);
        octx.drawImage(img, 0, 0, GRID, GRID);
      } catch (e) { return false; }
      var imgData = octx.getImageData(0, 0, GRID, GRID).data;
      var lum = new Float32Array(GRID * GRID);
      for (var i = 0, p = 0; i < imgData.length; i += 4, p++) {
        lum[p] = imgData[i] * 0.299 + imgData[i + 1] * 0.587 + imgData[i + 2] * 0.114;
      }

      // 3x3 box blur (single pass) to smooth jpeg noise
      var sm = new Float32Array(GRID * GRID);
      for (var yy = 0; yy < GRID; yy++) {
        for (var xx = 0; xx < GRID; xx++) {
          var s = 0, c = 0;
          for (var oy = -1; oy <= 1; oy++) {
            for (var ox = -1; ox <= 1; ox++) {
              var nx = xx + ox, ny = yy + oy;
              if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
              s += lum[ny * GRID + nx];
              c++;
            }
          }
          sm[yy * GRID + xx] = s / c;
        }
      }

      particles = [];
      // Dark-pixel halftone: only pixels below 170 luminance, density scaled by darkness
      for (var y = 0; y < GRID; y++) {
        for (var x = 0; x < GRID; x++) {
          var lv = sm[y * GRID + x];
          if (lv > 175) continue;
          var dark = (175 - lv) / 175;
          // Sparser overall: edges (high local contrast) keep most dots, interior decimated
          var prob = 0.18 + dark * 0.45;
          if (Math.random() > prob) continue;
          var r = 0.7 + dark * 1.7;
          var alpha = 0.6 + dark * 0.4;
          var jx = (Math.random() - 0.5) * 0.5;
          var jy = (Math.random() - 0.5) * 0.5;
          var cx = (x + 0.5 + jx) * STEP;
          var cy = (y + 0.5 + jy) * STEP;
          particles.push({
            tx: cx, ty: cy,
            x: cx + (Math.random() - 0.5) * DISPLAY * 1.4,
            y: cy + (Math.random() - 0.5) * DISPLAY * 1.4,
            vx: 0, vy: 0,
            r: r,
            a: alpha,
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      return true;
    }

    function bindCursor() {
      function update(e) {
        var r = cvs.getBoundingClientRect();
        var scaleX = DISPLAY / r.width;
        var scaleY = DISPLAY / r.height;
        mouse.x = (e.clientX - r.left) * scaleX;
        mouse.y = (e.clientY - r.top) * scaleY;
        mouse.active = true;
      }
      function leave() { mouse.active = false; mouse.x = -9999; mouse.y = -9999; }
      cvs.addEventListener('pointermove', update);
      cvs.addEventListener('pointerleave', leave);
      cvs.addEventListener('pointerdown', function (e) {
        update(e);
        // ripple: push particles outward
        for (var k = 0; k < particles.length; k++) {
          var p = particles[k];
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (d < 200) {
            var force = (1 - d / 200) * 12;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }
      });
    }

    function startLoop() {
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var ease = 0.12;
      var REPEL_R = 70;     // cursor influence radius (canvas px)
      var REPEL_F = 28;     // strength

      function frame(t) {
        ctx.clearRect(0, 0, DISPLAY, DISPLAY);
        ctx.fillStyle = accentColor();

        for (var k = 0; k < particles.length; k++) {
          var p = particles[k];

          // Cursor repel
          if (mouse.active) {
            var dx = p.x - mouse.x;
            var dy = p.y - mouse.y;
            var d2 = dx * dx + dy * dy;
            if (d2 < REPEL_R * REPEL_R) {
              var d = Math.sqrt(d2) || 1;
              var force = (1 - d / REPEL_R) * REPEL_F;
              p.vx += (dx / d) * force * 0.08;
              p.vy += (dy / d) * force * 0.08;
            }
          }

          // Velocity decay
          p.vx *= 0.86;
          p.vy *= 0.86;
          p.x += p.vx;
          p.y += p.vy;

          // Spring to target
          p.x += (p.tx - p.x) * ease;
          p.y += (p.ty - p.y) * ease;

          // Pulse
          var pulse = reduced ? 1 : 1 + Math.sin(t * 0.002 + p.phase) * 0.18;
          var r = p.r * pulse;

          ctx.globalAlpha = p.a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function init() {
      if (!buildParticles()) return;
      bindCursor();
      startLoop();
    }

    if (img.complete && img.naturalWidth > 0) init();
    else { img.addEventListener('load', init); }
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
