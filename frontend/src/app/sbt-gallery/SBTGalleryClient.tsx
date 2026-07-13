'use client';
import { useEffect, useState } from 'react';
import { useIdentityStore } from '@/store/useIdentityStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, Award, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useShallow } from 'zustand/shallow';

const DOMAIN_COLORS: Record<string, string> = {
  GAMING: 'from-purple-500 to-violet-500',
  ENTERPRISE: 'from-blue-500 to-indigo-500',
  EDUCATION: 'from-emerald-500 to-teal-500',
  COMMERCE: 'from-amber-500 to-orange-500',
};

export default function SBTGalleryClient() {
  // Selector-based Zustand hooks with shallow comparison
  const soulboundTokens = useIdentityStore(useShallow(s => s.soulboundTokens));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-pulse shimmer" />
        ))}
      </div>
    );
  }

  if (soulboundTokens.length === 0) {
    return (
      <div className="p-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm text-zinc-450">
        No Soulbound Tokens yet. Forge your identity to receive your Genesis Citizen SBT.
      </div>
    );
  }

  return (
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
              <a 
                href={t.txHash.startsWith('0x') ? `https://amoy.polygonscan.com/tx/${t.txHash}` : '#'} 
                target="_blank" 
                rel="noopener noreferrer" 
                data-testid={`view-tx-${t.id}`} 
                className="text-[10px] text-blue-600 font-bold flex items-center gap-1"
              >
                View <ExternalLink size={9} />
              </a>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
