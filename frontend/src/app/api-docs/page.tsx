'use client';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Server, ChevronRight, Code2, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

const ENDPOINTS = [
  { m: 'GET', p: '/api/auth/nonce', d: 'Issues an EIP-4361 SIWE nonce for wallet sign-in.' },
  { m: 'POST', p: '/api/auth/verify', d: 'Verifies SIWE signature, establishes encrypted session cookie.' },
  { m: 'POST', p: '/api/user/sync', d: 'Persists forged identity (DID, ZK proof, voice hash) to backend.' },
  { m: 'GET', p: '/api/user/me', d: 'Returns the current authenticated user profile.' },
  { m: 'POST', p: '/api/verify-proof', d: 'Server-side Groth16 zk-SNARK structural verification.' },
  { m: 'POST', p: '/api/relay', d: 'EIP-712 gasless relay with nullifier replay protection (5/min).' },
  { m: 'POST', p: '/api/credentials/verify', d: 'Validates an imported Verifiable Credential JSON.' },
  { m: 'GET', p: '/api/sbts/{address}', d: 'Returns Soulbound Tokens owned by a wallet.' },
  { m: 'GET', p: '/api/did/resolve/{did}', d: 'W3C-compliant DID document resolver (federated).' },
  { m: 'GET', p: '/api/did/cross-chain/{address}', d: 'Cross-EVM identity attestation status.' },
  { m: 'POST', p: '/api/billing/checkout', d: 'Creates a subscription checkout session.' },
  { m: 'GET', p: '/api/billing/plans', d: 'Lists IDaaS subscription tiers.' },
];

const M_COLOR: Record<string, string> = {
  GET: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  POST: 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
};

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" data-testid="api-docs-root">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 dark:text-zinc-500 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">API Reference</span>
        </div>
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            API <span className="gradient-text">Reference</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">Protocol-grade REST endpoints powering the Meta Go IDaaS layer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <GlassCard className="p-4">
            <Server size={16} className="text-blue-600 mb-2" />
            <p className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400">Architecture</p>
            <p className="text-sm font-bold mt-1">REST + JSON</p>
          </GlassCard>
          <GlassCard className="p-4">
            <Lock size={16} className="text-emerald-500 mb-2" />
            <p className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400">Auth</p>
            <p className="text-sm font-bold mt-1">SIWE + Session Cookie</p>
          </GlassCard>
          <GlassCard className="p-4">
            <Zap size={16} className="text-indigo-500 mb-2" />
            <p className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400">Rate Limit</p>
            <p className="text-sm font-bold mt-1">5 req/min · relay</p>
          </GlassCard>
        </div>

        <GlassCard className="p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Server size={16} className="text-blue-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Base URL</h2>
          </div>
          <code className="block p-3 rounded-lg bg-zinc-900 dark:bg-black text-emerald-400 font-mono text-xs break-all">
            {process.env.NEXT_PUBLIC_BACKEND_URL || 'https://your-host'}/api
          </code>
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Code2 size={16} className="text-indigo-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Endpoints</h2>
              <span className="ml-auto text-[10px] font-mono text-zinc-500">{ENDPOINTS.length} routes</span>
            </div>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {ENDPOINTS.map(e => (
              <div key={e.p} className="p-5 flex items-start gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${M_COLOR[e.m]} shrink-0`}>{e.m}</span>
                <div className="min-w-0 flex-1">
                  <code className="text-sm font-mono text-zinc-900 dark:text-zinc-200 block break-all">{e.p}</code>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{e.d}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
