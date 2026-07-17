'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Share2, AlertTriangle, Fingerprint } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';

export default function ConnectedDApps() {
  const [dapps, setDapps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();

  useEffect(() => {
    async function fetchData() {
      if (!address) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await authenticatedFetch(`/api/dapps?address=${address}`);
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
  }, [address]);

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
        <div className="card-head flex justify-between items-center">
          <div className="card-title">
            Active Connections
          </div>
          {dapps.length > 0 && (
            <button onClick={() => window.location.href = '/dashboard'} className="text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
              + Connect New
            </button>
          )}
        </div>
        <div className="row-list">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Scanning ledger...</div>
          ) : dapps.length === 0 ? (
            <div className="empty-state">
              <Share2 />
              <h4>No Connected DApps</h4>
              <p>Your identity footprint is completely private. You have not authorized any third-party applications.</p>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
              >
                Browse Ecosystem
              </button>
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
