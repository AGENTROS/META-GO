'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { disposeRenderer, disposeObject } from '@/lib/three.utils';

// Lightweight, clean blue particle facemesh visualization (no cyber-grid).
export function FaceMeshHero() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 400;
    const h = el.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Particle face mesh
    const NUM = 240;
    const positions = new Float32Array(NUM * 3);
    for (let i = 0; i < NUM; i++) {
      const phi = Math.acos(-1 + (2 * i) / NUM);
      const theta = Math.sqrt(NUM * Math.PI) * phi;
      positions[i * 3] = 1.2 * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = 1.2 * Math.cos(phi);
      positions[i * 3 + 2] = 1.2 * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x2563eb, size: 0.025, transparent: true, opacity: 0.85 });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Outer ring
    const ringGeo = new THREE.TorusGeometry(1.55, 0.005, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.35 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ring);

    let raf = 0;
    const t0 = performance.now();
    function tick() {
      const t = (performance.now() - t0) * 0.001;
      points.rotation.y = t * 0.18;
      points.rotation.x = Math.sin(t * 0.2) * 0.15;
      ring.rotation.z = t * 0.1;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    function onResize() {
      const W = el!.clientWidth || 400;
      const H = el!.clientHeight || 400;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      disposeObject(scene);
      disposeRenderer(renderer);
    };
  }, []);

  return <div ref={ref} className="w-full h-full" />;
}
