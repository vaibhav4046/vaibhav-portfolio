/* Vaibhav Lalwani — Portfolio: theme, scroll state, reveals, micro-interactions */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Theme ------------------------------------------------------------
  var STORAGE_KEY = 'vl-theme';
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');
  var themes = ['dark', 'light'];
  var themeColors = {
    dark: '#070707',
    light: '#fbfaf7'
  };

  function applyTheme(theme) {
    if (themes.indexOf(theme) === -1) theme = 'dark';
    root.setAttribute('data-theme', theme);
    // Update every theme-color meta (there is one per color-scheme media query)
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute('content', themeColors[theme] || themeColors.dark);
    }
    if (btn) {
      btn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
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
      var next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  }

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onThemeChange = function (e) { if (!getSavedTheme()) applyTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onThemeChange);
    else if (mq.addListener) mq.addListener(onThemeChange);
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

  // ---- Reading progress + active navigation + back-to-top --------------
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute('href');
      return id ? document.querySelector(id) : null;
    })
    .filter(Boolean);
  var toTop = document.getElementById('back-to-top');

  function updateScrollState() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var pct = Math.min(1, Math.max(0, window.scrollY / max));
    if (progress) progress.style.setProperty('--scroll-progress', pct.toFixed(4));
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 640);

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

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  // ---- Footer year ------------------------------------------------------
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // ---- Hero stat count-up ----------------------------------------------
  // Animates the numeric prefix of each hero stat (e.g. "20+" -> 0..20+).
  (function statCountUp() {
    var stats = document.querySelectorAll('.hero-stats dt');
    if (!stats.length || reduced) return;
    stats.forEach(function (dt) {
      var raw = dt.textContent.trim();
      var m = raw.match(/^(\d+)(.*)$/);
      if (!m) return;
      var target = parseInt(m[1], 10);
      var suffix = m[2] || '';
      var start = null;
      var DURATION = 1100;
      function tick(t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / DURATION);
        var eased = 1 - Math.pow(1 - p, 3);
        dt.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else dt.textContent = raw;
      }
      requestAnimationFrame(tick);
    });
  })();

  // ---- Scroll reveal ----------------------------------------------------
  // Adds .is-in to anything tagged [data-reveal] when it enters the viewport.
  // Honors prefers-reduced-motion: instantly reveals everything.
  function tagReveals() {
    // .foot p deliberately excluded: it sits inside the observer's bottom
    // dead zone at max scroll, so it would never reveal.
    var sels = [
      '.section-title', '.section-eyebrow', '.section-lede',
      '.card', '.timeline-item', '.skill-col',
      '.contact-card'
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
    // Stagger skill chips inside each column.
    document.querySelectorAll('.skill-col').forEach(function (col) {
      var chips = col.querySelectorAll('.chiplist li');
      for (var k = 0; k < chips.length; k++) {
        chips[k].style.setProperty('--chip-delay', (k * 36) + 'ms');
      }
    });
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
  // Radial highlight that follows the cursor (CSS reads --mx/--my).
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    var cards = document.querySelectorAll('.project, .contact-card, .cert-card');
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
      navigator.clipboard.writeText(email).then(
        function () { toast('Email copied · ' + email); },
        function () {}
      );
    });
  });

  // ---- Hero figurine (Hermes-style pixelated glitch canvas) -----------
  // rAF loop only runs while the figurine is on screen; reduced motion
  // renders a single static frame.
  (function heroFigurine() {
    var cvs = document.getElementById('figurine-canvas');
    var img = document.querySelector('.fig-src');
    if (!cvs || !img) return;
    var ctx = cvs.getContext('2d', { willReadFrequently: false });
    ctx.imageSmoothingEnabled = false;

    var LOW = 80;          // pixelation grid
    var off = document.createElement('canvas');
    off.width = LOW; off.height = LOW;
    var octx = off.getContext('2d', { willReadFrequently: true });
    octx.imageSmoothingEnabled = false;

    var baseData = null;
    var visible = true;
    var rafId = 0;
    var lastBurst = 0;
    var glitchUntil = 0;
    var slices = [];

    function buildBase() {
      try {
        octx.clearRect(0, 0, LOW, LOW);
        octx.drawImage(img, 0, 0, LOW, LOW);
        var id = octx.getImageData(0, 0, LOW, LOW);
        var d = id.data;
        for (var i = 0; i < d.length; i += 4) {
          // Monochrome with slight contrast lift
          var lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          lum = Math.max(0, Math.min(255, (lum - 128) * 1.18 + 128));
          d[i] = d[i + 1] = d[i + 2] = lum;
        }
        baseData = id;
      } catch (e) { baseData = null; }
    }

    function drawStatic() {
      if (!baseData) return;
      octx.putImageData(baseData, 0, 0);
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(off, 0, 0, cvs.width, cvs.height);
    }

    function frame(t) {
      if (!visible) { rafId = 0; return; }
      var work = octx.createImageData(LOW, LOW);
      work.data.set(baseData.data);

      // Spawn glitch burst
      if (t - lastBurst > 380 + Math.random() * 720) {
        lastBurst = t;
        glitchUntil = t + 80 + Math.random() * 140;
        slices = [];
        var n = 1 + Math.floor(Math.random() * 3);
        for (var s = 0; s < n; s++) {
          slices.push({
            y: Math.floor(Math.random() * LOW),
            h: 2 + Math.floor(Math.random() * 5),
            dx: Math.floor((Math.random() - 0.5) * 14)
          });
        }
      }

      // Apply slice shifts
      if (t < glitchUntil) {
        for (var k = 0; k < slices.length; k++) {
          var sl = slices[k];
          for (var y = sl.y; y < Math.min(sl.y + sl.h, LOW); y++) {
            var srcRow = baseData.data.subarray(y * LOW * 4, (y + 1) * LOW * 4);
            var dstStart = y * LOW * 4;
            for (var x = 0; x < LOW; x++) {
              var sx = (x - sl.dx + LOW) % LOW;
              work.data[dstStart + x * 4]     = srcRow[sx * 4];
              work.data[dstStart + x * 4 + 1] = srcRow[sx * 4 + 1];
              work.data[dstStart + x * 4 + 2] = srcRow[sx * 4 + 2];
              work.data[dstStart + x * 4 + 3] = srcRow[sx * 4 + 3];
            }
          }
        }
      }

      // Per-frame noise + scanline darken (subtle)
      var dd = work.data;
      for (var p = 0; p < dd.length; p += 4) {
        var n2 = (Math.random() - 0.5) * 12;
        dd[p]     = Math.max(0, Math.min(255, dd[p] + n2));
        dd[p + 1] = Math.max(0, Math.min(255, dd[p + 1] + n2));
        dd[p + 2] = Math.max(0, Math.min(255, dd[p + 2] + n2));
      }
      for (var yy = 1; yy < LOW; yy += 2) {
        var rowStart = yy * LOW * 4;
        for (var xx = 0; xx < LOW; xx++) {
          dd[rowStart + xx * 4]     *= 0.82;
          dd[rowStart + xx * 4 + 1] *= 0.82;
          dd[rowStart + xx * 4 + 2] *= 0.82;
        }
      }

      octx.putImageData(work, 0, 0);
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.drawImage(off, 0, 0, cvs.width, cvs.height);

      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (!baseData || rafId) return;
      if (reduced) { drawStatic(); return; }
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    function init() {
      buildBase();
      if (!baseData) return;
      if (reduced) { drawStatic(); return; }
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start();
          else stop();
        }, { threshold: 0 });
        io.observe(cvs);
      } else {
        start();
      }
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop();
        else if (visible) start();
      });
    }

    if (img.complete && img.naturalWidth > 0) init();
    else img.addEventListener('load', init);
  })();

  // ---- LinkedIn activity sync -----------------------------------------
  // The section stays hidden until /api/linkedin-posts has OAuth-backed data.
  (function initLinkedInPosts() {
    var section = document.getElementById('linkedin-activity');
    var grid = document.getElementById('linkedin-posts');
    if (!section || !grid || !window.fetch) return;

    fetch('/api/linkedin-posts', { headers: { Accept: 'application/json' } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (payload) {
        if (!payload || !payload.configured || !payload.posts || !payload.posts.length) return;

        grid.innerHTML = '';
        payload.posts.slice(0, 6).forEach(function (post) {
          var article = document.createElement('article');
          article.className = 'card linkedin-post';

          var meta = document.createElement('p');
          meta.className = 'muted';
          meta.textContent = post.publishedAt || 'LinkedIn post';

          var text = document.createElement('p');
          text.textContent = post.text || 'View this LinkedIn update.';

          article.appendChild(meta);
          article.appendChild(text);

          if (post.url) {
            var row = document.createElement('p');
            row.className = 'project-link-row';
            var link = document.createElement('a');
            link.href = post.url;
            link.target = '_blank';
            link.rel = 'noopener';
            link.textContent = 'Open on LinkedIn →';
            row.appendChild(link);
            article.appendChild(row);
          }

          grid.appendChild(article);
        });

        section.hidden = false;
        tagReveals();
      })
      .catch(function () {});
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
