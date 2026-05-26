'use client';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart3, Users, Shield, Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const stats = [
    { label: 'Total Identities', value: 1284, icon: Users, color: 'text-blue-600' },
    { label: 'SBTs Minted', value: 1547, icon: Shield, color: 'text-emerald-500' },
    { label: 'Proofs Verified', value: '23.4k', icon: Activity, color: 'text-indigo-600' },
    { label: 'Network Health', value: '99.97%', icon: BarChart3, color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Admin Panel</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-8">Protocol <span className="gradient-text">Admin</span></h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <GlassCard key={s.label} className="p-5">
              <s.icon size={16} className={`${s.color} mb-2`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] uppercase font-mono text-zinc-450 mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Recent Network Events</h2>
          <div className="space-y-3 font-mono text-xs">
            {[
              { ts: '14:32:19', e: 'Identity registered', a: '0x7a3b...c4f2' },
              { ts: '14:30:01', e: 'SBT minted - GAMING', a: '0x91d2...e7b8' },
              { ts: '14:28:44', e: 'Proof verified on-chain', a: '0xa5e1...f932' },
              { ts: '14:27:11', e: 'Guardian confirmation', a: '0xc3d8...a1b4' },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-4 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900">
                <span className="text-zinc-450">{ev.ts}</span>
                <span className="flex-1 font-sans">{ev.e}</span>
                <span className="text-blue-600">{ev.a}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
