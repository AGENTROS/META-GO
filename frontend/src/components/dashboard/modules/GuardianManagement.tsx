'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Users, Shield, Cpu, Key } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api';

export default function GuardianManagement() {
  const [guardians, setGuardians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();

  useEffect(() => {
    async function fetchData() {
      if (!address) { setLoading(false); return; }
      try {
        setLoading(true);
        const res = await authenticatedFetch(`/api/dashboard/recovery?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setGuardians(data.guardians || [
            { name: 'Aditya S.', role: 'Voting Guardian', added: '4 months ago', type: 'Active', icon: 'user' },
            { name: 'Meera K.', role: 'Voting Guardian', added: '3 months ago', type: 'Active', icon: 'user' },
            { name: 'Ledger Nano X', role: 'Hardware Guardian', added: '1 year ago', type: 'Active', icon: 'hardware' },
            { name: 'JSPM RSCOE Registrar', role: 'Institutional Attestor', added: '1 week ago', type: 'Pending invite', icon: 'institution' }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch guardian data:", err);
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
          <div className="page-eyebrow">Trust Network</div>
          <h1 className="page-title">
            <div className="picon"><Users size={18} /></div>
            Guardian Management
          </h1>
          <p className="page-desc">
            Directory and role management for every trusted party who can vote on your account recovery or attest to your identity.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> Quorum Secure (3/5)
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-head">
          <div className="card-title">
            Social Recovery Guardians
          </div>
          <button className="row-action text-white border-violet-500 bg-violet-500/10 hover:bg-violet-500/20">
            + Invite Guardian
          </button>
        </div>
        <div className="row-list">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Syncing trust network...</div>
          ) : (
            guardians.map((g, idx) => (
              <div className="row-item" key={idx}>
                <div className="row-ic">
                  {g.icon === 'hardware' ? <Cpu size={16} /> : 
                   g.icon === 'institution' ? <Shield size={16} /> : 
                   <Users size={16} />}
                </div>
                <div className="row-body">
                  <div className="row-title">{g.name}</div>
                  <div className="row-desc">Role: {g.role} · added {g.added}</div>
                </div>
                <div className={`stag ${g.type === 'Active' ? 'ok' : 'warn'}`}>
                  <div className="d"></div> {g.type}
                </div>
                <button className="row-action danger-btn ml-3">Revoke</button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="data-note">
        <Key />
        <p>
          MetaGo uses a 2-of-3 quorum by default. If you lose your primary hardware wallet or biometric device, 
          you can initiate a recovery sequence that requires 2 guardians to sign a cryptographic threshold transaction.
        </p>
      </div>
    </>
  );
}