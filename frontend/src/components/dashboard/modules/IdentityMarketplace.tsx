'use client';
import React, { useEffect, useState } from 'react';
import { ShoppingCart, CheckCircle2, Shield, Activity, Wallet } from 'lucide-react';

export default function IdentityMarketplace() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading since marketplace listings are static ZK definitions for now
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">ZK Selective Disclosure</div>
          <h1 className="page-title">
            <div className="picon"><ShoppingCart size={18} /></div>
            Identity Marketplace
          </h1>
          <p className="page-desc">
            License specific, proof-backed facts about yourself to third parties without revealing the underlying data — you set the terms and privacy limits.
          </p>
        </div>
        <div className="status-pill">
          <div className="pulse"></div> ZK Network Ready
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-head">
          <div className="card-title">
            Available Zero-Knowledge Proofs
          </div>
        </div>
        <div className="row-list">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Compiling ZK snarks...</div>
          ) : (
            <>
              <div className="row-item">
                <div className="row-ic"><CheckCircle2 size={16} /></div>
                <div className="row-body">
                  <div className="row-title">Prove I am over 18</div>
                  <div className="row-desc">Zero-knowledge age proof · shareable payload</div>
                </div>
                <div className="stag ok"><div className="d"></div> Available</div>
                <button className="row-action text-white border-violet-500 bg-violet-500/10 hover:bg-violet-500/20 ml-3">Generate Proof</button>
              </div>
              <div className="row-item">
                <div className="row-ic"><Wallet size={16} /></div>
                <div className="row-body">
                  <div className="row-title">Prove I hold &gt; $10k in assets</div>
                  <div className="row-desc">ZK balance range proof across linked wallets</div>
                </div>
                <div className="stag ok"><div className="d"></div> Available</div>
                <button className="row-action text-white border-violet-500 bg-violet-500/10 hover:bg-violet-500/20 ml-3">Generate Proof</button>
              </div>
              <div className="row-item">
                <div className="row-ic"><Activity size={16} /></div>
                <div className="row-body">
                  <div className="row-title">Prove I am a verified human</div>
                  <div className="row-desc">Backed by Humanity Index SBT</div>
                </div>
                <div className="stag ok"><div className="d"></div> Available</div>
                <button className="row-action text-white border-violet-500 bg-violet-500/10 hover:bg-violet-500/20 ml-3">Generate Proof</button>
              </div>
              <div className="row-item">
                <div className="row-ic"><ShoppingCart size={16} /></div>
                <div className="row-body">
                  <div className="row-title text-zinc-500">Active listings</div>
                  <div className="row-desc">0 credentials currently licensed to third parties</div>
                </div>
                <div className="stag info"><div className="d"></div> None active</div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="data-note">
        <Shield />
        <p>
          All data is shared via verifiable zero-knowledge succinct non-interactive arguments of knowledge (zk-SNARKs). 
          The requesting party mathematically verifies the statement without ever seeing the raw data (e.g., your exact birthday).
        </p>
      </div>
    </>
  );
}
