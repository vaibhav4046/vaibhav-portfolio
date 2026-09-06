/* Gargantua, rendered as a live dot matrix on a 2D canvas.
 *
 * No WebGL, no shader, no library: every frame walks a fixed lattice of cells,
 * samples an accretion-disc field at each cell centre and paints one square dot
 * whose size and colour follow the sampled brightness.
 *
 * The field is built from four pieces, in units of the event-horizon radius:
 *
 *   horizon    a genuinely black disc at rho < 1
 *   photon     a thin, very bright ring just outside it
 *   disc       the direct image of the accretion disc: an annulus in the
 *              equatorial plane, squashed vertically because we sit nearly in
 *              that plane. Its near half crosses in FRONT of the hole, which is
 *              the band that cuts across the black centre; its far half is
 *              hidden behind the horizon and reappears as
 *   halo       the lensed image of that far side, bent up over the top of the
 *              hole and down under the bottom, so the disc closes into a ring.
 *
 * Doppler beaming brightens the side of the disc orbiting toward the camera and
 * dims the receding side, which is what makes the picture lopsided.
 *
 * The pointer acts as a second mass: sample coordinates are deflected away from
 * it with a 1/b falloff, the way light bends around a lens, and the viewing
 * inclination tips with the pointer's height. Nothing tracks the cursor
 * directly, so it reads as gravity rather than as a cursor effect.
 */

