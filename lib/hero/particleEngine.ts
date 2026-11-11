"use client";

// Full-screen GPU particle cloud for the home hero.
// - 262,144 points on desktop (512² position texture), 16,384 on phones (128²).
// - Positions live in a float texture updated by a ping-pong simulation pass each frame:
//   curl-noise drift, a pull onto a signed-distance ring form, a spring back to origin,
//   and a push from a small GPU fluid simulation driven by the cursor.
// - Colors come from the site's CSS tokens (no literal colors here).

import * as THREE from "three";

type Opts = { reduceMotion: boolean };
export type ParticleHero = { dispose(): void };

const FULLSCREEN_VS = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/* ---------------- Particle simulation ---------------- */

const SIM_FS = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tPos;
uniform sampler2D tOrigin;
uniform sampler2D tVel;
uniform sampler2D tDensity;
uniform float uTime;
uniform float uHZ;
uniform float uMouse;
uniform mat4 uProj;
uniform mat4 uModel;
uniform mat3 uCamRot;

vec3 rotq(vec3 v, vec4 q) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }

// A bent, hollow ring with one large opening and soft lobes (about 0.7 units across).
float sdfShape(vec3 p) {
  float l = length(p);
  if (l > 0.8) return l - 0.7;
  p.z = sqrt(p.z * p.z + 0.0215) - sqrt(0.012);
  p = rotq(p, vec4(0.5, 0.5, 0.5, 0.5));
  float a = atan(p.y, p.x);
  p.z += 0.08 * sin(2.0 * a + 0.4);
  float R = 0.25 + 0.03 * sin(3.0 * a + 0.6);
  vec2 q = vec2(length(p.xy) - R, p.z);
  float r = 0.09 + 0.028 * sin(2.0 * a + 1.3) + 0.012 * sin(5.0 * a);
  return length(q) - r;
}

vec3 sdfNormal(vec3 p) {
  const float e = 0.001;
  return vec3(
    sdfShape(p + vec3(e, 0.0, 0.0)) - sdfShape(p - vec3(e, 0.0, 0.0)),
    sdfShape(p + vec3(0.0, e, 0.0)) - sdfShape(p - vec3(0.0, e, 0.0)),
    sdfShape(p + vec3(0.0, 0.0, e)) - sdfShape(p - vec3(0.0, 0.0, e))
  ) / (2.0 * e);
}

// Three sine-sum potentials; curl taken by central differences, then normalized.
vec3 potential(vec3 p) {
  return vec3(
    sin(p.y * 1.7 + 1.3) + sin(p.z * 2.3 + 0.4) * 0.5,
    sin(p.z * 1.9 + 2.1) + sin(p.x * 2.7 + 1.7) * 0.5,
    sin(p.x * 1.5 + 0.7) + sin(p.y * 2.1 + 2.9) * 0.5
  );
}
vec3 curlNoise(vec3 p) {
  const float e = 0.01;
  vec3 dx = vec3(e, 0.0, 0.0), dy = vec3(0.0, e, 0.0), dz = vec3(0.0, 0.0, e);
  vec3 px0 = potential(p - dx), px1 = potential(p + dx);
  vec3 py0 = potential(p - dy), py1 = potential(p + dy);
  vec3 pz0 = potential(p - dz), pz1 = potential(p + dz);
  vec3 c = vec3(
    (py1.z - py0.z) - (pz1.y - pz0.y),
    (pz1.x - pz0.x) - (px1.z - px0.z),
    (px1.y - px0.y) - (py1.x - py0.x)
  ) / (2.0 * e);
  return normalize(c + 1e-6);
}

