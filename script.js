/* Vaibhav Lalwani — Portfolio: theme toggle + sticky border + footer year */
(function () {
  'use strict';

  // ---- Theme ------------------------------------------------------------
  var STORAGE_KEY = 'vl-theme';
  var root = document.documentElement;
  var btn = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    if (theme === 'light') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', 'dark');
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#faf7f2' : '#161310');
  }

  function getSavedTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveTheme(t) {
    try { localStorage.setItem(STORAGE_KEY, t); } catch (e) {}
  }

  function initTheme() {
    var saved = getSavedTheme();
    if (saved === 'light' || saved === 'dark') { applyTheme(saved); return; }
    var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
  }
  initTheme();

  if (btn) {
    btn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
    });
  }

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
})();
