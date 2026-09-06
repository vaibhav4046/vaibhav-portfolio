// Gargantua: a Schwarzschild black hole with a thin accretion disk, rendered as a
// full-screen fragment shader. Pass one raymarches at half resolution (the picture is
// soft anyway), pass two upsamples, adds film grain and a vignette at full resolution.
import * as THREE from '../vendor/three.module.min.js';

const MAX_DPR = 1.5;
const RAY_SCALE = 0.5;
const STILL_TIME = 12.0;
const POINTER_EASE = 0.08;

const VERT = 'void main() { gl_Position = vec4(position, 1.0); }';

const RAY_FRAG = `
uniform vec2 uRes;
uniform float uFit;
uniform float uTime;
uniform float uProgress;
uniform vec2 uPointer;
uniform vec3 uAccent;

// Units: G = c = 1 and the event horizon radius is 1. Light can orbit at 1.5 (the photon
// sphere); the innermost stable orbit for gas is at 3, so that is where the disk starts.
const float R_HORIZON = 1.0;
const float R_PHOTON = 1.5;
const float R_IN = 3.0;
const float R_OUT = 9.5;
const float R_FAR = 24.0;
const int STEPS = 96;
const float TAU = 6.28318530718;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Value noise whose second axis wraps every "period" cells, so it tiles around the disk with no seam.
float noiseWrap(vec2 p, float period) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, period);
  float y1 = mod(i.y + 1.0, period);
  float a = hash12(vec2(i.x, y0));
  float b = hash12(vec2(i.x + 1.0, y0));
  float c = hash12(vec2(i.x, y1));
  float d = hash12(vec2(i.x + 1.0, y1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbmWrap(vec2 p, float period) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * noiseWrap(p, period);
    p = p * 2.0 + vec2(13.7, 0.0);
    period *= 2.0;
    a *= 0.5;
  }
  return s;
}

// Light emitted where a ray crosses the disk plane at pc, travelling along -rd toward the camera.
vec3 diskEmit(vec3 pc, vec3 rd) {
  float rc = length(pc.xz);
  if (rc < R_IN || rc > R_OUT) return vec3(0.0);
  float ang = atan(pc.z, pc.x);
  // Two noise layers rotating rigidly at different rates read as slow turbulence, without
  // winding the pattern into ever finer spirals over a long session (which would alias).
  const float P = 12.0;
  float u1 = (ang + uTime * 0.045) * (P / TAU);
  float u2 = (ang + uTime * 0.075) * (P / TAU);
  float t1 = fbmWrap(vec2(rc * 2.4 + uTime * 0.01, u1), P);
  float t2 = fbmWrap(vec2(rc * 3.3 + 7.0 - uTime * 0.008, u2), P);
  float turb = 0.5 * (t1 + t2);
  turb = turb * turb * turb * 3.2;
  // Radial profile: hottest at the inner edge, fading outward, soft at both edges.
  float prof = pow(R_IN / rc, 2.0);
  prof *= smoothstep(R_IN, R_IN + 0.3, rc) * (1.0 - smoothstep(R_OUT - 2.5, R_OUT, rc));
  float e = 3.4 * prof * (0.12 + turb);
  // Doppler beaming: gas on a circular orbit at radius r moves at sqrt(1 / (2 r)) of c, about
  // 0.4c at the inner edge. Gas coming toward the camera is boosted (brighter, and tinted
  // warmer here as an art choice), gas moving away is dimmed.
  float beta = sqrt(0.5 / rc);
  vec3 vdir = vec3(-pc.z, 0.0, pc.x) / rc;
  float cosA = dot(vdir, -rd);
  float dop = sqrt(1.0 - beta * beta) / (1.0 - beta * cosA);
  // Gravitational redshift: light climbing out of the well arrives dimmer.
  float g = sqrt(1.0 - 1.0 / rc);
  // Bolometric flux scales with the fourth power of the Doppler factor.
  float d2 = dop * dop;
  e *= d2 * d2 * g * g;
  // Palette: amber on the outskirts, burning through to white where the gas is hottest and beamed.
  vec3 tint = mix(vec3(1.0, 0.8, 0.6), vec3(1.0, 0.56, 0.22), smoothstep(0.7, 1.4, dop));
  tint = mix(tint, vec3(1.0, 0.97, 0.92), smoothstep(0.35, 1.0, prof) * 0.8);
  return e * tint;
}

// Procedural starfield looked up by the final direction of an escaped ray, so stars near
// the hole are smeared and doubled by the lensing for free.
vec3 stars(vec3 d) {
  vec2 sp = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 64.0;
  vec2 cell = floor(sp);
  vec2 f = fract(sp);
  float on = step(0.975, hash12(cell));
  vec2 sPos = vec2(hash12(cell + 11.3), hash12(cell + 27.1));
  vec2 q = f - sPos;
  float s = on * exp(-dot(q, q) * 90.0) * (0.3 + 0.7 * hash12(cell + 5.7));
  return s * vec3(0.9, 0.9, 0.95) * 0.4;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float prog = uProgress * uProgress * (3.0 - 2.0 * uProgress);
  // Camera: sit a few degrees above the disk plane so the disk is nearly edge-on and its far
  // side gets lensed into the halo above and below the shadow. Scroll drifts it up and back.
  // uFit backs the camera off on a narrow canvas so the whole disk stays in frame.
  float dist = mix(14.5, 17.0, prog) * uFit;
  float elev = radians(mix(7.0, 12.0, prog) + uPointer.y * 4.0);
  float yaw = radians(uPointer.x * 4.0);
  vec3 ro = dist * vec3(cos(elev) * sin(yaw), sin(elev), cos(elev) * cos(yaw));
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * 1.25 + rt * uv.x + up * uv.y);

  // Trace the ray backwards from the camera. In these units a light ray obeys
  // a = -1.5 h^2 p / r^5 (h = conserved angular momentum), which is the exact Schwarzschild
  // null geodesic written as a Newtonian style force. Steps grow with distance from the hole.
  vec3 p = ro;
  vec3 v = rd;
  vec3 hv = cross(p, v);
  float h2 = dot(hv, hv);
  vec3 col = vec3(0.0);
  float T = 1.0;
  float rmin = 1e3;
  bool captured = false;
  for (int i = 0; i < STEPS; i++) {
    float r2 = dot(p, p);
    float r = sqrt(r2);
    rmin = min(rmin, r);
    if (r < R_HORIZON) { captured = true; break; }
    if (r > R_FAR && dot(p, v) > 0.0) break;
    float dt = clamp(0.22 * (r - 0.9), 0.04, 1.0);
    v -= 1.5 * h2 * p / (r2 * r2 * r) * dt;
    vec3 pn = p + v * dt;
    if (p.y * pn.y < 0.0) {
      // Crossed the disk plane: add its light, then dim what lies behind (the disk is thin
      // and only partly opaque, so the lensed images show through it).
      vec3 pc = mix(p, pn, p.y / (p.y - pn.y));
      col += T * diskEmit(pc, normalize(v));
      T *= 0.6;
    }
    p = pn;
  }
  if (!captured) {
    col += T * stars(normalize(v));
    // Photon ring: rays whose closest approach skims the photon sphere circle the hole and
    // pile disk light into a thin bright ring right at the edge of the shadow.
    float dr = rmin - R_PHOTON;
    col += vec3(1.0, 0.93, 0.8) * exp(-dr * dr * 95.0) * 1.05;
    // Accent: a faint tint on the rim just outside the ring, the only place the site colour goes.
    col += uAccent * exp(-max(dr, 0.0) * 9.0) * 0.09;
  }
  // Scroll eases the exposure down so text laid over the canvas stays readable.
  float exposure = mix(1.0, 0.42, prog);
  col = 1.0 - exp(-col * exposure);
  gl_FragColor = vec4(col, 1.0);
}
`;

