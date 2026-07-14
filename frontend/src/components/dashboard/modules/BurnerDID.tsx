'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Flame, Shield, Clock, Plus, Trash2, Key, Link as LinkIcon, Lock } from 'lucide-react';

export default function BurnerDID() {
  const [burners, setBurners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const { address } = useAccount();
  const dummyAddress = address;

  const fetchBurners = async () => {
    if (!address) { setLoading(false); return; }
    try {
      const res = await fetch(`http://localhost:8001/api/privacy/burner-dids?address=${dummyAddress}`);
      if (res.ok) {
        const d = await res.json();
        setBurners(d.burner_dids || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBurners();
  }, [address]);

  const generateBurner = async () => {
    setGenerating(true);
    try {
      await fetch(`http://localhost:8001/api/privacy/burner-did/create?address=${dummyAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_hours: 24 })
      });
      fetchBurners();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const revokeBurner = async (id: string) => {
    try {
      await fetch(`http://localhost:8001/api/privacy/burner-did/${id}?address=${dummyAddress}`, { method: 'DELETE' });
      fetchBurners();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--fg)' }}></div>
        Syncing cryptographic state...
      </div>
    );
  }

  const activeBurners = burners.filter(b => b.status === 'Active');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Flame size={24} style={{ color: 'var(--danger)' }} />
            Burner Identities
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
            Generate unlinkable, self-destructing identities for private transactions.
          </p>
        </div>
        <button 
          onClick={generateBurner} 
          disabled={generating}
          style={{ 
            background: 'var(--fg)', color: 'var(--bg)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' 
          }}
        >
          {generating ? <div className="pulse" style={{ background: 'var(--bg)' }}></div> : <Plus size={16} />}
          New Identity
        </button>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Lock size={16} style={{ color: 'var(--success)' }}/>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Zero-Knowledge Provenance</h3>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
          Burner DIDs are cryptographically linked to your Root DID via Zero-Knowledge proofs. 
          They are mathematically provable to you, but completely unlinkable by public observers.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeBurners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', color: 'var(--muted)' }}>
            <Shield size={32} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <div style={{ fontSize: '15px' }}>No active burner identities.</div>
          </div>
        ) : activeBurners.map((burner, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,92,114,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                <Flame size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, fontFamily: 'monospace', letterSpacing: '0.5px' }}>{burner.burner_address.substring(0, 12)}...{burner.burner_address.substring(burner.burner_address.length - 4)}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={12}/> ZK Ref: {burner.zk_reference}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12}/> Expires: {new Date(burner.expires_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={() => revokeBurner(burner.burner_id)} style={{ background: 'transparent', border: '1px solid rgba(255,92,114,0.3)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              <Trash2 size={14} /> Revoke
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
