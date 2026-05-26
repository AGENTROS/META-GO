'use client';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Calendar } from 'lucide-react';

export function QuantumTimeline() {
  const { soulboundTokens, credentials } = useIdentityStore();
  const events = [
    ...soulboundTokens.map(s => ({ id: s.id, label: s.name, ts: s.issuedAt, type: 'SBT', color: 'bg-blue-500' })),
    ...credentials.map(c => ({ id: c.id, label: c.name, ts: c.issuedAt, type: 'CRED', color: 'bg-emerald-500' })),
    { id: 'genesis', label: 'Identity Forged', ts: Date.now() - 86400000 * 14, type: 'EVENT', color: 'bg-indigo-500' },
  ].sort((a, b) => a.ts - b.ts);

  if (events.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center text-xs text-zinc-450">
        <Calendar size={14} className="mr-2" /> No timeline events yet
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-widest">Identity Timeline</p>
        <span className="text-[10px] font-mono text-zinc-450">{events.length} events</span>
      </div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-700 to-transparent" />
        <div className="relative flex justify-between items-center">
          {events.slice(0, 8).map(e => (
            <div key={e.id} className="flex flex-col items-center gap-2 group">
              <span className="text-[8px] font-mono text-zinc-450 whitespace-nowrap">{new Date(e.ts).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${e.color} shadow ring-2 ring-white dark:ring-zinc-900 group-hover:scale-125 transition-transform`} />
              <span className="text-[9px] font-semibold text-zinc-700 dark:text-zinc-300 max-w-[80px] text-center truncate">{e.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
