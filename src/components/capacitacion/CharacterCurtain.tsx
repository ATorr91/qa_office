"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { CurtainSoundEngine } from "@/lib/capacitacion/curtainSound";

const CHARACTERS = [
  "未",
  "来",
  "风",
  "尚",
  "光",
  "影",
  "云",
  "龙",
  "凤",
  "福",
  "禄",
  "喜",
  "寿",
  "锦",
  "绣",
  "裳",
];

const CHAR_SIZE = 15;
const COLUMN_GAP = 7;
const ROW_PITCH = 22;
const ROWS = 24;

const CORE_RADIUS = 130;
const RIPPLE_RADIUS = 460;
const MAX_PUSH = 85;
const DRAG_STRENGTH = 60;
const ROT_KICK = 1.0;
const POP_DEPTH = 48;

const WAVE_SPEED = 1.05;
const WAVE_AMPLITUDE = 17;
const FLUTTER_SPEED = 2.3;
const FLUTTER_AMPLITUDE = 6.5;
const Z_FLUTTER_AMPLITUDE = 11;
const AMBIENT_ROT_AMPLITUDE = 0.32;
const GUST_SMOOTHING = 0.16;

const IMPULSE_DURATION = 1.2;
const IMPULSE_FREQ = 12;
const IMPULSE_DAMPING = 2.6;
const IMPULSE_AMPLITUDE = 36;

const PROXIMITY_SMOOTHING = 0.16;
const WIND_SOFTNESS = 55; // larger = gentler, more gradual direction change near the cursor
const BEND_AMOUNT = 15;

