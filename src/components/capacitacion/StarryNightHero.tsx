"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { Hanken_Grotesk, IM_Fell_English, JetBrains_Mono } from "next/font/google";

const fontDisplay = IM_Fell_English({ weight: "400", subsets: ["latin"], variable: "--sn-display", display: "swap" });
const fontBody = Hanken_Grotesk({ subsets: ["latin"], variable: "--sn-body", display: "swap" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--sn-mono", display: "swap" });

const TOTAL_FRAMES = 289;
const IMG_W = 1280;
const IMG_H = 1014;
const BASE_FOV = 50;
const PAD_X = 320;
const PAD_B = 260;
const GROUND_W = IMG_W + PAD_X * 2;
const GROUND_H = IMG_H + PAD_B;
const ASSET_V = "27";

const CHAPTERS = [
  { from: 0, to: 0.08, first: true, when: "Saint-Rémy · June 1889", title: "The Starry Night", body: "Scroll to step inside the painting." },
  { from: 0.16, to: 0.33, when: "The view from the asylum", title: "A sky in motion", body: "Painted from memory, a quiet village night became a sea of turbulent light." },
  { from: 0.44, to: 0.6, when: "The moon", title: "A crescent of fire", body: "Every star wears its own halo of brushstrokes. Move the cursor, the paint answers." },
  { from: 0.62, to: 0.76, when: "The cypress", title: "The dark flame", body: "It reaches from earth to sky. Walk around it, nothing else in the canvas stands so close." },
  { from: 0.79, to: 0.91, when: "The village", title: "Rooftops asleep", body: "Every window is lit, nobody is awake. Take the controls with Explore and wander the streets." },
  { from: 0.94, to: 1.01, when: "Back to the canvas", title: "Built by LGPSM", body: "Scroll-driven sites, 3D and motion for brands that want to be remembered." },
];

// Tour path. Camera (cu, cv, cf) = image-space position (v DOWN) and distance as a
// fraction of the "whole painting" distance; look (lu, lv, lz) is the point it faces.
// `dwell` (0..1) is how much the camera lingers when it arrives at that waypoint.
type Key = { p: number; cu: number; cv: number; cf: number; lu: number; lv: number; lz: number; dwell: number };
const PATH: Key[] = [
  { p: 0.0, cu: 0.5, cv: 0.5, cf: 1.0, lu: 0.5, lv: 0.5, lz: 0, dwell: 1 },
  { p: 0.09, cu: 0.5, cv: 0.47, cf: 0.9, lu: 0.5, lv: 0.45, lz: 0, dwell: 0.4 },
  { p: 0.22, cu: 0.47, cv: 0.42, cf: 0.66, lu: 0.55, lv: 0.37, lz: -300, dwell: 0.95 },
  { p: 0.36, cu: 0.62, cv: 0.32, cf: 0.5, lu: 0.72, lv: 0.24, lz: -520, dwell: 0.3 },
  { p: 0.5, cu: 0.74, cv: 0.31, cf: 0.46, lu: 0.86, lv: 0.2, lz: -700, dwell: 0.95 },
  { p: 0.6, cu: 0.5, cv: 0.47, cf: 0.62, lu: 0.3, lv: 0.5, lz: 120, dwell: 0.3 },
  { p: 0.71, cu: 0.36, cv: 0.56, cf: 0.5, lu: 0.26, lv: 0.47, lz: 150, dwell: 0.95 },
  { p: 0.8, cu: 0.52, cv: 0.68, cf: 0.36, lu: 0.57, lv: 0.78, lz: -150, dwell: 0.3 },
  { p: 0.88, cu: 0.58, cv: 0.8, cf: 0.2, lu: 0.6, lv: 0.82, lz: -250, dwell: 0.95 },
  { p: 0.96, cu: 0.5, cv: 0.6, cf: 0.68, lu: 0.5, lv: 0.5, lz: 0, dwell: 0.4 },
  { p: 1.0, cu: 0.5, cv: 0.5, cf: 1.0, lu: 0.5, lv: 0.5, lz: 0, dwell: 1 },
];

// World layout (world units ~ painting pixels at z = 0)
const Z_SKY = -1100;
const Z_MOON = -820;
const Z_BACK = -520;
const GROUND_Z0 = -520;
const GROUND_RANGE = 700;
const SKY_EXTENT = 2.6;
const STAR_Z = [-900, -760, -640, -520, -420, -600, -700, -480, -560, -380, -460];
const MIST = [
  { z: -900, scale: 1.0, alpha: 0.2, speed: 0.012, offset: [0.17, -0.08] },
  { z: -730, scale: 0.8, alpha: 0.18, speed: -0.017, offset: [-0.2, 0.12] },
  { z: -580, scale: 0.65, alpha: 0.14, speed: 0.022, offset: [0.05, 0.2] },
];

// x, y (px), radius (px): index 0 is the moon, the rest map to atlas cells
const STARS: [number, number, number][] = [
  [1155, 175, 115],
  [136, 44, 52],
  [297, 35, 42],
  [442, 40, 52],
  [528, 67, 40],
  [304, 178, 58],
  [779, 86, 62],
  [901, 237, 56],
  [417, 331, 44],
  [58, 457, 40],
  [175, 476, 56],
  [452, 537, 82],
];

const IMPASTO = /* glsl */ `
float lumaAt(sampler2D t, vec2 uv) { return dot(texture2D(t, uv).rgb, vec3(0.30, 0.59, 0.11)); }
vec3 impasto(sampler2D t, vec2 uv, vec2 texel, vec3 col, vec3 L, float k) {
  float gx = lumaAt(t, uv + vec2(texel.x, 0.0)) - lumaAt(t, uv - vec2(texel.x, 0.0));
  float gy = lumaAt(t, uv + vec2(0.0, texel.y)) - lumaAt(t, uv - vec2(0.0, texel.y));
  vec3 n = normalize(vec3(-gx * k, -gy * k, 1.0));
  return col * (1.0 + (dot(n, L) - L.z) * 1.05);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 rot(vec2 q, float a) { float c = cos(a), s = sin(a); return vec2(c * q.x - s * q.y, s * q.x + c * q.y); }
`;

const SKY_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTime;
uniform float uAsp;
uniform vec2 uMouse;
uniform float uStir;
uniform float uPresence;
uniform float uExtent;
uniform vec3 uLight;
uniform vec2 uTexel;
${IMPASTO}

vec2 swirl(vec2 uv, vec2 c, float amp, float sig, float ph) {
  vec2 q = (uv - c) * vec2(uAsp, 1.0);
  float a = amp * (0.8 + 0.5 * sin(uTime * 0.5 + ph)) * exp(-dot(q, q) / sig);
  q = rot(q, a);
  return c + q / vec2(uAsp, 1.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * uExtent + 0.5;
  vec2 p = uv * vec2(uAsp, 1.0);
  vec2 flow = vec2(
    sin(p.y * 7.0 + uTime * 0.55 + sin(p.x * 5.0 - uTime * 0.3) * 1.5),
    cos(p.x * 6.0 - uTime * 0.45 + sin(p.y * 6.0 + uTime * 0.35) * 1.5)
  ) * 0.0045;
  uv += flow;
  uv = swirl(uv, vec2(0.51, 0.66), 0.2, 0.035, 0.0);
  uv = swirl(uv, vec2(0.69, 0.51), 0.24, 0.012, 1.7);

  vec2 q = (uv - uMouse) * vec2(uAsp, 1.0);
  float r2 = dot(q, q);
  q = rot(q, uStir * exp(-r2 / 0.03) * 1.6);
  uv = uMouse + q / vec2(uAsp, 1.0);

  vec2 fold = 1.0 - abs(1.0 - mod(uv, 2.0));
  vec2 tc = fold * 0.964 + 0.018;
  vec3 col = texture2D(uTex, tc).rgb;
  col = impasto(uTex, tc, uTexel * 1.3, col, uLight, 4.6);
  vec2 oo = abs(uv - 0.5) - 0.5;
  col = mix(col, vec3(0.03, 0.05, 0.12), smoothstep(0.0, 0.09, max(oo.x, oo.y)));
  col += vec3(1.0, 0.82, 0.4) * exp(-r2 / 0.01) * 0.07 * uPresence;
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}
`;

const MIST_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTime;
uniform float uScale;
uniform float uAlpha;
uniform vec2 uOffset;
uniform float uSpeed;
void main() {
  vec2 uv = (vUv - 0.5) * uScale + 0.5 + uOffset + vec2(uTime * uSpeed, uTime * uSpeed * 0.4);
  vec2 fold = 1.0 - abs(1.0 - mod(uv, 2.0));
  vec3 col = texture2D(uTex, fold * 0.964 + 0.018).rgb;
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x) * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
  gl_FragColor = vec4(col * 1.1, smoothstep(0.5, 0.82, lum) * uAlpha * edge);
}
`;

const GROUND_VERT = /* glsl */ `
uniform sampler2D uDepth;
uniform float uD;
uniform float uZ0;
uniform float uRange;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  float zv = uZ0 + d * uRange;
  float s = (uD - zv) / uD;
  vec4 w = vec4(position.xy * s, zv, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * w;
}
`;

const GROUND_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec3 vWorld;
uniform sampler2D uTex;
uniform sampler2D uDepth;
uniform vec2 uTexel;
uniform float uRange;
uniform vec3 uLight;
uniform vec3 uCamPos;
uniform vec3 uFog;
uniform float uVolume;
${IMPASTO}
void main() {
  vec4 c = texture2D(uTex, vUv);
  if (c.a < 0.3) discard;
  vec3 col = c.rgb;

  vec2 e = uTexel * 2.0;
  float dR = texture2D(uDepth, vUv + vec2(e.x, 0.0)).r;
  float dL = texture2D(uDepth, vUv - vec2(e.x, 0.0)).r;
  float dU = texture2D(uDepth, vUv + vec2(0.0, e.y)).r;
  float dD = texture2D(uDepth, vUv - vec2(0.0, e.y)).r;
  vec2 slope = vec2(dR - dL, dU - dD) * uRange * 0.25;
  float steep = length(slope);
  float alpha = c.a * (1.0 - smoothstep(4.0, 10.0, steep));
  if (alpha < 0.25) discard;

  vec3 nd = normalize(vec3(-slope.x, -slope.y, 1.0));
  col = impasto(uTex, vUv, uTexel * 1.2, col, uLight, 5.2);
  col *= 1.0 + (dot(nd, uLight) - uLight.z) * uVolume;

  float dist = length(vWorld - uCamPos);
  col = mix(col, uFog, smoothstep(900.0, 3000.0, dist) * 0.32);
  gl_FragColor = vec4(col, alpha);
}
`;

const SPRITE_VERT = /* glsl */ `
uniform float uTime;
uniform float uPhase;
uniform float uHover;
uniform vec4 uTile;
varying vec2 vUv;
varying vec2 vLocal;
void main() {
  float a = uTime * 0.12 * (mod(uPhase, 2.0) < 1.0 ? 1.0 : -1.0) + uPhase;
  float pulse = 1.0 + 0.035 * sin(uTime * 1.3 + uPhase * 2.0) + uHover * 0.1;
  vec2 local = uv - 0.5;
  vLocal = local;
  vec2 lr = vec2(cos(a) * local.x - sin(a) * local.y, sin(a) * local.x + cos(a) * local.y);
  vUv = uTile.xy + (lr + 0.5) * uTile.zw;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy * pulse, position.z, 1.0);
}
`;

const SPRITE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
varying vec2 vLocal;
uniform sampler2D uTex;
uniform float uFade;
uniform float uTime;
uniform float uPhase;
uniform float uHover;
void main() {
  vec4 c = texture2D(uTex, vUv);
  float glow = 1.0 + 0.16 * sin(uTime * 1.3 + uPhase * 2.0) + uHover * 0.55;
  float edge = 1.0 - smoothstep(0.44, 0.5, length(vLocal));
  gl_FragColor = vec4(c.rgb * glow, c.a * uFade * edge);
}
`;

const DUST_VERT = /* glsl */ `
attribute float aSeed;
attribute float aBig;
uniform float uTime;
uniform float uScale;
uniform float uVel;
varying float vA;
varying vec3 vC;
varying float vBig;
void main() {
  vec3 p = position;
  float t = uTime * 0.15;
  p.x += sin(t * 1.3 + aSeed * 40.0) * 60.0;
  p.y += cos(t * 1.1 + aSeed * 55.0) * 50.0;
  p.z += sin(t * 0.9 + aSeed * 23.0) * 50.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = -mv.z;
  float worldSize = aBig > 0.5 ? 26.0 + 40.0 * fract(aSeed * 5.31) : 3.0 + 9.0 * fract(aSeed * 7.13);
  gl_PointSize = clamp(worldSize * uScale / max(dist, 1.0), 1.0, aBig > 0.5 ? 120.0 : 28.0);
  vC = mix(vec3(0.55, 0.75, 1.0), vec3(1.0, 0.86, 0.45), step(0.72, fract(aSeed * 3.7)));
  float fade = smoothstep(50.0, 260.0, dist) * (1.0 - smoothstep(1500.0, 2800.0, dist));
  vA = fade * (0.3 + 0.7 * fract(aSeed * 11.3)) * (1.0 + uVel * 2.5) * (aBig > 0.5 ? 0.16 : 1.0);
  vBig = aBig;
  gl_Position = projectionMatrix * mv;
}
`;

const DUST_FRAG = /* glsl */ `
precision highp float;
varying float vA;
varying vec3 vC;
varying float vBig;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  float soft = vBig > 0.5 ? a : a * a;
  gl_FragColor = vec4(vC, soft * vA * 0.55);
}
`;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function catmull(p0: number, p1: number, p2: number, p3: number, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function sampleTour(p: number, D: number, pos: THREE.Vector3, look: THREE.Vector3) {
  let i = 0;
  while (i < PATH.length - 2 && p >= PATH[i + 1].p) i++;
  const k1 = PATH[i];
  const k2 = PATH[i + 1];
  const k0 = PATH[Math.max(0, i - 1)];
  const k3 = PATH[Math.min(PATH.length - 1, i + 2)];
  const t = clamp((p - k1.p) / (k2.p - k1.p), 0, 1);
  const dw = (k1.dwell + k2.dwell) / 2;
  const e = t * (1 - dw) + (t * t * t * (t * (t * 6 - 15) + 10)) * dw;
  const cr = (key: "cu" | "cv" | "cf" | "lu" | "lv" | "lz") => catmull(k0[key], k1[key], k2[key], k3[key], e);
  pos.set((cr("cu") - 0.5) * IMG_W, (0.5 - cr("cv")) * IMG_H, cr("cf") * D);
  look.set((cr("lu") - 0.5) * IMG_W, (0.5 - cr("lv")) * IMG_H, cr("lz"));
}

function smoothDamp(cur: number, target: number, vel: { v: number }, smoothTime: number, dt: number) {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const ex = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = cur - target;
  const temp = (vel.v + omega * change) * dt;
  vel.v = (vel.v - omega * temp) * ex;
  return target + (change + temp) * ex;
}

function loadTexture(loader: THREE.TextureLoader, url: string) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    loader.load(
      url,
      (tex) => {
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.anisotropy = 4;
        resolve(tex);
      },
      undefined,
      reject
    );
  });
}

