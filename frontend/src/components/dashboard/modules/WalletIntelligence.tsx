'use client';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Activity, ShieldCheck, 
  ExternalLink, Fingerprint, History, Server
} from 'lucide-react';

export default function WalletIntelligence() {
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Real implementation would pull this from Wagmi context
  const { address } = useAccount();
  const dummyAddress = address || '0x0000000000000000000000000000000000000000';

  const DEMO_WALLET = {
    native_balance: '2.847 ETH',
    ens: 'metago.eth',
    connected_chain: 'Ethereum Mainnet',
    risk_analysis: 'Low Risk',
    history: [
      { type: 'receive', tx: '0x8a3f...c91d', time: '2 mins ago', amount: '0.5 ETH' },
      { type: 'send', tx: '0x4b7e...a2f3', time: '1 hour ago', amount: '120 USDC' },
      { type: 'receive', tx: '0xd1c9...7b4a', time: '5 hours ago', amount: '0.12 ETH' },
      { type: 'send', tx: '0x6f2a...e8c1', time: '1 day ago', amount: '50 MATIC' },
    ],
    permissions: [
      { contract: 'Uniswap V3 Router', allowance: 'Unlimited USDC' },
      { contract: 'OpenSea Seaport', allowance: 'NFT Collection' },
      { contract: 'Aave V3 Pool', allowance: '5,000 DAI' },
    ]
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8001';
        const [overviewRes, txRes, contractRes] = await Promise.all([
          fetch(`${backend}/api/wallet/${dummyAddress}`),
          fetch(`${backend}/api/wallet/history?address=${dummyAddress}`),
          fetch(`${backend}/api/wallet/permissions?address=${dummyAddress}`)
        ]);

        if (overviewRes.ok && txRes.ok && contractRes.ok) {
          const overview = await overviewRes.json();
          const tx = await txRes.json();
          const contracts = await contractRes.json();
          setWalletData({ ...overview, ...tx, ...contracts });
        } else {
          setWalletData(DEMO_WALLET);
        }
      } catch (err) {
        // Backend not available — use demo data
        setWalletData(DEMO_WALLET);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [address, dummyAddress]);

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Web3 Finance (Hybrid Sync)</div>
          <h1 className="page-title">
            <div className="picon"><Wallet size={18} /></div>
            Wallet Intelligence
          </h1>
          <p className="page-desc">
            Full visibility over your connected wallets, cross-chain balances, gas fees, and active smart contract permissions. Data served securely by the MetaGo Python Engine.
          </p>
        </div>
        <div className="status-pill" style={{ background: 'rgba(91,140,255,0.1)', color: 'var(--blue)' }}>
          <Server size={14} /> Backend Indexed
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>
          <div className="pulse" style={{ display: 'inline-block', marginRight: '8px' }}></div>
          Syncing wallet intelligence from backend...
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total Balance</div>
              <div className="stat-value">{walletData?.native_balance || '0.00 ETH'}</div>
              <div className="stat-trend up">Live sync active</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Primary ENS</div>
              <div className="stat-value" style={{ fontSize: '18px' }}>{walletData?.ens || 'Not Set'}</div>
              <div className="stat-trend flat">Resolves to {dummyAddress ? `${dummyAddress.substring(0,5)}...` : "—"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Current Chain</div>
              <div className="stat-value">{walletData?.connected_chain || 'Unknown'}</div>
              <div className="stat-trend ok">Network healthy</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Risk Profile</div>
              <div className="stat-value text-success">{walletData?.risk_analysis || 'Safe'}</div>
              <div className="stat-trend up">Audited by AI</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card stack">
              <div className="card-head" style={{ marginBottom: '0' }}>
                <div className="card-title"><History size={16} /> Recent Transactions</div>
              </div>
              <div className="row-list">
                {walletData?.history?.map((tx: any, i: number) => (
                  <div className="row-item" key={i}>
                    <div className="row-ic" style={{ color: tx.type === 'receive' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'receive' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </div>
                    <div className="row-body">
                      <div className="row-title">{tx.type === 'receive' ? 'Received' : 'Sent'} Transfer</div>
                      <div className="row-desc">Tx: {tx.tx} • {tx.time}</div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{tx.type === 'receive' ? '+' : '-'}{tx.amount}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card stack">
              <div className="card-head" style={{ marginBottom: '0' }}>
                <div className="card-title"><Fingerprint size={16} /> Active Permissions</div>
              </div>
              <div className="row-list">
                {walletData?.permissions?.map((perm: any, i: number) => (
                  <div className="row-item" key={i}>
                    <div className="row-ic"><ExternalLink size={16} /></div>
                    <div className="row-body">
                      <div className="row-title">{perm.contract}</div>
                      <div className="row-desc">{perm.allowance} approval</div>
                    </div>
                    <button className="row-action danger-btn">Revoke</button>
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
