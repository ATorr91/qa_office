"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

const LENS_RX = 42;
const LENS_RY = 32;
const FRAME_WIDTH = 4.5;
const LENS_GAP = 20;
const GROUP_SCALE = 4.4;

const FRAME_COLOR = 0xcda668;
const LENS_COLOR = 0x1a1410;

function buildLensPoints(rx: number, ry: number) {
  const segments = 64;
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const topFactor = Math.max(0, Math.sin(t));
    const squeeze = 1 - 0.22 * Math.pow(topFactor, 1.6);
    const peak = Math.exp(-Math.pow((t - Math.PI / 2) / 0.55, 2)) * 0.1;
    const x = Math.cos(t) * rx * squeeze;
    const y = Math.sin(t) * ry * (1 + peak);
    points.push(new THREE.Vector2(x, y));
  }
  return points;
}

function buildLensShape(rx: number, ry: number) {
  const points = buildLensPoints(rx, ry);
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y);
  shape.closePath();
  return shape;
}

function buildFrameShape(rx: number, ry: number, frameWidth: number) {
  const outer = buildLensShape(rx + frameWidth, ry + frameWidth);
  const inner = buildLensShape(rx, ry);
  outer.holes.push(inner as unknown as THREE.Path);
  return outer;
}

function makeGlareTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  // A soft diagonal streak: bright, narrow core fading fast across its short axis
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.42, "rgba(255,255,255,0)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.58, "rgba(255,255,255,0)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 128);
  // fade the ends of the streak too, so it doesn't look like a hard-edged bar
  const edgeFade = ctx.createLinearGradient(0, 0, 256, 0);
  edgeFade.addColorStop(0, "rgba(0,0,0,1)");
  edgeFade.addColorStop(0.15, "rgba(0,0,0,0)");
  edgeFade.addColorStop(0.85, "rgba(0,0,0,0)");
  edgeFade.addColorStop(1, "rgba(0,0,0,1)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = edgeFade;
  ctx.fillRect(0, 0, 256, 128);
  ctx.globalCompositeOperation = "source-over";
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function buildLensUnit(side: 1 | -1, glareTexture: THREE.Texture) {
  const unit = new THREE.Group();

  const lensDepth = 3;
  const lensGeo = new THREE.ExtrudeGeometry(buildLensShape(LENS_RX, LENS_RY), {
    depth: lensDepth,
    bevelEnabled: true,
    bevelThickness: 0.6,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 32,
  });
  lensGeo.translate(0, 0, -lensDepth / 2);
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: LENS_COLOR,
    metalness: 0,
    roughness: 0.15,
    transmission: 0.55,
    thickness: 2,
    transparent: true,
    opacity: 0.92,
  });
  const lensMesh = new THREE.Mesh(lensGeo, lensMaterial);
  unit.add(lensMesh);

  const frameDepth = 5;
  const frameGeo = new THREE.ExtrudeGeometry(buildFrameShape(LENS_RX, LENS_RY, FRAME_WIDTH), {
    depth: frameDepth,
    bevelEnabled: true,
    bevelThickness: 0.7,
    bevelSize: 0.5,
    bevelSegments: 2,
    curveSegments: 32,
  });
  frameGeo.translate(0, 0, -frameDepth / 2);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: FRAME_COLOR,
    metalness: 0.85,
    roughness: 0.28,
  });
  const frameMesh = new THREE.Mesh(frameGeo, frameMaterial);
  unit.add(frameMesh);

  const glareMaterial = new THREE.MeshBasicMaterial({
    map: glareTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glareMesh = new THREE.Mesh(new THREE.PlaneGeometry(72, 22), glareMaterial);
  glareMesh.position.set(0, 0, lensDepth / 2 + 0.6);
  glareMesh.rotation.z = -0.45;
  unit.add(glareMesh);

  const templeGeo = new THREE.CylinderGeometry(1.1, 1.1, 55, 10);
  const templeMesh = new THREE.Mesh(templeGeo, frameMaterial);
  templeMesh.rotation.z = Math.PI / 2;
  templeMesh.rotation.y = side * 0.55;
  templeMesh.position.set(side * (LENS_RX + FRAME_WIDTH + 20), LENS_RY * 0.35, -22);
  unit.add(templeMesh);

  unit.position.x = side * (LENS_RX + FRAME_WIDTH + LENS_GAP / 2);
  unit.userData.glareMesh = glareMesh;
  return unit;
}

export default function SunglassesShowcase() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 4, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe9c7, 0.9);
    fill.position.set(-4, -1, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff4dd, 1.1);
    rim.position.set(0, 3, -6);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const glareTexture = makeGlareTexture();
    const glasses = new THREE.Group();
    const leftUnit = buildLensUnit(-1, glareTexture);
    const rightUnit = buildLensUnit(1, glareTexture);
    glasses.add(leftUnit, rightUnit);

    const bridgeMaterial = new THREE.MeshStandardMaterial({
      color: FRAME_COLOR,
      metalness: 0.85,
      roughness: 0.28,
    });
    const bridgeGeo = new THREE.CylinderGeometry(1.4, 1.4, LENS_GAP + 6, 12);
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMaterial);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, LENS_RY * 0.55, 0);
    glasses.add(bridge);

    glasses.scale.setScalar(GROUP_SCALE);
    scene.add(glasses);

    const raycaster = new THREE.Raycaster();
    const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const ndc = new THREE.Vector2();
    const mouseWorld = new THREE.Vector3(0, 0, 0);
    let hasPointer = false;

    const fitCamera = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      const distance = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
      camera.position.z = distance;
      camera.updateProjectionMatrix();
    };
    fitCamera();

    const updateMouseWorld = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect();
      const inside =
        clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      if (!inside) {
        hasPointer = false;
        return;
      }
      hasPointer = true;
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      raycaster.ray.intersectPlane(dragPlane, mouseWorld);
    };

    const handlePointerMove = (event: PointerEvent) => updateMouseWorld(event.clientX, event.clientY);
    const handlePointerLeave = () => {
      hasPointer = false;
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    const handleResize = () => fitCamera();
    window.addEventListener("resize", handleResize);

    const rotYTo = gsap.quickTo(glasses.rotation, "y", { duration: 0.7, ease: "power3.out" });
    const rotXTo = gsap.quickTo(glasses.rotation, "x", { duration: 0.7, ease: "power3.out" });
    const posYTo = gsap.quickTo(glasses.position, "y", { duration: 0.9, ease: "power3.out" });

    const leftGlare = leftUnit.userData.glareMesh as THREE.Mesh;
    const rightGlare = rightUnit.userData.glareMesh as THREE.Mesh;
    const glareXTo = [
      gsap.quickTo(leftGlare.position, "x", { duration: 0.35, ease: "power2.out" }),
      gsap.quickTo(rightGlare.position, "x", { duration: 0.35, ease: "power2.out" }),
    ];
    const glareYTo = [
      gsap.quickTo(leftGlare.position, "y", { duration: 0.35, ease: "power2.out" }),
      gsap.quickTo(rightGlare.position, "y", { duration: 0.35, ease: "power2.out" }),
    ];

    const tick = (time: number) => {
      const t = time;
      const bob = Math.sin(t * 0.6) * 0.04;

      let normX = 0;
      let normY = 0;
      if (hasPointer) {
        const width = host.clientWidth;
        const height = host.clientHeight;
        normX = THREE.MathUtils.clamp(mouseWorld.x / (width / 2), -1, 1);
        normY = THREE.MathUtils.clamp(mouseWorld.y / (height / 2), -1, 1);
      }

      rotYTo(normX * 0.5 + Math.sin(t * 0.35) * 0.06);
      rotXTo(-normY * 0.28 + bob);
      posYTo(normY * -6);

      const glareX = normX * 26;
      const glareY = normY * 18;
      glareXTo[0](glareX);
      glareXTo[1](glareX);
      glareYTo[0](glareY);
      glareYTo[1](glareY);

      renderer.render(scene, camera);
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
      glasses.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const material = obj.material;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material.dispose();
        }
      });
      glareTexture.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="absolute inset-0 z-0 pointer-events-none" aria-hidden />;
}
