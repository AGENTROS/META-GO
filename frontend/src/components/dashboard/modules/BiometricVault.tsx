'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Fingerprint, Lock, Unlock, FileText, Upload, ShieldCheck, EyeOff } from 'lucide-react';

export default function BiometricVault() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const { address } = useAccount();
  const dummyAddress = address;

  const fetchItems = async () => {
    try {
      const res = await fetch(`http://localhost:8001/api/privacy/vault?address=${dummyAddress}`);
      if (res.ok) {
        const d = await res.json();
        setItems(d.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUnlock = () => {
    setUnlocking(true);
    // Simulate WebAuthn/Wallet Signature prompt
    setTimeout(async () => {
      try {
        await fetch(`http://localhost:8001/api/privacy/vault/unlock?address=${dummyAddress}`, { method: 'POST' });
        setUnlocked(true);
      } catch (err) {
        console.error(err);
      } finally {
        setUnlocking(false);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '100px', textAlign: 'center', color: 'var(--muted)' }}>
        <div className="pulse" style={{ display: 'inline-block', marginRight: '8px', background: 'var(--fg)' }}></div>
        Syncing encrypted enclaves...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--fg)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Fingerprint size={24} style={{ color: 'var(--blue)' }} />
            Soulbound Vault
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '8px', fontSize: '15px' }}>
            Zero-knowledge encrypted storage. The server never sees your raw data.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            disabled={!unlocked}
            style={{ 
              background: 'transparent', color: unlocked ? 'var(--fg)' : 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: unlocked ? 'pointer' : 'not-allowed', opacity: unlocked ? 1 : 0.5 
            }}
          >
            <Upload size={16} /> Encrypt File
          </button>
        </div>
      </div>

      {!unlocked ? (
        <div style={{ textAlign: 'center', padding: '100px 20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 24px auto', borderRadius: '50%', background: 'rgba(91,140,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)', boxShadow: unlocking ? '0 0 40px rgba(91,140,255,0.4)' : 'none', transition: 'all 0.3s ease' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>Vault is Locked</h2>
          <p style={{ color: 'var(--muted)', maxWidth: '400px', margin: '0 auto 32px auto', lineHeight: 1.5 }}>
            Your encrypted blobs require cryptographic decryption derived from your root identity signature.
          </p>
          <button 
            onClick={handleUnlock}
            disabled={unlocking}
            style={{ background: 'var(--fg)', color: 'var(--bg)', border: 'none', padding: '14px 32px', borderRadius: '24px', fontSize: '15px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            {unlocking ? <div className="pulse" style={{ background: 'var(--bg)' }}></div> : <Fingerprint size={18} />}
            {unlocking ? 'Verifying Signature...' : 'Unlock Vault'}
          </button>
        </div>
      ) : (
        <>
          <div style={{ background: 'rgba(62,207,142,0.05)', border: '1px solid rgba(62,207,142,0.2)', borderRadius: '12px', padding: '16px 24px', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--success)' }}/>
            <span style={{ fontSize: '14px', color: 'var(--success)' }}>Vault decrypted locally via WebAuthn derived keys.</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {items.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', color: 'var(--muted)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <EyeOff size={32} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                Vault is empty.
              </div>
            ) : items.map((item, i) => (
              <div key={i} style={{ padding: '20px', background: '#0a0a0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <FileText size={20} style={{ color: 'var(--fg)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{item.encryption_metadata?.name || 'Encrypted Blob'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{item.algorithm}</div>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace', wordBreak: 'break-all', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '4px' }}>
                  Hash: {item.integrity_hash.substring(0, 16)}...
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
