// Wave: a monochrome Gerstner ocean on a single dense plane, shaded in the fragment
// shader with a hairline grid over it. The giant swell is driven by scroll progress.
import * as THREE from '../vendor/three.module.min.js';

const MAX_DPR = 1.5;
const STILL_TIME = 7.0;
const SEG_X = 240;
const NEAR = 3;
const FAR = 260;
const CAMERA_HEIGHT = 2.6;
const ROW_ANGLE_STEP = 0.0022;
const ROW_MAX_STEP = 4;
// Wide enough for a 21:9 canvas plus the sideways Gerstner drift.
const HALF_FOV_TAN = Math.tan((55 / 2) * Math.PI / 180) * 2.6;

// Hex values are meant as the on-screen colour, so they bypass three's sRGB to linear conversion.
const raw = (hex) => new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
const TONES = {
  ink: { water: 0x101216, crest: 0xe8e4dc, line: 0xe8e4dc, fog: 0x26282d, sky: 0x0a0a0c },
  paper: { water: 0xe3dfd6, crest: 0x141414, line: 0x141414, fog: 0xf1eee7, sky: 0xf6f4ef },
};

// Shared by both stages. The rest position (x, z before displacement) interpolates exactly
// across a triangle, so the fragment shader can re-evaluate the same wave field per pixel
// and get smooth normals and thin analytic crest lines instead of per-vertex blobs.
const FIELD = `
uniform float uTime;
uniform float uSwellAmp;
uniform float uSwellQ;

struct Sea {
  vec3 disp;
  vec3 tx;
  vec3 tz;
  float swellS;
  float swellAmp;
  float rippleJ;
  float rippleMax;
};

// One Gerstner component. Surface points travel in circles, so crests sharpen and troughs
// flatten; q in 0..1 sets how sharp. Accumulates the displacement and the two tangents.
float wave(vec2 dir, float len, float amp, float q, float speed, vec2 xz, inout vec3 disp, inout vec3 tx, inout vec3 tz) {
  float k = 6.2831853 / len;
  float c = sqrt(9.8 / k) * speed;
  float phi = k * dot(dir, xz) - c * k * uTime;
  float s = sin(phi);
  float co = cos(phi);
  float qa = q * amp;
  float wa = k * amp;
  disp += vec3(qa * dir.x * co, amp * s, qa * dir.y * co);
  tx += vec3(-q * dir.x * dir.x * wa * s, dir.x * wa * co, -q * dir.x * dir.y * wa * s);
  tz += vec3(-q * dir.x * dir.y * wa * s, dir.y * wa * co, -q * dir.y * dir.y * wa * s);
  return s;
}

Sea sea(vec2 xz) {
  Sea o;
  o.disp = vec3(0.0);
  o.tx = vec3(1.0, 0.0, 0.0);
  o.tz = vec3(0.0, 0.0, 1.0);
  float ahead = -xz.y;
  // Giant swell: grows with scroll progress and is held away from the camera so it looms
  // ahead instead of swallowing the viewpoint.
  o.swellAmp = uSwellAmp * smoothstep(6.0, 48.0, ahead);
  o.swellS = wave(normalize(vec2(0.14, 1.0)), 72.0, o.swellAmp, uSwellQ, 0.22, xz, o.disp, o.tx, o.tz);
  // The smaller trains are tracked separately so their crest lines can be drawn on their own
  // compression, not blurred into the swell's.
  vec3 rd = vec3(0.0);
  vec3 rx = vec3(1.0, 0.0, 0.0);
  vec3 rz = vec3(0.0, 0.0, 1.0);
  // Small waves fade with distance: far away they are smaller than a pixel and would only alias.
  float fine = 1.0 - smoothstep(40.0, 110.0, ahead);
  wave(normalize(vec2(0.42, 0.91)), 19.0, 0.55, 0.55, 0.55, xz, rd, rx, rz);
  wave(normalize(vec2(-0.6, 0.8)), 9.5, 0.26, 0.65, 0.6, xz, rd, rx, rz);
  wave(normalize(vec2(0.86, 0.5)), 4.6, 0.12 * fine, 0.75, 0.7, xz, rd, rx, rz);
  wave(normalize(vec2(-0.3, 0.95)), 2.3, 0.05 * fine, 0.7, 0.8, xz, rd, rx, rz);
  o.disp += rd;
  o.tx += rx - vec3(1.0, 0.0, 0.0);
  o.tz += rz - vec3(0.0, 0.0, 1.0);
  // Jacobian of the horizontal displacement: drops toward zero where the surface bunches at a crest.
  o.rippleJ = rx.x * rz.z - rx.z * rz.x;
  o.rippleMax = 0.1 + 0.112 + (0.123 + 0.096) * fine;
  return o;
}
`;

