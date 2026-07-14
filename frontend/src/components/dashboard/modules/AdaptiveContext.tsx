'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Activity, MapPin, Laptop, Wifi, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdaptiveContext() {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const dummyAddress = address;

  useEffect(() => {
    async function fetchRisk() {
      try {
        const res = await fetch(`http://localhost:8001/api/privacy/context-risk?address=${dummyAddress}`);
        if (res.ok) {
          const d = await res.json();
          setContext(d);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchRisk();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--fg)' }}></div>
        Evaluating dynamic context...
      </div>
    );
  }

  const getRiskColor = (level: string) => {
    if (level === 'High Risk') return 'var(--danger)';
    if (level === 'Medium Risk') return 'var(--warning)';
    return 'var(--success)';
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Activity size={24} style={{ color: 'var(--blue)' }} />
            Adaptive Context Engine
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
            Real-time multi-dimensional risk evaluation dictating your authentication thresholds.
          </p>
        </div>
        <div style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' 
        }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Stance</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: getRiskColor(context?.risk_level) }}>
            {context?.risk_level}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Telemetry Factors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {context?.factors.map((f: any, i: number) => (
            <div key={i} style={{ padding: '16px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {f.factor.includes('Device') && <Laptop size={16} className="text-muted"/>}
                {f.factor.includes('Travel') && <MapPin size={16} className="text-muted"/>}
                {f.factor.includes('Network') && <Wifi size={16} className="text-muted"/>}
                {f.factor.includes('Velocity') && <Activity size={16} className="text-muted"/>}
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{f.factor}</span>
              </div>
              <div style={{ fontSize: '12px', color: f.status === 'Secure' || f.status === 'Clear' || f.status === 'Normal' ? 'var(--success)' : 'var(--warning)' }}>
                {f.status}
              </div>
            </div>
          ))}
        </div>

        {/* Engine Output Analysis */}
        <div style={{ background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '32px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: getRiskColor(context?.risk_level) }}/>
            Engine Heuristics Analysis
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {context?.reasons.map((reason: string, i: number) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '14px', lineHeight: 1.6, color: 'var(--muted)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <CheckCircle2 size={16} style={{ color: getRiskColor(context?.risk_level), flexShrink: 0, marginTop: '2px' }} />
                {reason}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '8px' }}>System Recommendation</div>
            <div style={{ fontSize: '14px', color: 'var(--fg)', fontWeight: 500 }}>
              {context?.risk_level === 'Low Risk' ? 'Proceed with standard implicit authentication. No step-up required.' : 'Elevated risk detected. Require hardware key or biometric signature for subsequent actions.'}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
