'use client';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Code2, Copy, Check, Activity, Users, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    MetaGo?: any;
    metagoOnSuccess?: (d: any) => void;
  }
}

export default function TryPage() {
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [lastForge, setLastForge] = useState<any>(null);
  const [origin, setOrigin] = useState('https://soulbound-identity.preview.emergentagent.com');

  useEffect(() => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    fetch(`${backend}/api/demo/stats`).then(r => r.json()).then(setStats).catch(() => {});
    
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    // load the embed script for live demo
    if (!document.getElementById('metago-embed-script')) {
      const s = document.createElement('script');
      s.id = 'metago-embed-script';
      s.src = '/metago-embed.js';
      s.defer = true;
      document.body.appendChild(s);
    }
    window.metagoOnSuccess = (d: any) => {
      setLastForge(d);
      toast.success(`Identity forged for @${d.handle}`);
      fetch(`${backend}/api/demo/stats`).then(r => r.json()).then(setStats).catch(() => {});
    };
  }, []);

  const snippet = `<script src="${origin}/metago-embed.js" defer></script>
<div data-metago-embed="signin"></div>`;

  function copy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success('Snippet copied');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Try-Me Embed</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Drop-in <span className="gradient-text">Sign-In</span> for any site
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10">
          Two lines of HTML. Sixty seconds for your visitors. Zero passwords.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Total attempts', value: stats?.totalAttempts ?? 0, icon: Users },
            { label: 'Completed', value: stats?.completedAttempts ?? 0, icon: Check },
            { label: 'Conversion rate', value: `${stats?.conversionRate ?? 0}%`, icon: Zap },
            { label: 'Today', value: stats?.last24h ?? 0, icon: Activity },
          ].map(s => (
            <GlassCard key={s.label} className="p-4">
              <s.icon size={14} className="text-blue-600 mb-2" />
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-[10px] uppercase font-mono text-zinc-500 mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"><Code2 size={16} className="text-indigo-500" /> Integration Snippet</h2>
            <NeonButton size="sm" onClick={copy} data-testid="copy-snippet-btn">
              {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
            </NeonButton>
          </div>
          <pre className="bg-zinc-950 text-emerald-400 p-4 rounded-xl overflow-x-auto text-xs font-mono">
{snippet}
          </pre>
        </GlassCard>

        <GlassCard className="p-8 mb-6 text-center">
          <h2 className="text-lg font-bold mb-2">Live demo button</h2>
          <p className="text-xs text-zinc-500 mb-6">Click below — it&apos;s the same button your visitors will see.</p>
          <div data-metago-embed="signin" data-testid="live-demo-embed" />
          {lastForge && (
            <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-left">
              <p className="text-xs font-bold text-emerald-600">✓ Last forge</p>
              <p className="text-[10px] font-mono break-all text-zinc-600 dark:text-zinc-400 mt-1">@{lastForge.handle} → {lastForge.did}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Completed in {(lastForge.durationMs/1000).toFixed(1)}s</p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Programmatic API</h2>
          <pre className="bg-zinc-950 text-blue-300 p-4 rounded-xl overflow-x-auto text-xs font-mono">{`// React / vanilla JS
window.MetaGo.open();
window.metagoOnSuccess = function (d) {
  console.log('DID:', d.did);
  console.log('Handle:', d.handle);
  console.log('Proof hash:', d.proofHash);
};

// Custom mount
window.MetaGo.mount('#my-button-host');`}</pre>
        </GlassCard>
      </main>
    </div>
  );
}
