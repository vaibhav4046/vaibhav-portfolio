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

  /* Reveals arrive on a wavefront: a crest sweeps down and to the right across
     each section, and every element lifts as the crest reaches it. The delay is
     the element's position along that diagonal, measured inside its own section,
     so a grid ripples row by row instead of all landing at once. */
  function initReveals() {
    var items = all(".reveal");
    if (!items.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-in"); });
      return;
    }

    function assignWave() {
      var groups = new Map();
      items.forEach(function (item) {
        var host = item.closest("section") || document.body;
        if (!groups.has(host)) groups.set(host, []);
        groups.get(host).push(item);
      });
      groups.forEach(function (list, host) {
        var box = host.getBoundingClientRect();
        var width = Math.max(1, box.width);
        var measured = list.map(function (item) {
          var rect = item.getBoundingClientRect();
          return { item: item, top: rect.top, u: (rect.left + rect.width / 2 - box.left) / width };
        });
        measured.sort(function (a, b) { return a.top - b.top; });
        // Group into visual rows, then let the crest run across each row and
        // trail one row behind. The row term cycles rather than accumulating, so
        // a 33-card grid ripples the whole way down instead of stalling at the
        // bottom under a delay that has grown to seconds.
        var row = -1;
        var lastTop = -1e9;
        measured.forEach(function (entry) {
          if (entry.top - lastTop > 12) { row++; lastTop = entry.top; }
          entry.item.style.setProperty("--wave", ((row % 3) * 0.9 + entry.u * 2.4).toFixed(3));
        });
      });
    }

    items.forEach(function (item) { item.classList.add("will-reveal"); });
    assignWave();

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (item) { observer.observe(item); });

    // Re-measure once the layout settles, but never for elements already in.
    var recalc = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(recalc);
      recalc = window.setTimeout(function () {
        items = items.filter(function (item) { return !item.classList.contains("is-in"); });
        if (items.length) assignWave();
      }, 200);
    }, { passive: true });
  }

  function initScrollSpy() {
    var links = all('.nav a[href^="#"], .mobile-nav a[href^="#"]');
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
        targets.filter(function (item) { return item.target === entry.target; }).forEach(function (match) {
          match.link.classList.add("is-active");
          match.link.setAttribute("aria-current", "location");
        });
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
    function finishNavigation(target, selector) {
      try { history.pushState(null, "", selector); } catch (error) {}

      var addedTabIndex = !target.hasAttribute("tabindex");
      if (addedTabIndex) target.setAttribute("tabindex", "-1");
      try { target.focus({ preventScroll: true }); }
      catch (error) { target.focus(); }
      if (addedTabIndex) {
        target.addEventListener("blur", function () {
          target.removeAttribute("tabindex");
        }, { once: true });
      }
    }
    all('a[href^="#"]:not(.skip-link)').forEach(function (link) {
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
          finishNavigation(target, selector);
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
            finishNavigation(target, selector);
          }
        }
        runningFrame = window.requestAnimationFrame(step);
      });
    });
  }



  /* Silent preview clips. Each [data-clip] holds a poster image and an empty <video>; the clip is fetched and played only
     when the card is hovered or focused (mouse), or when it is mostly on screen (touch, and clips marked data-autoplay).
     Nothing downloads on load, a visitor who asked for less motion or for saved data keeps the poster, and with no
     script the poster is simply the picture. */
  function initClips() {
    var hosts = all("[data-clip]");
    if (!hosts.length || reduceMotion) return;
    try { if (navigator.connection && navigator.connection.saveData) return; } catch (error) {}
    var fine = false;
    try { fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (error) {}
    root.classList.add("clips-on");
    var current = null;

    function videoOf(host) {
      var video = host.querySelector("video");
      if (video && !video.getAttribute("src")) video.setAttribute("src", host.getAttribute("data-clip"));
      return video;
    }
    function stop(host) {
      var video = host.querySelector("video");
      host.classList.remove("is-playing");
      if (video) { try { video.pause(); video.currentTime = 0; } catch (error) {} }
      if (current === host) current = null;
    }
    function play(host) {
      if (current && current !== host && !current.hasAttribute("data-autoplay")) stop(current);
      var video = videoOf(host);
      if (!video) return;
      if (!host.hasAttribute("data-autoplay")) current = host;
      var started = video.play();
      if (started && started.then) started.then(function () { host.classList.add("is-playing"); }).catch(function () {});
      else host.classList.add("is-playing");
    }

    var watcher = null;
    if ("IntersectionObserver" in window) {
      watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) play(entry.target);
          else stop(entry.target);
        });
      }, { threshold: [0.62] });
    }

    hosts.forEach(function (host) {
      var auto = host.hasAttribute("data-autoplay");
      if (auto || !fine) { if (watcher) watcher.observe(host); return; }
      var scope = host.closest("article") || host;
      scope.addEventListener("pointerenter", function () { play(host); });
      scope.addEventListener("pointerleave", function () { stop(host); });
      scope.addEventListener("focusin", function () { play(host); });
      scope.addEventListener("focusout", function () { stop(host); });
    });

    document.addEventListener("visibilitychange", function () { if (document.hidden && current) stop(current); });
  }


  /* Archive filter and search. The bar ships hidden and appears only when this script runs, so with no script the full list is simply shown.
     Typing narrows the list as you go; a chip narrows it by type; both together AND. The choice lives in the address (#agents, ?q=mcp) so it can be shared. */
  function initArchiveFilter() {
    var bar = document.getElementById("cat-tools");
    var cards = all(".cat-card");
    if (!bar || !cards.length) return;
    bar.hidden = false;
    var input = document.getElementById("cat-q");
    var status = document.getElementById("cat-status");
    var empty = document.getElementById("cat-empty");
    var chips = all(".chip[data-f]", bar);
    var active = "all";

    function norm(text) { return String(text).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(); }
    function apply(fromUser) {
      var words = norm(input.value).split(" ").filter(Boolean);
      var shown = 0;
      cards.forEach(function (card) {
        var inGroup = active === "all" || (" " + card.getAttribute("data-groups") + " ").indexOf(" " + active + " ") >= 0;
        var hay = card.getAttribute("data-search") || "";
        var match = inGroup && words.every(function (w) { return hay.indexOf(w) >= 0; });
        card.hidden = !match;
        if (match) { shown += 1; card.classList.add("is-in"); }
      });
      chips.forEach(function (chip) { chip.setAttribute("aria-pressed", chip.getAttribute("data-f") === active ? "true" : "false"); });
      status.textContent = shown === cards.length ? "All " + cards.length + " projects" : "Showing " + shown + " of " + cards.length;
      empty.hidden = shown !== 0;
      if (fromUser) {
        try {
          var q = input.value.trim();
          history.replaceState(null, "", location.pathname + (q ? "?q=" + encodeURIComponent(q) : "") + (active !== "all" ? "#" + active : ""));
        } catch (error) {}
      }
    }

    chips.forEach(function (chip) { chip.addEventListener("click", function () { active = chip.getAttribute("data-f"); apply(true); }); });
    input.addEventListener("input", function () { apply(true); });
    document.getElementById("cat-reset").addEventListener("click", function () { active = "all"; input.value = ""; apply(true); input.focus(); });

    try {
      var fromHash = location.hash.replace("#", "");
      if (chips.some(function (chip) { return chip.getAttribute("data-f") === fromHash; })) active = fromHash;
      var fromQuery = new URLSearchParams(location.search).get("q");
      if (fromQuery) input.value = fromQuery.slice(0, 60);
    } catch (error) {}
    apply(false);
  }

  function boot() {
    try { initYear(); } catch (error) {}
    try { initProgress(); } catch (error) {}
    try { initBackToTop(); } catch (error) {}
    try { initReveals(); } catch (error) { all(".reveal").forEach(function (item) { item.classList.add("is-in"); }); }
    try { initScrollSpy(); } catch (error) {}
    try { initMobileMenu(); } catch (error) {}
    try { initAnchorNavigation(); } catch (error) {}
    try { initClips(); } catch (error) {}
    try { initArchiveFilter(); } catch (error) {}
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
