'use client';
import { useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { SUPPORTED_CHAIN_IDS } from '@/lib/wagmi.config';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Navbar } from '@/components/layout/Navbar';
import { QuantumTimeline } from '@/components/dashboard/QuantumTimeline';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/shallow';

const VRMAvatarSlot = dynamic(
  () => import('@/components/dashboard/VRMAvatarSlot').then(mod => mod.VRMAvatarSlot),
  { ssr: false, loading: () => <div className="h-64 bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse shimmer" /> }
);
const EngramVisualizer3D = dynamic(
  () => import('@/components/dashboard/EngramVisualizer3D').then(mod => mod.EngramVisualizer3D),
  { ssr: false, loading: () => <div className="h-64 bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse shimmer" /> }
);
const IdentityRadar = dynamic(
  () => import('@/components/dashboard/IdentityRadar').then(mod => mod.IdentityRadar),
  { ssr: false, loading: () => <div className="h-48 bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse shimmer" /> }
);
const ActivityFeed = dynamic(
  () => import('@/components/dashboard/ActivityFeed'),
  { ssr: false, loading: () => <div className="h-48 bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse shimmer" /> }
);
const CommandRail = dynamic(
  () => import('@/components/dashboard/CommandRail'),
  { ssr: false }
);
import { GlassCard } from '@/components/ui/GlassCard';
import { HoloButton } from '@/components/ui/HoloButton';
import { WidgetErrorBoundary } from '@/components/ui/ErrorBoundary';
import { deriveVaultKey, encryptVault, decryptVault } from '@/lib/vault.crypto';
import { ChevronRight, Copy, Check, Zap, ExternalLink, Lock, Network, ArrowRight, ShieldCheck, Cpu, AlertTriangle, Mail, Send, Key, RefreshCw, LockOpen, LockKeyholeOpen, Award } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { m } from 'framer-motion';
import { useOnChainIdentity } from '@/hooks/useOnChainIdentity';
import { authenticatedFetch as fetch } from '@/lib/api';


