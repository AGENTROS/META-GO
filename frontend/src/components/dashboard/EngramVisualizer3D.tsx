'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { disposeObject, disposeRenderer } from '@/lib/three.utils';
import { useIdentityStore } from '@/store/useIdentityStore';

export function EngramVisualizer3D() {
  const ref = useRef<HTMLDivElement>(null);
  const linked = useIdentityStore(s => s.linkedAvatar);
  const metrics = useIdentityStore(s => s.identityMetrics);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth || 260, h = el.clientHeight || 260;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const geo = new THREE.IcosahedronGeometry(1.1, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.8, roughness: 0.2, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const wireGeo = new THREE.IcosahedronGeometry(1.18, 1);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x4f46e5, wireframe: true, transparent: true, opacity: 0.35 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    let ring: THREE.Mesh | null = null;
    if (linked) {
      const rGeo = new THREE.TorusGeometry(1.6, 0.02, 16, 100);
      const rMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
    }

    const light1 = new THREE.DirectionalLight(0xffffff, 1.2);
    light1.position.set(2, 2, 3);
    scene.add(light1);
    scene.add(new THREE.AmbientLight(0x6080ff, 0.3));

    const sovereignty = metrics?.sovereignty ?? 80;
    const speed = 0.2 + (sovereignty / 100) * 0.4;

    let raf = 0;
    const t0 = performance.now();
    let isVisible = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(el);

    function tick() {
      if (!isVisible || document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const t = (performance.now() - t0) * 0.001;
      mesh.rotation.y = t * speed;
      mesh.rotation.x = Math.sin(t * 0.4) * 0.2;
      wire.rotation.y = -t * speed * 0.8;
      const s = 1 + Math.sin(t * 1.5) * 0.04;
      mesh.scale.set(s, s, s);
      if (ring) ring.rotation.z = t * 0.5;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    function onResize() {
      const W = el!.clientWidth, H = el!.clientHeight;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      disposeObject(scene);
      disposeRenderer(renderer);
    };
  }, [linked, metrics?.sovereignty]);

  return <div ref={ref} className="w-full h-full" />;
}
