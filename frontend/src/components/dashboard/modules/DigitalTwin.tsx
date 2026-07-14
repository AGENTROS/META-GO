'use client';
import React, { useEffect, useState } from 'react';
import { Network, Database, Cloud, MapPin, Globe } from 'lucide-react';

export default function DigitalTwin() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating loading the massive presence graph
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--blue)' }}></div>
        Mapping Identity Presence...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif', height: 'calc(100vh - 120px)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Network size={24} style={{ color: 'var(--blue)' }} />
            Identity Presence Map
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
            A complete topological graph of where your digital twin currently exists across Web2 and Web3.
          </p>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 120px)', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Placeholder for real React Force Graph or Canvas */}
        <div style={{ position: 'absolute', top: 20, left: 20, color: 'var(--muted)', fontSize: '13px', display: 'flex', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--violet)' }}></div> Web3 Metaverses</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div> Connected DApps</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--blue)' }}></div> Web2 Oauth</div>
        </div>

        <div style={{ textAlign: 'center', zIndex: 10 }}>
          <Network size={64} style={{ color: 'var(--blue)', opacity: 0.2, margin: '0 auto 20px auto' }} />
          <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Graph Mapping Active</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto' }}>
            Connected to 14 platforms including Discord, Spatial, Unreal Engine, and ENS.
          </p>
        </div>

        {/* Decorative connecting lines simulation */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1, pointerEvents: 'none' }}>
          <circle cx="50%" cy="50%" r="150" fill="none" stroke="var(--blue)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="50%" cy="50%" r="300" fill="none" stroke="var(--blue)" strokeWidth="1" strokeDasharray="2 6" />
        </svg>
      </div>

    </div>
  );
}
