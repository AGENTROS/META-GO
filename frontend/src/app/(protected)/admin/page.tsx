'use client';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart3, Users, Shield, Activity, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface AdminMetrics {
  totalUsers: number;
  totalSbts: number;
  totalProofs: number;
  recentEvents: Array<{ ts: string; e: string; a: string }>;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    totalSbts: 0,
    totalProofs: 0,
    recentEvents: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
    fetch(`${backend}/api/admin/metrics`)
      .then(res => res.json())
      .then(data => {
        setMetrics({
          totalUsers: data.totalUsers || 0,
          totalSbts: data.totalSbts || 0,
          totalProofs: data.totalProofs || 0,
          recentEvents: data.recentEvents || [],
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch admin metrics', err);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: 'Total Identities', value: metrics.totalUsers, icon: Users, color: 'text-blue-600' },
    { label: 'SBTs Minted', value: metrics.totalSbts, icon: Shield, color: 'text-emerald-500' },
    { label: 'Proofs Verified', value: metrics.totalProofs, icon: Activity, color: 'text-indigo-600' },
    { label: 'Network Health', value: '99.99%', icon: BarChart3, color: 'text-amber-500' },
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
              <p className="text-2xl font-bold">{loading ? '...' : s.value}</p>
              <p className="text-[10px] uppercase font-mono text-zinc-450 mt-1">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4">Recent Network Events</h2>
          {loading ? (
            <p className="text-xs text-zinc-500 font-mono">Loading events...</p>
          ) : metrics.recentEvents.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono">No recent events recorded.</p>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {metrics.recentEvents.map((ev, i) => (
                <div key={i} className="flex items-center gap-4 p-2 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <span className="text-zinc-450">{ev.ts}</span>
                  <span className="flex-1 font-sans">{ev.e}</span>
                  <span className="text-blue-600">{ev.a.slice(0, 6)}...{ev.a.slice(-4)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
}