void main() {
  vec3 pos = texture2D(tPos, vUv).xyz;
  vec3 origin = texture2D(tOrigin, vUv).xyz;

  if (length(pos) > 0.7) pos /= 2.0;
  pos += curlNoise(pos * 0.1 + uTime * 0.05) * 0.0002 * uHZ;
  vec3 gradient = sdfNormal(pos);
  float sdf = sdfShape(pos);
  pos += cross(normalize(pos + 1e-6), normalize(gradient + 1e-6)) * 0.0005;
  pos += -gradient * sdf * 0.5;
  pos += (origin - pos) * 0.0002 * uHZ;

  // Cursor fluid: push along the flow where the cursor has been (density mask).
  if (uMouse > 0.5) {
    vec4 clip = uProj * uModel * vec4(pos, 1.0);
    vec2 screenUV = clip.xy / clip.w * 0.5 + 0.5;
    if (screenUV.x > 0.0 && screenUV.x < 1.0 && screenUV.y > 0.0 && screenUV.y < 1.0) {
      vec3 flow = uCamRot * vec3(texture2D(tVel, screenUV).xy, 0.0);
      float d = texture2D(tDensity, screenUV).r;
      pos += flow * 0.0001 * uHZ * 0.4 * d;
    }
  }
  gl_FragColor = vec4(pos, 1.0);
}
`;

/* ---------------- Point rendering ---------------- */

const POINTS_VS = /* glsl */ `
uniform sampler2D tPos;
uniform float uDPR;
attribute vec4 random;
varying vec4 vRandom;
varying float vScale;
void main() {
  vec3 p = texture2D(tPos, position.xy).xyz;
  p *= mix(1.0, 1.5, pow(random.y, 150.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = length(mv.xyz);
  float scale = smoothstep(3.0, 15.0, dist) * mix(0.5, 1.0, random.z);
  vScale = scale;
  vRandom = random;
  gl_PointSize = 0.04 * uDPR * 2.0 * scale * (1000.0 / dist);
  gl_Position = projectionMatrix * mv;
}
`;

const POINTS_FS = /* glsl */ `
uniform sampler2D tMatcap;
uniform float uTime;
uniform vec3 uBase;
uniform vec3 uAccent;
varying vec4 vRandom;
varying float vScale;

vec3 softLight(vec3 b, vec3 s) {
  return mix(2.0 * b * s + b * b * (1.0 - 2.0 * s), sqrt(b) * (2.0 * s - 1.0) + 2.0 * b * (1.0 - s), step(0.5, s));
}
vec3 overlay(vec3 b, vec3 s) {
  return mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
}

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  if (dot(c, c) > 1.0) discard;
  if (vScale < 0.1) discard;
  vec3 col = uBase * mix(0.0, 0.2, vRandom.x);
  col = mix(col, uAccent, pow(vRandom.z, 100.0));
  float sparkle = 0.5 + (0.4 + sin(uTime * 4.0 + vRandom.y * 20.0)) * pow(vRandom.z, 10.0) * 2.5;
  float ang = sin(uTime + vRandom.z * 20.0) * 0.5 + 1.0;
  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec3 m = texture2D(tMatcap, rot * (gl_PointCoord - 0.5) + 0.5).rgb;
  col = mix(col, softLight(col, m), 0.8);
  col = mix(col, overlay(col, m), 0.2);
  gl_FragColor = vec4(col * sparkle, 1.0);
}
`;

/* ---------------- Fluid simulation (curl → vorticity → divergence → pressure → subtract → advect) ---------------- */

const NEIGHBOR_VS = /* glsl */ `
uniform vec2 texelSize;
varying vec2 vUv, vL, vR, vT, vB;
void main() {
  vUv = uv;
  vL = uv - vec2(texelSize.x, 0.0); vR = uv + vec2(texelSize.x, 0.0);
  vT = uv + vec2(0.0, texelSize.y); vB = uv - vec2(0.0, texelSize.y);
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const FS = {
  splat: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio, radius;
    uniform vec3 color;
    uniform vec2 point, prevPoint;
    void main() {
      vec2 a = prevPoint, b = point, p = vUv;
      a.x *= aspectRatio; b.x *= aspectRatio; p.x *= aspectRatio;
      vec2 ab = b - a;
      float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
      float d = length(p - (a + ab * t));
      vec3 splat = exp(-(d * d) / max(radius * radius * 0.25, 1e-6)) * color;
      gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
    }`,
  curl: /* glsl */ `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).y, R = texture2D(uVelocity, vR).y;
      float T = texture2D(uVelocity, vT).x, B = texture2D(uVelocity, vB).x;
      gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
    }`,
  vorticity: /* glsl */ `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity, uCurl;
    uniform float curl, dt;
    void main() {
      float L = texture2D(uCurl, vL).x, R = texture2D(uCurl, vR).x;
      float T = texture2D(uCurl, vT).x, B = texture2D(uCurl, vB).x, C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force /= length(force) + 0.0001;
      force *= curl * C; force.y *= -1.0;
      gl_FragColor = vec4(texture2D(uVelocity, vUv).xy + force * dt, 0.0, 1.0);
    }`,
  divergence: /* glsl */ `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uVelocity;
    void main() {
      float L = texture2D(uVelocity, vL).x, R = texture2D(uVelocity, vR).x;
      float T = texture2D(uVelocity, vT).y, B = texture2D(uVelocity, vB).y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }`,
  clear: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float value;
    void main() { gl_FragColor = value * texture2D(uTexture, vUv); }`,
  pressure: /* glsl */ `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure, uDivergence;
    void main() {
      float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
      float div = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
    }`,
  gradient: /* glsl */ `
    precision highp float;
    varying vec2 vUv, vL, vR, vT, vB;
    uniform sampler2D uPressure, uVelocity;
    void main() {
      float L = texture2D(uPressure, vL).x, R = texture2D(uPressure, vR).x;
      float T = texture2D(uPressure, vT).x, B = texture2D(uPressure, vB).x;
      vec2 v = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
      gl_FragColor = vec4(v, 0.0, 1.0);
    }`,
  advect: /* glsl */ `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity, uSource;
    uniform vec2 texelSize;
    uniform float dt, dissipation;
    void main() {
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      gl_FragColor = dissipation * texture2D(uSource, coord);
    }`,
};

