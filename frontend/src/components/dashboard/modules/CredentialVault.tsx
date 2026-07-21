'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Shield, CreditCard, Lock, Fingerprint, Eye, Share2, Download, AlertCircle } from 'lucide-react';

export default function CredentialVault() {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const { address } = useAccount();
  const dummyAddress = address;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    // Simulate ZK proof generation delay
    setTimeout(() => {
      setUploading(false);
      setCredentials(prev => [
        {
          id: `new-zk-${Date.now()}`,
          type: `${file.name.split('.')[0]} Proof (zk-SNARK)`,
          issuer: 'Local ZK Verifier',
          issuedAt: new Date().toISOString().split('T')[0],
          metadata: { claim: 'verified_document', doc: file.name, size: `${(file.size / 1024).toFixed(1)} KB` },
          is_zk: true
        },
        ...prev
      ]);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2000);
  };

  useEffect(() => {
    // Simulate fetching credentials
    setTimeout(() => {
      setCredentials([
        { id: 'demo-zk-001', type: 'Aadhaar Identity Proof (zk-SNARK)', issuer: 'UIDAI via ZK Verifier', issuedAt: '2026-07-12', metadata: { claim: 'aadhaar_verified', doc: 'Aadhaar Card' }, is_zk: true },
        { id: 'demo-sbt-002', type: 'Binance KYC Compliance', issuer: 'Binance Global', issuedAt: '2026-06-20', metadata: { tier: '2', risk: 'low' }, is_zk: false },
        { id: 'demo-zk-003', type: 'Age > 18 Proof (zk-SNARK)', issuer: 'Gov ZK Node', issuedAt: '2026-07-15', metadata: { claim: 'age_verified', threshold: '18+' }, is_zk: true }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <>
      <div className="page-head flex justify-between items-start">
        <div>
          <div className="page-eyebrow">Zero-Knowledge Storage</div>
          <h1 className="page-title">
            <div className="picon"><Shield size={18} /></div>
            Credential Vault
          </h1>
          <p className="page-desc">
            Manage your Zero-Knowledge proofs and Soulbound Tokens securely.
          </p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept=".pdf,.png,.jpg,.jpeg,.json" 
          />
          <button 
            onClick={handleUploadClick}
            disabled={uploading}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm flex items-center gap-2"
          >
            {uploading ? (
              <span className="flex items-center gap-2"><div className="pulse"></div> Generating Proof...</span>
            ) : (
              <><span style={{ fontSize: '18px', lineHeight: '1' }}>+</span> Upload Credential</>
            )}
          </button>
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
              <button className="primary-btn" onClick={handleUploadClick}>Mint Genesis Credential</button>
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
                <button 
                  className="icon-btn" 
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => alert(`Decrypting ZK payload for ${cred.type}...\n\n${JSON.stringify(cred.metadata || {}, null, 2)}`)}
                >
                  <Eye size={14}/> View
                </button>
                <button 
                  className="icon-btn" 
                  style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => alert(`Generating single-use ZK proof link for: ${cred.type}`)}
                >
                  <Share2 size={14}/> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
