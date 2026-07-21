'use client';
import React, { useState } from 'react';
import { 
  Network, Shield, Fingerprint, Globe, Link2, CheckCircle2, 
  AlertTriangle, Lock, CreditCard, Smartphone, Mail, Key, 
  ExternalLink, ChevronRight, Zap, Eye
} from 'lucide-react';

const IDENTITY_CONNECTIONS = [
  { id: 'wallet', name: '0x7a3b...f92c', type: 'Primary Wallet', icon: Key, status: 'active', color: '#8b7bff', chain: 'Ethereum' },
  { id: 'google', name: 'user@gmail.com', type: 'Google Account', icon: Mail, status: 'active', color: '#3AA0FF', chain: 'Web2' },
  { id: 'github', name: '@metago-dev', type: 'GitHub', icon: Globe, status: 'active', color: '#3ecf8e', chain: 'Web2' },
  { id: 'phone', name: '+91 •••• ••48', type: 'Mobile Device', icon: Smartphone, status: 'active', color: '#f59e0b', chain: 'Biometric' },
];

const CREDENTIALS = [
  { name: 'Aadhaar ZK Proof', issuer: 'UIDAI via ZK Verifier', type: 'zk', verified: true, date: '12 Jul 2026' },
  { name: 'KYC Compliance', issuer: 'Binance Global', type: 'sbt', verified: true, date: '08 Jul 2026' },
  { name: 'University Degree', issuer: 'Delhi University', type: 'sbt', verified: true, date: '28 Jun 2026' },
  { name: 'Age Verification', issuer: 'ZK Verifier Network', type: 'zk', verified: true, date: '14 Jul 2026' },
];

const SECURITY_CHECKS = [
  { label: 'Biometric Anchor', status: 'pass', detail: 'Face mesh + voice verified' },
  { label: 'Multi-Chain Sync', status: 'pass', detail: 'Polygon, Arbitrum, Ethereum' },
  { label: 'Recovery Guardians', status: 'warn', detail: '2 of 3 configured' },
  { label: 'Phishing Protection', status: 'pass', detail: 'Bloom filter active' },
  { label: 'DID Rotation', status: 'pass', detail: 'Last rotated 3 days ago' },
];

export default function IdentityCore() {
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'security'>('overview');

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Identity Engine</div>
          <h1 className="page-title">
            <div className="picon"><Network size={18} /></div>
            Identity Graph
          </h1>
          <p className="page-desc">
            A structured overview of your decentralized identity — connections, credentials, and security posture.
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '4px' }}>
        {(['overview', 'connections', 'security'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer',
              background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab === tab ? 'var(--fg)' : 'var(--muted)',
              fontSize: '13px', fontWeight: 600, transition: '0.2s ease',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Row */}
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Identity Score</div>
              <div className="stat-value" style={{ color: '#3ecf8e' }}>94/100</div>
              <div className="stat-trend up">Excellent standing</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Connected Anchors</div>
              <div className="stat-value">4</div>
              <div className="stat-trend flat">Wallet, Google, GitHub, Mobile</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Verified Credentials</div>
              <div className="stat-value">4</div>
              <div className="stat-trend up">2 ZK Proofs, 2 SBTs</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Security Level</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>Strong</div>
              <div className="stat-trend flat">1 action needed</div>
            </div>
          </div>

          {/* Credentials Table */}
          <div className="card stack" style={{ marginTop: '20px' }}>
            <div className="card-head" style={{ marginBottom: 0 }}>
              <div className="card-title"><CreditCard size={16} /> Verified Credentials</div>
            </div>
            <div className="row-list">
              {CREDENTIALS.map((cred, i) => (
                <div className="row-item" key={i}>
                  <div className="row-ic" style={{ color: cred.type === 'zk' ? '#ff5fa8' : '#8b7bff' }}>
                    {cred.type === 'zk' ? <Fingerprint size={18} /> : <Shield size={18} />}
                  </div>
                  <div className="row-body">
                    <div className="row-title">{cred.name}</div>
                    <div className="row-desc">Issued by {cred.issuer} • {cred.date}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
                      background: cred.type === 'zk' ? 'rgba(255,95,168,0.1)' : 'rgba(139,123,255,0.1)',
                      color: cred.type === 'zk' ? '#ff5fa8' : '#8b7bff',
                      border: `1px solid ${cred.type === 'zk' ? 'rgba(255,95,168,0.2)' : 'rgba(139,123,255,0.2)'}`
                    }}>
                      {cred.type === 'zk' ? 'ZK Proof' : 'SBT'}
                    </span>
                    {cred.verified && <CheckCircle2 size={16} style={{ color: '#3ecf8e' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CONNECTIONS TAB */}
      {activeTab === 'connections' && (
        <div className="grid-2">
          {IDENTITY_CONNECTIONS.map((conn) => (
            <div className="card" key={conn.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '12px',
                    background: `${conn.color}15`, border: `1px solid ${conn.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: conn.color
                  }}>
                    <conn.icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>{conn.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{conn.type}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
                  background: 'rgba(62,207,142,0.1)', color: '#3ecf8e', border: '1px solid rgba(62,207,142,0.2)'
                }}>Active</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Link2 size={12} /> {conn.chain}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} /> Bi-directional link
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <button className="icon-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
                  <Eye size={13} /> Inspect
                </button>
                <button className="icon-btn" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '12px' }}>
                  <ExternalLink size={13} /> Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="card stack">
          <div className="card-head" style={{ marginBottom: 0 }}>
            <div className="card-title"><Lock size={16} /> Security Posture</div>
          </div>
          <div className="row-list">
            {SECURITY_CHECKS.map((check, i) => (
              <div className="row-item" key={i}>
                <div className="row-ic" style={{ color: check.status === 'pass' ? '#3ecf8e' : '#f59e0b' }}>
                  {check.status === 'pass' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="row-body">
                  <div className="row-title">{check.label}</div>
                  <div className="row-desc">{check.detail}</div>
                </div>
                <span style={{
                  fontSize: '10px', padding: '3px 10px', borderRadius: '20px', fontWeight: 600,
                  background: check.status === 'pass' ? 'rgba(62,207,142,0.1)' : 'rgba(245,158,11,0.1)',
                  color: check.status === 'pass' ? '#3ecf8e' : '#f59e0b',
                  border: `1px solid ${check.status === 'pass' ? 'rgba(62,207,142,0.2)' : 'rgba(245,158,11,0.2)'}`
                }}>
                  {check.status === 'pass' ? 'Passed' : 'Attention'}
                </span>
              </div>
            ))}
          </div>

          {/* Action Banner */}
          <div style={{
            marginTop: '16px', padding: '16px 20px', borderRadius: '12px',
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Add 3rd Recovery Guardian</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Strengthen your account recovery to 3-of-3 multisig</div>
              </div>
            </div>
            <button style={{
              background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px',
              padding: '8px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              Fix Now <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