const FLUID = {
  velocityDissipation: 0.98,
  densityDissipation: 0.97,
  pressureDissipation: 0.95,
  pressureIterations: 5,
  curl: 30,
  dt: 1 / 60,
};

type Double = { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget; swap(): void; dispose(): void };

function doubleTarget(w: number, h: number, opts: THREE.RenderTargetOptions): Double {
  let a = new THREE.WebGLRenderTarget(w, h, opts);
  let b = new THREE.WebGLRenderTarget(w, h, opts);
  return {
    get read() {
      return a;
    },
    get write() {
      return b;
    },
    swap() {
      [a, b] = [b, a];
    },
    dispose() {
      a.dispose();
      b.dispose();
    },
  };
}

/** Grey sphere shading generated per pixel (no color strings), used as the point-sprite matcap. */
function makeMatcap(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size * 2 - 1;
      const ny = (y + 0.5) / size * 2 - 1;
      const r2 = nx * nx + ny * ny;
      const nz = r2 < 1 ? Math.sqrt(1 - r2) : 0;
      // light from top-left-front
      const diff = Math.max(0, nx * -0.4 + ny * 0.5 + nz * 0.77);
      const spec = Math.pow(Math.max(0, nz * 0.9 + ny * 0.3 - nx * 0.2), 24);
      const v = Math.min(255, Math.round((0.18 + 0.62 * diff + 0.5 * spec) * 255));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = r2 < 1 ? v : 0;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function cssColor(name: string): THREE.Color {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || 0x808080);
}

const clampMap = (v: number, a: number, b: number, c: number, d: number) => c + (Math.min(Math.max(v, a), b) - a) / (b - a) * (d - c);