const POST_FRAG = `
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uTex, uv).rgb;
  vec2 q = uv - 0.5;
  c *= 1.0 - 0.45 * dot(q, q);
  c = pow(max(c, 0.0), vec3(1.0 / 2.2));
  // Film grain after gamma so black stays black; the seed freezes under reduced motion.
  vec2 seed = vec2(fract(uTime * 7.31) * 977.0, fract(uTime * 3.17) * 593.0);
  float g = hash12(gl_FragCoord.xy + seed) - 0.5;
  c += g * (0.02 + 0.06 * dot(c, vec3(0.33)));
  gl_FragColor = vec4(c, 1.0);
}
`;

function fullscreenScene(fragmentShader, uniforms) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return { scene, geometry, material };
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function mountGargantua(canvas, { reducedMotion = false, accent = '#ff4b3e' } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false });
  const target = new THREE.WebGLRenderTarget(2, 2, {
    depthBuffer: false, stencilBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
  });
  const rayU = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uFit: { value: 1 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uAccent: { value: new THREE.Color(accent) },
  };
  const postU = { uTex: { value: target.texture }, uRes: { value: new THREE.Vector2(1, 1) }, uTime: { value: 0 } };
  const ray = fullscreenScene(RAY_FRAG, rayU);
  const post = fullscreenScene(POST_FRAG, postU);
  const camera = new THREE.Camera();
  const pointerGoal = new THREE.Vector2(0, 0);

  let raf = 0;
  let visible = true;
  let destroyed = false;
  const t0 = performance.now();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    renderer.setSize(w, h, false);
    target.setSize(Math.max(1, Math.round(w * RAY_SCALE)), Math.max(1, Math.round(h * RAY_SCALE)));
    rayU.uRes.value.set(target.width, target.height);
    // A portrait or square canvas needs the camera further back: the disk spans about 1.35 of the height.
    rayU.uFit.value = Math.max(1, 1.35 / Math.max(0.2, w / h));
    postU.uRes.value.set(w, h);
  }

  function frame() {
    raf = 0;
    if (destroyed) return;
    const time = reducedMotion ? STILL_TIME : (performance.now() - t0) / 1000;
    if (reducedMotion) rayU.uPointer.value.copy(pointerGoal);
    else rayU.uPointer.value.lerp(pointerGoal, POINTER_EASE);
    rayU.uTime.value = time;
    postU.uTime.value = time;
    renderer.setRenderTarget(target);
    renderer.render(ray.scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(post.scene, camera);
    if (!reducedMotion && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  // Reduced motion: one frame per kick (mount, resize, pointer, progress). Otherwise the loop
  // runs only while the canvas is on screen and the tab is visible.
  function kick() {
    if (!raf && !destroyed && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible) kick();
  });
  io.observe(canvas);
  const ro = new ResizeObserver(() => { resize(); kick(); });
  ro.observe(canvas);
  const onVisibility = () => { if (!document.hidden) kick(); };
  document.addEventListener('visibilitychange', onVisibility);
  resize();
  kick();

  return {
    setPointer(nx, ny) {
      pointerGoal.set(clamp(nx, -1, 1), clamp(ny, -1, 1));
      kick();
    },
    setProgress(t) {
      rayU.uProgress.value = clamp(t, 0, 1);
      kick();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      target.dispose();
      ray.geometry.dispose();
      ray.material.dispose();
      post.geometry.dispose();
      post.material.dispose();
      renderer.dispose();
    },
  };
}
