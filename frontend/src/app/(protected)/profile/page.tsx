'use client';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { useIdentityStore } from '@/store/useIdentityStore';
import { useAccount } from 'wagmi';
import { User, Hash, Shield, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';

import { useShallow } from 'zustand/shallow';

export default function ProfilePage() {
  const { handle, did, soulboundTokens, credentials, identityMetrics } = useIdentityStore(useShallow(s => ({
    handle: s.handle,
    did: s.did,
    soulboundTokens: s.soulboundTokens,
    credentials: s.credentials,
    identityMetrics: s.identityMetrics
  })));
  const { address } = useAccount();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Profile</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-8">Sovereign <span className="gradient-text">Profile</span></h1>

        <GlassCard className="p-8 mb-6 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white">
            {handle?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold">{handle ? `@${handle}` : 'Anonymous'}</h2>
            {did && <p className="text-xs font-mono text-zinc-450 mt-1 break-all">{did}</p>}
            {address && <p className="text-[11px] font-mono text-zinc-450 mt-1">{address}</p>}
            <div className="flex gap-2 mt-4 justify-center md:justify-start">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 text-[10px] font-bold uppercase">Verified</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 text-[10px] font-bold uppercase">ZK-Proof</span>
              {(identityMetrics?.trustScore ?? 0) > 75 && <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 text-[10px] font-bold uppercase">High Trust</span>}
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'SBTs', value: soulboundTokens.length, icon: Shield },
            { label: 'Credentials', value: credentials.length, icon: Hash },
            { label: 'Trust Score', value: identityMetrics?.trustScore ?? 0, icon: User },
            { label: 'Days Active', value: 14, icon: Calendar },
          ].map(s => (
            <GlassCard key={s.label} className="p-4">
              <s.icon size={14} className="text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] uppercase font-mono text-zinc-450 mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {identityMetrics && (
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Identity Metrics</h3>
            <div className="space-y-3">
              {Object.entries(identityMetrics).map(([k, v]) => (
                <div key={k}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-xs font-bold text-blue-600">{v}/100</span>
                  </div>
                  <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
