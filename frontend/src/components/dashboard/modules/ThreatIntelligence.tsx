'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ShieldAlert, Activity, Crosshair, AlertTriangle, Fingerprint, Lock } from 'lucide-react';

export default function ThreatIntelligence() {
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const dummyAddress = address;

  useEffect(() => {
    async function fetchThreats() {
      try {
        const res = await fetch(`http://localhost:8001/api/dashboard/intelligence/threats?address=${dummyAddress}`);
        if (res.ok) {
          const d = await res.json();
          setThreats(d.threats || []);
        }
      } catch (err) {
        console.error('Failed to fetch threats', err);
      } finally {
        setLoading(false);
      }
    }
    fetchThreats();
    
    // Fallback polling for live threat detection
    const interval = setInterval(fetchThreats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--danger)' }}></div>
        Scanning threat vectors...
      </div>
    );
  }

  const highRiskCount = threats.filter(t => t.risk === 'High').length;

  return (
    <>
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow" style={{ color: 'var(--danger)' }}>
            <Crosshair size={12} style={{ display: 'inline', marginRight: '4px' }}/> Active Monitoring
          </div>
          <h1 className="page-title">Threat Intelligence Center</h1>
          <p className="page-desc">Live detection of deepfakes, clone attempts, and impossible travel vectors.</p>
        </div>
        <div className="status-pill" style={{ background: highRiskCount > 0 ? 'rgba(255,92,114,0.1)' : 'rgba(62,207,142,0.1)', color: highRiskCount > 0 ? 'var(--danger)' : 'var(--success)' }}>
          <div className="pulse" style={{ background: highRiskCount > 0 ? 'var(--danger)' : 'var(--success)' }}></div> 
          {highRiskCount > 0 ? `${highRiskCount} Active Threats` : 'Zero Threats Detected'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', minHeight: '600px' }}>
        
        {/* Radar / Scanners */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            
            <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,92,114,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 50px rgba(255,92,114,0.1)' }}>
               {/* Animated Radar Line Simulator */}
               <div style={{ position: 'absolute', top: 0, left: '50%', width: '1px', height: '50%', background: 'linear-gradient(to bottom, rgba(255,92,114,1), transparent)', transformOrigin: 'bottom center', animation: 'spin 4s linear infinite' }} />
               <Fingerprint size={48} style={{ color: highRiskCount > 0 ? 'var(--danger)' : 'var(--success)', opacity: 0.5 }} />
            </div>

            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
            
            <h3 style={{ marginTop: '20px' }}>Deepfake Scanner Active</h3>
            <div className="stag ok text-success" style={{ marginTop: '10px' }}><Lock size={12} style={{marginRight:'4px'}}/> Neural Network Guarding</div>
          </div>
        </div>

        {/* Threat Log */}
        <div className="card stack" style={{ background: 'rgba(20,20,25,0.7)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="card-head">
            <div className="card-title"><ShieldAlert size={16} className={highRiskCount > 0 ? 'text-danger' : 'text-success'} /> Threat Telemetry</div>
          </div>
          <div className="row-list" style={{ overflowY: 'auto' }}>
            {threats.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
                <Activity size={32} style={{ opacity: 0.2, margin: '0 auto 10px auto' }} />
                No medium or high-risk events detected in the network logs.
              </div>
            ) : threats.map((t, i) => (
              <div className="row-item" key={i} style={{ background: t.risk === 'High' ? 'rgba(255,92,114,0.05)' : 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${t.risk === 'High' ? 'var(--danger)' : 'var(--warning)'}` }}>
                <div className="row-ic" style={{ color: t.risk === 'High' ? 'var(--danger)' : 'var(--warning)' }}>
                  <AlertTriangle size={16} />
                </div>
                <div className="row-body">
                  <div className="row-title">{t.event}</div>
                  <div className="row-desc">{new Date(t.time).toLocaleString()}</div>
                </div>
                <div className={`stag ${t.risk === 'High' ? 'danger' : 'warning'}`}>{t.risk}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
