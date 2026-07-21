'use client';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Users, Plus, Trash2, Shield, ChevronRight, Share2, Clipboard, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi.config';
import { clsx } from 'clsx';
import { hardhat } from 'wagmi/chains';
import { authenticatedFetch as fetch } from '@/lib/api';


type Tab = 'CONFIG' | 'CONSOLE';

// Helper to hash passphrase client side
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function RecoveryPage() {
  const { guardians, setGuardians, addNotification, walletAddress, did } = useIdentityStore();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [activeTab, setActiveTab] = useState<Tab>('CONFIG');
  const [newGuardian, setNewGuardian] = useState('');
  const [passphrase, setPassphrase] = useState('');
  
  // Console States
  const [recoveryDid, setRecoveryDid] = useState('');
  const [targetWallet, setTargetWallet] = useState('');
  const [enteredPassphrase, setEnteredPassphrase] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);
  
  // Active session status
  const [session, setSession] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-fill defaults for convenience if connected
  useEffect(() => {
    const activeAddress = address || walletAddress;
    if (activeAddress && did) {
      setRecoveryDid(did);
    }
  }, [address, walletAddress, did]);

  function addGuardianLocal() {
    if (!/^0x[a-fA-F0-9]{40}$/.test(newGuardian)) {
      toast.error('Invalid EVM address');
      return;
    }
    const cleanG = newGuardian.toLowerCase();
    if (guardians.includes(cleanG)) {
      toast.error('Already a guardian');
      return;
    }
    setGuardians([...guardians, cleanG]);
    toast.success('Guardian added to draft');
    setNewGuardian('');
  }

  function removeGuardianLocal(g: string) {
    setGuardians(guardians.filter(x => x !== g));
    toast.success('Guardian removed from draft');
  }

  async function handleRegisterSetup() {
    const activeAddress = address || walletAddress;
    if (!activeAddress) {
      toast.error('Connect your wallet to configure guardians');
      return;
    }
    if (guardians.length < 3) {
      toast.error('You must specify exactly 3 trusted guardians');
      return;
    }
    if (!passphrase) {
      toast.error('Provide a safe backup passphrase');
      return;
    }

    const toastId = toast.loading('Hashing passphrase...');
    try {
      const hash = await sha256(passphrase);
      
      // 1. Submit setupRecovery transaction on-chain
      toast.loading('Registering setup on-chain...', { id: toastId });
      const txHash = await writeContractAsync({
        address: CONTRACTS.IDENTITY_REGISTRY as `0x${string}`,
        abi: [
          {
            "inputs": [
              {
                "internalType": "address[]",
                "name": "_guardians",
                "type": "address[]"
              },
              {
                "internalType": "bytes32",
                "name": "_passphraseHash",
                "type": "bytes32"
              }
            ],
            "name": "setupRecovery",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ] as const,
        functionName: 'setupRecovery',
        args: [
          guardians.map(g => g as `0x${string}`),
          `0x${hash}` as `0x${string}`
        ],
        account: activeAddress as `0x${string}`,
        chain: hardhat,
      });

      // 2. Post to backend to sync
      toast.loading('Syncing setup with database...', { id: toastId });
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      const res = await fetch(`${backend}/api/recovery/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeAddress.toLowerCase(),
          guardians: guardians.map(g => g.toLowerCase()),
          passphraseHash: hash
        })
      });

      if (!res.ok) throw new Error('Database sync failed');
      toast.success('Recovery network configured successfully on-chain and synced!', { id: toastId });
      setPassphrase('');
    } catch (e: any) {
      toast.error(e.message || 'Setup failed', { id: toastId });
    }
  }

  async function handleInitiateRecovery() {
    if (!recoveryDid.startsWith('did:metago:')) {
      toast.error('Provide a valid Meta Go DID');
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(targetWallet)) {
      toast.error('Provide a valid target wallet address');
      return;
    }
    if (!enteredPassphrase) {
      toast.error('Recovery passphrase is required');
      return;
    }

    setIsInitiating(true);
    const toastId = toast.loading('Verifying security parameters...');
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const hash = await sha256(enteredPassphrase);
      
      const res = await fetch(`${backend}/api/recovery/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: recoveryDid.trim(),
          newWalletAddress: targetWallet.toLowerCase(),
          passphrase: hash
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Initiation failed');
      }
      const data = await res.json();

      toast.success('Recovery Session active. Collect guardian signatures!', { id: toastId });
      fetchSessionStatus();
    } catch (e: any) {
      toast.error(e.message || 'Failed to start recovery', { id: toastId });
    } finally {
      setIsInitiating(false);
    }
  }

  async function fetchSessionStatus() {
    if (!recoveryDid) return;
    setIsRefreshing(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/recovery/status/${encodeURIComponent(recoveryDid.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.active) {
          setSession(data);
        } else {
          setSession(null);
        }
      }
    } catch (e) {
      // Ignore
    } finally {
      setIsRefreshing(false);
    }
  }

  // Poll status when session is pending
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && session.status === 'pending') {
      interval = setInterval(fetchSessionStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [session, recoveryDid]);

  async function handleMigrate() {
    if (!session) return;
    const toastId = toast.loading('Executing identity migration...');
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/recovery/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId })
      });

      if (!res.ok) throw new Error('Migration request failed');
      toast.success('Sovereign identity migrated to target wallet successfully!', { id: toastId });
      addNotification({ type: 'GUARDIAN_CONFIRMED', message: `Identity migrated to ${session.newAddress.slice(0, 10)}...` });
      setSession(null);
      setTargetWallet('');
      setEnteredPassphrase('');
    } catch (e: any) {
      toast.error(e.message || 'Migration failed', { id: toastId });
    }
  }

  const copyApprovalLink = () => {
    if (!session) return;
    const url = `${window.location.origin}/recovery/approve?sessionId=${session.sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Approval link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Social Recovery</span>
        </div>
        
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Social <span className="gradient-text">Recovery</span></h1>
            <p className="text-sm text-zinc-450 mt-1">Configure guardians to secure your identity passport against lost keys.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={clsx('px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
              activeTab === 'CONFIG' ? 'bg-blue-600 text-white' : 'bg-zinc-150 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800')}
          >
            Configure Guardians
          </button>
          <button
            onClick={() => setActiveTab('CONSOLE')}
            className={clsx('px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
              activeTab === 'CONSOLE' ? 'bg-blue-600 text-white' : 'bg-zinc-150 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800')}
          >
            Social Recovery Console
          </button>
        </div>

        {activeTab === 'CONFIG' && (
          <div className="space-y-6">
            <GlassCard className="p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-blue-600" /> Trust Network Setup
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Register exactly **3 trusted friends** or backup wallet addresses. If you ever lose access to your primary wallet, 2 of these 3 guardians can authorize a migration.
              </p>

              <div className="flex gap-2">
                <NeonInput value={newGuardian} onChange={e => setNewGuardian(e.target.value)} placeholder="Guardian wallet address (0x...)" className="flex-1" />
                <button
                  onClick={addGuardianLocal}
                  className="px-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider"
                >
                  Add Draft
                </button>
              </div>

              <div className="space-y-2">
                {guardians.map((g, i) => (
                  <div key={g} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-850">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-500">
                        {i + 1}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-350">{g}</span>
                    </div>
                    <button onClick={() => removeGuardianLocal(g)} className="text-red-500 hover:text-red-650">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <KeyRound size={16} className="text-indigo-650" /> Set Recovery Passphrase
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Input a secure mnemonic phrase or word. This acts as a secondary knowledge factor verification that must match when starting the console.
              </p>
              <NeonInput
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="Enter secure backup word/phrase..."
              />
              <button
                onClick={handleRegisterSetup}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-[10px] font-bold text-white rounded-lg uppercase tracking-wider"
              >
                Register Recovery System
              </button>
            </GlassCard>
          </div>
        )}

        {activeTab === 'CONSOLE' && (
          <div className="space-y-6">
            {!session ? (
              <GlassCard className="p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Shield size={16} className="text-indigo-600" /> Start Recovery Session
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Lost key recovery mode. Enter the target Meta Go DID you want to recover, your new wallet address, and the safe passphrase.
                </p>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono text-zinc-450 uppercase">Original DID to Recover</span>
                    <NeonInput value={recoveryDid} onChange={e => setRecoveryDid(e.target.value)} placeholder="did:metago:..." />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono text-zinc-450 uppercase">New Wallet Address (To Migrate to)</span>
                    <NeonInput value={targetWallet} onChange={e => setTargetWallet(e.target.value)} placeholder="0x..." />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-mono text-zinc-450 uppercase">Recovery Passphrase</span>
                    <NeonInput type="password" value={enteredPassphrase} onChange={e => setEnteredPassphrase(e.target.value)} placeholder="Enter backup passphrase..." />
                  </div>
                  <button
                    onClick={handleInitiateRecovery}
                    disabled={isInitiating}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-[10px] font-bold text-white rounded-lg uppercase tracking-wider disabled:opacity-50"
                  >
                    {isInitiating ? 'Verifying...' : 'Initiate Social Recovery'}
                  </button>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                    <Shield size={16} className="animate-pulse" /> Active Recovery Console
                  </h2>
                  <button onClick={fetchSessionStatus} className="text-zinc-500 hover:text-zinc-700">
                    <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850 text-[9px] font-mono space-y-1 text-zinc-400">
                  <p>DID: <span className="text-blue-500">{session.did}</span></p>
                  <p>MIGRATING TO: <span className="text-indigo-400">{session.newAddress}</span></p>
                  <p>STATUS: <strong className="text-amber-500">{session.status.toUpperCase()}</strong></p>
                </div>

                {/* Guardian Approval Status Map */}
                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-zinc-450 uppercase">Consensus Status (2/3 approvals required)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {session.guardians.map((g: string, idx: number) => {
                      const approved = session.approvals.includes(g.toLowerCase());
                      return (
                        <div key={g} className={clsx('p-3 rounded-xl border text-center font-mono space-y-1.5 transition-all',
                          approved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-950 border-zinc-850 text-zinc-500')}>
                          <p className="text-[10px] font-bold">Guardian {idx + 1}</p>
                          <p className="text-[7px] truncate">{g}</p>
                          <p className="text-[8px] font-bold">{approved ? '✓ APPROVED' : '● PENDING'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Copy and Share link */}
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-850 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[8px] font-mono text-zinc-550 uppercase">Share Link with Guardians</p>
                    <p className="text-[9px] font-mono text-blue-500 truncate max-w-[200px]">
                      {window.location.origin}/recovery/approve?sessionId={session.sessionId}
                    </p>
                  </div>
                  <button
                    onClick={copyApprovalLink}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-[8px] uppercase tracking-wider font-bold"
                  >
                    {copiedLink ? 'Copied' : <Clipboard size={10} />}
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSession(null)}
                    className="flex-1 py-1.5 border border-zinc-200 dark:border-zinc-850 hover:border-red-500 hover:text-red-500 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all"
                  >
                    Cancel Session
                  </button>
                  <button
                    onClick={handleMigrate}
                    disabled={session.approvals.length < 2}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider disabled:opacity-50 transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/10"
                  >
                    <CheckCircle2 size={12} /> Execute Migration
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
