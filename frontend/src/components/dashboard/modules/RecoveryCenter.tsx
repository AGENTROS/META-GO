'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Users, Shield, Clock, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

export default function RecoveryCenter() {
  const [guardians, setGuardians] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const dummyAddress = address;

  useEffect(() => {
    async function fetchRecovery() {
      if (!address) { setLoading(false); return; }
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const res = await fetch(`${backend}/api/dashboard/recovery?address=${dummyAddress}`);
        if (res.ok) {
          const data = await res.json();
          setGuardians(data.guardians || []);
          setSessions(data.sessions || []);
        }
      } catch (err) {
        console.error('Failed to fetch recovery data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecovery();
  }, [address]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Social Resilience</div>
          <h1 className="page-title">
            <span className="picon"><Users size={18} /></span>
            Recovery Center
          </h1>
          <p className="page-desc">
            Manage your Guardian Network. Initiate multi-sig shard reconstruction if your primary keys are compromised.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          <div className="pulse" style={{ display: 'inline-block', marginRight: '8px' }}></div>
          Syncing guardian network state...
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Active Guardians</div>
              <div className="stat-value">{guardians.length}</div>
              <div className="stat-trend flat">Requires 2/3 for recovery</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending Recoveries</div>
              <div className="stat-value">{sessions.length}</div>
              <div className="stat-trend ok">No urgent alerts</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card stack">
              <div className="card-head" style={{ marginBottom: '0' }}>
                <div className="card-title"><Shield size={16} /> Guardian Network</div>
              </div>
              <div className="row-list">
                {guardians.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                    No Guardians configured. <br/><br/>
                    <button className="primary-btn">Setup Social Recovery</button>
                  </div>
                ) : guardians.map((g, i) => (
                  <div className="row-item" key={i}>
                    <div className="row-ic"><Users size={16} /></div>
                    <div className="row-body">
                      <div className="row-title">{g.name || 'Guardian'}</div>
                      <div className="row-desc">{g.address}</div>
                    </div>
                    <div className="stag ok"><CheckCircle2 size={12} style={{marginRight: '4px'}}/> Active</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card stack">
              <div className="card-head" style={{ marginBottom: '0' }}>
                <div className="card-title"><Clock size={16} /> Active Recovery Sessions</div>
              </div>
              <div className="row-list">
                {sessions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No active recovery sessions found in the audit logs.</div>
                ) : sessions.map((sess, i) => (
                  <div className="row-item" key={i}>
                    <div className="row-ic text-warning"><AlertTriangle size={16} /></div>
                    <div className="row-body">
                      <div className="row-title">Migrating to {sess.new_address.substring(0, 10)}...</div>
                      <div className="row-desc">Approvals: {(sess.approvals || []).length} / 2 required</div>
                    </div>
                    <div className="stag warning">{sess.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
