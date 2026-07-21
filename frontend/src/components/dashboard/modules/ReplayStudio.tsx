'use client';
import React, { useState } from 'react';
import { Activity, PlayCircle, Clock, ShieldCheck, Database, Code, Terminal, Eye, FileJson } from 'lucide-react';

const MOCK_EVENTS = [
  {
    id: 'evt-001',
    title: 'DeFi Swap (Uniswap v3)',
    timestamp: '2 mins ago',
    type: 'Transaction',
    network: 'Ethereum Mainnet',
    status: 'Verified',
    payload: `{\n  "method": "exactInputSingle",\n  "params": {\n    "tokenIn": "USDC",\n    "tokenOut": "ETH",\n    "amountIn": 1500000000\n  },\n  "gasUsed": "135,420"\n}`
  },
  {
    id: 'evt-002',
    title: 'KYC Verification (Binance)',
    timestamp: '3 hours ago',
    type: 'Identity',
    network: 'Zero-Knowledge Proof',
    status: 'Audited',
    payload: `{\n  "verifier": "Binance Global",\n  "proofType": "zk-SNARK",\n  "claims": ["age > 18", "country != US"],\n  "status": "VALID"\n}`
  },
  {
    id: 'evt-003',
    title: 'Wallet Connection (OpenSea)',
    timestamp: '1 day ago',
    type: 'Authentication',
    network: 'MetaMask',
    status: 'Logged',
    payload: `{\n  "app": "OpenSea",\n  "permissions": ["read_address"],\n  "signature": "0x4a9b...7f1a",\n  "sessionDuration": "24h"\n}`
  }
];

export default function ReplayStudio() {
  const [activeEvent, setActiveEvent] = useState(MOCK_EVENTS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePlay = () => {
    setIsPlaying(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsPlaying(false);
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Activity size={24} style={{ color: 'var(--blue)' }} />
            Replay Studio
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
            Playback and visualize your historical identity interactions in real-time.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', height: '600px' }}>
        
        {/* Sidebar - Event List */}
        <div style={{ width: '320px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--muted)' }}/> Recent Interactions
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {MOCK_EVENTS.map(evt => (
              <div 
                key={evt.id}
                onClick={() => { setActiveEvent(evt); setProgress(0); setIsPlaying(false); }}
                style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  background: activeEvent.id === evt.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                  borderLeft: activeEvent.id === evt.id ? '3px solid var(--blue)' : '3px solid transparent'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>{evt.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{evt.type}</span>
                  <span>{evt.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Stage - Replay Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Visualizer Player */}
          <div style={{ flex: '0 0 300px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' }}>
              <div>
                <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeEvent.title}
                  <span style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{activeEvent.status}</span>
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--muted)', display: 'flex', gap: '16px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Database size={14}/> {activeEvent.network}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={14}/> {activeEvent.type}</span>
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '16px', overflow: 'hidden' }}>
                <div style={{ width: progress + '%', height: '100%', background: 'var(--blue)', transition: 'width 0.1s linear' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={handlePlay}
                  disabled={isPlaying}
                  style={{ 
                    background: isPlaying ? 'rgba(255,255,255,0.05)' : 'var(--blue)', 
                    color: isPlaying ? 'var(--muted)' : '#fff',
                    border: 'none', borderRadius: '50%', width: '48px', height: '48px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isPlaying ? 'default' : 'pointer',
                    transition: '0.2s ease'
                  }}
                >
                  <PlayCircle size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Payload Data */}
          <div style={{ flex: 1, background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '20px', fontSize: '13px', fontWeight: 500 }}>
              <div style={{ color: 'var(--fg)', borderBottom: '2px solid var(--blue)', paddingBottom: '16px', marginBottom: '-17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileJson size={14}/> Payload Data
              </div>
              <div style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={14}/> Execution Trace
              </div>
            </div>
            
            <div style={{ padding: '20px', background: '#050505', flex: 1, overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13px', color: '#a5b4fc', lineHeight: 1.6 }}>
                {progress > 0 ? activeEvent.payload.substring(0, Math.floor((progress / 100) * activeEvent.payload.length)) : '// Press play to reconstruct event payload...'}
                {progress > 0 && progress !== 100 && <span style={{ opacity: 0.5 }}>_</span>}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
