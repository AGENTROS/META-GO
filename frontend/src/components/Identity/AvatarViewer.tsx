'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float, TorusKnot } from '@react-three/drei';
import AvatarRig from '../dashboard/modules/AvatarRig';

declare global {
  namespace JSX {
    interface IntrinsicElements {}
  }
}

const saveToIndexedDB = (file: File) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AvatarDB', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('avatars');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('avatars', 'readwrite');
      tx.objectStore('avatars').put(file, 'current_avatar');
      tx.oncomplete = () => resolve(true);
    };
    request.onerror = reject;
  });
};

const loadFromIndexedDB = () => {
  return new Promise<File | null>((resolve, reject) => {
    const request = indexedDB.open('AvatarDB', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('avatars');
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('avatars')) return resolve(null);
      const tx = db.transaction('avatars', 'readonly');
      const getReq = tx.objectStore('avatars').get('current_avatar');
      getReq.onsuccess = () => resolve(getReq.result || null);
    };
    request.onerror = reject;
  });
};

function PlaceholderAvatar() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <TorusKnot args={[1, 0.3, 128, 32]} scale={0.8} position={[0, 0, 0]}>
        <meshPhysicalMaterial 
          color="#4F46E5" 
          metalness={0.8} 
          roughness={0.2} 
          transmission={0.9} 
          thickness={0.5} 
          envMapIntensity={2} 
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </TorusKnot>
    </Float>
  );
}

export default function AvatarViewer() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-load avatar from IndexedDB if the user uploaded it previously (e.g. from the main dashboard)
    const initLoad = async () => {
      try {
        const savedFile = await loadFromIndexedDB();
        if (savedFile) {
          setAvatarUrl(URL.createObjectURL(savedFile));
        }
      } catch (e) {
        console.error("Failed to load avatar from DB", e);
      }
    };
    initLoad();
  }, []);

  const handleFile = async (file: File) => {
    if (file && (file.name.toLowerCase().endsWith('.vrm') || file.name.toLowerCase().endsWith('.glb'))) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      await saveToIndexedDB(file);
    }
  };

  return (
    <div 
      className="w-full h-full min-h-[400px] md:min-h-[500px] relative rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#020202]/40 backdrop-blur-xl flex items-center justify-center cursor-pointer transition-all hover:border-cyan-400/50"
      onClick={() => !avatarUrl && fileInputRef.current?.click()}
    >
      <input type="file" accept=".glb,.vrm" ref={fileInputRef} className="hidden" style={{display: 'none'}} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

      {/* Glow effects and platform */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64 h-12 bg-cyan-500/20 blur-2xl rounded-[100%] pointer-events-none" />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-56 h-3 border-[1px] border-cyan-400/40 rounded-[100%] pointer-events-none shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-1.5 border-[1px] border-cyan-300/60 rounded-[100%] pointer-events-none shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

      {avatarUrl ? (
        <div style={{ width: '100%', height: '100%', zIndex: 30, position: 'absolute', inset: 0 }}>
          <Canvas camera={{ position: [0, 1, 4], fov: 45 }} className="w-full h-full">
            <ambientLight intensity={0.6} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, 1, -10]} intensity={1.5} color="#4F46E5" />
            <Environment preset="city" />
            
            <AvatarRig url={avatarUrl} activeMotion="inspect" />
            
            <OrbitControls 
              enableZoom={true} 
              enablePan={false}
              autoRotate={true}
              autoRotateSpeed={1.0}
              minPolarAngle={Math.PI / 3}
              maxPolarAngle={Math.PI / 1.5}
            />
          </Canvas>
          
          <button 
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="absolute top-4 right-4 z-40 bg-black/60 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400 text-xs font-mono hover:bg-cyan-900/40 transition-colors"
          >
            CHANGE AVATAR
          </button>
        </div>
      ) : (
        <>
          {/* Upload Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-center mix-blend-plus-lighter">
            <p className="text-[#22D3EE] font-mono tracking-widest text-xs font-bold shadow-black drop-shadow-xl bg-black/60 px-4 py-2 rounded-full border border-[#22D3EE]/30">
              CLICK TO UPLOAD .VRM / .GLB
            </p>
          </div>

          {/* 3D Canvas */}
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="w-full h-full absolute inset-0 z-10 pointer-events-none">
            <ambientLight intensity={0.4} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -5, -10]} intensity={1.5} color="#4F46E5" />
            <pointLight position={[10, 0, -5]} intensity={1.0} color="#22D3EE" />
            <Environment preset="city" />
            
            <PlaceholderAvatar />
            
            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              autoRotate={true}
              autoRotateSpeed={1.0}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 2}
            />
          </Canvas>
        </>
      )}
    </div>
  );
}