const SEA_VERT = `${FIELD}
varying vec2 vRest;
varying vec3 vWorld;
varying vec2 vUv;
void main() {
  Sea s = sea(position.xz);
  vec3 pos = position + s.disp;
  vRest = position.xz;
  vWorld = pos;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const SEA_FRAG = `${FIELD}
uniform vec3 uWater;
uniform vec3 uCrest;
uniform vec3 uLine;
uniform vec3 uFog;
uniform vec2 uGrid;
uniform float uFogDensity;
varying vec2 vRest;
varying vec3 vWorld;
varying vec2 vUv;

void main() {
  Sea s = sea(vRest);
  vec3 N = normalize(cross(s.tz, s.tx));
  vec3 toCam = cameraPosition - vWorld;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  float ndv = max(dot(N, V), 0.0);
  // Ink water: lit faintly from the sky, with a fresnel sheen at grazing angles so the
  // far field lifts toward the haze while the water underfoot stays ink.
  vec3 col = uWater * (0.55 + 0.45 * max(N.y, 0.0));
  float fres = pow(1.0 - ndv, 4.0);
  vec3 sheen = mix(uFog, uCrest, 0.3);
  col = mix(col, sheen, 0.55 * fres);
  // One low light ahead and to the left, so the swell faces read as broad soft gradients.
  vec3 L = normalize(vec3(-0.5, 0.3, -0.8));
  float diff = max(dot(N, L), 0.0);
  col += uCrest * (0.04 * diff + 0.14 * diff * diff * diff);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 48.0);
  col += uCrest * 0.12 * spec;
  // Thin light lines: the swell's crest once it is up, and the small trains where they
  // reinforce each other (compression near its local maximum).
  float top = smoothstep(0.982, 0.999, s.swellS) * clamp((s.swellAmp - 1.0) / 6.0, 0.0, 1.0);
  float squeeze = (1.0 - s.rippleJ) / s.rippleMax;
  float ripple = smoothstep(0.74, 0.96, squeeze);
  col = mix(col, uCrest, max(top, ripple * 0.7) * 0.9);
  // Wireframe look: a hairline grid over the undisplaced mesh, each axis fading out once
  // its cells shrink to a few pixels.
  vec2 gp = vUv * uGrid;
  vec2 fw = fwidth(gp);
  vec2 gd = abs(fract(gp - 0.5) - 0.5) / fw;
  vec2 lines = (1.0 - min(gd, 1.0)) * (1.0 - smoothstep(0.12, 0.45, fw));
  float line = max(lines.x, lines.y);
  col = mix(col, uLine, line * 0.16);
  // Soft fog toward the horizon.
  float fog = 1.0 - exp(-max(dist - 12.0, 0.0) * uFogDensity);
  col = mix(col, uFog, fog);
  gl_FragColor = vec4(col, 1.0);
}
`;

const SKY_VERT = 'void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }';
const SKY_FRAG = `
uniform vec3 uSky;
uniform vec3 uFog;
uniform vec2 uRes;
void main() {
  float y = gl_FragCoord.y / uRes.y;
  gl_FragColor = vec4(mix(uFog, uSky, smoothstep(0.42, 0.85, y)), 1.0);
}
`;

// Rows spaced so they land a few pixels apart on screen: near the camera the ground
// foreshortens hard, so spacing grows with distance squared, capped so the far swell
// still has enough rows to stay smooth. Width follows the view frustum with a margin.
function rowDistances() {
  const rows = [NEAR];
  let z = NEAR;
  while (z < FAR) {
    z += Math.min(ROW_MAX_STEP, ROW_ANGLE_STEP * z * z);
    rows.push(Math.min(z, FAR));
  }
  return rows;
}

function buildSea() {
  const distances = rowDistances();
  const cols = SEG_X + 1;
  const rows = distances.length;
  const segZ = rows - 1;
  const position = new Float32Array(cols * rows * 3);
  const uv = new Float32Array(cols * rows * 2);
  for (let j = 0; j < rows; j++) {
    const ahead = distances[j];
    const halfWidth = ahead * HALF_FOV_TAN + 14;
    for (let i = 0; i < cols; i++) {
      const un = i / SEG_X;
      const n = j * cols + i;
      position[n * 3] = (un - 0.5) * 2 * halfWidth;
      position[n * 3 + 1] = 0;
      position[n * 3 + 2] = -ahead;
      uv[n * 2] = un;
      uv[n * 2 + 1] = j / segZ;
    }
  }
  const index = new Uint32Array(SEG_X * segZ * 6);
  let k = 0;
  for (let j = 0; j < segZ; j++) {
    for (let i = 0; i < SEG_X; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      // Counter-clockwise seen from above, so the top of the water is the front face.
      index[k++] = a; index[k++] = b; index[k++] = c;
      index[k++] = b; index[k++] = d; index[k++] = c;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(index, 1));
  return { geometry, segZ };
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (t) => t * t * (3 - 2 * t);

export function mountWave(canvas, { reducedMotion = false, tone = 'ink' } = {}) {
  const palette = TONES[tone] || TONES.ink;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: false });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 700);

  const { geometry: seaGeometry, segZ } = buildSea();
  const seaU = {
    uTime: { value: 0 },
    uSwellAmp: { value: 0.4 },
    uSwellQ: { value: 0.35 },
    uWater: { value: raw(palette.water) },
    uCrest: { value: raw(palette.crest) },
    uLine: { value: raw(palette.line) },
    uFog: { value: raw(palette.fog) },
    uGrid: { value: new THREE.Vector2(SEG_X / 2, segZ / 4) },
    uFogDensity: { value: 0.0075 },
  };
  const seaMaterial = new THREE.ShaderMaterial({ vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, uniforms: seaU });
  const sea = new THREE.Mesh(seaGeometry, seaMaterial);
  sea.frustumCulled = false;
  scene.add(sea);

  const skyU = { uSky: { value: raw(palette.sky) }, uFog: { value: raw(palette.fog) }, uRes: { value: new THREE.Vector2(1, 1) } };
  const skyGeometry = new THREE.BufferGeometry();
  skyGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const skyMaterial = new THREE.ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: skyU, depthWrite: false });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.frustumCulled = false;
  scene.add(sky);

  let raf = 0;
  let visible = true;
  let destroyed = false;
  const t0 = performance.now();

  function setProgressValue(t) {
    const e = ease(clamp01(t));
    seaU.uSwellAmp.value = 0.4 + 12.6 * e;
    seaU.uSwellQ.value = 0.35 + 0.37 * e;
    camera.position.set(0, CAMERA_HEIGHT - 0.7 * e, 0);
    camera.lookAt(0, 0.4 - 1.0 * e, -120);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    skyU.uRes.value.set(w, h);
  }

  function frame() {
    raf = 0;
    if (destroyed) return;
    seaU.uTime.value = reducedMotion ? STILL_TIME : (performance.now() - t0) / 1000;
    renderer.render(scene, camera);
    if (!reducedMotion && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  // Reduced motion: one frame per kick (mount, resize, progress). Otherwise the loop runs
  // only while the canvas is on screen and the tab is visible.
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
  setProgressValue(0);
  resize();
  kick();

  return {
    setProgress(t) {
      setProgressValue(t);
      kick();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      seaGeometry.dispose();
      seaMaterial.dispose();
      skyGeometry.dispose();
      skyMaterial.dispose();
      renderer.dispose();
    },
  };
}
