'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Shield, Monitor, Smartphone, Globe, CheckCircle2, XCircle, AlertTriangle, Activity, ShieldAlert } from 'lucide-react';

export default function SecurityCenter() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [posture, setPosture] = useState({ score: 100, threat: 'Secure' });
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
  const dummyAddress = address;

  const fetchData = async () => {
    if (!address) { setLoading(false); return; }
    try {
      const [sessRes, auditRes, postureRes] = await Promise.all([
        fetch(`http://localhost:8001/api/dashboard/security/sessions?address=${dummyAddress}`),
        fetch(`http://localhost:8001/api/dashboard/security/audit?address=${dummyAddress}`),
        fetch(`http://localhost:8001/api/security?address=${dummyAddress}`)
      ]);

      if (sessRes.ok) {
        const d = await sessRes.json();
        setSessions(d.sessions || []);
      }
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.audit_logs || []);
      }
      if (postureRes.ok) {
        const d = await postureRes.json();
        setPosture({ score: d.context_score, threat: d.threat_level });
      }
    } catch (err) {
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [address]);

  const revokeSession = async (id: string) => {
    try {
      await fetch(`http://localhost:8001/api/dashboard/security/sessions/${id}?address=${dummyAddress}`, { method: 'DELETE' });
      fetchData(); // refresh
    } catch (err) {
      console.error('Failed to revoke', err);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Threat Posture</div>
          <h1 className="page-title">
            <div className="picon"><Shield size={18} /></div>
            Security Center
          </h1>
          <p className="page-desc">
            Active sessions, device fingerprints, and context-aware risk analysis securing your identity.
          </p>
        </div>
        <div className="status-pill" style={{ background: posture.threat === 'High' ? 'rgba(255,92,114,0.1)' : 'rgba(62,207,142,0.1)', color: posture.threat === 'High' ? 'var(--danger)' : 'var(--success)' }}>
          <div className="pulse" style={{ background: posture.threat === 'High' ? 'var(--danger)' : 'var(--success)' }}></div> {posture.threat === 'High' ? 'Threat Detected' : 'Guarded'}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          <div className="pulse" style={{ display: 'inline-block', marginRight: '8px' }}></div>
          Auditing backend security logs...
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Trust Score</div>
              <div className="stat-value text-success">{posture.score}/100</div>
              <div className="stat-trend up">Based on backend audit</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Open Sessions</div>
              <div className="stat-value">{sessions.length}</div>
              <div className="stat-trend flat">Active JWT sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Threat Level</div>
              <div className="stat-value" style={{ color: posture.threat === 'High' ? 'var(--danger)' : 'var(--success)' }}>{posture.threat}</div>
              <div className="stat-trend ok">AI Analyzed</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card stack">
              <div className="card-head" style={{ marginBottom: '0' }}>
                <div className="card-title"><Monitor size={16} /> Active Sessions & Devices</div>
              </div>
              <div className="row-list">
                {sessions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No active sessions found in db.sessions.</div>
                ) : sessions.map((sess, i) => (
                  <div className="row-item" key={i}>
                    <div className="row-ic" style={{ color: sess.is_current ? 'var(--success)' : 'var(--blue)' }}>
                      {sess.os.includes('Mobile') ? <Smartphone size={16} /> : <Globe size={16} />}
                    </div>
                    <div className="row-body">
                      <div className="row-title">{sess.os} • {sess.browser} {sess.is_current && <span style={{ color: 'var(--success)', fontSize: '12px' }}>(Current)</span>}</div>
                      <div className="row-desc">IP: {sess.ip} • Active: {sess.last_active || 'Just now'}</div>
                    </div>
                    {!sess.is_current && (
                      <button className="row-action danger-btn" onClick={() => revokeSession(sess.id)}>Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card stack">
              <div className="card-head" style={{ marginBottom: '0' }}>
                <div className="card-title"><ShieldAlert size={16} /> Audit Logs & Threat Timeline</div>
              </div>
              <div className="row-list">
                {auditLogs.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No audit logs found.</div>
                ) : auditLogs.map((log, i) => (
                  <div className="row-item" key={i}>
                    <div className="row-ic" style={{ color: log.risk === 'High' ? 'var(--danger)' : 'var(--muted)' }}>
                      {log.risk === 'High' ? <AlertTriangle size={16} /> : <Activity size={16} />}
                    </div>
                    <div className="row-body">
                      <div className="row-title">{log.event}</div>
                      <div className="row-desc">{log.time}</div>
                    </div>
                    <div className="stag ok"><div className="d" style={{ background: log.risk === 'High' ? 'var(--danger)' : 'var(--success)' }}></div>{log.risk}</div>
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
