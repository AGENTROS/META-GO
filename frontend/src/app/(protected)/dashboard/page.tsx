'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useIdentityStore } from '@/store/useIdentityStore';
import { useShallow } from 'zustand/shallow';
import {
  ShieldCheck, ChevronRight, Fingerprint, Coins, Shield,
  Activity, Key, Lock, Zap, LayoutDashboard, Clock, AlertTriangle,
  CheckCircle2, XCircle, Star, Network, Award
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MetaverseFootprint = dynamic(() => import('@/components/dashboard/widgets/MetaverseFootprint'), { ssr: false });
import GuardianDashboardCard from '@/components/dashboard/guardian/GuardianDashboardCard';
import ConnectedEcosystem from '@/components/dashboard/widgets/ConnectedEcosystem';
import TelemetryStrip from '@/components/dashboard/widgets/TelemetryStrip';


export default function DashboardCommandCenter() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  const {
    handle,
    did,
    fullDID,
    soulboundTokens,
    credentials,
    identityMetrics,
    zkProof,
    linkedAvatar,
    peers,
    notifications,
  } = useIdentityStore(useShallow(s => ({
    handle: s.handle,
    did: s.did,
    fullDID: s.fullDID,
    soulboundTokens: s.soulboundTokens,
    credentials: s.credentials,
    identityMetrics: s.identityMetrics,
    zkProof: s.zkProof,
    linkedAvatar: s.linkedAvatar,
    peers: s.peers,
    notifications: s.notifications,
  })));

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
        <div className="pulse" style={{ marginRight: '10px' }}></div>
        Loading Command Center...
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', flexDirection: 'column', gap: '16px' }}>
        <AlertTriangle size={32} style={{ color: 'var(--danger)' }} />
        <div style={{ fontSize: '16px', color: '#fff' }}>Wallet Not Connected</div>
        <div style={{ fontSize: '13px' }}>Connect your wallet to access the MetaGo OS Command Center.</div>
      </div>
    );
  }

  const activeSBTs = (soulboundTokens || []).filter(t => t.status === 'VALID');
  const activeCredentials = (credentials || []).filter(c => c.revocationStatus === 'VALID');
  const trustScore = identityMetrics?.trustScore ?? null;
  const humanityScore = identityMetrics?.sovereignty ?? null;
  const unreadNotifs = (notifications || []).filter(n => !n.read).length;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-head" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-eyebrow">MetaGo OS</div>
          <h1 className="page-title">
            <div className="picon"><LayoutDashboard size={18} /></div>
            Command Center
          </h1>
          <p className="page-desc">
            High-level overview of your entire sovereign identity ecosystem.
          </p>
        </div>
      </div>

      {/* 1. IDENTITY STRIP (TELEMETRY) */}
      <TelemetryStrip 
        identityScore={(humanityScore && humanityScore > 0) ? humanityScore : 70}
        credentials={activeCredentials.length}
        connections={(peers || []).length}
        trustScore={(trustScore && trustScore > 0) ? trustScore : 65}
      />

      {/* 2. TOP 3 CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>

        {/* Core Identity */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-title"><ShieldCheck size={16} /> Core Identity</div>
          </div>
          <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Active Credentials</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeCredentials.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Soulbound Tokens</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeSBTs.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>ZK Proof</span>
              <span style={{ color: zkProof ? 'var(--success)' : 'var(--muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {zkProof ? <><CheckCircle2 size={12} /> Active</> : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Trust Peers</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{(peers || []).length}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/dashboard/credentials" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '11px' }}>Credentials</button></Link>
            <Link href="/dashboard/identity-graph" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '11px' }}>Graph</button></Link>
          </div>
        </div>

        {/* Wallet & Web3 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-title"><Coins size={16} /> Wallet & Web3</div>
          </div>
          <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Address</span>
              <span className="mono" style={{ color: '#fff', fontSize: '12px' }}>{shortAddress}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>SBT Portfolio</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{(soulboundTokens || []).length} tokens</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Domains</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                {[...new Set((soulboundTokens || []).map(s => s.domain))].length || '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Status</span>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Connected</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/dashboard/wallet-intelligence" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '11px' }}>Wallet</button></Link>
            <Link href="/dashboard/cross-chain" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '11px' }}>Cross Chain</button></Link>
          </div>
        </div>

        {/* Security Health */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-head">
            <div className="card-title"><Shield size={16} /> Security Health</div>
          </div>
          <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Risk Level</span>
              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Low</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Security Depth</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{identityMetrics?.securityDepth ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Data Integrity</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{identityMetrics?.dataIntegrity ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Unread Alerts</span>
              <span style={{ color: unreadNotifs > 0 ? 'var(--warning)' : '#fff', fontWeight: 'bold' }}>{unreadNotifs}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/dashboard/security-center" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '11px' }}>Security</button></Link>
            <Link href="/dashboard/threats" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '11px' }}>Threats</button></Link>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>

        {/* AI Guardian */}
        <GuardianDashboardCard isConnected={isConnected} unreadNotifs={unreadNotifs} />

        {/* Privacy & Presence */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><Key size={16} /> Privacy & Presence</div>
          </div>
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Metaverse Avatar</span>
              <span style={{ color: linkedAvatar ? 'var(--success)' : 'var(--muted)', fontWeight: 'bold' }}>
                {linkedAvatar ? 'Linked' : 'Not Linked'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Presence Index</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{identityMetrics?.presenceIndex ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)', fontSize: '13px' }}>Recovery Guardians</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>
                <Link href="/dashboard/recovery-center" style={{ color: 'var(--violet)', textDecoration: 'none' }}>Configure →</Link>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Link href="/dashboard/burner-did" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '12px' }}>Burner DIDs</button></Link>
              <Link href="/dashboard/metaverse-hub" style={{ flex: 1 }}><button className="tbtn" style={{ width: '100%', fontSize: '12px' }}>Avatar</button></Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SBT SHOWCASE */}
      {activeSBTs.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <div className="card-title"><Award size={16} /> Soulbound Tokens</div>
            <Link href="/dashboard/identity-passport"><button className="tbtn" style={{ fontSize: '11px' }}>View All</button></Link>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            {activeSBTs.slice(0, 4).map(sbt => (
              <div key={sbt.id} style={{ background: 'rgba(139,123,255,0.07)', border: '1px solid rgba(139,123,255,0.15)', borderRadius: '10px', padding: '12px 16px', minWidth: '160px' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>{sbt.domain}</div>
                <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{sbt.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{sbt.chain}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. METAVERSE FOOTPRINT */}
      <Suspense fallback={
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-head">
            <div className="card-title" style={{ opacity: 0.5 }}>Loading Metaverse Footprint...</div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '170px', height: '170px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)', flexShrink: 0,
              }} />
            ))}
          </div>
        </div>
      }>
        <MetaverseFootprint />
      </Suspense>

      {/* 6. QUICK ACTIONS */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-head">
          <div className="card-title"><Zap size={16} /> Quick Actions</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <Link href="/dashboard/credentials"><button className="tbtn primary">Verify Credentials</button></Link>
          <Link href="/dashboard/identity-passport"><button className="tbtn primary" style={{ background: 'var(--panel)', color: '#fff' }}>Generate ZK Proof</button></Link>
          <Link href="/dashboard/biometric-vault"><button className="tbtn primary" style={{ background: 'var(--panel)', color: '#fff' }}>Open Vault</button></Link>
          <Link href="/dashboard/burner-did"><button className="tbtn primary" style={{ background: 'var(--panel)', color: '#fff' }}>Create Burner DID</button></Link>
          <Link href="/dashboard/recovery-center"><button className="tbtn primary" style={{ background: 'var(--panel)', color: '#fff' }}>Recovery Center</button></Link>
        </div>
      </div>

      <ConnectedEcosystem />

      {/* 6. RECENT NOTIFICATIONS */}
      <div className="card">
        <div className="card-head">
          <div className="card-title"><Clock size={16} /> Recent Activity</div>
          {unreadNotifs > 0 && (
            <span style={{ fontSize: '11px', background: 'rgba(139,123,255,0.15)', color: 'var(--violet)', padding: '2px 8px', borderRadius: '12px' }}>
              {unreadNotifs} unread
            </span>
          )}
        </div>
        {notifications.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            No recent activity. Start using MetaGo features to see your activity here.
          </div>
        ) : (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className="row-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: n.read ? 0.6 : 1 }}>
                <span style={{ fontSize: '13px', color: '#fff' }}>{n.message}</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{new Date(n.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
