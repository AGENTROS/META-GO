'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Globe, Cpu, Hexagon, Activity, Radio, Sparkles, Upload, Maximize, Play, CheckCircle2, Zap, AlertTriangle, Shield, Award, Map, RefreshCw } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

const SUPPORTED_WORLDS = [
  'Decentraland', 'Sandbox', 'Spatial', 'VRChat', 'Hyperfy', 'OnCyber', 'Unity', 'Unreal Engine'
];

export default function AvatarCenter() {
  const [avatar, setAvatar] = useState<any>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [presence, setPresence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deployingTo, setDeployingTo] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (file && (file.name.toLowerCase().endsWith('.vrm') || file.name.toLowerCase().endsWith('.glb'))) {
      setAvatar({
        avatar_name: file.name,
        version: 'v1.0',
        url: URL.createObjectURL(file)
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const { address } = useAccount();
  const dummyAddress = address;

  useEffect(() => {
    // Add Google Model Viewer script
    if (typeof window !== 'undefined' && !document.querySelector('script[src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"]')) {
      const script = document.createElement('script');
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
      script.type = "module";
      document.head.appendChild(script);
    }

    // Prevent global drag/drop to stop browser from opening files if dropped outside zone
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
      const res = await fetch(`http://localhost:8001/api/dashboard/avatar/hub?address=${dummyAddress}`);
      if (res.ok) {
        const data = await res.json();
        setAvatar(data.avatar);
        setDeployments(data.deployments || []);
        setPresence(data.presence);
      }
    } catch (err) {
      console.error('Failed to fetch hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHub();

    // In a real implementation, we would connect the websocket here to listen for:
    // 'deployment_started', 'deployment_finished', 'avatar_updated'
    const interval = setInterval(fetchHub, 10000); // Polling as fallback for WebSockets in this demo
    return () => clearInterval(interval);
  }, [address]);

  const handleDeploy = async (world: string) => {
    setDeployingTo(world);
    try {
      await fetch(`http://localhost:8001/api/dashboard/avatar/deploy?address=${dummyAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ world })
      });
      fetchHub();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setDeployingTo(null), 1000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px' }}></div>
        Synchronizing Spatial Computing Engine...
      </div>
    );
  }

  const dna = avatar?.dna || {};
  const connectedWorlds = avatar?.connected_worlds || [];

  return (
    <>
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow" style={{ color: 'var(--blue)' }}><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }}/> Spatial Computing</div>
          <h1 className="page-title">
            Metaverse Hub
          </h1>
          <p className="page-desc">
            Your interoperable digital twin. Deploy across engines, sync identity DNA, and command your spatial presence.
          </p>
        </div>
        <div className="status-pill" style={{ background: avatar ? 'rgba(62,207,142,0.1)' : 'rgba(255,255,255,0.05)', color: avatar ? 'var(--success)' : 'var(--muted)' }}>
          <div className="pulse" style={{ background: avatar ? 'var(--success)' : 'var(--muted)' }}></div> 
          {avatar ? 'Interoperable' : 'No Avatar Found'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '800px' }}>
        
        {/* LEFT COLUMN: DNA Engine & Deployments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingRight: '10px' }}>
          
          {/* Avatar DNA Engine */}
          <div className="card stack" style={{ background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div className="card-head">
              <div className="card-title"><Hexagon size={16} className="text-violet" /> Avatar DNA Engine</div>
            </div>
            {avatar ? (
              <div className="row-list">
                <div className="row-item" style={{ background: 'transparent' }}>
                  <div className="row-title">Humanity Score</div>
                  <div className="row-desc text-success" style={{ fontSize: '16px', fontWeight: 600 }}>{dna.humanity_score || 0}%</div>
                </div>
                <div className="row-item" style={{ background: 'transparent' }}>
                  <div className="row-title">Trust Level</div>
                  <div className="row-desc text-success" style={{ fontSize: '16px', fontWeight: 600 }}>{dna.trust_score || 0}/100</div>
                </div>
                <div className="row-item" style={{ background: 'transparent' }}>
                  <div className="row-title">SBTs Active</div>
                  <div className="row-desc text-pink" style={{ fontSize: '16px', fontWeight: 600 }}>{dna.sbt_count || 0}</div>
                </div>
                <div className="row-item" style={{ background: 'transparent' }}>
                  <div className="row-title">Credentials</div>
                  <div className="row-desc text-blue" style={{ fontSize: '16px', fontWeight: 600 }}>{dna.credential_count || 0}</div>
                </div>
                {dna.enterprise_access && (
                  <div className="row-item" style={{ background: 'transparent' }}>
                    <div className="row-title">Enterprise Access</div>
                    <div className="stag ok"><CheckCircle2 size={12} style={{marginRight:'4px'}}/> Verified</div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                <Hexagon size={32} style={{ opacity: 0.2, margin: '0 auto 10px auto' }} />
                No DNA active. Upload an avatar.
              </div>
            )}
          </div>

          {/* Deployment Jobs */}
          <div className="card stack" style={{ flex: 1, background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="card-head">
              <div className="card-title"><Activity size={16} className="text-blue" /> Deployment Jobs</div>
            </div>
            <div className="row-list" style={{ overflowY: 'auto' }}>
              {deployments.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>No active or past deployments.</div>
              ) : deployments.map((dep, i) => (
                <div className="row-item" key={i} style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="row-body">
                    <div className="row-title">{dep.world}</div>
                    <div className="row-desc">{new Date(dep.created_at).toLocaleTimeString()}</div>
                  </div>
                  <div className={`stag ${dep.status === 'Pending' ? 'warning' : 'ok'}`}>
                    {dep.status === 'Pending' && <div className="pulse"></div>} {dep.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Avatar 3D Viewer & World Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Avatar Viewer */}
          <div 
            className="card" 
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{ 
            flex: 2, 
            position: 'relative', 
            overflow: 'hidden', 
            background: isDragging ? 'radial-gradient(circle at center, rgba(91,140,255,0.2) 0%, rgba(10,10,12,1) 100%)' : 'radial-gradient(circle at center, rgba(91,140,255,0.1) 0%, rgba(10,10,12,1) 100%)',
            border: isDragging ? '2px dashed rgba(91,140,255,0.8)' : '1px solid rgba(91,140,255,0.2)',
            boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8), 0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <input type="file" accept=".glb,.vrm" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
              <div className="stag" style={{ background: 'rgba(91,140,255,0.1)', color: 'var(--blue)', border: '1px solid var(--blue)' }}>
                <Cpu size={12} style={{ marginRight: '4px' }}/> {avatar ? `Engine Ready • ${avatar.version || 'v1.0'}` : 'Awaiting Avatar'}
              </div>
            </div>
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, display: 'flex', gap: '8px' }}>
              <button className="icon-btn" onClick={() => fileInputRef.current?.click()}><Upload size={16}/></button>
              <button className="icon-btn"><RefreshCw size={16}/></button>
              <button className="icon-btn"><Maximize size={16}/></button>
            </div>

            <div style={{ textAlign: 'center', zIndex: 5 }}>
              {avatar ? (
                <>
                  <div style={{ 
                    width: '180px', height: '320px', 
                    borderRadius: '90px', 
                    margin: '0 auto', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 60px rgba(91,140,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden'
                  }}>
                    <model-viewer 
                      src={avatar.url} 
                      auto-rotate 
                      camera-controls 
                      style={{width: '100%', height: '100%', backgroundColor: 'transparent'}} 
                    ></model-viewer>
                  </div>
                  <h3 style={{ marginTop: '20px' }}>{avatar.avatar_name || 'Genesis Avatar'}</h3>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button className="primary-btn" style={{ padding: '6px 12px', fontSize: '12px' }}><Play size={12} style={{marginRight: '4px'}}/> Animation Preview</button>
                  </div>
                </>
              ) : (
                <div 
                  style={{ padding: '40px', color: 'var(--muted)', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isDragging ? 'Drop it like it\'s hot! 🔥' : 'Upload a .VRM or .GLB to initialize Metaverse Hub.'}
                </div>
              )}
            </div>
          </div>

          {/* 3D World Map (Visualizer) */}
          <div className="card" style={{ 
            flex: 1, 
            background: 'rgba(20,20,25,0.8)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div className="card-head">
              <div className="card-title"><Map size={16} /> Spatial Deployment Map</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', position: 'relative', overflow: 'hidden' }}>
              <Globe size={48} style={{ opacity: 0.1, position: 'absolute' }} />
              [3D WebGL Globe Render Pending]
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Presence & Deployments Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', paddingLeft: '10px' }}>
          
          {/* Presence Engine */}
          <div className="card stack" style={{ background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div className="card-head">
              <div className="card-title"><Radio size={16} className="text-success" /> Presence Engine</div>
            </div>
            {presence ? (
              <div className="row-list">
                <div className="row-item" style={{ background: 'transparent' }}>
                  <div className="row-title">Active Session</div>
                  <div className="row-desc text-success">{presence.current_world}</div>
                </div>
                <div className="row-item" style={{ background: 'transparent' }}>
                  <div className="row-title">Device Fingerprint</div>
                  <div className="row-desc">{presence.device}</div>
                </div>
                <div className="row-item" style={{ background: 'transparent' }}>
                  <div className="row-title">Last Ping</div>
                  <div className="row-desc">{presence.last_active}</div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                <AlertTriangle size={24} style={{ opacity: 0.2, margin: '0 auto 10px auto' }} />
                No Active Metaverse Session
              </div>
            )}
          </div>

          {/* Connected Worlds Synchronization */}
          <div className="card stack" style={{ flex: 1, background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="card-head">
              <div className="card-title"><Globe size={16} className="text-pink" /> Sync Manager</div>
            </div>
            <div className="row-list">
              {SUPPORTED_WORLDS.map((world, i) => {
                const isConnected = connectedWorlds.includes(world);
                const hasActiveJob = deployments.some(d => d.world === world && d.status === 'Pending');

                return (
                  <div className="row-item" key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '12px' }}>
                    <div className="row-body">
                      <div className="row-title">{world}</div>
                      <div className="row-desc" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? 'var(--success)' : 'var(--muted)' }}></div>
                        {isConnected ? 'Connected' : 'Integration Pending'}
                      </div>
                    </div>
                    {deployingTo === world || hasActiveJob ? (
                      <div className="stag warning"><div className="pulse"></div> Deploying...</div>
                    ) : isConnected ? (
                      <button className="primary-btn" style={{ padding: '6px 10px', fontSize: '11px', background: 'rgba(62,207,142,0.1)', color: 'var(--success)', border: '1px solid var(--success)' }}>
                        <CheckCircle2 size={12} style={{marginRight: '4px'}}/> Synced
                      </button>
                    ) : (
                      <button className="primary-btn" style={{ padding: '6px 10px', fontSize: '11px' }} onClick={() => handleDeploy(world)} disabled={!avatar}>
                        <Zap size={12} style={{marginRight:'4px'}}/> Deploy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
