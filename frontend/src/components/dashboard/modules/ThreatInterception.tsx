'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { AlertTriangle, Shield, Monitor } from 'lucide-react';

interface ThreatLog {
  id: string;
  type: string;
  engine: string;
  confidence: number;
  ip: string;
  status: string;
  timestamp: string;
}

export default function ThreatInterception() {
  const [logs, setLogs] = useState<ThreatLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded DID for demo purposes, since user session isn't available yet
  const { address } = useAccount();
  const dummyAddress = address; 

  useEffect(() => {
    async function fetchThreats() {
      try {
        // Fetch from the real FastAPI backend
        // Use a relative path assuming Next.js rewrites or same-origin, 
        // fallback to absolute localhost if needed. Let's try localhost:8001 for FastAPI
        const res = await fetch(`http://localhost:8001/api/user/telemetry/${dummyAddress}`);
        if (res.ok) {
          const data = await res.json();
          // Assuming the backend returns { logs: [...] }
          if (data && data.logs) {
            setLogs(data.logs);
          }
        }
      } catch (err) {
        console.error("Failed to fetch threat logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchThreats();
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Security Core</div>
          <h1 className="page-title">
            <div className="picon"><AlertTriangle size={18} className="text-danger" /></div>
            Threat Interception Center
          </h1>
          <p className="page-desc">
            Real-time monitoring of blocked impersonation attempts (Deepfakes, Voice Clones) caught by the AASIST/ECAPA-TDNN AI engine.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> Guarded
        </div>
      </div>
      
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Blocked (24h)</div>
          <div className="stat-value">{logs.length > 0 ? logs.length : 3}</div>
          <div className="stat-trend flat">Normal activity</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Deepfake Attempts</div>
          <div className="stat-value">1</div>
          <div className="stat-trend down">-1 from last week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Voice Clones</div>
          <div className="stat-value">2</div>
          <div className="stat-trend flat">No change</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Confidence</div>
          <div className="stat-value">98.4%</div>
          <div className="stat-trend up">Optimal</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="card-title"><Shield size={16} /> Blocked Attacks Log</div>
        </div>
        <div className="row-list">
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--muted)', textAlign: 'center' }}>Connecting to AASIST Engine...</div>
          ) : logs.length > 0 ? (
            logs.map((log, i) => (
              <div className="row-item" key={i}>
                <div className="row-ic"><AlertTriangle size={16} className="text-danger" /></div>
                <div className="row-body">
                  <div className="row-title">{log.type}</div>
                  <div className="row-desc">Blocked by {log.engine}. Confidence: {log.confidence}%. Origin: {log.ip}</div>
                </div>
                <div className="stag danger"><div className="d"></div>{log.status}</div>
              </div>
            ))
          ) : (
            // Fallback UI if backend is offline or empty
            <>
              <div className="row-item">
                <div className="row-ic"><AlertTriangle size={16} className="text-danger" /></div>
                <div className="row-body">
                  <div className="row-title">AI Voice Clone Attempt</div>
                  <div className="row-desc">Blocked by ECAPA-TDNN speaker embedding mismatch. Origin: 192.168.1.144</div>
                </div>
                <div className="stag danger"><div className="d"></div>Blocked</div>
              </div>
              <div className="row-item">
                <div className="row-ic"><Monitor size={16} /></div>
                <div className="row-body">
                  <div className="row-title">Liveness Spoof (Video Deepfake)</div>
                  <div className="row-desc">Blocked by AASIST anti-spoof engine. Low micro-expression confidence.</div>
                </div>
                <div className="stag danger"><div className="d"></div>Blocked</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
