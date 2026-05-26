'use client';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { SUPPORTED_CHAIN_IDS } from '@/lib/wagmi.config';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Navbar } from '@/components/layout/Navbar';
import { EngramVisualizer3D } from '@/components/dashboard/EngramVisualizer3D';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { IdentityRadar } from '@/components/dashboard/IdentityRadar';
import { QuantumTimeline } from '@/components/dashboard/QuantumTimeline';
import { VRMAvatarSlot } from '@/components/dashboard/VRMAvatarSlot';
import CommandRail from '@/components/dashboard/CommandRail';
import { GlassCard } from '@/components/ui/GlassCard';
import { HoloButton } from '@/components/ui/HoloButton';
import { WidgetErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ChevronRight, Copy, Check, Zap, ExternalLink, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useOnChainIdentity } from '@/hooks/useOnChainIdentity';

export default function DashboardClient() {
  const { isConnected, chainId, address } = useAccount();
  const { did, handle, soulboundTokens, addSBT } = useIdentityStore();
  const { isLoading, refresh } = useOnChainIdentity();
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isWrongChain = chainId ? !(SUPPORTED_CHAIN_IDS as number[]).includes(chainId) : false;

  const hasEnterpriseSBT = soulboundTokens.some(t => t.domain === 'ENTERPRISE');

  const testAccessGate = () => {
    if (hasEnterpriseSBT) {
      toast.success('Access Gate passed. Decrypted institutional data.', { duration: 3000 });
    } else {
      toast.error('Access denied. Requires ENTERPRISE SBT.', { duration: 3500 });
    }
  };

  const claimEnterpriseSBT = () => {
    addSBT({
      id: 'sbt-enterprise-' + Date.now(),
      name: 'Institutional Contributor SBT',
      issuer: 'Meta Go Authority',
      issuedAt: Date.now(),
      domain: 'ENTERPRISE',
      chain: 'POLYGON',
      status: 'VALID',
      txHash: '0x' + Math.random().toString(16).slice(2, 66),
      description: 'Verifies enterprise affiliation and contribution status.'
    });
    toast.success('Enterprise Soulbound Token issued.');
  };

  useEffect(() => setIsMounted(true), []);

  const copyDID = () => {
    if (!did) return;
    navigator.clipboard.writeText(did);
    setCopied(true);
    toast.success('DID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20" data-testid="dashboard-root">
      <Navbar />

      {isWrongChain && isConnected && (
        <div className="fixed top-16 left-0 right-0 z-40 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-center backdrop-blur-md">
          <p className="text-xs font-mono text-red-500">⚠ PROTOCOL MISMATCH — SWITCH TO POLYGON AMOY</p>
        </div>
      )}

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-450 mb-3 tracking-wider">
              <span className="hover:text-blue-600 transition-colors cursor-pointer">META GO</span>
              <ChevronRight size={10} />
              <span className="text-blue-600 font-semibold">OVERVIEW</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">
              Identity <span className="gradient-text">Control Panel</span>
            </h1>
            <p className="text-zinc-550 dark:text-zinc-400 text-sm max-w-md">
              {handle ? `Welcome back @${handle}. ` : ''}Real-time biometric integrity and on-chain sovereign metrics.
            </p>
          </div>

          <div className="flex gap-3">
            <HoloButton variant="ghost" size="sm" onClick={refresh} loading={isLoading} data-testid="refresh-identity-btn">
              <Zap size={14} className={isLoading ? 'animate-pulse' : ''} />
              Refresh Identity
            </HoloButton>
            <HoloButton variant="cyan" size="sm" data-testid="verify-credentials-btn">
              <ExternalLink size={14} />
              Verify Credentials
            </HoloButton>
          </div>
        </header>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <GlassCard intensity="low" className="p-1" hover={false}>
            <WidgetErrorBoundary name="Activity Timeline"><QuantumTimeline /></WidgetErrorBoundary>
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-6">
            <GlassCard intensity="medium" className="p-8 flex flex-col items-center justify-center min-h-[400px] relative">
              <div className="absolute top-4 left-6 text-[10px] font-mono text-zinc-450 uppercase tracking-widest">Security Core</div>
              <div className="w-full h-64 mb-4 relative">
                <WidgetErrorBoundary name="Engram"><EngramVisualizer3D /></WidgetErrorBoundary>
              </div>
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs font-sans text-zinc-500">IDENTIFIER</span>
                  {handle && <span className="text-sm font-bold text-zinc-900 dark:text-white" data-testid="dashboard-handle">@{handle}</span>}
                </div>
                {did && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between group cursor-pointer" onClick={copyDID} data-testid="copy-did-btn">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-mono text-zinc-450 uppercase">DID</span>
                      <span className="text-[10px] font-mono text-blue-600 truncate">{did}</span>
                    </div>
                    <div className="text-zinc-450 group-hover:text-blue-600 transition-colors ml-2">
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest">Role-Based Access Gate</p>
                <Lock size={16} className="text-indigo-600" />
              </div>
              <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed mb-4">
                Demo access gate evaluating verified attributes. Requires an active{' '}
                <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-850 font-mono text-[10px] text-zinc-800 dark:text-zinc-200">ENTERPRISE</code> credential.
              </p>

              {hasEnterpriseSBT ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                    <Check size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Enterprise Access Granted</p>
                    <p className="text-[10px] font-mono text-emerald-600/70 mt-0.5">SBT verified</p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 animate-pulse">
                    <Lock size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Access Restricted</p>
                    <p className="text-[10px] font-mono text-amber-600/70 mt-0.5 truncate">Requires active ENTERPRISE SBT</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button onClick={testAccessGate} data-testid="test-gate-btn"
                  className="flex-grow py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold rounded-xl transition-all">
                  Test Gate
                </button>
                {!hasEnterpriseSBT && (
                  <button onClick={claimEnterpriseSBT} data-testid="claim-enterprise-btn"
                    className="px-3.5 py-2 border border-zinc-200 hover:border-blue-600 dark:border-zinc-800 dark:hover:border-blue-500 hover:text-blue-600 text-xs font-bold rounded-xl transition-all">
                    Claim SBT
                  </button>
                )}
              </div>
            </GlassCard>
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <GlassCard className="p-6">
                <p className="text-[10px] font-mono text-zinc-450 mb-4 uppercase tracking-widest">Biometric Integrity</p>
                <WidgetErrorBoundary name="Radar"><IdentityRadar /></WidgetErrorBoundary>
              </GlassCard>
              <GlassCard className="p-6 flex flex-col">
                <p className="text-[10px] font-mono text-zinc-450 mb-4 uppercase tracking-widest">Avatar Engram</p>
                <div className="flex-1 min-h-[200px]">
                  <WidgetErrorBoundary name="Avatar"><VRMAvatarSlot /></WidgetErrorBoundary>
                </div>
              </GlassCard>
            </div>

            <GlassCard className="p-6 h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest">Security Log</p>
                <div className="flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider">Live Sync</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <WidgetErrorBoundary name="Feed"><ActivityFeed /></WidgetErrorBoundary>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      <CommandRail />
    </div>
  );
}
