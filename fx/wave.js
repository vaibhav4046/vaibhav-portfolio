/* The interlude swell, drawn in the same dot language as the hero.
 *
 * A height field is sampled on a receding grid and projected with a simple
 * pinhole camera, so the lattice compresses toward the horizon. Each sample is
 * one square dot: brighter and larger on the crests, dimmer in the troughs and
 * with distance. Scroll progress raises the amplitude, so the sea builds as the
 * section passes through the viewport and the copy rises out of it.
 *
 * 2D canvas only. No WebGL, no library.
 */

var COLS = 132;
var ROWS = 76;
var Z_NEAR = 1.05;
var Z_FAR = 15.5;
var FOCAL = 1.05;
var CAM_H = 1.28;
var SPAN = 9.2;           // half-width of the sampled sea, in world units
var FRAME_MS = 1000 / 30;
var LEVELS = 14;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

function buildRamp(accent) {
  var ar = parseInt(accent.slice(1, 3), 16);
  var ag = parseInt(accent.slice(3, 5), 16);
  var ab = parseInt(accent.slice(5, 7), 16);
  var ramp = [];
  for (var i = 0; i < LEVELS; i++) {
    var t = i / (LEVELS - 1);
    var r, g, b;
    if (t < 0.62) {                       // cold trough grey rising to the accent
      var k = t / 0.62;
      r = 30 + (ar - 30) * k * 0.9;
      g = 31 + (ag - 31) * k * 0.75;
      b = 33 + (ab - 33) * k * 0.55;
    } else {
      var k2 = (t - 0.62) / 0.38;
      r = ar * 0.9 + (255 - ar * 0.9) * k2;
      g = ag * 0.8 + (248 - ag * 0.8) * k2;
      b = ab * 0.6 + (240 - ab * 0.6) * k2;
    }
    ramp.push("rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")");
  }
  return ramp;
}

/* Three crossed swells at different rates: no single period reads as a loop. */
function height(x, z, t) {
  return (
    Math.sin(x * 0.62 + t * 0.85) * 0.42 +
    Math.sin(z * 0.47 - t * 0.62 + x * 0.18) * 0.34 +
    Math.sin((x * 0.31 + z * 0.55) * 1.35 + t * 1.15) * 0.22
  );
}

export function mountWave(canvas, options) {
  var opts = options || {};
  var reduced = !!opts.reducedMotion;
  var ramp = buildRamp(opts.accent || "#ff6a1a");
  var ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { destroy: function () {} };

  var cw = 0, ch = 0, dpr = 1;
  var time = 0, progress = reduced ? 0.6 : 0;
  var running = false, visible = true, raf = 0, last = 0;

  // Flat arrays reused every frame; no per-frame allocation. Dots are bucketed
  // by brightness so the paint pass costs one fillStyle per level and one
  // fillRect per dot, instead of rescanning every dot for every level.
  var count = COLS * ROWS;
  var bx = new Float32Array(count);
  var by = new Float32Array(count);
  var bs = new Float32Array(count);
  var buckets = [];
  var bucketLen = new Int32Array(LEVELS);
  for (var bi = 0; bi < LEVELS; bi++) buckets.push(new Int32Array(count));

  function resize() {
    var rect = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.round(rect.width));
    ch = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, cw, ch);

    var amp = 0.16 + progress * 1.25;         // the swell builds with the scroll
    var cx = cw * 0.5;
    var cy = ch * 0.335;                      // horizon sits high, sea fills the frame
    var scale = cw * 0.5;
    var n = 0;
    bucketLen.fill(0);

    // Far rows first so the near ones paint over them.
    for (var r = ROWS - 1; r >= 0; r--) {
      var zt = r / (ROWS - 1);
      var z = Z_NEAR + (Z_FAR - Z_NEAR) * zt * zt;   // squared: detail stays near
      var depth = 1 - zt;
      for (var c = 0; c < COLS; c++) {
        var x = (c / (COLS - 1) - 0.5) * 2 * SPAN;
        var h = height(x, z, time) * amp;
        var sx = cx + (FOCAL * x / z) * scale;
        if (sx < -20 || sx > cw + 20) continue;
        var sy = cy + (FOCAL * (CAM_H - h) / z) * scale;
        if (sy < -20 || sy > ch + 20) continue;

        // Crests carry the light; troughs go dark, distance fades out.
        var lit = clamp((h / (amp * 0.82 + 0.001)) * 0.5 + 0.5, 0, 1);
        var fade = 0.26 + 0.74 * depth * depth;
        var v = Math.pow(lit, 1.55) * fade * (0.46 + 0.54 * progress);
        // The very tops of the crests catch the light and blow out to white,
        // which is what gives the sea an edge rather than an even wash.
        var crest = clamp((lit - 0.70) / 0.30, 0, 1);
        v += crest * crest * 0.62 * fade;
        var lvl = v <= 0.02 ? 0 : Math.min(LEVELS - 1, 1 + (v * (LEVELS - 2)) | 0);
        if (!lvl) continue;
        bx[n] = sx;
        by[n] = sy;
        bs[n] = clamp((FOCAL / z) * scale * 0.052, 1.1, 11);
        buckets[lvl][bucketLen[lvl]++] = n;
        n++;
      }
    }

    for (var lvl2 = 1; lvl2 < LEVELS; lvl2++) {
      var len = bucketLen[lvl2];
      if (!len) continue;
      ctx.fillStyle = ramp[lvl2];
      var list = buckets[lvl2];
      for (var i = 0; i < len; i++) {
        var k = list[i];
        var s = bs[k];
        ctx.fillRect(bx[k] - s * 0.5, by[k] - s * 0.5, s, s);
      }
    }
  }

  function loop(now) {
    raf = 0;
    if (!running) return;
    if (now - last >= FRAME_MS) {
      time += (now - last) / 1000;
      last = now;
      draw();
    }
    raf = window.requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduced) return;
    running = true;
    last = performance.now();
    raf = window.requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
  }

  resize();

  var resizeTimer = 0;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 140);
  }
  window.addEventListener("resize", onResize, { passive: true });

  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.02 });
    io.observe(canvas);
  } else {
    start();
  }
  function onVisibility() {
    if (document.hidden) stop();
    else if (visible) start();
  }
  document.addEventListener("visibilitychange", onVisibility);

  return {
    setProgress: function (p) {
      progress = clamp(p, 0, 1);
      if (!running) draw();
    },
    destroy: function () {
      stop();
      if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
