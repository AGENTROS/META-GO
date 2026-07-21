'use client';
import React from 'react';
import { Globe } from 'lucide-react';

const WORLDS = [
  { name: 'Decentraland', color: 'from-orange-500 to-red-500', online: true, img: '/images/worlds/cyber_city.png' },
  { name: 'The Sandbox', color: 'from-blue-400 to-blue-600', online: true, img: '/images/worlds/meta_office.png' },
  { name: 'Spatial', color: 'from-indigo-500 to-purple-600', online: true, img: '/images/worlds/study_verse.png' },
  { name: 'VRChat', color: 'from-cyan-400 to-blue-500', online: true, img: '/images/worlds/veridia_realm.png' },
  { name: 'OnCyber', color: 'from-purple-500 to-pink-500', online: true, img: '/images/worlds/cyber_city.png' },
];

const DAPPS = [
  { name: 'OpenSea', icon: '⛵', color: 'bg-blue-600', img: 'https://storage.googleapis.com/opensea-static/Logomark/Logomark-White.svg' },
  { name: 'Uniswap', icon: '🦄', color: 'bg-pink-500', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png' },
  { name: 'Lens', icon: '🌿', color: 'bg-green-500', img: null },
  { name: 'Farcaster', icon: '🟪', color: 'bg-purple-600', img: null },
  { name: 'GitHub', icon: '🐙', color: 'bg-gray-800', img: 'https://github.fluidicon.png' },
];

const CHAINS = [
  { name: 'Polygon', status: 'Active', statusColor: 'text-emerald-400', color: 'bg-purple-600', icon: '∞', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png' },
  { name: 'Ethereum', status: 'Connected', statusColor: 'text-emerald-400', color: 'bg-indigo-500', icon: '⟠', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png' },
  { name: 'Arbitrum', status: 'Connected', statusColor: 'text-emerald-400', color: 'bg-blue-500', icon: 'A', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png' },
  { name: 'Base', status: 'Connected', statusColor: 'text-emerald-400', color: 'bg-blue-600', icon: '⚪', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png' },
  { name: 'Optimism', status: 'Coming Soon', statusColor: 'text-gray-500', color: 'bg-red-500', icon: 'OP', img: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/info/logo.png' },
];

import { useIdentityStore } from '@/store/useIdentityStore';
import { useEffect } from 'react';

export default function ConnectedEcosystem() {
  const { integrations, fetchIntegrations } = useIdentityStore();

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleConnect = (providerName: string) => {
    const key = providerName.toLowerCase();
    if (integrations[key] || key === 'optimism') return;
    window.location.href = `http://localhost:8005/api/integrations/connect/${key}`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
      
      {/* Connected Worlds */}
      <div className="card" style={{ padding: '20px', background: 'rgba(15,15,20,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Connected Worlds</h3>
          <span style={{ fontSize: '12px', color: '#5b8cff' }}>5 Connected</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
          {WORLDS.map((w, i) => {
            const isConnected = !!integrations[w.name.toLowerCase()];
            return (
            <div key={i} className="group" style={{ width: '80px', flexShrink: 0, cursor: isConnected ? 'default' : 'pointer', opacity: isConnected ? 1 : 0.8 }} onClick={() => handleConnect(w.name)}>
              <div className={`bg-gradient-to-br ${w.color} ${isConnected ? '' : 'group-hover:scale-105 transition-all'}`} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '16px', marginBottom: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={w.img} alt={w.name} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: isConnected ? 0.9 : 0.7, mixBlendMode: 'overlay', zIndex: 0, filter: isConnected ? 'none' : 'grayscale(60%)' }} />
                <Globe size={24} color="rgba(255,255,255,0.9)" style={{ position: 'relative', zIndex: 1 }} />
              </div>
              <div className={isConnected ? '' : "group-hover:text-blue-400 transition-colors"} style={{ fontSize: '12px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.name}</div>
              <div style={{ fontSize: '10px', color: isConnected ? '#10b981' : '#888' }}>{isConnected ? 'Online' : 'Click to connect'}</div>
            </div>
          )})}
        </div>
        <button className="hover:bg-blue-600/20 transition-colors" style={{ width: '100%', padding: '10px', background: 'rgba(91,140,255,0.05)', border: '1px solid rgba(91,140,255,0.1)', borderRadius: '12px', color: '#5b8cff', fontSize: '13px', cursor: 'pointer' }}>Manage Worlds</button>
      </div>

      {/* Connected DApps */}
      <div className="card" style={{ padding: '20px', background: 'rgba(15,15,20,0.6)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>Connected DApps</h3>
          <span style={{ fontSize: '12px', color: '#5b8cff' }}>8 Connected</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', flex: 1 }}>
          {DAPPS.map((d, i) => {
            const isConnected = !!integrations[d.name.toLowerCase()];
            return (
            <div key={i} className="group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: isConnected ? 'default' : 'pointer', opacity: isConnected ? 1 : 0.6 }} onClick={() => handleConnect(d.name)}>
              <div className={`${d.color} ${isConnected ? '' : 'group-hover:scale-110 transition-transform'}`} style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                {d.img ? <img src={d.img} alt={d.name} style={{ width: '60%', height: '60%', objectFit: 'contain', opacity: isConnected ? 1 : 0.8 }} onError={(e) => e.currentTarget.style.display = 'none'} /> : d.icon}
              </div>
              <div className={isConnected ? '' : "group-hover:text-blue-400 transition-colors"} style={{ fontSize: '11px', color: '#d8d8db' }}>{d.name}</div>
              {!isConnected && <div style={{ fontSize: '9px', color: '#888' }}>Connect</div>}
            </div>
          )})}
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#888', marginBottom: '20px' }}>
            +3
          </div>
        </div>
        <button className="hover:bg-blue-600/20 transition-colors" style={{ width: '100%', padding: '10px', background: 'rgba(91,140,255,0.05)', border: '1px solid rgba(91,140,255,0.1)', borderRadius: '12px', color: '#5b8cff', fontSize: '13px', cursor: 'pointer', marginTop: 'auto' }}>Manage DApps</button>
      </div>

      {/* Cross-Chain Identity */}
      <div className="card" style={{ padding: '20px', background: 'rgba(15,15,20,0.6)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>Cross-Chain Identity</h3>
          <div style={{ fontSize: '12px', color: '#888892' }}>Bridge your identity across multiple blockchains</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flex: 1 }}>
          {CHAINS.map((c, i) => {
            const isConnected = !!integrations[c.name.toLowerCase()];
            const isOptimism = c.name === 'Optimism';
            return (
            <div key={i} className="group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: isOptimism ? 0.3 : (isConnected ? 1 : 0.6), cursor: isConnected || isOptimism ? 'default' : 'pointer' }} onClick={() => handleConnect(c.name)}>
              <div className={`${c.color} ${isConnected || isOptimism ? '' : 'group-hover:scale-110 transition-transform'}`} style={{ width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', overflow: 'hidden' }}>
                {c.img ? <img src={c.img} alt={c.name} style={{ width: '60%', height: '60%', objectFit: 'contain', opacity: isConnected ? 1 : 0.8 }} onError={(e) => e.currentTarget.style.display = 'none'} /> : c.icon}
              </div>
              <div className={isConnected || isOptimism ? '' : "group-hover:text-blue-400 transition-colors"} style={{ fontSize: '11px', color: '#fff' }}>{c.name}</div>
              <div className={isConnected ? 'text-emerald-400' : (isOptimism ? 'text-gray-500' : 'text-gray-400')} style={{ fontSize: '10px' }}>{isConnected ? 'Connected' : (isOptimism ? 'Coming Soon' : 'Connect')}</div>
            </div>
          )})}
        </div>
        <button className="hover:bg-blue-600/20 transition-colors" style={{ width: '100%', padding: '10px', background: 'rgba(91,140,255,0.05)', border: '1px solid rgba(91,140,255,0.1)', borderRadius: '12px', color: '#5b8cff', fontSize: '13px', cursor: 'pointer', marginTop: 'auto' }}>Manage Cross-Chain</button>
      </div>

    </div>
  );
}
