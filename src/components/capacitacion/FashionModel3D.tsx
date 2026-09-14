"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Procedural draped-fabric mesh: a displaced plane simulating a hanging
 * garment, pinned at the top edge with folds that deepen toward the hem.
 */
function buildFabricGeometry(width: number, height: number, widthSegments: number, heightSegments: number) {
  const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  const position = geometry.attributes.position;
  const foldFactors = new Float32Array(position.count);

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const normalizedY = y / height + 0.5; // 0 at hem, 1 at pinned top
    const foldFactor = Math.pow(1 - normalizedY, 1.4);
    foldFactors[i] = foldFactor;
    const baseZ = Math.sin(x * 1.2 + normalizedY * 3) * 0.45 * foldFactor;
    position.setZ(i, baseZ);
  }

  geometry.setAttribute("foldFactor", new THREE.BufferAttribute(foldFactors, 1));
  geometry.computeVertexNormals();
  return geometry;
}

function rippleGeometry(geometry: THREE.PlaneGeometry, width: number, height: number, time: number) {
  const position = geometry.attributes.position;
  const foldFactor = geometry.getAttribute("foldFactor");

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const normalizedY = y / height + 0.5;
    const fold = foldFactor.getX(i);
    const baseZ = Math.sin(x * 1.2 + normalizedY * 3) * 0.45 * fold;
    const rippleZ = Math.sin(x * 2 + time * 0.6 + normalizedY * 4) * 0.15 * fold;
    position.setZ(i, baseZ + rippleZ);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

export default function FashionModel3D() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      host.clientWidth / host.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.4, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const width = 5.5;
    const height = 7;
    const geometry = buildFabricGeometry(width, height, 48, 64);

    const fabric = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.85,
        metalness: 0.05,
        side: THREE.DoubleSide,
      })
    );
    group.add(fabric);

    const wireframe = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true,
        opacity: 0.08,
      })
    );
    wireframe.position.z += 0.01;
    group.add(wireframe);

    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 5);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(-4, -2, 3);
    scene.add(fill);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const pointer = { x: 0, y: 0 };
    const smoothed = { x: 0, y: 0 };
    const handlePointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
    };
    window.addEventListener("pointermove", handlePointerMove);

    const handleResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    let frameId: number;
    const timer = new THREE.Timer();
    const animate = () => {
      timer.update();
      const elapsed = timer.getElapsed();

      rippleGeometry(geometry, width, height, elapsed);

      smoothed.x += (pointer.x - smoothed.x) * 0.06;
      smoothed.y += (pointer.y - smoothed.y) * 0.06;
      group.rotation.y = Math.sin(elapsed * 0.15) * 0.12 + smoothed.x * 0.25;
      group.rotation.x = smoothed.y * 0.12;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("resize", handleResize);
      host.removeChild(renderer.domElement);
      geometry.dispose();
      fabric.material.dispose();
      wireframe.material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 z-0 pointer-events-none"
      aria-hidden
    />
  );
}