function imageToGrid(img: CanvasImageSource, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

export default function StarryNightHero() {
  const scrollyRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLButtonElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const apiRef = useRef<{ toggle: () => void } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const scrolly = scrollyRef.current;
    const stage = stageRef.current;
    if (!host || !scrolly || !stage) return;
    const stageEl = stage;
    const scrollyEl = scrolly;

    let disposed = false;
    let tick: ((time: number, deltaMs: number) => void) | null = null;
    const cleanups: (() => void)[] = [];

    const failToStatic = () => {
      stage.style.backgroundImage = "url(/capacitacion/starry-night.jpg)";
      stage.style.backgroundSize = "cover";
      stage.style.backgroundPosition = "center";
      loaderRef.current?.classList.add("done");
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      failToStatic();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x080d1c, 1);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(BASE_FOV, 1, 10, 7000);
    const disposables: { dispose: () => void }[] = [];
    const track = <T extends { dispose: () => void }>(o: T) => {
      disposables.push(o);
      return o;
    };

    const textureLoader = new THREE.TextureLoader();
    const v = `?v=${ASSET_V}`;
    Promise.all([
      loadTexture(textureLoader, `/capacitacion/starry/sky.jpg${v}`),
      loadTexture(textureLoader, `/capacitacion/starry/back.webp${v}`),
      loadTexture(textureLoader, `/capacitacion/starry/ground.webp${v}`),
      loadTexture(textureLoader, `/capacitacion/starry/depth.png${v}`),
      loadTexture(textureLoader, `/capacitacion/starry/stars.webp${v}`),
      loadTexture(textureLoader, `/capacitacion/starry/moon.webp${v}`),
    ])
      .then(([skyTex, backTex, groundTex, depthTex, starsTex, moonTex]) => {
        const all = [skyTex, backTex, groundTex, depthTex, starsTex, moonTex];
        if (disposed) {
          all.forEach((t) => t.dispose());
          return;
        }
        skyTex.wrapS = skyTex.wrapT = THREE.MirroredRepeatWrapping;
        all.forEach((t) => track(t));
        build({ skyTex, backTex, groundTex, depthTex, starsTex, moonTex });
        loaderRef.current?.classList.add("done");
      })
      .catch(() => {
        if (!disposed) failToStatic();
      });

    function build(tx: Record<"skyTex" | "backTex" | "groundTex" | "depthTex" | "starsTex" | "moonTex", THREE.Texture>) {
      let D = 1000;
      const lightDir = new THREE.Vector3(0.4, 0.5, 0.75).normalize();
      const fogColor = new THREE.Color(0.1, 0.16, 0.38);
      const camPosU = new THREE.Vector3();

      // --- sky plate -------------------------------------------------------
      const skyMat = track(
        new THREE.ShaderMaterial({
          vertexShader: SKY_VERT,
          fragmentShader: SKY_FRAG,
          depthWrite: false,
          uniforms: {
            uTex: { value: tx.skyTex },
            uTime: { value: 0 },
            uAsp: { value: IMG_W / IMG_H },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uStir: { value: 0 },
            uPresence: { value: 0 },
            uExtent: { value: SKY_EXTENT },
            uLight: { value: lightDir },
            uTexel: { value: new THREE.Vector2(1 / IMG_W, 1 / IMG_H) },
          },
        })
      );
      const planeGeo = track(new THREE.PlaneGeometry(IMG_W, IMG_H));
      const skyMesh = new THREE.Mesh(planeGeo, skyMat);
      skyMesh.renderOrder = 0;
      scene.add(skyMesh);

      // --- drifting mist (cloud ribbons borrowed from the sky) -------------
      const mists = MIST.map((m, i) => {
        const mat = track(
          new THREE.ShaderMaterial({
            vertexShader: SKY_VERT,
            fragmentShader: MIST_FRAG,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uTex: { value: tx.skyTex },
              uTime: { value: 0 },
              uScale: { value: m.scale },
              uAlpha: { value: m.alpha },
              uOffset: { value: new THREE.Vector2(m.offset[0], m.offset[1]) },
              uSpeed: { value: m.speed },
            },
          })
        );
        const mesh = new THREE.Mesh(planeGeo, mat);
        mesh.renderOrder = 1 + i * 0.1;
        scene.add(mesh);
        return { mesh, mat, z: m.z };
      });

      // --- stars + moon ----------------------------------------------------
      const spriteGeo = track(new THREE.PlaneGeometry(1, 1));
      const sprites: {
        mesh: THREE.Mesh;
        cx: number;
        cy: number;
        z: number;
        size: number;
        mat: THREE.ShaderMaterial;
        hover: number;
        k: number;
      }[] = [];
      STARS.forEach(([cx, cy, r], i) => {
        const isMoon = i === 0;
        const cell = i - 1;
        const tile = isMoon
          ? new THREE.Vector4(0, 0, 1, 1)
          : new THREE.Vector4((cell % 4) * 0.25, 1 - (Math.floor(cell / 4) + 1) / 3, 0.25, 1 / 3);
        const mat = track(
          new THREE.ShaderMaterial({
            vertexShader: SPRITE_VERT,
            fragmentShader: SPRITE_FRAG,
            transparent: true,
            depthWrite: false,
            uniforms: {
              uTex: { value: isMoon ? tx.moonTex : tx.starsTex },
              uTile: { value: tile },
              uTime: { value: 0 },
              uPhase: { value: i * 1.7 },
              uFade: { value: 1 },
              uHover: { value: 0 },
            },
          })
        );
        const mesh = new THREE.Mesh(spriteGeo, mat);
        mesh.renderOrder = isMoon ? 2 : 2.5;
        scene.add(mesh);
        sprites.push({ mesh, cx, cy, z: isMoon ? Z_MOON : STAR_Z[cell], size: r * 1.45 * 2, mat, hover: 0, k: 1 });
      });

      // --- far ground plate (what you see through gaps in the relief) ------
      const backGeo = track(new THREE.PlaneGeometry(GROUND_W, GROUND_H, 8, 8));
      backGeo.translate(0, -PAD_B / 2, 0);
      const backMat = track(
        new THREE.ShaderMaterial({
          vertexShader: GROUND_VERT,
          fragmentShader: GROUND_FRAG,
          transparent: true,
          depthWrite: true,
          uniforms: {
            uTex: { value: tx.backTex },
            uDepth: { value: tx.depthTex },
            uTexel: { value: new THREE.Vector2(1 / GROUND_W, 1 / GROUND_H) },
            uRange: { value: 0 },
            uLight: { value: lightDir },
            uCamPos: { value: camPosU },
            uFog: { value: fogColor },
            uVolume: { value: 0 },
            uD: { value: D },
            uZ0: { value: Z_BACK },
          },
        })
      );
      const backMesh = new THREE.Mesh(backGeo, backMat);
      backMesh.frustumCulled = false;
      backMesh.renderOrder = 4;
      scene.add(backMesh);

      // --- the relief: painting displaced by estimated depth ---------------
      const groundGeo = track(new THREE.PlaneGeometry(GROUND_W, GROUND_H, 240, 160));
      groundGeo.translate(0, -PAD_B / 2, 0);
      const groundMat = track(
        new THREE.ShaderMaterial({
          vertexShader: GROUND_VERT,
          fragmentShader: GROUND_FRAG,
          transparent: true,
          depthWrite: true,
          uniforms: {
            uTex: { value: tx.groundTex },
            uDepth: { value: tx.depthTex },
            uTexel: { value: new THREE.Vector2(1 / GROUND_W, 1 / GROUND_H) },
            uRange: { value: GROUND_RANGE },
            uLight: { value: lightDir },
            uCamPos: { value: camPosU },
            uFog: { value: fogColor },
            uVolume: { value: 0.55 },
            uD: { value: D },
            uZ0: { value: GROUND_Z0 },
          },
        })
      );
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.frustumCulled = false;
      groundMesh.renderOrder = 5;
      scene.add(groundMesh);

      // CPU copy of the relief for collisions while exploring
      const GRID_W = 480;
      const GRID_H = Math.round((GRID_W * GROUND_H) / GROUND_W);
      const depthPx = imageToGrid(tx.depthTex.image as CanvasImageSource, GRID_W, GRID_H);
      const alphaPx = imageToGrid(tx.groundTex.image as CanvasImageSource, GRID_W, GRID_H);
      const terrainZ = (x: number, y: number) => {
        let z = GROUND_Z0 + GROUND_RANGE * 0.3;
        let hit = false;
        for (let i = 0; i < 3; i++) {
          const s = (D - z) / D;
          const ix = x / s + IMG_W / 2;
          const iy = IMG_H / 2 - y / s;
          const u = (ix + PAD_X) / GROUND_W;
          const vv = iy / GROUND_H;
          if (u < 0 || u > 1 || vv < 0 || vv > 1) return -Infinity;
          const gi = (Math.min(GRID_H - 1, Math.floor(vv * GRID_H)) * GRID_W + Math.min(GRID_W - 1, Math.floor(u * GRID_W))) * 4;
          if (alphaPx[gi + 3] < 140) return -Infinity;
          z = GROUND_Z0 + (depthPx[gi] / 255) * GROUND_RANGE;
          hit = true;
        }
        return hit ? z : -Infinity;
      };

      // --- floating paint dust (small flecks + large soft bokeh) -----------
      const DUST = 2200;
      const BIG = 90;
      const total = DUST + BIG;
      const dustPos = new Float32Array(total * 3);
      const dustSeed = new Float32Array(total);
      const dustBig = new Float32Array(total);
      for (let i = 0; i < total; i++) {
        dustPos[i * 3] = (Math.random() - 0.5) * 2600;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 1800;
        dustPos[i * 3 + 2] = -1000 + Math.random() * 1900;
        dustSeed[i] = Math.random();
        dustBig[i] = i >= DUST ? 1 : 0;
      }
      const dustGeo = track(new THREE.BufferGeometry());
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(dustSeed, 1));
      dustGeo.setAttribute("aBig", new THREE.BufferAttribute(dustBig, 1));
      const dustMat = track(
        new THREE.ShaderMaterial({
          vertexShader: DUST_VERT,
          fragmentShader: DUST_FRAG,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { uTime: { value: 0 }, uScale: { value: 1000 }, uVel: { value: 0 } },
        })
      );
      const dust = new THREE.Points(dustGeo, dustMat);
      dust.frustumCulled = false;
      dust.renderOrder = 6;
      scene.add(dust);

      // --- layout / resize -------------------------------------------------
      const layout = () => {
        const w = stageEl.clientWidth;
        const h = stageEl.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        const visibleH = Math.min(IMG_H, IMG_W / camera.aspect);
        D = visibleH / (2 * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)));
        skyMesh.position.set(0, 0, Z_SKY);
        skyMesh.scale.setScalar(((D - Z_SKY) / D) * SKY_EXTENT);
        mists.forEach((m) => {
          m.mesh.position.set(0, 0, m.z);
          m.mesh.scale.setScalar(((D - m.z) / D) * SKY_EXTENT);
        });
        backMat.uniforms.uD.value = D;
        groundMat.uniforms.uD.value = D;
        sprites.forEach((s) => {
          s.k = (D - s.z) / D;
          s.mesh.position.set((s.cx - IMG_W / 2) * s.k, (IMG_H / 2 - s.cy) * s.k, s.z);
          s.mesh.scale.setScalar(s.size * s.k);
        });
        camera.updateProjectionMatrix();
      };
      layout();
      window.addEventListener("resize", layout);
      cleanups.push(() => window.removeEventListener("resize", layout));

      // --- state -----------------------------------------------------------
      const pointer = { x: 0.5, y: 0.5, present: false };
      const smooth = { p: 0, prev: 0, vel: 0 };
      const pVel = { v: 0 };
      const mouseSm = { x: 0.5, y: 0.5 };
      const state = { stir: 0, presence: 0, flow: 0 };
      const rig = new THREE.Camera();
      const tourPos = new THREE.Vector3();
      const tourLook = new THREE.Vector3();
      const tourQuat = new THREE.Quaternion();
      const expQuat = new THREE.Quaternion();
      const euler = new THREE.Euler(0, 0, 0, "YXZ");
      const tmpV = new THREE.Vector3();
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const skyUniforms = skyMat.uniforms;

      const exp = {
        active: false,
        w: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        yaw: 0,
        pitch: 0,
        yawT: 0,
        pitchT: 0,
        wheel: 0,
        drag: false,
        moved: 0,
        keys: new Set<string>(),
        fly: null as null | {
          t: number;
          dur: number;
          from: THREE.Vector3;
          to: THREE.Vector3;
          fromYaw: number;
          fromPitch: number;
        },
      };
      let hoverIdx = -1;
      let lastFrame = -1;
      const modeBtn = modeRef.current;

      const setExplore = (on: boolean) => {
        if (on === exp.active) return;
        exp.active = on;
        stageEl.classList.toggle("exploring", on);
        document.documentElement.style.overflow = on ? "hidden" : "";
        if (modeBtn) modeBtn.textContent = on ? "Back to tour" : "Explore";
        if (on) {
          euler.setFromQuaternion(camera.quaternion, "YXZ");
          exp.yaw = exp.yawT = euler.y;
          exp.pitch = exp.pitchT = euler.x;
          exp.pos.copy(camera.position);
          exp.vel.set(0, 0, 0);
          exp.wheel = 0;
          exp.fly = null;
        }
      };
      apiRef.current = { toggle: () => setExplore(!exp.active) };
      cleanups.push(() => {
        apiRef.current = null;
        document.documentElement.style.overflow = "";
      });

      const flyToStar = (i: number) => {
        const s = sprites[i];
        if (!exp.active) setExplore(true);
        const dist = Math.max(360, s.size * s.k * 1.25);
        exp.fly = {
          t: 0,
          dur: 3.2,
          from: camera.position.clone(),
          to: new THREE.Vector3(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z + dist),
          fromYaw: exp.yaw,
          fromPitch: exp.pitch,
        };
        exp.vel.set(0, 0, 0);
      };

      // --- input -----------------------------------------------------------
      const onMove = (e: PointerEvent) => {
        if (exp.drag) {
          const dx = e.movementX || 0;
          const dy = e.movementY || 0;
          exp.moved += Math.abs(dx) + Math.abs(dy);
          if (exp.active) {
            exp.yawT -= dx * 0.0034;
            exp.pitchT = clamp(exp.pitchT - dy * 0.0034, -1.25, 1.25);
          }
        }
        pointer.x = e.clientX / window.innerWidth;
        pointer.y = 1 - e.clientY / window.innerHeight;
        pointer.present = true;
      };
      const onLeave = () => {
        pointer.present = false;
      };
      const onDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest(".sn-btn")) return;
        exp.drag = true;
        exp.moved = 0;
        stageEl.setPointerCapture?.(e.pointerId);
      };
      const onUp = (e: PointerEvent) => {
        const wasDrag = exp.drag;
        const wasClick = exp.moved < 6;
        exp.drag = false;
        stageEl.releasePointerCapture?.(e.pointerId);
        if (wasDrag && wasClick && hoverIdx >= 0) flyToStar(hoverIdx);
      };
      const onWheel = (e: WheelEvent) => {
        if (!exp.active) return;
        e.preventDefault();
        exp.wheel += e.deltaY;
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape" && exp.active) {
          setExplore(false);
          return;
        }
        if (!exp.active) return;
        const k = e.key.toLowerCase();
        if (["w", "a", "s", "d", "q", "e", "c", " ", "shift", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) {
          e.preventDefault();
          if (e.type === "keydown") exp.keys.add(k);
          else exp.keys.delete(k);
        }
      };
      window.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("pointerleave", onLeave);
      stageEl.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      stageEl.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKey);
      window.addEventListener("keyup", onKey);
      cleanups.push(() => {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        stageEl.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        stageEl.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("keyup", onKey);
      });

      const constrain = (pos: THREE.Vector3) => {
        pos.z = clamp(pos.z, -90, D * 1.25);
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const planeHalfW = (IMG_W / 2) * ((D - Z_SKY) / D);
        const planeHalfH = (IMG_H / 2) * ((D - Z_SKY) / D);
        const viewHalfW = (pos.z - Z_SKY) * tanHalf * camera.aspect;
        const viewHalfH = (pos.z - Z_SKY) * tanHalf;
        const maxX = Math.max(260, planeHalfW - viewHalfW + 140);
        const maxY = Math.max(220, planeHalfH - viewHalfH + 140);
        pos.x = clamp(pos.x, -maxX, maxX);
        pos.y = clamp(pos.y, -maxY, maxY);
        const tz = terrainZ(pos.x, pos.y);
        if (tz > -Infinity) pos.z = Math.max(pos.z, tz + 95);
      };

      const fwd = new THREE.Vector3();
      const right = new THREE.Vector3();
      const want = new THREE.Vector3();
      const upV = new THREE.Vector3(0, 1, 0);

      tick = (time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs / 1000, 0.05) || 0.016;

        // scroll progress with a critically damped spring (inertia, no rush)
        const rect = scrollyEl.getBoundingClientRect();
        const span = Math.max(1, scrollyEl.offsetHeight - window.innerHeight);
        const target = clamp(-rect.top / span, 0, 1);
        smooth.prev = smooth.p;
        smooth.p = clamp(smoothDamp(smooth.p, target, pVel, 0.62, dt), 0, 1);
        const p = smooth.p;
        const velRaw = Math.abs(p - smooth.prev) / dt;
        smooth.vel += (velRaw - smooth.vel) * (1 - Math.exp(-dt * 4));

        const prevX = mouseSm.x;
        const prevY = mouseSm.y;
        const follow = 1 - Math.exp(-dt * 7);
        mouseSm.x += (pointer.x - mouseSm.x) * follow;
        mouseSm.y += (pointer.y - mouseSm.y) * follow;
        const speed = Math.hypot(mouseSm.x - prevX, mouseSm.y - prevY) / dt;
        state.stir += (clamp(speed * 0.9, 0, 1) - state.stir) * (1 - Math.exp(-dt * 4));
        state.presence += ((pointer.present ? 1 : 0) - state.presence) * (1 - Math.exp(-dt * 5));
        state.flow += dt * (1 + smooth.vel * 7);
        const mx = mouseSm.x * 2 - 1;
        const my = mouseSm.y * 2 - 1;

        // ---- tour pose ----
        sampleTour(p, D, tourPos, tourLook);
        const breathe = Math.sin(time * 0.23) * 0.5 + Math.sin(time * 0.57) * 0.25;
        tourPos.x += mx * 60 + Math.sin(time * 0.31) * 9;
        tourPos.y += my * 40 + Math.cos(time * 0.27) * 7 + breathe * 5;
        tourPos.z += breathe * 12;
        rig.position.copy(tourPos);
        rig.lookAt(tourLook);
        rig.rotateY(-mx * 0.05);
        rig.rotateX(my * 0.035);
        rig.rotateZ(-mx * 0.016 + Math.sin(time * 0.19) * 0.004);
        tourQuat.copy(rig.quaternion);

        // ---- explore pose ----
        if (exp.active) {
          if (exp.fly) {
            const f = exp.fly;
            f.t += dt / f.dur;
            const e = f.t >= 1 ? 1 : f.t * f.t * (3 - 2 * f.t);
            exp.pos.lerpVectors(f.from, f.to, e);
            exp.yawT = f.fromYaw * (1 - e);
            exp.pitchT = f.fromPitch * (1 - e);
            exp.yaw = exp.yawT;
            exp.pitch = exp.pitchT;
            if (f.t >= 1) exp.fly = null;
          } else {
            exp.yaw += (exp.yawT - exp.yaw) * (1 - Math.exp(-dt * 9));
            exp.pitch += (exp.pitchT - exp.pitch) * (1 - Math.exp(-dt * 9));
            euler.set(exp.pitch, exp.yaw, 0, "YXZ");
            expQuat.setFromEuler(euler);
            fwd.set(0, 0, -1).applyQuaternion(expQuat);
            right.set(1, 0, 0).applyQuaternion(expQuat);
            const k = exp.keys;
            const f = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
            const r = (k.has("d") || k.has("arrowright") ? 1 : 0) - (k.has("a") || k.has("arrowleft") ? 1 : 0);
            const u = (k.has("e") || k.has(" ") ? 1 : 0) - (k.has("q") || k.has("c") ? 1 : 0);
            const sp = k.has("shift") ? 980 : 300;
            want.set(0, 0, 0).addScaledVector(fwd, f * sp).addScaledVector(right, r * sp).addScaledVector(upV, u * sp * 0.7);
            exp.vel.lerp(want, 1 - Math.exp(-dt * (f || r || u ? 2.6 : 1.7)));
            exp.vel.addScaledVector(fwd, -exp.wheel * 0.55);
            exp.wheel = 0;
            exp.pos.addScaledVector(exp.vel, dt);
          }
          constrain(exp.pos);
        }
        euler.set(exp.pitch, exp.yaw, 0, "YXZ");
        expQuat.setFromEuler(euler);

        // ---- blend tour <-> explore ----
        exp.w += ((exp.active ? 1 : 0) - exp.w) * (1 - Math.exp(-dt * 2.4));
        if (Math.abs((exp.active ? 1 : 0) - exp.w) < 0.002) exp.w = exp.active ? 1 : 0;
        const bw = exp.w * exp.w * (3 - 2 * exp.w);
        camera.position.lerpVectors(tourPos, exp.pos, bw);
        camera.quaternion.copy(tourQuat).slerp(expQuat, bw);
        camera.fov = BASE_FOV + clamp(smooth.vel * 40, 0, 6) + clamp(exp.vel.length() / 260, 0, 1) * 4 * exp.w;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        camPosU.copy(camera.position);

        // ---- light follows the cursor (raking light over the impasto) ----
        lightDir
          .set(mx * 0.75 + 0.3 + Math.sin(time * 0.17) * 0.12, my * 0.55 + 0.5 + Math.cos(time * 0.13) * 0.08, 0.72)
          .normalize();

        // ---- sky + cursor ----
        skyUniforms.uTime.value = state.flow;
        ndc.set(mx, my);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObject(skyMesh, false)[0];
        if (hit?.uv)
          (skyUniforms.uMouse.value as THREE.Vector2).set(
            (hit.uv.x - 0.5) * SKY_EXTENT + 0.5,
            (hit.uv.y - 0.5) * SKY_EXTENT + 0.5
          );
        skyUniforms.uStir.value = (0.18 + 0.82 * state.stir) * state.presence;
        skyUniforms.uPresence.value = state.presence;
        mists.forEach((m) => (m.mat.uniforms.uTime.value = state.flow));

        // ---- stars: fade when close, hover glow, click target ----
        const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        let newHover = -1;
        let best = 1e9;
        sprites.forEach((s, i) => {
          s.mat.uniforms.uTime.value = state.flow;
          const dist = camera.position.distanceTo(s.mesh.position);
          const front = s.mesh.position.z < camera.position.z - 40 ? 1 : 0;
          s.mat.uniforms.uFade.value = smoothstep(90, 320, dist) * front;
          tmpV.copy(s.mesh.position).project(camera);
          const half = (s.size * s.k * 0.34) / (dist * 2 * tanHalf);
          const dx = (tmpV.x - mx) * camera.aspect;
          const dy = tmpV.y - my;
          const d = Math.hypot(dx, dy);
          if (front && tmpV.z < 1 && d < half && d < best && state.presence > 0.5) {
            best = d;
            newHover = i;
          }
        });
        hoverIdx = newHover;
        sprites.forEach((s, i) => {
          s.hover += ((i === hoverIdx ? 1 : 0) - s.hover) * (1 - Math.exp(-dt * 6));
          s.mat.uniforms.uHover.value = s.hover;
        });
        stageEl.style.cursor = hoverIdx >= 0 ? "pointer" : exp.active ? (exp.drag ? "grabbing" : "grab") : "";

        dustMat.uniforms.uTime.value = state.flow;
        dustMat.uniforms.uVel.value = smooth.vel + exp.vel.length() / 600;
        dustMat.uniforms.uScale.value = renderer.domElement.height / (2 * tanHalf);

        renderer.render(scene, camera);

        const frame = Math.round(p * (TOTAL_FRAMES - 1)) + 1;
        if (frame !== lastFrame) {
          lastFrame = frame;
          if (numRef.current) numRef.current.textContent = String(frame).padStart(3, "0");
        }
        if (barRef.current) barRef.current.style.width = `${p * 100}%`;
        if (hintRef.current) hintRef.current.style.opacity = p > 0.02 || exp.active ? "0" : "1";
        CHAPTERS.forEach((ch, i) => {
          chapterRefs.current[i]?.classList.toggle("on", !exp.active && p >= ch.from && p < ch.to);
        });
      };
      gsap.ticker.add(tick);
    }

    return () => {
      disposed = true;
      if (tick) gsap.ticker.remove(tick);
      cleanups.forEach((fn) => fn());
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className={`sn-root ${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <style>{CSS}</style>

      <section ref={scrollyRef} className="sn-scrolly">
        <div ref={stageRef} className="sn-stage">
          <div ref={hostRef} className="sn-canvas" aria-hidden />
          <div className="sn-vignette" />

          {CHAPTERS.map((ch, i) => (
            <div
              key={ch.title}
              ref={(el) => {
                chapterRefs.current[i] = el;
              }}
              className={`sn-chapter${ch.first ? " first" : ""}${i === 0 ? " on" : ""}`}
            >
              <div className="when">{ch.when}</div>
              <h2>{ch.title}</h2>
              <p>{ch.body}</p>
            </div>
          ))}

          <div className="sn-gate">
            <span ref={numRef}>001</span>
            <span className="bar">
              <i ref={barRef} />
            </span>
            <span>{String(TOTAL_FRAMES).padStart(3, "0")}</span>
          </div>
          <div ref={hintRef} className="sn-hint">
            Scroll
          </div>

          <button ref={modeRef} type="button" className="sn-btn" onClick={() => apiRef.current?.toggle()}>
            Explore
          </button>
          <div className="sn-help">
            <b>W A S D</b> move · <b>Q E</b> down / up · <b>Shift</b> fast · <b>drag</b> look · <b>wheel</b> glide ·{" "}
            <b>click a star</b> to fly there · <b>Esc</b> exit
          </div>

          <div ref={loaderRef} className="sn-loader">
            <div className="box">
              <h3>Preparing the painting</h3>
              <div className="progress">
                <i />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sn-after">
        <div className="placard">
          <h2>
            The Starry Night, <em>set in motion</em>
          </h2>
          <div>
            <p>
              Vincent van Gogh painted The Starry Night in June 1889 from his room at the Saint-Paul-de-Mausole asylum in
              Saint-Rémy-de-Provence, working from memory and imagination rather than from the view itself. The village
              is invented; the sky is not. It now hangs at The Museum of Modern Art in New York.
            </p>
            <dl>
              <dt>Artist</dt>
              <dd>Vincent van Gogh (1853–1890)</dd>
              <dt>Date</dt>
              <dd>1889</dd>
              <dt>Medium</dt>
              <dd>Oil on canvas</dd>
              <dt>Size</dt>
              <dd>73.7 × 92.1 cm</dd>
              <dt>Collection</dt>
              <dd>The Museum of Modern Art, New York</dd>
              <dt>Scroll experience by</dt>
              <dd>LGPSM</dd>
            </dl>
          </div>
        </div>
        <p className="fine">
          Painting in the public domain. Depth was estimated with Depth Anything V2 and the canvas is flown through live
          in WebGL; brushstroke relief is lit in real time.
        </p>
      </section>
    </div>
  );
}

const CSS = `
.sn-root{--night:#080d1c;--ice:#eae7da;--fog:#8e9aae;--gilt:#e3c15a;--line:rgba(234,231,218,.14);
  background:var(--night);color:var(--ice);font-family:var(--sn-body),"Helvetica Neue",Arial,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
.sn-root *{box-sizing:border-box}
.sn-scrolly{position:relative;height:1100vh}
.sn-stage{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;background:var(--night);touch-action:pan-y}
.sn-stage.exploring{touch-action:none;user-select:none}
.sn-canvas{position:absolute;inset:0}
.sn-canvas canvas{width:100%!important;height:100%!important;display:block}
.sn-vignette{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120% 90% at 50% 45%,rgba(8,13,28,0) 55%,rgba(8,13,28,.75) 100%),
             linear-gradient(rgba(8,13,28,.55) 0%,rgba(8,13,28,0) 18%,rgba(8,13,28,0) 70%,rgba(8,13,28,.85) 100%)}
.sn-chapter{position:absolute;left:clamp(16px,5vw,64px);bottom:clamp(72px,12vh,120px);max-width:min(30rem,calc(100% - 32px));
  opacity:0;transform:translateY(14px);transition:opacity .9s ease,transform .9s ease;pointer-events:none}
.sn-chapter.on{opacity:1;transform:none}
.sn-chapter .when{font-family:var(--sn-mono),ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gilt)}
.sn-chapter h2{font-family:var(--sn-display),Georgia,serif;font-weight:400;font-size:clamp(30px,4.6vw,58px);line-height:1.05;margin:.3em 0 .35em;text-wrap:balance;color:var(--ice)}
.sn-chapter p{margin:0;color:var(--ice);opacity:.85;max-width:34ch}
.sn-chapter.first{bottom:auto;top:50%;transform:translateY(-40%)}
.sn-chapter.first.on{transform:translateY(-50%)}
.sn-gate{position:absolute;right:clamp(16px,4vw,40px);bottom:clamp(20px,4vh,36px);display:flex;align-items:center;gap:12px;
  font-family:var(--sn-mono),ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.1em;color:var(--fog);font-variant-numeric:tabular-nums}
.sn-gate .bar{display:block;width:clamp(80px,14vw,180px);height:1px;background:var(--line);position:relative}
.sn-gate .bar i{position:absolute;inset:0 auto 0 0;width:0;background:var(--gilt)}
.sn-hint{position:absolute;left:50%;bottom:clamp(20px,4vh,36px);transform:translateX(-50%);font-family:var(--sn-mono),ui-monospace,Menlo,monospace;font-size:11px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--fog);transition:opacity .4s}
.sn-btn{position:absolute;right:clamp(16px,4vw,40px);bottom:clamp(56px,9vh,84px);z-index:6;cursor:pointer;
  font-family:var(--sn-mono),ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--ice);
  background:rgba(8,13,28,.35);border:1px solid rgba(234,231,218,.35);border-radius:999px;padding:10px 18px;backdrop-filter:blur(6px);transition:background .25s,border-color .25s,color .25s}
