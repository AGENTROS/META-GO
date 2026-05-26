// Centralized Three.js disposal helpers to prevent GPU memory leaks.
import * as THREE from 'three';

export function disposeObject(obj: any) {
  if (!obj) return;
  obj.traverse?.((child: any) => {
    if (child.isMesh) {
      child.geometry?.dispose?.();
      if (Array.isArray(child.material)) {
        child.material.forEach((m: any) => m.dispose?.());
      } else {
        child.material?.dispose?.();
      }
    }
  });
}

export function disposeRenderer(renderer: THREE.WebGLRenderer | null) {
  if (!renderer) return;
  try {
    renderer.forceContextLoss?.();
    renderer.dispose?.();
    const el = renderer.domElement;
    el?.parentNode?.removeChild(el);
  } catch {}
}
