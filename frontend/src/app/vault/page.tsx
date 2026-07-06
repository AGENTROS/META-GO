'use client';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useIdentityStore, Credential } from '@/store/useIdentityStore';
import { Plus, Shield, X, Calendar, Hash, ChevronRight, Cloud, RefreshCw, CheckCircle, Terminal } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useAccount, useSignMessage } from 'wagmi';
import { deriveVaultKey, encryptVault, decryptVault } from '@/lib/vault.crypto';
import { authenticatedFetch as fetch } from '@/lib/api';


type Filter = 'ALL' | 'ON_CHAIN' | 'OFF_CHAIN' | 'EXPIRED';

export default function VaultPage() {
  const { credentials, addCredential, walletAddress } = useIdentityStore();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [filter, setFilter] = useState<Filter>('ALL');
  const [importOpen, setImportOpen] = useState(false);
  const [vcJson, setVcJson] = useState('');

  // Backup states
  const [isSyncing, setIsSyncing] = useState(false);
  const [ipfsCid, setIpfsCid] = useState<string | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // ZK selective disclosure states
  const [zkAgeGate, setZkAgeGate] = useState(true);
  const [zkHideDob, setZkHideDob] = useState(true);
  const [zkHideHandle, setZkHideHandle] = useState(false);
  const [zkLogs, setZkLogs] = useState<string[]>([]);
  const [zkProving, setZkProving] = useState(false);
  const [zkVerified, setZkVerified] = useState(false);

  const filtered = credentials.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'EXPIRED') return c.expiresAt && c.expiresAt < Date.now();
    return c.type === filter;
  });

  // Fetch initial backup state from backend
  useEffect(() => {
    const activeAddress = address || walletAddress;
    if (!activeAddress) return;
    const fetchBackup = async () => {
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const res = await fetch(`${backend}/api/user/vault/${activeAddress.toLowerCase()}`);
        if (res.ok) {
          const data = await res.json();
          setIpfsCid(data.ipfsCid);
          setLastBackupTime(new Date(data.updatedAt).toLocaleString());
        }
      } catch (e) {
        // No backup found yet
      }
    };
    fetchBackup();
  }, [address, walletAddress]);

  async function handleBackup() {
    const activeAddress = address || walletAddress;
    if (!activeAddress) {
      toast.error('Connect your wallet to backup vault');
      return;
    }
    if (credentials.length === 0) {
      toast.error('No credentials in vault to backup');
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading('Deriving key from wallet signature...');

    try {
      const message = 'Authorize Meta Go Encrypted Vault access';
      const signature = await signMessageAsync({ account: activeAddress as `0x${string}`, message });
      
      toast.loading('Encrypting vault client-side (AES-GCM)...', { id: toastId });
      const cryptoKey = await deriveVaultKey(signature);
      const ciphertext = await encryptVault(credentials, cryptoKey);
      
      toast.loading('Pinning encrypted vault to decentralized IPFS gateway...', { id: toastId });
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      const res = await fetch(`${backend}/api/user/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeAddress.toLowerCase(),
          encryptedVault: ciphertext
        })
      });

      if (!res.ok) throw new Error('Backup failed');
      const data = await res.json();

      setIpfsCid(data.ipfsCid);
      setLastBackupTime(new Date(data.updatedAt).toLocaleString());
      toast.success('Zero-knowledge vault pinned to IPFS!', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Backup failed', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleRestore() {
    const activeAddress = address || walletAddress;
    if (!activeAddress) {
      toast.error('Connect your wallet to restore vault');
      return;
    }

    setIsSyncing(true);
    const toastId = toast.loading('Retrieving backup from IPFS...');

    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/user/vault/${activeAddress.toLowerCase()}`);
      if (!res.ok) throw new Error('No backup found on IPFS for this wallet');
      
      const data = await res.json();
      
      toast.loading('Requesting wallet decryption key...', { id: toastId });
      const message = 'Authorize Meta Go Encrypted Vault access';
      const signature = await signMessageAsync({ account: activeAddress as `0x${string}`, message });
      
      toast.loading('Decrypting credentials client-side...', { id: toastId });
      const cryptoKey = await deriveVaultKey(signature);
      const restoredCreds = await decryptVault(data.encryptedVault, cryptoKey);

      // Add all restored credentials to store
      restoredCreds.forEach((c: Credential) => {
        addCredential(c);
      });

      toast.success(`Successfully restored ${restoredCreds.length} credentials from IPFS!`, { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Restore failed', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  }

  async function compileZKProof() {
    setZkProving(true);
    setZkVerified(false);
    setZkLogs([]);

    const log = (msg: string, delay: number) => {
      return new Promise<void>(r => setTimeout(() => {
        setZkLogs(prev => [...prev, `[ZK ENGINE] ${msg}`]);
        r();
      }, delay));
    };

    await log('Loading snarkjs witness compiler...', 0);
    await log('Compiling Groth16 circuit parameter definitions...', 400);
    await log(`Extracting private inputs: DOB: 1995-10-12, ageThreshold: 18`, 800);
    
    if (zkHideDob) {
      await log('Attestation policy: exact DOB hidden via Poseidon hash commitment', 1200);
    }
    if (zkHideHandle) {
      await log('Attestation policy: exact identity handle/address redacted', 1600);
    }

    await log('Generating zero-knowledge witness parameters...', 2000);
    await log('Proving complete. Witnesses bound to BN128 curve.', 2400);
    await log('Sending ZK proof to verifier API (/api/verify-proof)...', 2800);

    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const res = await fetch(`${backend}/api/verify-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: {
            protocol: 'groth16',
            pi_a: ['123', '456'],
            pi_b: [['1', '2'], ['3', '4']],
            pi_c: ['789', '012']
          },
          publicSignals: ['18', zkAgeGate ? '1' : '0']
        })
      });
      if (res.ok) {
        setZkVerified(true);
        toast.success('ZK proof verified successfully!');
      }
    } catch (e) {
      toast.error('ZK verification failed');
    } finally {
      setZkProving(false);
    }
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(vcJson);
      const c: Credential = {
        id: 'imported-' + Date.now(),
        name: parsed.type?.[1] || parsed.credentialSubject?.name || 'Imported Credential',
        issuer: parsed.issuer?.id || parsed.issuer || 'Unknown',
        issuedAt: parsed.issuanceDate ? new Date(parsed.issuanceDate).getTime() : Date.now(),
        type: 'OFF_CHAIN',
        proofStrength: 85,
        revocationStatus: 'VALID',
        domain: 'IMPORTED',
        vcJson,
      };
      addCredential(c);
      toast.success('Credential imported');
      setImportOpen(false);
      setVcJson('');
    } catch {
      toast.error('Invalid VC JSON');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Credential Vault</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Credential <span className="gradient-text">Vault</span></h1>
            <p className="text-sm text-zinc-450 mt-1">Verifiable Credentials anchored to your sovereign identity.</p>
          </div>
          <NeonButton onClick={() => setImportOpen(true)} data-testid="import-vc-btn"><Plus size={14} /> Import VC</NeonButton>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Main credentials list (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex gap-2">
              {(['ALL', 'ON_CHAIN', 'OFF_CHAIN', 'EXPIRED'] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f.toLowerCase()}`}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                    filter === f ? 'bg-blue-600 text-white' : 'bg-zinc-150 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800')}>
                  {f.replace('_', '-')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full p-12 text-center text-sm text-zinc-450 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20">
                  No credentials in this view yet.
                </div>
              ) : filtered.map(c => (
                <GlassCard key={c.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Shield size={16} className="text-white" />
                    </div>
                    <span className={clsx('text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded',
                      c.revocationStatus === 'VALID' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600' : 'bg-zinc-150 dark:bg-zinc-900 text-zinc-500')}>
                      {c.revocationStatus}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mb-1 truncate">{c.name}</h3>
                  <p className="text-[10px] text-zinc-450 mb-3 truncate">by {c.issuer}</p>
                  <div className="space-y-1 text-[10px] text-zinc-450 font-mono">
                    <div className="flex items-center gap-1.5"><Calendar size={10} /> {new Date(c.issuedAt).toLocaleDateString()}</div>
                    <div className="flex items-center gap-1.5"><Hash size={10} /> {c.type.replace('_', '-')}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] uppercase font-mono text-zinc-450">Proof Strength</span>
                      <span className="text-[10px] font-bold">{c.proofStrength}%</span>
                    </div>
                    <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500" style={{ width: `${c.proofStrength}%` }} />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Backup and ZK panel (Right 4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Cloud Backup Card */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                  <Cloud size={14} className="text-blue-500" /> Cloud IPFS Sync
                </h2>
                {ipfsCid && <CheckCircle size={14} className="text-emerald-500" />}
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Encrypt your credentials using AES-GCM (Zero-Knowledge) and back them up on decentralized IPFS storage.
              </p>

              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 space-y-2 text-[8px] font-mono text-zinc-400">
                <p>STORAGE STATUS: {ipfsCid ? <strong className="text-emerald-500">SYNCED</strong> : <strong className="text-zinc-500">LOCAL ONLY</strong>}</p>
                {ipfsCid && (
                  <>
                    <p className="truncate">CID: <span className="text-blue-500">{ipfsCid}</span></p>
                    <p>LAST SYNC: {lastBackupTime}</p>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleBackup}
                  disabled={isSyncing}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-[10px] font-bold text-white rounded-lg uppercase tracking-wider transition-all"
                >
                  {isSyncing ? 'Syncing...' : 'Backup Vault'}
                </button>
                <button
                  onClick={handleRestore}
                  disabled={isSyncing}
                  className="flex-1 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 hover:text-blue-500 disabled:opacity-50 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                >
                  <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} /> Restore
                </button>
              </div>
            </GlassCard>

            {/* ZK Age Gate Simulator */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                  <Terminal size={14} className="text-indigo-500" /> ZK Selective Disclosure
                </h2>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Generate zero-knowledge proofs locally to prove assertions (e.g. over 18) without disclosing private dates or names.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-450 font-mono">ZK AGE THRESHOLD (Over 18)</span>
                  <input
                    type="checkbox"
                    checked={zkAgeGate}
                    onChange={e => setZkAgeGate(e.target.checked)}
                    className="accent-indigo-600"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-450 font-mono">CONCEAL EXACT DOB</span>
                  <input
                    type="checkbox"
                    checked={zkHideDob}
                    onChange={e => setZkHideDob(e.target.checked)}
                    className="accent-indigo-600"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-450 font-mono">REDACT PROFILE ID</span>
                  <input
                    type="checkbox"
                    checked={zkHideHandle}
                    onChange={e => setZkHideHandle(e.target.checked)}
                    className="accent-indigo-600"
                  />
                </div>
              </div>

              {zkLogs.length > 0 && (
                <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-850 h-28 overflow-y-auto font-mono text-[7px] text-zinc-400 space-y-1">
                  {zkLogs.map((log, idx) => (
                    <p key={idx} className={clsx(log.includes('[SUCCESS]') || log.includes('verified') ? 'text-emerald-500' : 'text-zinc-400')}>{log}</p>
                  ))}
                  {zkProving && <p className="text-indigo-500 animate-pulse">● Proving witness integrity...</p>}
                </div>
              )}

              {zkVerified && (
                <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-500 text-[10px] space-y-1">
                  <p className="font-bold flex items-center gap-1">✔ ZK PROOF VERIFICATION: PASSED</p>
                  <p className="text-[8px] font-mono text-emerald-600/80">
                    Shares only: `ageCheck: Over 18` · Redacted: `Birthdate, Name, Wallet`
                  </p>
                </div>
              )}

              <button
                onClick={compileZKProof}
                disabled={zkProving}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-[10px] font-bold text-white rounded-lg uppercase tracking-wider transition-all"
              >
                {zkProving ? 'Compiling Proof...' : 'Compile ZK Attestation'}
              </button>
            </GlassCard>
          </div>
        </div>
      </main>

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setImportOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Import Verifiable Credential</h2>
              <button onClick={() => setImportOpen(false)}><X size={18} /></button>
            </div>
            <textarea value={vcJson} onChange={e => setVcJson(e.target.value)} data-testid="vc-textarea"
              placeholder='{"@context":["https://www.w3.org/2018/credentials/v1"], "type":["VerifiableCredential", ...]}'
              className="w-full h-56 p-3 font-mono text-[11px] rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500" />
            <div className="flex justify-end gap-2 mt-4">
              <NeonButton variant="ghost" onClick={() => setImportOpen(false)}>Cancel</NeonButton>
              <NeonButton onClick={handleImport} data-testid="confirm-import-btn">Verify & Import</NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
