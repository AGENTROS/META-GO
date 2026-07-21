'use client';
import React, { useState, useEffect } from 'react';
import { 
  Network, Hexagon, Shield, CheckCircle2, Link as LinkIcon, 
  Smartphone, Wallet, Key
} from 'lucide-react';

export default function IdentityGraph() {
  const [deviceString, setDeviceString] = useState('Primary Device');

  useEffect(() => {
    // Client-side detection of device
    const ua = window.navigator.userAgent;
    let detected = 'Desktop Device';
    if (ua.includes('iPhone')) detected = 'iPhone (Trusted)';
    else if (ua.includes('iPad')) detected = 'iPad (Trusted)';
    else if (ua.includes('Android')) detected = 'Android Device';
    else if (ua.includes('Macintosh')) detected = 'MacBook / Mac Device';
    else if (ua.includes('Windows')) detected = 'Windows PC';
    
    setDeviceString(detected);
  }, []);
  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Relationship Mapping</div>
          <h1 className="page-title">
            <div className="picon"><Network size={18} /></div>
            Identity Graph
          </h1>
          <p className="page-desc">
            A live, topological view of every entity linked to your decentralized identity. This includes wallets, credentials, devices, and authorized smart contracts.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> 47 Nodes Synced
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-head">
          <div className="card-title"><Hexagon size={16} /> Topology Explorer</div>
        </div>
        
        {/* Placeholder for the interactive Neo4j / React-Flow graph */}
        <div 
          style={{ 
            height: '400px', 
            borderRadius: '12px',
            background: 'radial-gradient(circle at center, rgba(139,123,255,0.08), transparent 70%)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Mock Graph Nodes */}
          <div style={{ position: 'absolute', top: '20%', left: '30%', padding: '8px 12px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <Wallet size={12} className="text-violet" /> Polygon Wallet
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '12px 18px', background: 'rgba(91,140,255,0.1)', border: '1px solid var(--blue)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <Shield size={16} className="text-blue" /> MetaGo DID Core
          </div>
          <div style={{ position: 'absolute', bottom: '25%', right: '25%', padding: '8px 12px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <Smartphone size={12} className="text-pink" /> Trusted {deviceString}
          </div>
          <div style={{ position: 'absolute', top: '25%', right: '35%', padding: '8px 12px', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <Key size={12} className="text-success" /> Biometric Key
          </div>
          
          {/* Mock Edge SVG */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.3 }}>
            <line x1="35%" y1="25%" x2="50%" y2="50%" stroke="var(--blue)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="60%" y1="30%" x2="50%" y2="50%" stroke="var(--blue)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="70%" y1="70%" x2="50%" y2="50%" stroke="var(--blue)" strokeWidth="1" />
          </svg>
        </div>
      </div>

      <div className="grid-2">
        <div className="card stack">
          <div className="card-head" style={{ marginBottom: '0' }}>
            <div className="card-title"><LinkIcon size={16} /> Direct Relationships (Edges)</div>
          </div>
          <div className="row-list">
            <div className="row-item">
              <div className="row-ic"><Shield size={16} /></div>
              <div className="row-body">
                <div className="row-title">DID to Polygon Wallet</div>
                <div className="row-desc">Authenticated Ownership • Confirmed</div>
              </div>
              <div className="stag ok"><div className="d"></div>Verified</div>
            </div>
            <div className="row-item">
              <div className="row-ic"><Smartphone size={16} /></div>
              <div className="row-body">
                <div className="row-title">DID to {deviceString}</div>
                <div className="row-desc">Device Fingerprint Match • Confirmed</div>
              </div>
              <div className="stag ok"><div className="d"></div>Verified</div>
            </div>
            <div className="row-item">
              <div className="row-ic"><Key size={16} /></div>
              <div className="row-body">
                <div className="row-title">DID to Biometric Key</div>
                <div className="row-desc">AASIST+ECAPA Fusion Hash • Confirmed</div>
              </div>
              <div className="stag ok"><div className="d"></div>Verified</div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="stat-grid" style={{ marginBottom: '0' }}>
            <div className="stat-card">
              <div className="stat-label">Total Nodes</div>
              <div className="stat-value">47</div>
              <div className="stat-trend up">+3 this week</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Graph Depth</div>
              <div className="stat-value">4 hops</div>
              <div className="stat-trend flat">Optimal indexing</div>
            </div>
          </div>
          <div className="stat-grid" style={{ marginBottom: '0' }}>
            <div className="stat-card">
              <div className="stat-label">Direct Edges</div>
              <div className="stat-value">24</div>
              <div className="stat-trend ok">Strongly connected</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Orphaned Nodes</div>
              <div className="stat-value">0</div>
              <div className="stat-trend ok">Clean graph</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
