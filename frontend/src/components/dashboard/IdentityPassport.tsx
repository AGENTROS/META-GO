'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { CheckCircle2, Shield, Users, Activity, Copy } from 'lucide-react';

export default function IdentityPassport() {
  const { address } = useAccount();
  const [profile, setProfile] = useState<any>(null);
  const [trust, setTrust] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!address) {
        setLoading(false);
        return;
      }
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001';
        const lookupAddress = address.toLowerCase();
        const [profRes, trustRes] = await Promise.all([
          fetch(`${backend}/api/did/profile?address=${lookupAddress}`),
          fetch(`${backend}/api/did/trust?address=${lookupAddress}`)
        ]);

        if (profRes.ok) setProfile(await profRes.json());
        if (trustRes.ok) setTrust(await trustRes.json());
      } catch (err) {
        console.error("Failed to fetch passport data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCopy = () => {
    if (profile?.did) {
      navigator.clipboard.writeText(profile.did);
      // Optional: Add a toast notification here
    }
  };

  return (
    <div className="passport mb-8">
      <div className="passport-grid">
        {/* 3D Sphere Section */}
        <div className="sphere-wrap">
          <div className="sphere-inner">
            <div className="ring rx"></div>
            <div className="ring ry"></div>
            <div className="ring rz"></div>
            <div className="ring r4"></div>
            <div className="sphere-core"></div>
            <div className="p-dot" style={{ top: '20%', left: '30%' }}></div>
            <div className="p-dot pink" style={{ bottom: '25%', right: '20%' }}></div>
            <div className="p-dot blue" style={{ top: '40%', right: '10%' }}></div>
          </div>
          <div className="absolute inset-x-0 bottom-[-30px] flex justify-center">
            <div className="live-status-row">
              <div className="d"></div>
              <span>ZK Network Live</span>
            </div>
          </div>
        </div>

        {/* Identity Information Section */}
        <div className="passport-id">
          <div className="id-handle">
            {loading ? 'Syncing...' : profile?.handle || 'Citizen'}
            <CheckCircle2 className="verified-tick" />
          </div>
          <div className="id-sub">Level {profile?.level || 1} Verified Identity</div>
          
          <div className="did-row">
            <span className="mono">{profile?.did || 'did:metago:...'}</span>
            <Copy className="copy-ic" onClick={handleCopy} />
          </div>

          <div className="passport-metrics">
            <div className="pmetric">
              <div className="pmetric-label">Trust Score</div>
              <div className="pmetric-value">{trust?.trust_score || 0}</div>
            </div>
            <div className="pmetric">
              <div className="pmetric-label">Humanity Index</div>
              <div className="pmetric-value">{trust?.humanity_index ? `${trust.humanity_index}%` : '0%'}</div>
            </div>
            <div className="pmetric">
              <div className="pmetric-label">Network Health</div>
              <div className="pmetric-value" style={{ color: 'var(--success)' }}>100%</div>
            </div>
          </div>

          <div className="badges-row">
            <div className="badge-chip"><Shield /> ZK-Verified</div>
            <div className="badge-chip"><Users /> Humanity-SBT Linked</div>
            <div className="badge-chip"><Activity /> Sybil-Resistant</div>
          </div>
        </div>
      </div>
    </div>
  );
}