.sn-btn:hover{background:var(--gilt);border-color:var(--gilt);color:#1a1405}
.sn-help{position:absolute;left:50%;bottom:clamp(16px,3.4vh,30px);transform:translate(-50%,8px);width:min(calc(100% - 32px),52rem);text-align:center;pointer-events:none;
  font-family:var(--sn-mono),ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.08em;color:var(--fog);opacity:0;transition:opacity .6s,transform .6s}
.sn-help b{color:var(--ice);font-weight:500}
.sn-stage.exploring .sn-help{opacity:1;transform:translate(-50%,0)}
.sn-loader{position:absolute;inset:0;display:grid;place-items:center;padding:16px;background:var(--night);z-index:5;transition:opacity .8s}
.sn-loader.done{opacity:0;pointer-events:none}
.sn-loader .box{display:grid;gap:14px;justify-items:center;text-align:center}
.sn-loader h3{font-family:var(--sn-display),Georgia,serif;font-weight:400;font-size:28px;margin:0}
.sn-loader .progress{width:220px;max-width:100%;height:1px;background:var(--line);position:relative;overflow:hidden}
.sn-loader .progress i{position:absolute;inset:0;background:var(--gilt);transform:translateX(-100%);animation:sn-load 1.2s ease-in-out infinite}
@keyframes sn-load{to{transform:translateX(100%)}}
.sn-after{padding-block:clamp(72px,12vh,140px);padding-inline:clamp(16px,5vw,64px);display:grid;gap:56px;max-width:1120px;margin:0 auto}
.sn-after .placard{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:clamp(24px,5vw,72px);align-items:start}
.sn-after h2{font-family:var(--sn-display),Georgia,serif;font-weight:400;font-size:clamp(36px,5vw,64px);line-height:1;margin:0;text-wrap:balance}
.sn-after h2 em{color:var(--gilt)}
.sn-after p{margin:0 0 1em;color:var(--ice);opacity:.85;max-width:60ch}
.sn-after dl{margin:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px 24px;border-top:1px solid var(--line);padding-top:18px}
.sn-after dt{font-family:var(--sn-mono),ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--fog);padding-top:3px}
.sn-after dd{margin:0;font-size:15px}
.sn-after .fine{font-size:12px;color:var(--fog);margin:0;border-top:1px solid var(--line);padding-top:24px}
@media (max-width:720px){.sn-after .placard{grid-template-columns:minmax(0,1fr)}.sn-chapter p{font-size:15px}.sn-help{display:none}}
@media (prefers-reduced-motion:reduce){.sn-chapter,.sn-loader{transition:none}}
`;
