'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Shield, CreditCard, Lock, Fingerprint, Eye, Share2, Download, AlertCircle } from 'lucide-react';

export default function CredentialVault() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const dummyAddress = address;

  const DEMO_CREDENTIALS = [
    { id: 'demo-zk-001', type: 'Aadhaar Identity Proof (zk-SNARK)', issuer: 'UIDAI via ZK Verifier', issuedAt: '2026-07-12', metadata: { claim: 'aadhaar_verified', doc: 'Aadhaar Card' }, is_zk: true },
    { id: 'demo-sbt-001', type: 'Passport Verification SBT', issuer: 'MetaGo Document Vault', issuedAt: '2026-07-10', metadata: { country: 'India', doc_type: 'Passport' }, is_zk: false },
    { id: 'demo-zk-002', type: 'Age Verification (zk-SNARK)', issuer: 'ZK Verifier Network', issuedAt: '2026-07-14', metadata: { claim: 'age >= 18', source: 'PAN Card' }, is_zk: true },
    { id: 'demo-sbt-002', type: 'University Degree Certificate', issuer: 'Delhi University (On-Chain)', issuedAt: '2026-06-28', metadata: { degree: 'B.Tech CS', grade: 'First Class' }, is_zk: false },
    { id: 'demo-sbt-003', type: 'KYC Compliance Badge', issuer: 'Binance Global', issuedAt: '2026-07-08', metadata: { tier: 'Level 2', region: 'Global' }, is_zk: false },
    { id: 'demo-zk-003', type: 'Driving License Proof (zk-SNARK)', issuer: 'ZK Verifier Network', issuedAt: '2026-07-15', metadata: { claim: 'valid_license', doc: 'Driving License' }, is_zk: true },
  ];

  useEffect(() => {
    async function fetchVault() {
      if (!address) { setCredentials(DEMO_CREDENTIALS); setLoading(false); return; }
      try {
        const res = await fetch(`http://localhost:8001/api/dashboard/vault/credentials?address=${dummyAddress}`);
        if (res.ok) {
          const data = await res.json();
          const creds = data.credentials || [];
          setCredentials(creds.length > 0 ? creds : DEMO_CREDENTIALS);
        } else {
          setCredentials(DEMO_CREDENTIALS);
        }
      } catch (err) {
        // Backend not available — use demo data
        setCredentials(DEMO_CREDENTIALS);
      } finally {
        setLoading(false);
      }
    }
    fetchVault();
  }, [address]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Data Sovereignty</div>
          <h1 className="page-title">
            <div className="picon"><Shield size={18} /></div>
            Credential Vault
          </h1>
          <p className="page-desc">
            Manage your Zero-Knowledge proofs and Soulbound Tokens securely.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          <div className="pulse" style={{ display: 'inline-block', marginRight: '8px' }}></div>
          Decrypting vault contents...
        </div>
      ) : (
        <div className="grid-3">
          {credentials.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)', gridColumn: '1 / -1' }}>
              <Lock size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto', display: 'block' }}/>
              Your vault is empty. No Zero-Knowledge Proofs or SBTs found.
              <br/><br/>
              <button className="primary-btn">Mint Genesis Credential</button>
            </div>
          ) : credentials.map((cred, i) => (
            <div className="card" key={i} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div className="row-ic" style={{ color: cred.is_zk ? 'var(--blue)' : 'var(--violet)' }}>
                  {cred.is_zk ? <Fingerprint size={24} /> : <CreditCard size={24} />}
                </div>
                <div className="stag ok" style={{ fontSize: '10px' }}>{cred.is_zk ? 'ZK Proof' : 'SBT'}</div>
              </div>
              
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{cred.type}</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: 'var(--muted)', flexGrow: 1 }}>
                Issued by: <br/>
                <span style={{ color: 'var(--fg)' }}>{cred.issuer}</span>
              </p>

              {cred.metadata && Object.keys(cred.metadata).length > 0 && (
                <div style={{ padding: '10px', background: 'var(--bg)', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: 'var(--muted)', wordBreak: 'break-all' }}>
                  {JSON.stringify(cred.metadata)}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button className="icon-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}><Eye size={14}/> View</button>
                <button className="icon-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}><Share2 size={14}/> Share</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
