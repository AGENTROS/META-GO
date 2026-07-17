'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { 
  ScanFace, Crosshair, Hexagon, Shield, User, Globe, Activity, Zap, Play, Upload, Map, CheckCircle2, ChevronRight
} from 'lucide-react';

import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import AvatarRig from './AvatarRig';

declare global {
  namespace JSX {
    interface IntrinsicElements {}
  }
}

const FOOTPRINT_DATA = [
  { name: 'Cyber City', status: 'Active', time: '12h 45m', color: 'from-blue-600 to-cyan-400', img: '/images/worlds/cyber_city.png' },
  { name: 'Meta Office', status: 'Active', time: '8h 30m', color: 'from-indigo-600 to-purple-500', img: '/images/worlds/meta_office.png' },
  { name: 'Veridia Realm', status: 'Active', time: '5h 16m', color: 'from-fuchsia-600 to-pink-500', img: '/images/worlds/veridia_realm.png' },
  { name: 'StudyVerse', status: 'Active', time: '3h 10m', color: 'from-violet-600 to-indigo-400', img: '/images/worlds/study_verse.png' },
];

export default function AvatarCenter() {
  const [avatar, setAvatar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const dummyAddress = address;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeMotion, setActiveMotion] = useState<string>('idle');
  const [orbit, setOrbit] = useState('0deg 75deg 2m');
  
  const motions = [
    { name: 'idle', icon: ScanFace, orbit: '0deg 75deg 2m', anim: 'Idle' },
    { name: 'walk', icon: Activity, orbit: '45deg 80deg 2.5m', anim: 'Walk' },
    { name: 'inspect', icon: User, orbit: '0deg 60deg 1.5m', anim: 'Inspect' },
    { name: 'wave', icon: Globe, orbit: '-30deg 75deg 2m', anim: 'Wave' },
    { name: 'dance', icon: Play, orbit: '0deg 85deg 3m', anim: 'Dance' }
  ];

  // IndexedDB helper for robust persistence of large VRM/GLB blobs
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

  const handleFile = async (file: File) => {
    if (file && (file.name.toLowerCase().endsWith('.vrm') || file.name.toLowerCase().endsWith('.glb'))) {
      const url = URL.createObjectURL(file);
      setAvatar({
        avatar_name: file.name,
        version: 'v1.0',
        url: url
      });
      await saveToIndexedDB(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  const fetchHub = async () => {
    if (!address) { setLoading(false); return; }
    try {
      // First try to load saved avatar from local IndexedDB
      const savedFile = await loadFromIndexedDB();
      if (savedFile) {
        setAvatar({
          avatar_name: savedFile.name,
          version: 'v1.0',
          url: URL.createObjectURL(savedFile)
        });
        setLoading(false);
        return;
      }
      
      const res = await fetch(`http://localhost:8001/api/dashboard/avatar/hub?address=${dummyAddress}`);
      if (res.ok) {
        const data = await res.json();
        if (data.avatar) setAvatar(data.avatar);
      }
    } catch (err) {
      console.error('Failed to fetch hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHub();
  }, [address]);

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px' }}></div>
        Loading Digital Avatar...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Main Avatar Section */}
      <div style={{ 
        display: 'flex', gap: '24px', 
        background: 'rgba(15,15,20,0.6)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '24px', padding: '24px',
        marginBottom: '24px',
        minHeight: '500px'
      }}>
        
        {/* Left Vertical Icons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '50px' }}>
          {motions.map((motion, idx) => {
            const isActive = avatar && activeMotion === motion.name;
            const isAllowed = !!avatar;
            const Icon = motion.icon;
            
            return (
              <div 
                key={idx} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isAllowed) {
                    setActiveMotion(motion.name);
                    setOrbit(motion.orbit);
                  }
                }}
                className={isAllowed ? "hover:scale-110 transition-transform" : ""} 
                style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: isActive ? 'rgba(91,140,255,0.15)' : 'rgba(255,255,255,0.03)', 
                  border: isActive ? '1px solid rgba(91,140,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isActive ? '#5b8cff' : '#888892',
                  cursor: isAllowed ? 'pointer' : 'not-allowed',
                  boxShadow: isActive ? '0 0 10px rgba(91,140,255,0.2)' : 'none',
                  opacity: isAllowed ? 1 : 0.4
                }}
                title={`Motion: ${motion.anim}`}
              >
                <Icon size={18} />
              </div>
            );
          })}
        </div>

        {/* Center Avatar 3D Viewer */}
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{ 
            flex: 1, position: 'relative', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '16px', overflow: 'hidden'
          }}
        >
          {/* Holographic Glowing Pedestal */}
          <div style={{
            position: 'absolute', bottom: '15%', width: '300px', height: '60px',
            background: 'radial-gradient(ellipse at center, rgba(138,43,226,0.2) 0%, rgba(10,10,12,0) 70%)',
            border: '2px solid rgba(138,43,226,0.3)',
            borderRadius: '50%',
            boxShadow: '0 0 40px rgba(138,43,226,0.4), inset 0 0 20px rgba(138,43,226,0.2)',
            transform: 'rotateX(75deg)',
            pointerEvents: 'none',
            zIndex: 0
          }}></div>
          
          <input type="file" accept=".glb,.vrm" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

          {avatar ? (
            <div style={{ width: '300px', height: '450px', zIndex: 10 }}>
              <Canvas camera={{ position: [0, 1, 3], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[2, 2, 2]} intensity={1.5} castShadow />
                <pointLight position={[-2, 1, -2]} intensity={1} color="#4F46E5" />
                <Environment preset="city" />
                <AvatarRig url={avatar.url} activeMotion={activeMotion} />
                <OrbitControls 
                  enableZoom={true} 
                  enablePan={false}
                  autoRotate={activeMotion === 'inspect' || activeMotion === 'dance'}
                  autoRotateSpeed={activeMotion === 'dance' ? 10 : 2}
                  minPolarAngle={Math.PI / 3}
                  maxPolarAngle={Math.PI / 1.5}
                />
              </Canvas>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} style={{ zIndex: 10, padding: '20px', color: '#888', cursor: 'pointer', textAlign: 'center' }}>
              <Upload size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              Upload .VRM or .GLB
            </div>
          )}
        </div>

        {/* Right Stats & Worlds Panel */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Avatar Identity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0 }}>Sharvan's Avatar</h2>
              <div style={{ background: '#8a2be2', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={10} color="#fff" />
              </div>
            </div>

            {/* Online Worlds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Cyber City', 'Meta Office', 'Veridia Realm', 'StudyVerse'].map((world, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d8d8db', fontSize: '14px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8a2be2', boxShadow: '0 0 8px #8a2be2' }}></div>
                    {world}
                  </div>
                  <span style={{ color: '#10b981', fontSize: '13px' }}>Online</span>
                </div>
              ))}
            </div>
            
            <button style={{ 
              marginTop: '20px', width: '100%', background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', color: '#fff', 
              padding: '10px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              transition: 'all 0.2s ease',
            }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
              View All Worlds <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>

          {/* Stats List */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d8d8db', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={14} color="#8a2be2"/> Level</div>
                <span style={{ color: '#fff', fontWeight: 500 }}>24</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d8d8db', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Hexagon size={14} color="#8a2be2"/> XP</div>
                <span style={{ color: '#fff', fontWeight: 500 }}>8,450 / 12,000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d8d8db', fontSize: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={14} color="#8a2be2"/> Reputation</div>
                <span style={{ color: '#fff', fontWeight: 500 }}>9,850</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Metaverse Footprint Section */}
      <div style={{ 
        background: 'rgba(15,15,20,0.6)', 
        border: '1px solid rgba(255,255,255,0.05)', 
        borderRadius: '24px', padding: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#fff', margin: 0 }}>Metaverse Footprint</h3>
          <span style={{ color: '#8a2be2', fontSize: '14px', cursor: 'pointer' }}>Explore All</span>
        </div>

        {/* Footprint Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {FOOTPRINT_DATA.map((item, i) => (
            <div key={i} style={{ 
              height: '140px', borderRadius: '16px', padding: '16px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)`,
              position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-40`} style={{ zIndex: 0 }}></div>
              <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" style={{ zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#10b981' }}>{item.status}</span>
                  <span style={{ color: '#d8d8db' }}>{item.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888892', fontSize: '12px', marginBottom: '4px' }}>Worlds Visited</div>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>7</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888892', fontSize: '12px', marginBottom: '4px' }}>Total Time</div>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>29h 40m</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888892', fontSize: '12px', marginBottom: '4px' }}>Avatars Used</div>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>3</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#888892', fontSize: '12px', marginBottom: '4px' }}>Interactions</div>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>128</div>
          </div>
        </div>
      </div>

    </div>
  );
}
