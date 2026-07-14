'use client';
import React, { useEffect, useState } from 'react';
import { Link2, Layers, Zap } from 'lucide-react';

export default function CrossChainIdentity() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001';
        const mockAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const res = await fetch(`${backend}/api/ccip?address=${mockAddress}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch CCIP status:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Chainlink CCIP</div>
          <h1 className="page-title">
            <div className="picon"><Link2 size={18} /></div>
            Cross Chain Identity
          </h1>
          <p className="page-desc">
            Export verified identity credentials across EVM networks seamlessly. Your primary identity lives on Polygon and broadcasts trust to other networks.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> CCIP Bridge Active
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Primary Chain</div>
          <div className="stat-value">Polygon</div>
          <div className="stat-trend up">Zero-Knowledge Hub</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Synced Chains</div>
          <div className="stat-value">5</div>
          <div className="stat-trend up">Ethereum, Arbitrum, Base...</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Bridge Queue</div>
          <div className="stat-value">{loading ? '-' : data?.sync_queue || 0}</div>
          <div className="stat-trend flat">{data?.transfer_status || 'Idle'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Bridge Time</div>
          <div className="stat-value">46s</div>
          <div className="stat-trend up">Optimal</div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-head">
          <div className="card-title">
            Network Rollups & L2 Sync Status
          </div>
        </div>
        <div className="row-list">
          <div className="row-item">
            <div className="row-ic"><Layers size={16} /></div>
            <div className="row-body">
              <div className="row-title">Polygon (Primary)</div>
              <div className="row-desc">Primary identity ledger · fully synced</div>
            </div>
            <div className="stag ok"><div className="d"></div> Synced</div>
          </div>
          <div className="row-item">
            <div className="row-ic"><Layers size={16} /></div>
            <div className="row-body">
              <div className="row-title">Arbitrum One</div>
              <div className="row-desc">Credentials mirrored 4m ago</div>
            </div>
            <div className="stag ok"><div className="d"></div> Synced</div>
          </div>
          <div className="row-item">
            <div className="row-ic"><Layers size={16} /></div>
            <div className="row-body">
              <div className="row-title">Base</div>
              <div className="row-desc">Credentials mirrored 11m ago</div>
            </div>
            <div className="stag ok"><div className="d"></div> Synced</div>
          </div>
          <div className="row-item">
            <div className="row-ic"><Zap size={16} className="text-yellow-500" /></div>
            <div className="row-body">
              <div className="row-title">Optimism</div>
              <div className="row-desc">Sync in progress via Chainlink CCIP</div>
            </div>
            <div className="stag warn"><div className="d"></div> Syncing</div>
          </div>
        </div>
      </div>
    </>
  );
}