/** Starts the hero. Returns null when the device can't run float render targets (the hero then shows only its UI). */
export function startParticleHero(canvas: HTMLCanvasElement, host: HTMLElement, { reduceMotion }: Opts): ParticleHero | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  if (!renderer.capabilities.isWebGL2 || !renderer.extensions.has("EXT_color_buffer_float")) {
    renderer.dispose();
    return null;
  }

  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 760;
  const SIDE = mobile ? 128 : 512;
  const SIM_RES = mobile ? 128 : 256;
  const DYE_RES = mobile ? 256 : 512;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(cssColor("--bg-0"), 1);
  renderer.autoClear = true;

  /* Scene */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 1000);
  const basePos = new THREE.Vector3(-1.17, 0, 6);
  camera.position.copy(basePos);
  camera.lookAt(0, 0, 0);
  const group = new THREE.Group();
  // Brief: (0.343, 0.16, -1). Shifted left so the form sits between the card column and the text column.
  group.position.set(-0.55, 0.16, -1);
  group.rotation.set(THREE.MathUtils.degToRad(-28.4), THREE.MathUtils.degToRad(390), THREE.MathUtils.degToRad(4.92));
  const baseRot = group.rotation.clone();
  group.scale.set(4, 4, 4.8); // brief: (5, 5, 6); 20% smaller keeps the text column readable
  scene.add(group);

  /* Fullscreen quad */
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quadScene.add(quad);
  const pass = (material: THREE.Material, target: THREE.WebGLRenderTarget | null) => {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCam);
  };

  /* Particle data */
  const count = SIDE * SIDE;
  const origin = new Float32Array(count * 4);
  const randoms = new Float32Array(count * 4);
  const uvs = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    origin[i * 4] = Math.random() * 2 - 1;
    origin[i * 4 + 1] = Math.random() * 2 - 1;
    origin[i * 4 + 2] = Math.random() * 2 - 1;
    origin[i * 4 + 3] = 1;
    for (let k = 0; k < 4; k++) randoms[i * 4 + k] = Math.random();
    uvs[i * 3] = ((i % SIDE) + 0.5) / SIDE;
    uvs[i * 3 + 1] = (Math.floor(i / SIDE) + 0.5) / SIDE;
  }
  const originTex = new THREE.DataTexture(origin, SIDE, SIDE, THREE.RGBAFormat, THREE.FloatType);
  originTex.needsUpdate = true;

  const floatOpts: THREE.RenderTargetOptions = {
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  };
  const positions = doubleTarget(SIDE, SIDE, floatOpts);
  const copyMat = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VS,
    fragmentShader: `precision highp float; varying vec2 vUv; uniform sampler2D t; void main(){ gl_FragColor = texture2D(t, vUv); }`,
    uniforms: { t: { value: originTex } },
  });
  pass(copyMat, positions.read);

  /* Fluid targets */
  const halfOpts = (filter: THREE.MagnificationTextureFilter): THREE.RenderTargetOptions => ({
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const velocity = doubleTarget(SIM_RES, SIM_RES, halfOpts(THREE.LinearFilter));
  const density = doubleTarget(DYE_RES, DYE_RES, halfOpts(THREE.LinearFilter));
  const pressure = doubleTarget(SIM_RES, SIM_RES, halfOpts(THREE.NearestFilter));
  const divergenceT = new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, halfOpts(THREE.NearestFilter));
  const curlT = new THREE.WebGLRenderTarget(SIM_RES, SIM_RES, halfOpts(THREE.NearestFilter));
  const simTexel = new THREE.Vector2(1 / SIM_RES, 1 / SIM_RES);

  const mat = (fs: string, uniforms: Record<string, THREE.IUniform>, neighbors = false) =>
    new THREE.ShaderMaterial({ vertexShader: neighbors ? NEIGHBOR_VS : FULLSCREEN_VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false });

  const splatMat = mat(FS.splat, {
    uTarget: { value: null },
    aspectRatio: { value: 1 },
    radius: { value: 0.1 },
    color: { value: new THREE.Vector3() },
    point: { value: new THREE.Vector2() },
    prevPoint: { value: new THREE.Vector2() },
  });
  const curlMat = mat(FS.curl, { uVelocity: { value: null }, texelSize: { value: simTexel } }, true);
  const vortMat = mat(FS.vorticity, { uVelocity: { value: null }, uCurl: { value: null }, curl: { value: FLUID.curl }, dt: { value: FLUID.dt }, texelSize: { value: simTexel } }, true);
  const divMat = mat(FS.divergence, { uVelocity: { value: null }, texelSize: { value: simTexel } }, true);
  const clearMat = mat(FS.clear, { uTexture: { value: null }, value: { value: FLUID.pressureDissipation } });
  const pressMat = mat(FS.pressure, { uPressure: { value: null }, uDivergence: { value: null }, texelSize: { value: simTexel } }, true);
  const gradMat = mat(FS.gradient, { uPressure: { value: null }, uVelocity: { value: null }, texelSize: { value: simTexel } }, true);
  const advectMat = mat(FS.advect, {
    uVelocity: { value: null },
    uSource: { value: null },
    texelSize: { value: simTexel },
    dt: { value: FLUID.dt },
    dissipation: { value: 1 },
  });

  const simMat = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VS,
    fragmentShader: SIM_FS,
    uniforms: {
      tPos: { value: null },
      tOrigin: { value: originTex },
      tVel: { value: null },
      tDensity: { value: null },
      uTime: { value: 0 },
      uHZ: { value: 1 },
      uMouse: { value: reduceMotion ? 0 : 1 },
      uProj: { value: new THREE.Matrix4() },
      uModel: { value: new THREE.Matrix4() },
      uCamRot: { value: new THREE.Matrix3() },
    },
    depthTest: false,
    depthWrite: false,
  });

  /* Points */
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(uvs, 3));
  geo.setAttribute("random", new THREE.BufferAttribute(randoms, 4));
  const matcap = makeMatcap();
  const pointsMat = new THREE.ShaderMaterial({
    vertexShader: POINTS_VS,
    fragmentShader: POINTS_FS,
    uniforms: {
      tPos: { value: positions.read.texture },
      tMatcap: { value: matcap },
      uDPR: { value: DPR },
      uTime: { value: 0 },
      uBase: { value: cssColor("--silver-200") },
      uAccent: { value: cssColor("--brand-300") },
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, pointsMat);
  points.frustumCulled = false;
  group.add(points);

  /* Size */
  let width = 1;
  let height = 1;
  const resize = () => {
    const r = host.getBoundingClientRect();
    width = Math.max(1, Math.round(r.width));
    height = Math.max(1, Math.round(r.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // Portrait screens: step the camera back so the whole form stays in frame.
    basePos.z = 6 * Math.max(1, 0.75 / camera.aspect);
    if (!mouse.has) {
      camera.position.copy(basePos);
      camera.lookAt(0, 0, 0);
    }
    splatMat.uniforms.aspectRatio.value = width / height;
    if (reduceMotion) render(0);
  };

  /* Input */
  const mouse = { x: 0, y: 0, px: 0, py: 0, has: false, lastSplat: 0 };
  const onMove = (clientX: number, clientY: number) => {
    const r = host.getBoundingClientRect();
    mouse.x = clientX - r.left;
    mouse.y = clientY - r.top;
    if (!mouse.has) {
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.has = true;
    }
  };
  const onPointer = (e: PointerEvent) => onMove(e.clientX, e.clientY);
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) onMove(t.clientX, t.clientY);
  };

  const splat = (target: Double, color: THREE.Vector3, radius: number, a: THREE.Vector2, b: THREE.Vector2) => {
    splatMat.uniforms.uTarget.value = target.read.texture;
    splatMat.uniforms.color.value.copy(color);
    splatMat.uniforms.radius.value = radius;
    splatMat.uniforms.point.value.copy(b);
    splatMat.uniforms.prevPoint.value.copy(a);
    pass(splatMat, target.write);
    target.swap();
  };

  const tmpA = new THREE.Vector2();
  const tmpB = new THREE.Vector2();
  const tmpC = new THREE.Vector3();
  const white = new THREE.Vector3(1, 1, 1);

  const stepFluid = (now: number) => {
    if (mouse.has) {
      const dx = mouse.x - mouse.px;
      const dy = mouse.y - mouse.py;
      const len = Math.hypot(dx, dy);
      if (len > 0.01) {
        const radius = (clampMap(len, 0, 5, 0, 60) * (mobile ? 0.48 : 0.6)) / 200;
        const mult = clampMap(len, 0, 15, 0, 10);
        const fresh = now - mouse.lastSplat > 50;
        tmpB.set(mouse.x / width, 1 - mouse.y / height);
        if (fresh) tmpA.copy(tmpB);
        else tmpA.set(mouse.px / width, 1 - mouse.py / height);
        splat(velocity, tmpC.set(dx * mult, -dy * mult, 1), radius, tmpA, tmpB);
        splat(density, white, radius, tmpA, tmpB);
        mouse.lastSplat = now;
      }
      mouse.px = mouse.x;
      mouse.py = mouse.y;
    }

    curlMat.uniforms.uVelocity.value = velocity.read.texture;
    pass(curlMat, curlT);
    vortMat.uniforms.uVelocity.value = velocity.read.texture;
    vortMat.uniforms.uCurl.value = curlT.texture;
    pass(vortMat, velocity.write);
    velocity.swap();
    divMat.uniforms.uVelocity.value = velocity.read.texture;
    pass(divMat, divergenceT);
    clearMat.uniforms.uTexture.value = pressure.read.texture;
    pass(clearMat, pressure.write);
    pressure.swap();
    pressMat.uniforms.uDivergence.value = divergenceT.texture;
    for (let i = 0; i < FLUID.pressureIterations; i++) {
      pressMat.uniforms.uPressure.value = pressure.read.texture;
      pass(pressMat, pressure.write);
      pressure.swap();
    }
    gradMat.uniforms.uPressure.value = pressure.read.texture;
    gradMat.uniforms.uVelocity.value = velocity.read.texture;
    pass(gradMat, velocity.write);
    velocity.swap();
    advectMat.uniforms.uVelocity.value = velocity.read.texture;
    advectMat.uniforms.uSource.value = velocity.read.texture;
    advectMat.uniforms.dissipation.value = FLUID.velocityDissipation;
    pass(advectMat, velocity.write);
    velocity.swap();
    advectMat.uniforms.uSource.value = density.read.texture;
    advectMat.uniforms.dissipation.value = FLUID.densityDissipation;
    pass(advectMat, density.write);
    density.swap();
  };

  const target = new THREE.Vector3();
  const projView = new THREE.Matrix4();
  let time = 0;

  const stepParticles = (dt: number) => {
    camera.updateMatrixWorld();
    group.updateMatrixWorld();
    projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const u = simMat.uniforms;
    u.tPos.value = positions.read.texture;
    u.tVel.value = velocity.read.texture;
    u.tDensity.value = density.read.texture;
    u.uTime.value = time;
    u.uHZ.value = dt * 60;
    (u.uProj.value as THREE.Matrix4).copy(projView);
    (u.uModel.value as THREE.Matrix4).copy(group.matrixWorld);
    (u.uCamRot.value as THREE.Matrix3).setFromMatrix4(camera.matrixWorld);
    pass(simMat, positions.write);
    positions.swap();
  };

  const render = (dt: number) => {
    if (!reduceMotion && mouse.has) {
      target.set(basePos.x + ((mouse.x / width) * 2 - 1) * -1, basePos.y + ((mouse.y / height) * 2 - 1) * 2, basePos.z);
      camera.position.lerp(target, 0.05);
      camera.lookAt(0, 0, 0);
    }
    pointsMat.uniforms.tPos.value = positions.read.texture;
    pointsMat.uniforms.uTime.value = time;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
    void dt;
  };

  /* Loop */
  let raf = 0;
  let last = performance.now();
  let visible = true;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!visible || document.hidden) {
      last = now;
      return;
    }
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    time += dt;
    // Page-wide backdrop: the form slowly turns as the page scrolls.
    const sy = window.scrollY;
    group.rotation.y = baseRot.y + sy * 0.0004;
    group.rotation.x = baseRot.x + sy * 0.00012;
    stepFluid(now);
    stepParticles(dt);
    render(dt);
  };

  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;
  });
  io.observe(host);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  if (reduceMotion) {
    // No animation: settle the form off-screen, then draw a single still frame.
    for (let i = 0; i < 360; i++) {
      time += 1 / 60;
      stepParticles(1 / 60);
    }
    render(0);
  } else {
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    raf = requestAnimationFrame(frame);
  }

  return {
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      positions.dispose();
      velocity.dispose();
      density.dispose();
      pressure.dispose();
      divergenceT.dispose();
      curlT.dispose();
      originTex.dispose();
      matcap.dispose();
      geo.dispose();
      [pointsMat, simMat, copyMat, splatMat, curlMat, vortMat, divMat, clearMat, pressMat, gradMat, advectMat].forEach((m) => m.dispose());
      quad.geometry.dispose();
      renderer.dispose();
    },
  };
}
