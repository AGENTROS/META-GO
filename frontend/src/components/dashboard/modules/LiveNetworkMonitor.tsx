'use client';
import React, { useEffect, useState } from 'react';
import { Monitor, Activity, Server, Database, Globe } from 'lucide-react';

export default function LiveNetworkMonitor() {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    // Simulate live uptime counter
    const timer = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">System Health</div>
          <h1 className="page-title">
            <div className="picon"><Monitor size={18} /></div>
            Live Network Monitor
          </h1>
          <p className="page-desc">
            Real-time telemetry for the MetaGo Identity Operating System.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> All Systems Operational
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Global Uptime</div>
          <div className="stat-value text-green-400">99.998%</div>
          <div className="stat-trend flat">Current session: {formatUptime(uptime)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">API Latency</div>
          <div className="stat-value">24ms</div>
          <div className="stat-trend up">p95 response time</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Nodes</div>
          <div className="stat-value">1,402</div>
          <div className="stat-trend up">Globally distributed</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ZK Proofs / Sec</div>
          <div className="stat-value">45.2</div>
          <div className="stat-trend up">High throughput</div>
        </div>
      </div>

      <div className="grid-2 mt-6">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Core Services</div>
          </div>
          <div className="row-list">
            <div className="row-item border-none">
              <div className="row-ic"><Server size={16} /></div>
              <div className="row-body">
                <div className="row-title">FastAPI Backend Router</div>
                <div className="row-desc">Primary API Gateway</div>
              </div>
              <div className="stag ok"><div className="d"></div> Healthy</div>
            </div>
            <div className="row-item border-none">
              <div className="row-ic"><Database size={16} /></div>
              <div className="row-body">
                <div className="row-title">MongoDB Atlas Cluster</div>
                <div className="row-desc">Identity fragment store</div>
              </div>
              <div className="stag ok"><div className="d"></div> Healthy</div>
            </div>
            <div className="row-item border-none">
              <div className="row-ic"><Activity size={16} /></div>
              <div className="row-body">
                <div className="row-title">Redis Event Bus</div>
                <div className="row-desc">WebSocket and rate-limiting</div>
              </div>
              <div className="stag ok"><div className="d"></div> Healthy</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Decentralized Networks</div>
          </div>
          <div className="row-list">
            <div className="row-item border-none">
              <div className="row-ic"><Globe size={16} /></div>
              <div className="row-body">
                <div className="row-title">Polygon RPC</div>
                <div className="row-desc">Primary contract network</div>
              </div>
              <div className="stag ok"><div className="d"></div> Synced</div>
            </div>
            <div className="row-item border-none">
              <div className="row-ic"><Globe size={16} /></div>
              <div className="row-body">
                <div className="row-title">IPFS Pinata</div>
                <div className="row-desc">Encrypted Biometric Vault storage</div>
              </div>
              <div className="stag ok"><div className="d"></div> Synced</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
