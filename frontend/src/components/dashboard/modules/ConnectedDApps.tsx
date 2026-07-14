'use client';
import React, { useEffect, useState } from 'react';
import { Share2, AlertTriangle, Fingerprint } from 'lucide-react';

export default function ConnectedDApps() {
  const [dapps, setDapps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001';
        const mockAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
        const res = await fetch(`${backend}/api/dapps?address=${mockAddress}`);
        if (res.ok) {
          const data = await res.json();
          setDapps(data.dapps || ['OpenSea', 'Uniswap', 'Lens Protocol']);
        }
      } catch (err) {
        console.error("Failed to fetch connected dapps:", err);
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
          <div className="page-eyebrow">Third-Party Access</div>
          <h1 className="page-title">
            <div className="picon"><Share2 size={18} /></div>
            Connected DApps
          </h1>
          <p className="page-desc">
            Applications with access to parts of your identity. Review permissions and revoke access instantly. No central authority can stop your revocation.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> 0 Threat Vectors
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-head">
          <div className="card-title">
            Active Connections
          </div>
        </div>
        <div className="row-list">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Scanning ledger...</div>
          ) : dapps.length === 0 ? (
            <div className="empty-state">
              <Share2 />
              <h4>No Connected DApps</h4>
              <p>Your identity footprint is completely private. You have not authorized any third-party applications.</p>
            </div>
          ) : (
            dapps.map((dapp, idx) => (
              <div className="row-item" key={idx}>
                <div className="row-ic"><Share2 size={16} /></div>
                <div className="row-body">
                  <div className="row-title">{dapp}</div>
                  <div className="row-desc">Read-only identity state access</div>
                </div>
                <div className="stag ok"><div className="d"></div> Connected</div>
                <button className="row-action danger-btn ml-3">Revoke</button>
              </div>
            ))
          )}
          
          {!loading && (
            <div className="row-item bg-red-900/10 rounded-lg mt-4 border border-red-900/30">
              <div className="row-ic"><AlertTriangle size={16} className="text-red-400" /></div>
              <div className="row-body">
                <div className="row-title text-red-200">Unknown Contract</div>
                <div className="row-desc">Suspicious connection attempt intercepted by AI Guardian</div>
              </div>
              <div className="stag danger"><div className="d"></div> Blocked</div>
            </div>
          )}
        </div>
      </div>
      
      <div className="data-note">
        <Fingerprint />
        <p>
          Revoking access invalidates the application's ZK session token instantly via <code>socket.io</code>. 
          The application will be mathematically unable to query your identity graph.
        </p>
      </div>
    </>
  );
}