function makeCharacterTexture(char: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(60,42,20,1)";
  ctx.font = "300 92px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, 64, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function CharacterCurtain() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const textures = new Map(CHARACTERS.map((c) => [c, makeCharacterTexture(c)]));
    const height = ROWS * ROW_PITCH;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const ndc = new THREE.Vector2();
    const mouseWorld = new THREE.Vector3(99999, 99999, 0);
    const prevMouseWorld = new THREE.Vector3(99999, 99999, 0);
    let gust = 0;

    let sprites: THREE.Sprite[] = [];
    let materials: THREE.SpriteMaterial[] = [];
    let xSetters: ((v: number) => void)[] = [];
    let ySetters: ((v: number) => void)[] = [];
    let zSetters: ((v: number) => void)[] = [];
    let rotSetters: ((v: number) => void)[] = [];
    let columnX: number[] = [];
    let baseY: number[] = [];
    let rowDepth: number[] = [];
    let columnSpeed: number[] = [];
    let columnPhase: number[] = [];
    let columnActive: boolean[] = [];
    let columnLastPluck: number[] = [];
    let columnEntryStart: (number | null)[] = [];
    let columnExitStart: (number | null)[] = [];
    let columnProximitySmoothed: number[] = [];

    const sound = new CurtainSoundEngine();
    let audioUnlocked = false;

    // Browsers only allow starting audio synchronously inside a real user-gesture
    // event handler (click/keydown/pointerdown) — never from a mousemove/hover, and
    // never from code deferred into an animation frame. This listens for the first
    // qualifying gesture anywhere on the page (invisible, no UI) purely to satisfy
    // that requirement; which notes actually play is still gated entirely by
    // hovering the curtain itself, further down in tick().
    const unlockAudio = () => {
      sound.init();
      sound.resume();
      audioUnlocked = true;
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    window.addEventListener("click", unlockAudio);

    const fitCamera = (width: number, heightPx: number) => {
      renderer.setSize(width, heightPx);
      camera.aspect = width / heightPx;
      const distance = heightPx / (2 * Math.tan((camera.fov * Math.PI) / 360));
      camera.position.z = distance;
      camera.updateProjectionMatrix();
    };

    const rebuild = () => {
      sprites.forEach((s) => {
        gsap.killTweensOf(s.position);
        scene.remove(s);
      });
      materials.forEach((m) => {
        gsap.killTweensOf(m);
        m.dispose();
      });
      sprites = [];
      materials = [];
      xSetters = [];
      ySetters = [];
      zSetters = [];
      rotSetters = [];

      const width = host.clientWidth;
      fitCamera(width, height);

      const targetPitch = CHAR_SIZE + COLUMN_GAP;
      const columnCount = Math.max(3, Math.round(width / targetPitch));
      const pitch = width / columnCount; // stretch to span the container edge-to-edge, no leftover slack
      columnX = Array.from({ length: columnCount }, (_, i) => (i + 0.5) * pitch - width / 2);
      baseY = Array.from({ length: ROWS }, (_, r) => height / 2 - r * ROW_PITCH);
      rowDepth = Array.from({ length: ROWS }, (_, r) => Math.pow(r / (ROWS - 1), 1.25));
      columnSpeed = Array.from({ length: columnCount }, () => gsap.utils.random(0.75, 1.35));
      columnPhase = Array.from({ length: columnCount }, () => gsap.utils.random(0, Math.PI * 2));
      columnActive = Array.from({ length: columnCount }, () => false);
      columnLastPluck = Array.from({ length: columnCount }, () => -Infinity);
      columnEntryStart = Array.from({ length: columnCount }, () => null);
      columnExitStart = Array.from({ length: columnCount }, () => null);
      columnProximitySmoothed = Array.from({ length: columnCount }, () => 0);

      for (let i = 0; i < columnCount; i++) {
        const character = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const texture = textures.get(character)!;

        for (let r = 0; r < ROWS; r++) {
          const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1 - (r / ROWS) * 0.8,
            depthTest: false,
          });
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(CHAR_SIZE, CHAR_SIZE, 1);
          sprite.position.set(columnX[i], baseY[r], 0);
          scene.add(sprite);
          sprites.push(sprite);
          materials.push(material);

          xSetters.push(gsap.quickTo(sprite.position, "x", { duration: 0.34, ease: "power2.out" }));
          ySetters.push(gsap.quickTo(sprite.position, "y", { duration: 0.38, ease: "power2.out" }));
          zSetters.push(gsap.quickTo(sprite.position, "z", { duration: 0.3, ease: "power2.out" }));
          rotSetters.push(gsap.quickTo(material, "rotation", { duration: 0.3, ease: "power2.out" }));
        }
      }
    };

    rebuild();

    const updateMouseWorld = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(dragPlane, mouseWorld);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (inside) {
        updateMouseWorld(event.clientX, event.clientY);
      } else {
        mouseWorld.set(99999, 99999, 0);
      }
    };
    const handlePointerLeave = () => {
      mouseWorld.set(99999, 99999, 0);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    const handleResize = () => rebuild();
    window.addEventListener("resize", handleResize);

    const tick = (time: number) => {
      const t = time; // gsap.ticker already reports elapsed time in seconds
      const cursorActive = mouseWorld.x < 9000;
      if (audioUnlocked) sound.setEnergy(gust);

      const dxMouse = mouseWorld.x - prevMouseWorld.x;
      const dyMouse = mouseWorld.y - prevMouseWorld.y;
      const moveDist = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
      const instantSpeed = cursorActive ? Math.min(moveDist / 40, 1.6) : 0;
      gust += (instantSpeed - gust) * GUST_SMOOTHING;
      const dragDirX = moveDist > 0.001 ? dxMouse / moveDist : 0;
      const dragDirY = moveDist > 0.001 ? dyMouse / moveDist : 0;
      prevMouseWorld.copy(mouseWorld);

      let spriteIndex = 0;
      for (let i = 0; i < columnX.length; i++) {
        const dx = mouseWorld.x - columnX[i];
        const speed = columnSpeed[i];
        const phase = columnPhase[i];

        // Proximity is column-level and horizontal-only: the whole strand reacts
        // together (like wind sweeping across it), not a circular bubble that only
        // grabs the rows nearest the cursor's exact height.
        let columnProximityRaw = 0;
        if (cursorActive) {
          const core = Math.exp(-(dx * dx) / (2 * CORE_RADIUS * CORE_RADIUS));
          const ripple = Math.exp(-(dx * dx) / (2 * RIPPLE_RADIUS * RIPPLE_RADIUS));
          columnProximityRaw = Math.min(1.4, core + ripple * 0.4);
        }
        // Ease the "how much wind is hitting this column" value over time instead of
        // snapping to whatever the cursor position implies this exact frame — this is
        // what makes the onset/release feel like momentum building up, not a switch.
        columnProximitySmoothed[i] += (columnProximityRaw - columnProximitySmoothed[i]) * PROXIMITY_SMOOTHING;
        const columnProximity = columnProximitySmoothed[i];

        // A soft sign: instead of snapping between -1/+1 exactly as the cursor
        // crosses the column, the direction (and its magnitude) fades through zero
        // smoothly — so the strand right under the cursor barely moves while the
        // ones just beside it lean away, like fabric actually parting around a hand.
        const windDir = Math.tanh(dx / WIND_SOFTNESS);

        const wasActive = columnActive[i];
        const isActive = columnProximity > 0.22;
        if (isActive && !wasActive) columnEntryStart[i] = t;
        if (!isActive && wasActive) columnExitStart[i] = t;

        let impulse = 0;
        const entryStart = columnEntryStart[i];
        if (entryStart !== null) {
          const dt = t - entryStart;
          if (dt < IMPULSE_DURATION) {
            impulse += Math.sin(dt * IMPULSE_FREQ) * IMPULSE_AMPLITUDE * Math.exp(-dt * IMPULSE_DAMPING);
          } else {
            columnEntryStart[i] = null;
          }
        }
        const exitStart = columnExitStart[i];
        if (exitStart !== null) {
          const dt = t - exitStart;
          if (dt < IMPULSE_DURATION) {
            impulse += Math.sin(dt * IMPULSE_FREQ) * IMPULSE_AMPLITUDE * Math.exp(-dt * IMPULSE_DAMPING);
          } else {
            columnExitStart[i] = null;
          }
        }

        // Pass 2: apply per-row transforms, including the entry/exit oscillation
        for (let r = 0; r < ROWS; r++) {
          const falloff = rowDepth[r];

          const travel = t * WAVE_SPEED * speed - r * 0.45 + i * 0.5 + phase;
          const mainWave = Math.sin(travel) * WAVE_AMPLITUDE * falloff;
          const flutter =
            Math.sin(t * FLUTTER_SPEED * speed + r * 0.9 + i * 1.1) * FLUTTER_AMPLITUDE * falloff;
          const zFlutter =
            Math.cos(t * FLUTTER_SPEED * 0.8 + r * 0.7 + i * 0.9) * Z_FLUTTER_AMPLITUDE * falloff;
          const ambientRot =
            Math.sin(t * FLUTTER_SPEED * 0.55 * speed + r * 0.7 + i * 0.9 + phase) *
            AMBIENT_ROT_AMPLITUDE *
            falloff;

          let pushX = impulse * falloff;
          let pushY = 0;
          let pop = zFlutter;
          let rotKick = impulse * 0.01 * falloff;

          if (cursorActive) {
            const proximity = columnProximity * falloff;
            const gustBoost = 1 + gust * 2.4;
            // A slow, per-row traveling ripple so a pushed strand bends into a soft
            // S-curve instead of leaning as one rigid rod — the hallmark of cloth,
            // not a hinge.
            const bend = Math.sin(t * 1.4 + r * 0.5 + i * 0.7) * proximity * BEND_AMOUNT;

            pushX +=
              -windDir * proximity * MAX_PUSH * gustBoost +
              dragDirX * proximity * DRAG_STRENGTH * gust +
              bend;
            pushY = dragDirY * proximity * DRAG_STRENGTH * 0.6 * gust;
            pop += proximity * POP_DEPTH * (1 + gust * 0.8);
            rotKick += -windDir * proximity * ROT_KICK;
          }

          xSetters[spriteIndex](columnX[i] + mainWave + flutter + pushX);
          ySetters[spriteIndex](baseY[r] + pushY);
          zSetters[spriteIndex](pop);
          rotSetters[spriteIndex](ambientRot + rotKick);
          spriteIndex++;
        }

        if (isActive && (!wasActive || t - columnLastPluck[i] > 0.22)) {
          if (!audioUnlocked) {
            sound.init();
            sound.resume();
            audioUnlocked = true;
          }
          sound.pluck(i, columnProximity, gust);
          columnLastPluck[i] = t;
        }
        columnActive[i] = isActive;
      }
      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      sound.dispose();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      sprites.forEach((s) => gsap.killTweensOf(s.position));
      materials.forEach((m) => {
        gsap.killTweensOf(m);
        m.dispose();
      });
      textures.forEach((tex) => tex.dispose());
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="absolute left-1/2 z-0 pointer-events-none"
      style={{
        top: "calc(100% - 50px)",
        width: "500px",
        transform: "translateX(-50%)",
        height: `${ROWS * ROW_PITCH}px`,
      }}
      aria-hidden
    />
  );
}
