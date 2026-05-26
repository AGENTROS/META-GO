'use client';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, AlertTriangle, CheckCircle2, MapPin, Monitor, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface LoginEvent {
  id: string;
  ts: number;
  ip: string;
  city: string;
  country: string;
  browser: string;
  os: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  reason?: string;
}

const SAMPLE_LOGINS: LoginEvent[] = [
  { id: '1', ts: Date.now() - 3600000, ip: '192.168.1.10', city: 'Pune', country: 'IN', browser: 'Chrome 130', os: 'macOS', risk: 'LOW' },
  { id: '2', ts: Date.now() - 86400000, ip: '192.168.1.10', city: 'Pune', country: 'IN', browser: 'Chrome 130', os: 'macOS', risk: 'LOW' },
  { id: '3', ts: Date.now() - 172800000, ip: '45.12.88.103', city: 'Tokyo', country: 'JP', browser: 'Safari 17', os: 'iOS', risk: 'HIGH', reason: 'Unusual geo location' },
  { id: '4', ts: Date.now() - 259200000, ip: '203.0.113.45', city: 'Berlin', country: 'DE', browser: 'Firefox 122', os: 'Linux', risk: 'MEDIUM', reason: 'New browser fingerprint' },
];

export default function SecurityPage() {
  const [events, setEvents] = useState<LoginEvent[]>([]);

  useEffect(() => {
    setEvents(SAMPLE_LOGINS);
  }, []);

  const highRiskCount = events.filter(e => e.risk === 'HIGH').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Security Center</span>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Security <span className="gradient-text">Center</span></h1>
          <p className="text-sm text-zinc-450 mt-1">Audit your login activity and review suspicious access patterns.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-1"><Shield size={14} className="text-emerald-500" /><span className="text-[10px] uppercase font-mono text-zinc-450">Status</span></div>
            <p className="text-xl font-bold text-emerald-500">PROTECTED</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle size={14} className="text-amber-500" /><span className="text-[10px] uppercase font-mono text-zinc-450">High-risk events</span></div>
            <p className="text-xl font-bold">{highRiskCount}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={14} className="text-blue-500" /><span className="text-[10px] uppercase font-mono text-zinc-450">Total logins</span></div>
            <p className="text-xl font-bold">{events.length}</p>
          </GlassCard>
        </div>

        <GlassCard className="overflow-hidden">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-bold uppercase tracking-wider">Login Activity</h2>
            <p className="text-[11px] text-zinc-450 mt-1">Recent authentication events with fraud risk scoring</p>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {events.map(e => (
              <div key={e.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className={clsx('w-2 h-2 rounded-full shrink-0',
                  e.risk === 'LOW' ? 'bg-emerald-500' : e.risk === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
                )} />
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-mono text-zinc-450">When</p>
                    <p className="text-xs font-semibold">{new Date(e.ts).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono text-zinc-450 flex items-center gap-1"><MapPin size={9} /> Location</p>
                    <p className="text-xs font-semibold">{e.city}, {e.country}</p>
                    <p className="text-[10px] font-mono text-zinc-450">{e.ip}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono text-zinc-450 flex items-center gap-1"><Monitor size={9} /> Device</p>
                    <p className="text-xs font-semibold">{e.browser}</p>
                    <p className="text-[10px] text-zinc-450">{e.os}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-mono text-zinc-450">Risk</p>
                    <span className={clsx('inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                      e.risk === 'LOW' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600' :
                      e.risk === 'MEDIUM' ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600' :
                      'bg-red-100 dark:bg-red-950/30 text-red-600'
                    )}>{e.risk}</span>
                    {e.reason && <p className="text-[10px] text-zinc-450 mt-1">{e.reason}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="mt-8 p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-1">Federated Identity & Cross-Platform Verification</p>
          <p className="text-[11px] text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Your Meta Go DID resolves on Polygon Amoy, Ethereum Mainnet, and Arbitrum. Proofs can be ported across EVM chains
            using the cross-chain DID resolver — verify your sovereign identity anywhere.
          </p>
        </div>
      </main>
    </div>
  );
}