var PITCH = 8;            // lattice pitch in CSS px
var MAX_DPR = 2;
var FRAME_MS = 1000 / 30; // the picture is soft; 30fps is plenty and halves the cost
var LEVELS = 18;          // brightness quantisation, so one fillStyle covers many dots
var R_IN = 3.55;          // inner disc edge, in horizon radii
var R_OUT = 8.8;
var BEAM = 0.70;          // Doppler beaming strength
var BEAM_FLOOR = 0.56;    // the receding side dims, it never goes out
var GAIN = 1.0;           // exposure, set so the photon ring alone reaches white
var POINTER_EASE = 0.055;
var LENS_STRENGTH = 0.34; // deflection from the pointer's own mass

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function smooth(edge0, edge1, x) {
  var t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/* A cheap hash-based value noise. Wrapped on the second axis so the disc
   texture meets itself when it comes back round and never shows a seam. */
function hash2(x, y) {
  var h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
function noiseWrap(x, y, period) {
  var xi = Math.floor(x), yi = Math.floor(y);
  var xf = x - xi, yf = y - yi;
  xf = xf * xf * (3 - 2 * xf);
  yf = yf * yf * (3 - 2 * yf);
  var y0 = ((yi % period) + period) % period;
  var y1 = ((yi + 1) % period + period) % period;
  var a = hash2(xi, y0), b = hash2(xi + 1, y0);
  var c = hash2(xi, y1), d = hash2(xi + 1, y1);
  return (a + (b - a) * xf) + ((c + (d - c) * xf) - (a + (b - a) * xf)) * yf;
}

/* Two octaves is all the lattice can resolve at this pitch. */
function turb(r, phi, period) {
  return noiseWrap(r, phi, period) * 0.62 + noiseWrap(r * 2.1 + 11.3, phi * 2, period * 2) * 0.38;
}

/* Colour ramp: ember -> accent -> hot white, precomputed as fill strings. */
function buildRamp(accent) {
  var ar = parseInt(accent.slice(1, 3), 16);
  var ag = parseInt(accent.slice(3, 5), 16);
  var ab = parseInt(accent.slice(5, 7), 16);
  var ramp = [];
  for (var i = 0; i < LEVELS; i++) {
    var t = i / (LEVELS - 1);
    var r, g, b;
    if (t < 0.55) {                       // deep ember climbing to the accent
      var k = t / 0.55;
      r = 34 + (ar - 34) * k;
      g = 16 + (ag - 16) * k;
      b = 14 + (ab - 14) * k;
    } else {                              // accent blowing out to white
      var k2 = (t - 0.55) / 0.45;
      r = ar + (255 - ar) * k2 * 0.92;
      g = ag + (250 - ag) * k2;
      b = ab + (238 - ab) * k2;
    }
    ramp.push("rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")");
  }
  return ramp;
}

export function mountGargantua(canvas, options) {
  var opts = options || {};
  var reduced = !!opts.reducedMotion;
  var ramp = buildRamp(opts.accent || "#ff6a1a");
  var ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { destroy: function () {} };

  var cols = 0, rows = 0, dpr = 1, cw = 0, ch = 0;
  var unit = 1;                 // px per horizon radius
  var ox = 0, oy = 0;           // hole centre in CSS px
  var levelBuf = null;          // one quantised level per cell

  var time = 0;
  var progress = 0;
  var px = 0, py = 0;           // pointer target, -1..1 in stage space
  var ex = 0, ey = 0;           // eased pointer
  var visible = true;
  var running = false;
  var raf = 0;
  var last = 0;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    cw = Math.max(1, Math.round(rect.width));
    ch = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(cw / PITCH);
    rows = Math.ceil(ch / PITCH);
    levelBuf = new Int8Array(cols * rows);
    // Size the picture so the flat disc spans the stage and the horizon lands at
    // roughly a tenth of the width, which is the proportion the film image uses.
    unit = Math.min(cw / 5.6, ch / 7.0);
    ox = cw * 0.5;
    oy = ch * 0.5;
    draw();
  }

  /* Brightness of the field at a point given in horizon radii.
     Returns -1 where the horizon shows through, which paints nothing at all. */
  function sample(x, y, squash, t) {
    var rho = Math.hypot(x, y);

    // --- direct image of the disc: the plane annulus, squashed by inclination
    var disc = 0;
    var near = false;
    var yd = y / squash;
    var rd = Math.hypot(x, yd);
    if (rd > R_IN * 0.80 && rd < R_OUT) {
      var phi = Math.atan2(yd, x);
      var prof = Math.pow(R_IN / rd, 1.35);
      prof *= smooth(R_IN * 0.80, R_IN + 0.9, rd) * (1 - smooth(R_OUT - 4.2, R_OUT, rd));
      var tex = turb(rd * 1.55, (phi / (Math.PI * 2) + t * 0.035) * 9, 9);
      var beam = Math.max(BEAM_FLOOR, 1 + BEAM * (x / rd));
      near = y > 0;                       // the half of the ring nearest the camera
      disc = prof * (0.26 + 1.55 * tex * tex * tex) * Math.pow(beam, 1.25) * 1.75;
      // The far half runs behind the hole and is not seen directly; its light
      // arrives bent over the top instead, as the halo below.
      if (!near && rho < 1.62) disc = 0;
    }

    // Inside the horizon nothing escapes, so the only thing that can appear
    // there is the near edge of the disc passing in front of it. That is the
    // band which cuts across the black centre.
    if (rho < 0.995) return near && disc > 0.03 ? disc * GAIN : -1;

    var out = disc;

    // --- lensed image of the far side, arced over the top and under the bottom.
    // The light piles up just outside the photon sphere, so the band is narrow
    // and hard against the black rather than a soft glow.
    if (rho < 2.15) {
      var ang = Math.atan2(y, x);
      var band = smooth(1.00, 1.15, rho) * (1 - smooth(1.20, 2.15, rho));
      // Thinnest at the sides, where the halo hands the light back to the flat
      // disc, but never closed: the ring has to join up all the way round.
      band *= 0.58 + 0.42 * Math.abs(Math.sin(ang));
      var htex = turb(rho * 5.0, (ang / (Math.PI * 2) + t * 0.05) * 9, 9);
      var hbeam = Math.max(BEAM_FLOOR, 1 + 0.62 * BEAM * (x / rho));
      out += band * (0.60 + 0.80 * htex * htex) * Math.pow(hbeam, 1.2) * 3.0;
    }

    // --- photon ring: the last light that can still climb out, a hard edge
    out += 5.2 * smooth(1.11, 1.0, rho) * smooth(0.995, 1.025, rho);

    return out * GAIN;
  }

  function draw() {
    if (!levelBuf) return;
    // Ease the pointer so the field lags the hand: gravity, not a cursor.
    ex += (px - ex) * POINTER_EASE;
    ey += (py - ey) * POINTER_EASE;

    // Pointer height tips the disc, so more or less of its face is on show.
    var squash = clamp(0.19 + ey * 0.095, 0.07, 0.36);
    var zoom = 1 + progress * 0.55;               // pulls away as the hero leaves
    var fade = 1 - smooth(0.45, 1, progress) * 0.85;
    var u = unit / zoom;

    // The pointer is a second mass sitting in the stage. It deflects sample
    // coordinates away from itself with a 1/b falloff, the way a lens bends the
    // light behind it, and its pull is held off the hole itself so the horizon
    // and the photon ring stay exact.
    var lx = ox + ex * (cw * 0.5), ly = oy + ey * (ch * 0.5);
    var lensR2 = (Math.min(cw, ch) * 0.16) * (Math.min(cw, ch) * 0.16);

    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, cw, ch);
    if (fade <= 0.02) return;

    var i = 0;
    for (var ry = 0; ry < rows; ry++) {
      var sy = ry * PITCH + PITCH * 0.5;
      for (var rx = 0; rx < cols; rx++, i++) {
        var sx = rx * PITCH + PITCH * 0.5;

        var hx = sx - ox, hy = sy - oy;
        var dx = sx - lx, dy = sy - ly;
        var d2 = dx * dx + dy * dy;
        // Fades to nothing within a couple of horizon radii of the black hole.
        var keepOff = smooth(1.6 * u, 3.4 * u, Math.sqrt(hx * hx + hy * hy));
        var defl = LENS_STRENGTH * keepOff * lensR2 / (d2 + lensR2);
        var gx = sx + dx * defl;
        var gy = sy + dy * defl;

        var v = sample((gx - ox) / u, (gy - oy) / u, squash, time);
        if (v < 0) { levelBuf[i] = -1; continue; }   // inside the horizon
        v *= fade;
        // Roll the open-ended brightness into 0..1 before quantising, so the hot
        // inner edge keeps its structure instead of clipping to a white slab.
        var tone = 1 - Math.exp(-v * 1.15);
        var lvl = tone <= 0.035 ? 0 : Math.min(LEVELS - 1, 1 + (Math.pow(tone, 0.82) * (LEVELS - 2)) | 0);
        levelBuf[i] = lvl;
      }
    }

    // One fill style per brightness level, so a few thousand dots cost a
    // handful of state changes instead of one each.
    for (var lvl2 = 1; lvl2 < LEVELS; lvl2++) {
      ctx.fillStyle = ramp[lvl2];
      var frac = lvl2 / (LEVELS - 1);
      var size = Math.max(1, (1.15 + frac * (PITCH - 2.9)));
      var half = size * 0.5;
      var j = 0;
      for (var y2 = 0; y2 < rows; y2++) {
        var cy = y2 * PITCH + PITCH * 0.5 - half;
        for (var x2 = 0; x2 < cols; x2++, j++) {
          if (levelBuf[j] !== lvl2) continue;
          ctx.fillRect(x2 * PITCH + PITCH * 0.5 - half, cy, size, size);
        }
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

  // Off-screen or in a hidden tab, the loop stops completely.
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.04 });
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
    setPointer: function (nx, ny) { px = clamp(nx, -1.2, 1.2); py = clamp(ny, -1.2, 1.2); },
    setProgress: function (p) {
      progress = clamp(p, 0, 1);
      if (!running) draw();               // keep the still frame honest when paused
    },
    destroy: function () {
      stop();
      if (io) io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
