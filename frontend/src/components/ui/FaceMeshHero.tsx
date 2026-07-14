'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { disposeRenderer, disposeObject } from '@/lib/three.utils';

export function FaceMeshHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [statusText, setStatusText] = useState('');

  const stateRef = useRef<{
    video: HTMLVideoElement | null;
    detector: any;
    points: THREE.Points | null;
    geo: THREE.BufferGeometry | null;
    NUM: number;
    fallbackActive: boolean;
  }>({
    video: null,
    detector: null,
    points: null,
    geo: null,
    NUM: 468,
    fallbackActive: true,
  });

  async function activateCamera() {
    setLoadingModel(true);
    setStatusText('Initializing neural mesh...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        stateRef.current.video = videoRef.current;
        setCameraActive(true);
      }

      setStatusText('Loading FaceMesh model...');
      const faceLandmarksDetection = await import('@tensorflow-models/face-landmarks-detection');
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: false,
      });
      stateRef.current.detector = detector;
      stateRef.current.fallbackActive = false;
      setStatusText('Hologram synced.');
    } catch (err) {
      console.error(err);
      setStatusText('Webcam or Model load failed. Using fallback.');
      stateRef.current.fallbackActive = true;
    } finally {
      setLoadingModel(false);
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const w = el.clientWidth || 400;
    const h = el.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const NUM = 468;
    const positions = new Float32Array(NUM * 3);
    
    for (let i = 0; i < NUM; i++) {
      const phi = Math.acos(-1 + (2 * i) / NUM);
      const theta = Math.sqrt(NUM * Math.PI) * phi;
      positions[i * 3] = 1.1 * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = 1.3 * Math.cos(phi);
      positions[i * 3 + 2] = 1.1 * Math.sin(phi) * Math.sin(theta);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.025,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geo, mat);

    stateRef.current.points = points;
    stateRef.current.geo = geo;

    // Create a group for the fallback rotating globe
    const globeGroup = new THREE.Group();
    globeGroup.add(points);

    // Calculate connections between nearby nodes to draw the wireframe network lines
    const linePositions: number[] = [];
    for (let i = 0; i < NUM; i++) {
      const p1_x = positions[i * 3];
      const p1_y = positions[i * 3 + 1];
      const p1_z = positions[i * 3 + 2];
      for (let j = i + 1; j < NUM; j++) {
        const p2_x = positions[j * 3];
        const p2_y = positions[j * 3 + 1];
        const p2_z = positions[j * 3 + 2];
        const dist = Math.sqrt(
          (p1_x - p2_x) ** 2 +
          (p1_y - p2_y) ** 2 +
          (p1_z - p2_z) ** 2
        );
        if (dist < 0.28) {
          linePositions.push(p1_x, p1_y, p1_z);
          linePositions.push(p2_x, p2_y, p2_z);
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x4f46e5,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    const networkLines = new THREE.LineSegments(lineGeo, lineMat);
    globeGroup.add(networkLines);

    // Create 20 larger glowing hub points on the globe
    const hubPositions = new Float32Array(20 * 3);
    for (let i = 0; i < 20; i++) {
      const idx = Math.floor(Math.random() * NUM);
      hubPositions[i * 3] = positions[idx * 3];
      hubPositions[i * 3 + 1] = positions[idx * 3 + 1];
      hubPositions[i * 3 + 2] = positions[idx * 3 + 2];
    }
    const hubGeo = new THREE.BufferGeometry();
    hubGeo.setAttribute('position', new THREE.BufferAttribute(hubPositions, 3));
    const hubMat = new THREE.PointsMaterial({
      color: 0xa855f7,
      size: 0.065,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const hubPoints = new THREE.Points(hubGeo, hubMat);
    globeGroup.add(hubPoints);

    scene.add(globeGroup);

    const rings: THREE.Mesh[] = [];
    const ringGeo = new THREE.TorusGeometry(1.6, 0.002, 8, 100);
    
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.35 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);
    rings.push(ring1);
    
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.25 });
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);
    ring2.rotation.x = Math.PI / 4;
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);
    rings.push(ring2);
    
    const ringMat3 = new THREE.MeshBasicMaterial({ color: 0xec4899, transparent: true, opacity: 0.2 });
    const ring3 = new THREE.Mesh(ringGeo, ringMat3);
    ring3.rotation.x = -Math.PI / 4;
    ring3.rotation.y = -Math.PI / 4;
    scene.add(ring3);
    rings.push(ring3);

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
    
    async function tick() {
      if (!isVisible || document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const t = (performance.now() - t0) * 0.001;
      const { video, detector, fallbackActive } = stateRef.current;

      if (!fallbackActive && video && detector) {
        networkLines.visible = false;
        hubPoints.visible = false;
        try {
          const faces = await detector.estimateFaces(video, { flipHorizontal: true });
          if (faces && faces.length > 0) {
            const keypoints = faces[0].keypoints;
            const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
            const arr = posAttr.array as Float32Array;

            for (let i = 0; i < NUM; i++) {
              if (keypoints[i]) {
                const kp = keypoints[i];
                const nx = (kp.x / 640) * 2 - 1;
                const ny = -(kp.y / 480) * 2 + 1;
                const nz = -(kp.z || 0) / 120;
                
                const targetX = nx * 1.6;
                const targetY = ny * 1.6;
                const targetZ = nz * 1.6;
                
                arr[i * 3] += (targetX - arr[i * 3]) * 0.25;
                arr[i * 3 + 1] += (targetY - arr[i * 3 + 1]) * 0.25;
                arr[i * 3 + 2] += (targetZ - arr[i * 3 + 2]) * 0.25;
              }
            }
            posAttr.needsUpdate = true;
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        networkLines.visible = true;
        hubPoints.visible = true;
        hubMat.opacity = 0.5 + Math.sin(t * 4) * 0.3;

        globeGroup.rotation.y = t * 0.15;
        globeGroup.rotation.x = Math.sin(t * 0.1) * 0.1;
        
        const arr = geo.getAttribute('position').array as Float32Array;
        for (let i = 0; i < NUM; i++) {
          const phi = Math.acos(-1 + (2 * i) / NUM);
          const theta = Math.sqrt(NUM * Math.PI) * phi;
          const targetX = 1.1 * Math.sin(phi) * Math.cos(theta);
          const targetY = 1.3 * Math.cos(phi);
          const targetZ = 1.1 * Math.sin(phi) * Math.sin(theta);
          
          arr[i * 3] += (targetX - arr[i * 3]) * 0.05;
          arr[i * 3 + 1] += (targetY - arr[i * 3 + 1]) * 0.05;
          arr[i * 3 + 2] += (targetZ - arr[i * 3 + 2]) * 0.05;
        }
        geo.getAttribute('position').needsUpdate = true;
      }

      rings.forEach((r, idx) => {
        r.rotation.z = t * (0.05 + idx * 0.02);
      });
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
      observer.disconnect();
      disposeObject(scene);
      disposeRenderer(renderer);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[350px] flex flex-col items-center justify-center">
      <video
        ref={videoRef}
        className="hidden"
        width="640"
        height="480"
        playsInline
        muted
      />
      <div ref={containerRef} className="w-full h-full max-w-[400px] max-h-[400px] flex-grow" />
      <div className="absolute bottom-4 flex flex-col items-center gap-2">
        {!cameraActive && (
          <button
            onClick={activateCamera}
            disabled={loadingModel}
            className="px-5 py-2 text-xs font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 backdrop-blur-md rounded-xl transition-all duration-350 tracking-wider uppercase"
          >
            {loadingModel ? 'CONNECTING MESH...' : 'ACTIVATE NEURAL SCANNER'}
          </button>
        )}
        {statusText && (
          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest bg-zinc-950/80 px-3 py-1 rounded-lg border border-zinc-900">
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
}
