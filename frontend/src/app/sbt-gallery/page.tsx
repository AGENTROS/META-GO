'use client';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Shield, Award, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

const DOMAIN_COLORS: Record<string, string> = {
  GAMING: 'from-purple-500 to-violet-500',
  ENTERPRISE: 'from-blue-500 to-indigo-500',
  EDUCATION: 'from-emerald-500 to-teal-500',
  COMMERCE: 'from-amber-500 to-orange-500',
};

export default function SBTGallery() {
  const { soulboundTokens } = useIdentityStore();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Soulbound Tokens</span>
        </div>
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Soulbound <span className="gradient-text">Credentials</span></h1>
          <p className="text-sm text-zinc-450 mt-1">Non-transferable ERC-721 tokens that prove your verified status.</p>
        </div>

        {soulboundTokens.length === 0 ? (
          <div className="p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-450">
            No Soulbound Tokens yet. Forge your identity to receive your Genesis Citizen SBT.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {soulboundTokens.map(t => (
              <GlassCard key={t.id} className="overflow-hidden">
                <div className={clsx('h-32 bg-gradient-to-br relative', DOMAIN_COLORS[t.domain])}>
                  <div className="absolute inset-0 grid-pattern opacity-30" />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-white font-bold">{t.domain}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <Shield size={20} className="text-white" />
                    <Award size={18} className="text-white/80" />
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold truncate">{t.name}</h3>
                    <span className="text-[9px] font-mono uppercase font-bold text-emerald-500">{t.status}</span>
                  </div>
                  <p className="text-[10px] text-zinc-450">issued by {t.issuer}</p>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">{t.description}</p>
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-450 truncate">{t.txHash.slice(0, 14)}...</span>
                    <a href="#" data-testid={`view-tx-${t.id}`} className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                      View <ExternalLink size={9} />
                    </a>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