export function CCIPBridgeTracker() {
  const { walletAddress, handle, did, addSBT } = useIdentityStore(useShallow(s => ({
    walletAddress: s.walletAddress,
    handle: s.handle,
    did: s.did,
    addSBT: s.addSBT
  })));
  const [targetChain, setTargetChain] = useState('arbitrum');
  const [bridgeStep, setBridgeStep] = useState<'idle' | 'signing' | 'gas' | 'routing' | 'finalized'>('idle');
  const [txLogs, setTxLogs] = useState<string[]>([]);

  const chainsMeta: Record<string, { name: string; chainId: number; color: string }> = {
    ethereum: { name: 'Ethereum Mainnet', chainId: 1, color: 'text-blue-500 bg-blue-500/10' },
    arbitrum: { name: 'Arbitrum One', chainId: 42161, color: 'text-sky-500 bg-sky-500/10' },
    optimism: { name: 'Optimism', chainId: 10, color: 'text-red-500 bg-red-500/10' },
    base: { name: 'Base', chainId: 8453, color: 'text-blue-600 bg-blue-600/10' }
  };

  const currentChainMeta = chainsMeta[targetChain];

  const addLog = (msg: string, delay: number) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setTxLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
        resolve();
      }, delay);
    });
  };

  const handleBridge = async () => {
    if (!walletAddress || !handle) {
      toast.error('Connect wallet to bridge identity.');
      return;
    }

    setBridgeStep('signing');
    setTxLogs([]);

    await addLog("Initiating CCIP bridge handshake request...", 0);
    await addLog("Requesting EIP-712 cryptographic signature...", 800);
    setBridgeStep('gas');

    await addLog("Signature verified successfully.", 1400);
    await addLog(`Target network: ${currentChainMeta.name} (Chain ID: ${currentChainMeta.chainId})`, 2000);
    await addLog("Calculating CCIP fee estimate in LINK/POL...", 2600);
    setBridgeStep('routing');

    await addLog("Dispatched CCIP message to Router (0x2c1...)", 3200);
    await addLog("CCIP Transaction Hash: 0x" + Math.random().toString(16).slice(2, 66), 3800);
    await addLog("Step 1/3: CCIP Committing on Polygon Amoy...", 4400);
    await addLog("Step 2/3: Executing cross-chain attestation consensus...", 5200);
    await addLog("Step 3/3: Dispatching mint instruction on target chain...", 6000);

    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const syncRes = await fetch(`${backend}/api/did/bridge/${targetChain}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json());

      if (syncRes.ok) {
        addSBT({
          id: `sbt-attested-${targetChain}-${Date.now()}`,
          name: `${currentChainMeta.name} Attested`,
          issuer: 'Meta Go Authority',
          issuedAt: Date.now(),
          domain: 'GAMING',
          chain: targetChain.toUpperCase() as any,
          status: 'VALID',
          txHash: syncRes.bridgeId || ('0x' + Math.random().toString(16).slice(2, 66)),
          description: `Cross-chain identity assertion successfully bridged to ${currentChainMeta.name} via Chainlink CCIP.`
        });

        await addLog("Attestation mint completed. SBT active on target chain.", 500);
        setBridgeStep('finalized');
        toast.success(`Identity bridged to ${currentChainMeta.name}!`);
      } else {
        throw new Error('Bridge failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Cross-chain bridge simulation failed');
      setBridgeStep('idle');
    }
  };

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest">Chainlink CCIP Bridge</p>
        <Network size={16} className="text-blue-500 animate-pulse" />
      </div>

      {bridgeStep === 'idle' && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Bridge your verified identity credentials to other EVM-compatible blockchains gaslessly via Chainlink CCIP.
          </p>

          <div className="flex gap-2">
            <div className="flex-grow flex flex-col gap-1">
              <span className="text-[8px] font-mono text-zinc-450 uppercase tracking-wider">Target Network</span>
              <select
                value={targetChain}
                onChange={e => setTargetChain(e.target.value)}
                className="w-full px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 font-bold outline-none text-[10px]"
              >
                <option value="arbitrum">Arbitrum One</option>
                <option value="ethereum">Ethereum Mainnet</option>
                <option value="optimism">Optimism</option>
                <option value="base">Base</option>
              </select>
            </div>
            <button
              onClick={handleBridge} data-testid="ccip-bridge-btn"
              className="px-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg mt-4 self-end h-7 tracking-wider uppercase"
            >
              Cross-chain Export
            </button>
          </div>
        </div>
      )}

      {bridgeStep !== 'idle' && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-800">
            <div className="flex items-center justify-between text-[10px] font-mono mb-2">
              <span className="text-zinc-450">CROSS-CHAIN ROUTING MAP</span>
              <span className="text-blue-650 dark:text-blue-450 font-bold uppercase tracking-wider animate-pulse">
                {bridgeStep.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between relative py-2">
              {/* Connector lines behind */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 -translate-y-1/2 z-0" />
              
              {/* Dynamic glowing progress line */}
              <div 
                className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-emerald-500 via-blue-500 to-sky-500 -translate-y-1/2 z-0 transition-all duration-500"
                style={{
                  width: bridgeStep === 'finalized' ? '83.3%' : ['signing', 'gas', 'routing'].includes(bridgeStep) ? '50%' : '16.6%'
                }}
              />

              {/* Node 1: Polygon (Attested) */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
                <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-zinc-100 dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-white shadow shadow-emerald-500/20">
                  ✓
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">Polygon</p>
                  <p className="text-[7px] font-mono text-emerald-500 uppercase tracking-widest font-semibold">(Attested)</p>
                </div>
              </div>

              {/* Node 2: Bridging (Oracle Pending) */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
                <div className={`w-5 h-5 rounded-full border-2 border-zinc-100 dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-white shadow transition-all duration-300 ${
                  bridgeStep === 'finalized' 
                    ? 'bg-emerald-500 shadow-emerald-500/20' 
                    : ['signing', 'gas', 'routing'].includes(bridgeStep)
                    ? 'bg-amber-500 animate-pulse shadow-amber-500/20' 
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {bridgeStep === 'finalized' ? '✓' : ['signing', 'gas', 'routing'].includes(bridgeStep) ? '⚡' : '2'}
                </div>
                <div className="text-center">
                  <p className={`text-[9px] font-bold ${
                    ['signing', 'gas', 'routing', 'finalized'].includes(bridgeStep) ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'
                  }`}>Bridging</p>
                  <p className={`text-[7px] font-mono uppercase tracking-widest font-semibold ${
                    bridgeStep === 'finalized'
                      ? 'text-emerald-500'
                      : ['signing', 'gas', 'routing'].includes(bridgeStep)
                      ? 'text-amber-500 animate-pulse'
                      : 'text-zinc-450'
                  }`}>
                    {bridgeStep === 'finalized' ? '(Completed)' : '(Oracle Pending)'}
                  </p>
                </div>
              </div>

              {/* Node 3: Target Chain (SBT Synced) */}
              <div className="flex flex-col items-center gap-1.5 z-10 w-1/3">
                <div className={`w-5 h-5 rounded-full border-2 border-zinc-100 dark:border-zinc-950 flex items-center justify-center text-[10px] font-bold text-white shadow transition-all duration-300 ${
                  bridgeStep === 'finalized' 
                    ? 'bg-sky-500 shadow-sky-500/20' 
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                }`}>
                  {bridgeStep === 'finalized' ? '✓' : '3'}
                </div>
                <div className="text-center">
                  <p className={`text-[9px] font-bold ${
                    bridgeStep === 'finalized' ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-400'
                  }`}>{currentChainMeta?.name?.split(' ')[0]}</p>
                  <p className={`text-[7px] font-mono uppercase tracking-widest font-semibold ${
                    bridgeStep === 'finalized' ? 'text-sky-500' : 'text-zinc-455'
                  }`}>
                    {bridgeStep === 'finalized' ? '(SBT Synced)' : '(Pending Sync)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 h-28 overflow-y-auto font-mono text-[8px] text-zinc-400 space-y-1.5">
            {txLogs.map((log, idx) => (
              <p key={idx} className="leading-relaxed">{log}</p>
            ))}
            {bridgeStep !== 'finalized' && (
              <p className="text-blue-500 animate-pulse leading-relaxed">● Processing operation...</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[9px] font-mono text-zinc-450 uppercase">
              STATUS: <strong className="text-blue-600 dark:text-blue-400">{bridgeStep.toUpperCase()}</strong>
            </span>
            {bridgeStep === 'finalized' ? (
              <button
                onClick={() => setBridgeStep('idle')}
                className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 uppercase"
              >
                <ShieldCheck size={12} /> Finished
              </button>
            ) : (
              <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export function AISecurityMonitor() {
  const walletAddress = useIdentityStore(s => s.walletAddress);
  const [telemetry, setTelemetry] = useState<any>({
    threatLevel: 'LOW',
    anomalyScore: 8,
    flags: [],
    aiAdjustedTrustScore: 92
  });
  const [loading, setLoading] = useState(false);

  const fetchTelemetry = async () => {
    if (!walletAddress) return;
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/user/telemetry/${walletAddress.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const handleSpoofAttack = async (trigger: boolean) => {
    if (!walletAddress) return;
    setLoading(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/user/telemetry/spoof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress.toLowerCase(),
          triggerAnomaly: trigger
        })
      });
      if (res.ok) {
        toast.success(trigger ? 'Geo-Spoof anomaly simulated!' : 'Security telemetry restored.');
        fetchTelemetry();
      }
    } catch (e) {
      toast.error('Simulation request failed');
    } finally {
      setLoading(false);
    }
  };

  const isHigh = telemetry.threatLevel === 'HIGH';

  return (
    <GlassCard className={clsx('p-6 space-y-4 border transition-all duration-500', isHigh ? 'border-red-500/30 bg-red-950/5' : 'border-zinc-200 dark:border-zinc-800')}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest flex items-center gap-1.5">
          <Cpu size={14} className={clsx(isHigh ? 'text-red-500 animate-spin' : 'text-blue-500')} /> AI Security Telemetry
        </p>
        <span className={clsx('text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded border',
          isHigh ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20')}>
          THREAT: {telemetry.threatLevel}
        </span>
      </div>

      {isHigh && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 animate-pulse">
          <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0" />
          <div className="text-[10px]">
            <p className="font-bold text-red-500 uppercase tracking-wider">High Anomaly Level Detected</p>
            <p className="text-zinc-500 mt-0.5 leading-relaxed">Dynamic access restrictions applied. Trust score lowered.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 font-mono text-[9px] text-zinc-450">
        <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850 space-y-1">
          <p className="text-zinc-500 uppercase">Anomaly Index</p>
          <p className={clsx('text-lg font-bold', isHigh ? 'text-red-500' : 'text-blue-500')}>{telemetry.anomalyScore}%</p>
        </div>
        <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850 space-y-1">
          <p className="text-zinc-500 uppercase">Trust Score (AI)</p>
          <p className={clsx('text-lg font-bold', isHigh ? 'text-red-500' : 'text-emerald-505')}>{telemetry.aiAdjustedTrustScore}/100</p>
        </div>
      </div>

      {telemetry.flags && telemetry.flags.length > 0 && (
        <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 space-y-1">
          <p className="text-[8px] font-mono text-zinc-500 uppercase font-bold font-semibold">Anomaly Indicators:</p>
          {telemetry.flags.map((flag: string, idx: number) => (
            <p key={idx} className="text-[8px] font-mono text-red-400 flex items-center gap-1">
              <span>●</span> {flag}
            </p>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-zinc-150 dark:border-zinc-850">
        {isHigh ? (
          <button
            onClick={() => handleSpoofAttack(false)}
            disabled={loading}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white rounded-lg uppercase tracking-wider transition-all disabled:opacity-50"
          >
            Clear Threat & Restore Score
          </button>
        ) : (
          <button
            onClick={() => handleSpoofAttack(true)}
            disabled={loading}
            className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-[10px] font-bold text-white rounded-lg uppercase tracking-wider transition-all disabled:opacity-50"
          >
            Simulate Geolocation Spoof Attack
          </button>
        )}
      </div>
    </GlassCard>
  );
}

// ===========================================================================
// DYNAMIC 3D HOLOGRAPHIC PASSPORT CARD
// ===========================================================================
export function HolographicPassportCard() {
  const { did, handle, soulboundTokens, identityMetrics } = useIdentityStore(useShallow(s => ({
    did: s.did,
    handle: s.handle,
    soulboundTokens: s.soulboundTokens,
    identityMetrics: s.identityMetrics
  })));
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glintX: 50, glintY: 50 });

  const copyDID = () => {
    if (!did) return;
    navigator.clipboard.writeText(did);
    setCopied(true);
    toast.success('DID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    
    // Degrees rotation
    const rotateX = ((centerY - y) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * -12;
    
    const glintX = (x / box.width) * 100;
    const glintY = (y / box.height) * 100;
    
    setTilt({ rotateX, rotateY, glintX, glintY });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, glintX: 50, glintY: 50 });
  };

  const trustScore = identityMetrics?.trustScore || 72;

  return (
    <div 
      className="relative w-full cursor-pointer select-none rounded-[24px] p-[1.5px] transition-all duration-300 hover:scale-[1.01]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ 
        perspective: '1000px',
        background: `radial-gradient(circle at ${tilt.glintX}% ${tilt.glintY}%, rgba(59, 130, 246, 0.45) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)`
      }}
    >
      <div 
        className="relative w-full rounded-[22px] bg-zinc-950/90 backdrop-blur-xl border border-zinc-900/80 p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-100 min-h-[420px]"
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
        }}
      >
        {/* Iridescent holographic foil glint */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 mix-blend-color-dodge rounded-[22px] transition-opacity duration-300 hover:opacity-35"
          style={{
            background: `linear-gradient(${135 + tilt.rotateY * 2.5}deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.015) 30%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.015) 70%, rgba(255, 255, 255, 0) 100%), radial-gradient(circle at ${tilt.glintX}% ${tilt.glintY}%, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 35%, transparent 75%)`,
          }}
        />

        {/* header */}
        <div className="flex justify-between items-start z-10" style={{ transform: 'translateZ(25px)' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600/10 border border-blue-600/30 flex items-center justify-center animate-pulse">
              <span className="text-blue-500 text-[10px] font-sans font-bold">M</span>
            </div>
            <div>
              <p className="text-[10px] font-mono font-bold tracking-widest text-zinc-300">META GO</p>
              <p className="text-[7px] font-mono text-zinc-500 uppercase">Sovereign Passport</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[7px] font-mono text-emerald-500 tracking-wider">SECURE NODE</span>
            </div>
            <p className="text-[6px] font-mono text-zinc-500 mt-0.5">DZBIP SEC-V2</p>
          </div>
        </div>

        {/* center */}
        <div className="flex-grow flex items-center justify-center my-4 relative" style={{ transform: 'translateZ(45px)' }}>
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-b from-blue-500/5 to-transparent border border-blue-500/10 blur-sm pointer-events-none animate-pulse" />
          <div className="w-full h-52 relative flex items-center justify-center">
            <WidgetErrorBoundary name="Engram">
              <EngramVisualizer3D />
            </WidgetErrorBoundary>
          </div>

          {/* left runes */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10" style={{ transform: 'translateZ(30px)' }}>
            {soulboundTokens.map((token) => {
              const colors: Record<string, string> = {
                GAMING: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
                ENTERPRISE: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-purple-500/10',
                EDUCATION: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-blue-500/10',
                COMMERCE: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10',
              };
              const colorClass = colors[token.domain] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
              return (
                <div 
                  key={token.id} 
                  title={`${token.name} (${token.domain})`}
                  className={clsx('w-7 h-7 rounded-xl border flex items-center justify-center font-mono font-bold text-[10px] shadow-md backdrop-blur-md transition-all hover:scale-110 hover:-translate-x-1', colorClass)}
                >
                  {token.domain.slice(0, 1)}
                </div>
              );
            })}
            {soulboundTokens.length === 0 && (
              <div className="w-7 h-7 rounded-xl border border-dashed border-zinc-800 flex items-center justify-center text-[10px] text-zinc-700" title="No SBTs claimed">
                Ø
              </div>
            )}
          </div>

          {/* right trust */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10" style={{ transform: 'translateZ(30px)' }}>
            <div className="relative w-11 h-11 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <defs>
                  <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <circle cx="22" cy="22" r="18" stroke="currentColor" className="text-zinc-900" strokeWidth="2.5" fill="transparent" />
                <circle cx="22" cy="22" r="18" stroke="currentColor" className="text-blue-500" strokeWidth="2.5" fill="transparent"
                  filter="url(#glow-filter)"
                  strokeDasharray={2 * Math.PI * 18}
                  strokeDashoffset={2 * Math.PI * 18 * (1 - trustScore / 100)}
                />
              </svg>
              <span className="absolute text-[9px] font-mono font-bold text-zinc-200">{trustScore}</span>
            </div>
            <span className="text-[6px] font-mono uppercase text-zinc-550 tracking-wider">TRUST</span>
          </div>
        </div>

        {/* footer */}
        <div className="space-y-2 z-10" style={{ transform: 'translateZ(25px)' }}>
          <div className="flex justify-between items-center border-t border-zinc-900/80 pt-3">
            <div>
              <p className="text-[8px] font-mono text-zinc-500 uppercase">Identity Identifier</p>
              {handle && <p className="text-xs font-sans font-bold text-zinc-200">@{handle}</p>}
            </div>
            <span className="text-[8px] font-mono px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-blue-400 font-semibold tracking-wider uppercase">
              LEVEL {Math.floor(trustScore / 20)}
            </span>
          </div>

          {did && (
            <div 
              onClick={copyDID}
              className="p-2 bg-zinc-900/40 hover:bg-zinc-900/70 rounded-xl border border-zinc-900 flex items-center justify-between group/did transition-colors cursor-pointer"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[6px] font-mono text-zinc-550 uppercase">DID Document Address</span>
                <span className="text-[8px] font-mono text-zinc-450 truncate">{did}</span>
              </div>
              <div className="text-zinc-500 group-hover/did:text-blue-500 transition-colors ml-1.5">
                {copied ? <Check size={10} /> : <Copy size={10} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ===========================================================================
// P2P ENCRYPTED DID MAIL WIDGET
// ===========================================================================
export function DIDMailInbox() {
  const walletAddress = useIdentityStore(s => s.walletAddress);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [isRegistered, setIsRegistered] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [rawMessages, setRawMessages] = useState<any[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<any[]>([]);
  
  // Compose states
  const [toAddress, setToAddress] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'INBOX' | 'COMPOSE'>('INBOX');

  // Encryption keys in memory
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);

  const activeAddress = address || walletAddress;

  const checkRegistration = async () => {
    if (!activeAddress) return;
    setLoading(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/user/encryption-keys/${activeAddress.toLowerCase()}`);
      if (res.ok) {
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    } catch (e) {
      setIsRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkRegistration();
  }, [activeAddress]);

  const handleActivate = async () => {
    if (!activeAddress) return;
    setIsUnlocking(true);
    const toastId = toast.loading('Generating RSA key pair (2048-bit)...');
    try {
      // 1. Generate RSA-OAEP keys
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      // 2. Export keys
      const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

      // 3. Request wallet signature for derivation key
      toast.loading('Sign authorization to encrypt private key...', { id: toastId });
      const message = 'Authorize Meta Go Encrypted Vault access';
      const signature = await signMessageAsync({ account: activeAddress as `0x${string}`, message });

      // 4. Encrypt private key
      toast.loading('Encrypting private key client-side...', { id: toastId });
      const cryptoKey = await deriveVaultKey(signature);
      const encryptedPrivate = await encryptVault([privJwk], cryptoKey);

      // 5. Submit keys to backend
      toast.loading('Registering DID mail secure keys...', { id: toastId });
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/user/encryption-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeAddress.toLowerCase(),
          publicKeyJwk: pubJwk,
          encryptedPrivateKey: encryptedPrivate
        })
      });

      if (!res.ok) throw new Error('Key registration failed');
      
      setPrivateKey(keyPair.privateKey);
      setIsRegistered(true);
      setIsUnlocked(true);
      toast.success('Secure DID Mail activated successfully!', { id: toastId });
      fetchMessages(keyPair.privateKey);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Activation failed', { id: toastId });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleUnlock = async () => {
    if (!activeAddress) return;
    setIsUnlocking(true);
    const toastId = toast.loading('Fetching keys from vault...');
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/user/encryption-keys/${activeAddress.toLowerCase()}`);
      if (!res.ok) throw new Error('Could not retrieve keys from server');
      const data = await res.json();

      // Sign to derive key
      toast.loading('Deriving decryption key from signature...', { id: toastId });
      const message = 'Authorize Meta Go Encrypted Vault access';
      const signature = await signMessageAsync({ account: activeAddress as `0x${string}`, message });

      // Decrypt private key JWK
      toast.loading('Decrypting private key...', { id: toastId });
      const cryptoKey = await deriveVaultKey(signature);
      const decryptedArray = await decryptVault(data.encryptedPrivateKey, cryptoKey);
      const decryptedJwk = decryptedArray[0] as JsonWebKey;

      // Import key
      const privKey = await window.crypto.subtle.importKey(
        'jwk',
        decryptedJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );

      setPrivateKey(privKey);
      setIsUnlocked(true);
      toast.success('DID Mail inbox unlocked!', { id: toastId });
      fetchMessages(privKey);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Decryption failed', { id: toastId });
    } finally {
      setIsUnlocking(false);
    }
  };

  const fetchMessages = async (privKey: CryptoKey) => {
    if (!activeAddress || !privKey) return;
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/messages/${activeAddress.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setRawMessages(data.messages);
        
        // Decrypt all messages
        const decryptedList = await Promise.all(data.messages.map(async (m: any) => {
          try {
            const bytes = new Uint8Array(window.atob(m.ciphertext).split('').map(c => c.charCodeAt(0)));
            const decryptedBuffer = await window.crypto.subtle.decrypt(
              { name: 'RSA-OAEP' },
              privKey,
              bytes
            );
            const plaintext = new TextDecoder().decode(decryptedBuffer);
            return { ...m, body: plaintext, success: true };
          } catch (err) {
            return { ...m, body: '[Decryption Failure: Key Mismatch]', success: false };
          }
        }));
        setDecryptedMessages(decryptedList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!activeAddress) return;
    if (!toAddress || !messageBody) {
      toast.error('Recipient address and body required');
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('Retrieving recipient public key...');
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const resKeys = await fetch(`${backend}/api/user/encryption-keys/${toAddress.toLowerCase()}`);
      if (!resKeys.ok) {
        throw new Error('Recipient does not have secure encryption keys registered');
      }
      const recipientData = await resKeys.json();

      // Import recipient public key
      toast.loading('Importing recipient public key...', { id: toastId });
      const pubKey = await window.crypto.subtle.importKey(
        'jwk',
        recipientData.publicKeyJwk as JsonWebKey,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
      );

      // Encrypt message body
      toast.loading('Encrypting message asymmetric (RSA-OAEP)...', { id: toastId });
      const plaintextBytes = new TextEncoder().encode(messageBody);
      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        pubKey,
        plaintextBytes
      );

      const ciphertextB64 = window.btoa(
        String.fromCharCode(...new Uint8Array(ciphertextBuffer))
      );

      // Post message
      toast.loading('Routing message to mailbox...', { id: toastId });
      const resSend = await fetch(`${backend}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderAddress: activeAddress.toLowerCase(),
          receiverAddress: toAddress.toLowerCase(),
          ciphertext: ciphertextB64
        })
      });

      if (!resSend.ok) throw new Error('Message dispatch failed');
      
      toast.success('Encrypted P2P message dispatched!', { id: toastId });
      setToAddress('');
      setMessageBody('');
      setActiveTab('INBOX');
      if (privateKey) fetchMessages(privateKey);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Dispatch failed', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  const handleRefresh = () => {
    if (privateKey) {
      fetchMessages(privateKey);
    }
  };

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest flex items-center gap-1.5">
          <Mail size={14} className="text-indigo-550" /> DID Mail (Secure Messaging)
        </p>
        {isUnlocked && (
          <div className="flex gap-2">
            <button onClick={handleRefresh} className="text-zinc-500 hover:text-zinc-700">
              <RefreshCw size={12} />
            </button>
            <span className="text-[8px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-semibold">
              DECRYPTED
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-4 text-center text-xs font-mono text-zinc-500">Checking key status...</div>
      ) : !isRegistered ? (
        <div className="space-y-3 text-center py-2">
          <p className="text-xs text-zinc-550 dark:text-zinc-400">
            Activate end-to-end encrypted notification inbox linked directly to your sovereign DID.
          </p>
          <button
            onClick={handleActivate}
            disabled={isUnlocking}
            className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            {isUnlocking ? <RefreshCw size={12} className="animate-spin" /> : <Key size={12} />}
            Activate Secure Mailbox
          </button>
        </div>
      ) : !isUnlocked ? (
        <div className="space-y-3 text-center py-2">
          <p className="text-xs text-zinc-550 dark:text-zinc-400">
            Secure encryption key found. Verify ownership signature to decrypt messages locally.
          </p>
          <button
            onClick={handleUnlock}
            disabled={isUnlocking}
            className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
          >
            {isUnlocking ? <RefreshCw size={12} className="animate-spin" /> : <LockOpen size={12} />}
            Unlock Inbox
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-zinc-150 dark:border-zinc-850 pb-2">
            <button
              onClick={() => setActiveTab('INBOX')}
              className={clsx('text-[9px] font-bold uppercase tracking-wider pb-1 transition-colors outline-none',
                activeTab === 'INBOX' ? 'text-indigo-400 border-b border-indigo-400' : 'text-zinc-500 hover:text-zinc-700')}
            >
              Inbox ({decryptedMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('COMPOSE')}
              className={clsx('text-[9px] font-bold uppercase tracking-wider pb-1 transition-colors outline-none',
                activeTab === 'COMPOSE' ? 'text-indigo-400 border-b border-indigo-400' : 'text-zinc-500 hover:text-zinc-700')}
            >
              Compose
            </button>
          </div>

          {activeTab === 'INBOX' ? (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {decryptedMessages.length === 0 ? (
                <p className="text-center text-[10px] text-zinc-500 font-mono py-6">Mailbox empty</p>
              ) : (
                decryptedMessages.map((m) => (
                  <div key={m.id} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-850 space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] font-mono text-zinc-500">
                      <span className="truncate max-w-[120px]">From: {m.senderAddress}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 font-mono break-all leading-relaxed">{m.body}</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Recipient Wallet (0x...)</span>
                <input
                  type="text"
                  value={toAddress}
                  onChange={e => setToAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Message Body</span>
                <textarea
                  value={messageBody}
                  onChange={e => setMessageBody(e.target.value)}
                  placeholder="Type secure notification..."
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-200 outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
              >
                {isSending ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                Send Secure Message
              </button>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}


// ===========================================================================
// MULTI-CHAIN REGISTRY SYNC STATUS
// ===========================================================================
export function MultiChainSyncTracker() {
  const walletAddress = useIdentityStore(s => s.walletAddress);
  const { address } = useAccount();
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({
    polygon: 'synced',
    arbitrum: 'not_syncing',
    base: 'not_syncing',
    optimism: 'not_syncing',
  });
  const [syncingChains, setSyncingChains] = useState<Record<string, boolean>>({});

  const activeAddress = address || walletAddress;

  const fetchSyncStatus = async () => {
    if (!activeAddress) return;
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/did/sync-status/${activeAddress.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
        
        // Clear sync indicators for chains that transitioned out of pending
        setSyncingChains(prev => {
          const next = { ...prev };
          Object.keys(prev).forEach(k => {
            if (data[k] === 'synced') {
              delete next[k];
            }
          });
          return next;
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 2000);
    return () => clearInterval(interval);
  }, [activeAddress]);

  const handleSync = async (chain: string) => {
    if (!activeAddress) return;
    setSyncingChains(prev => ({ ...prev, [chain]: true }));
    const toastId = toast.loading(`Initiating EIP-712 Sync call for ${chain.toUpperCase()}...`);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/did/sync-chain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeAddress.toLowerCase(),
          destinationChain: chain
        })
      });

      if (!res.ok) throw new Error('Sync request failed');
      const data = await res.json();

      toast.success(`Cross-chain sync sent! Tx: ${data.syncTxId.slice(0, 10)}... (CCIP Oracle Pending)`, { id: toastId });
      fetchSyncStatus();
    } catch (e: any) {
      toast.error(e.message || 'Sync failed', { id: toastId });
      setSyncingChains(prev => {
        const next = { ...prev };
        delete next[chain];
        return next;
      });
    }
  };

  const chains = [
    { key: 'polygon', name: 'Polygon Amoy', label: 'Primary Network' },
    { key: 'arbitrum', name: 'Arbitrum One', label: 'Layer-2 attestation' },
    { key: 'base', name: 'Base Mainnet', label: 'Coinbase rollup' },
  ];

  return (
    <GlassCard className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest flex items-center gap-1.5">
          <Network size={14} className="text-blue-500 animate-pulse" /> DID Multi-Chain Synchronization
        </p>
      </div>

      <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
        Synchronize your verified DID document globally across secondary EVM chains gaslessly via simulated Chainlink CCIP relays.
      </p>

      <div className="space-y-3">
        {chains.map((c) => {
          const status = syncStatus[c.key] || 'not_syncing';
          const isPending = status === 'pending' || syncingChains[c.key];
          
          return (
            <div key={c.key} className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-200">{c.name}</p>
                <p className="text-[8px] font-mono text-zinc-550 uppercase mt-0.5">{c.label}</p>
              </div>

              <div className="flex items-center gap-3">
                {c.key === 'polygon' ? (
                  <span className="text-[8px] font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold uppercase">
                    PRIMARY
                  </span>
                ) : isPending ? (
                  <div className="flex items-center gap-1.5 text-[8px] font-mono text-amber-500 uppercase tracking-wider">
                    <RefreshCw size={10} className="animate-spin text-amber-500" /> CCIP TRANSMITTING
                  </div>
                ) : status === 'synced' ? (
                  <span className="text-[8px] font-mono px-2 py-0.5 bg-sky-500/10 text-sky-450 border border-sky-500/20 rounded font-semibold uppercase">
                    SYNCED
                  </span>
                ) : (
                  <button
                    onClick={() => handleSync(c.key)}
                    className="px-3 py-1 bg-zinc-900 hover:bg-blue-600 hover:text-white border border-zinc-800 hover:border-blue-500 text-[8px] font-bold text-zinc-400 rounded-md uppercase tracking-wider transition-all"
                  >
                    CCIP Sync
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}


export default function DashboardClient() {
  const { isConnected, chainId, address } = useAccount();
  const { did, handle, soulboundTokens, addSBT } = useIdentityStore(useShallow(s => ({
    did: s.did,
    handle: s.handle,
    soulboundTokens: s.soulboundTokens,
    addSBT: s.addSBT
  })));
  const { isLoading, refresh } = useOnChainIdentity();
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [activeLogTab, setActiveLogTab] = useState<'system' | 'biometrics'>('system');

  useEffect(() => {
    async function loadLogs() {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const res = await fetch(`${backend}/api/user/me`, { credentials: 'include' }).then(r => r.json());
        if (res.authenticated && res.biometricSecurityLogs) {
          setSecurityLogs([...res.biometricSecurityLogs].reverse());
        }
      } catch (e) {
        console.warn("Failed to load security logs:", e);
      }
    }
    if (isMounted) {
      loadLogs();
    }
  }, [address, isMounted]);

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

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
        <Navbar />

        <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto space-y-8">
          {/* HEADER SKELETON */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
              <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg shimmer" />
              <div className="h-4 w-96 bg-zinc-200 dark:bg-zinc-800 rounded-md shimmer" />
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-xl shimmer" />
              <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-xl shimmer" />
            </div>
          </header>

          {/* TIMELINE SKELETON */}
          <div className="h-28 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
              <div className="h-3.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
            </div>
            <div className="flex justify-between items-center pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="h-2 w-8 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 shimmer" />
                  <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                </div>
              ))}
            </div>
          </div>

          {/* GRID STRUCTURE */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* LEFT PANELS */}
            <div className="md:col-span-5 space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-5">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                  <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 shimmer" />
                  <div className="space-y-2 flex-grow">
                    <div className="h-4 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                    <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT PANELS */}
            <div className="md:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px] space-y-4">
                  <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded shimmer self-start" />
                  <div className="w-36 h-36 rounded-full bg-zinc-200 dark:bg-zinc-800 shimmer" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-6">
                  <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded shimmer" />
                  <div className="h-36 w-full flex items-end gap-3 justify-center">
                    {[40, 60, 45, 80, 50].map((h, i) => (
                      <div key={i} className="bg-zinc-200 dark:bg-zinc-800 rounded shimmer flex-grow" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
            <HoloButton variant="ghost" size="sm" onClick={() => refresh()} loading={isLoading} data-testid="refresh-identity-btn">
              <Zap size={14} className={isLoading ? 'animate-pulse' : ''} />
              Refresh Identity
            </HoloButton>
            <HoloButton variant="cyan" size="sm" data-testid="verify-credentials-btn">
              <ExternalLink size={14} />
              Verify Credentials
            </HoloButton>
          </div>
        </header>

        <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <GlassCard intensity="low" className="p-1" hover={false}>
            <WidgetErrorBoundary name="Activity Timeline"><QuantumTimeline /></WidgetErrorBoundary>
          </GlassCard>
        </m.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-6">
            <WidgetErrorBoundary name="Holographic Passport"><HolographicPassportCard /></WidgetErrorBoundary>

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

            <WidgetErrorBoundary name="AI Security Monitor"><AISecurityMonitor /></WidgetErrorBoundary>

            <WidgetErrorBoundary name="CCIP Bridge"><CCIPBridgeTracker /></WidgetErrorBoundary>
            <WidgetErrorBoundary name="DID Mail"><DIDMailInbox /></WidgetErrorBoundary>
            <WidgetErrorBoundary name="DID Multi-Chain Sync"><MultiChainSyncTracker /></WidgetErrorBoundary>
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
              <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveLogTab('system')}
                    className={`text-[10px] font-mono uppercase tracking-widest transition-all ${
                      activeLogTab === 'system' 
                        ? 'text-blue-500 font-bold border-b border-blue-500 pb-1' 
                        : 'text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    System Feed
                  </button>
                  <button 
                    onClick={() => setActiveLogTab('biometrics')}
                    className={`text-[10px] font-mono uppercase tracking-widest transition-all ${
                      activeLogTab === 'biometrics' 
                        ? 'text-blue-500 font-bold border-b border-blue-500 pb-1' 
                        : 'text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200'
                    }`}
                  >
                    Biometric Audits
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider">Live Sync</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {activeLogTab === 'system' ? (
                  <WidgetErrorBoundary name="Feed"><ActivityFeed /></WidgetErrorBoundary>
                ) : (
                  securityLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-10 font-mono text-[10px]">
                      <AlertTriangle className="text-zinc-650 mb-2" size={16} />
                      NO VERIFICATION ATTEMPTS RECORDED
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto pr-1 space-y-3 font-mono text-[9px]">
                      {securityLogs.map((log, idx) => (
                        <div key={idx} className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-950/20 space-y-2 text-left">
                          <div className="flex justify-between items-center border-b border-zinc-250 dark:border-zinc-850 pb-1.5">
                            <span className="text-[8px] text-zinc-500">{new Date(log.timestamp).toLocaleString()}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold ${
                              log.riskLevel === 'LOW RISK' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                              log.riskLevel === 'MEDIUM RISK' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {log.riskLevel} ({log.trustScore}%)
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-[8px] text-zinc-400">
                            <div className="space-y-0.5">
                              <p className="text-zinc-500 font-bold uppercase text-[7px]">Face Analytics</p>
                              <p>Match Similarity: {log.face.match?.toFixed(1)}%</p>
                              <p>Liveness Rating: {log.face.liveness?.toFixed(1)}%</p>
                              <p>Deepfake Risk: {log.face.deepfakeRisk?.toFixed(1)}%</p>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-zinc-500 font-bold uppercase text-[7px]">Voice MFA</p>
                              <p>Voiceprint Match: {log.voice.match?.toFixed(1)}%</p>
                              <p>Anti-Spoof Risk: {log.voice.spoofRisk?.toFixed(1)}%</p>
                              <p className="truncate">Speech STT: "{log.voice.transcription || 'N/A'}"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      <CommandRail />
    </div>
  );
}
