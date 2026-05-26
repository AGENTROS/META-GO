'use client';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useIdentityStore, Credential } from '@/store/useIdentityStore';
import { Plus, Shield, X, Calendar, Hash, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

type Filter = 'ALL' | 'ON_CHAIN' | 'OFF_CHAIN' | 'EXPIRED';

export default function VaultPage() {
  const { credentials, addCredential } = useIdentityStore();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [importOpen, setImportOpen] = useState(false);
  const [vcJson, setVcJson] = useState('');

  const filtered = credentials.filter(c => {
    if (filter === 'ALL') return true;
    if (filter === 'EXPIRED') return c.expiresAt && c.expiresAt < Date.now();
    return c.type === filter;
  });

  function handleImport() {
    try {
      const parsed = JSON.parse(vcJson);
      const c: Credential = {
        id: 'imported-' + Date.now(),
        name: parsed.type?.[1] || parsed.credentialSubject?.name || 'Imported Credential',
        issuer: parsed.issuer?.id || parsed.issuer || 'Unknown',
        issuedAt: parsed.issuanceDate ? new Date(parsed.issuanceDate).getTime() : Date.now(),
        type: 'OFF_CHAIN',
        proofStrength: 78,
        revocationStatus: 'UNVERIFIED',
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Credential Vault</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Credential <span className="gradient-text">Vault</span></h1>
            <p className="text-sm text-zinc-450 mt-1">Verifiable Credentials anchored to your sovereign identity.</p>
          </div>
          <NeonButton onClick={() => setImportOpen(true)} data-testid="import-vc-btn"><Plus size={14} /> Import VC</NeonButton>
        </div>

        <div className="flex gap-2 mb-6">
          {(['ALL', 'ON_CHAIN', 'OFF_CHAIN', 'EXPIRED'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} data-testid={`filter-${f.toLowerCase()}`}
              className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all',
                filter === f ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800')}>
              {f.replace('_', '-')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full p-12 text-center text-sm text-zinc-450 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              No credentials in this view yet.
            </div>
          ) : filtered.map(c => (
            <GlassCard key={c.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Shield size={16} className="text-white" />
                </div>
                <span className={clsx('text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded',
                  c.revocationStatus === 'VALID' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500')}>
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
