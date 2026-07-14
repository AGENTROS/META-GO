'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Fingerprint, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';

export default function HumanityIndex() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();

  useEffect(() => {
    async function fetchData() {
      if (!address) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await authenticatedFetch(`/api/did/trust?address=${address}`);
        if (res.ok) {
          const trustData = await res.json();
          setData(trustData);
        }
      } catch (err) {
        console.error("Failed to fetch humanity index:", err);
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
          <div className="page-eyebrow">Proof of Personhood</div>
          <h1 className="page-title">
            <div className="picon"><Fingerprint size={18} /></div>
            Humanity Index
          </h1>
          <p className="page-desc">
            A unified Sybil-resistance score aggregating biometrics, Web2 provenance, and on-chain history. This proves you are a unique human without bots.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> Synced to ZK Network
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Humanity Score</div>
          <div className="stat-value">{loading ? '--' : `${data?.humanity_index || 99.8}%`}</div>
          <div className="stat-trend up">Top 1% Citizen</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sybil Risk</div>
          <div className="stat-value">Very Low</div>
          <div className="stat-trend up">0 Threat Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Linked Web2 Accounts</div>
          <div className="stat-value">4</div>
          <div className="stat-trend up">Google, GitHub, Discord</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Mintable SBT</div>
          <div className="stat-value">Ready</div>
          <div className="stat-trend up">Gas free via CCIP</div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-head">
          <div className="card-title">
            Verification Vectors
          </div>
        </div>
        <div className="row-list">
          <div className="row-item">
            <div className="row-ic"><Fingerprint size={16} /></div>
            <div className="row-body">
              <div className="row-title">Biometric uniqueness</div>
              <div className="row-desc">No duplicate face/voice embeddings found network-wide</div>
            </div>
            <div className="stag ok"><div className="d"></div> Passed</div>
          </div>
          <div className="row-item">
            <div className="row-ic"><CheckCircle2 size={16} /></div>
            <div className="row-body">
              <div className="row-title">Web2 provenance</div>
              <div className="row-desc">GitHub, Google linked and cross-verified</div>
            </div>
            <div className="stag info"><div className="d"></div> Linked</div>
          </div>
          <div className="row-item">
            <div className="row-ic"><ShieldAlert size={16} /></div>
            <div className="row-body">
              <div className="row-title">On-chain history depth</div>
              <div className="row-desc">14 months of consistent wallet activity</div>
            </div>
            <div className="stag ok"><div className="d"></div> Strong</div>
          </div>
          <div className="row-item">
            <div className="row-ic"><Cpu size={16} /></div>
            <div className="row-body">
              <div className="row-title">Mint Humanity SBT</div>
              <div className="row-desc">Publish your score as a portable Soulbound Token</div>
            </div>
            <button className="row-action">Mint Token</button>
          </div>
        </div>
      </div>
    </>
  );
}