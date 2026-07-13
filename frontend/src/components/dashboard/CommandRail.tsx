'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, Activity, Network, Server } from 'lucide-react';
import { clsx } from 'clsx';
import { TrustGraph } from './TrustGraph';

export default function CommandRail() {
  const [open, setOpen] = useState(false);
  const [blockHeight, setBlockHeight] = useState(48922020);
  const [gas, setGas] = useState(28);

  useEffect(() => {
    const i = setInterval(() => {
      setBlockHeight(b => b + Math.floor(Math.random() * 4) + 1);
      setGas(20 + Math.floor(Math.random() * 30));
    }, 12000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const congestion = gas < 25 ? { label: 'Low', color: 'text-emerald-500' } : gas < 40 ? { label: 'Moderate', color: 'text-amber-500' } : { label: 'High', color: 'text-red-500' };

  return (
    <>
      <button onClick={() => setOpen(o => !o)} data-testid="command-rail-toggle"
        aria-expanded={open}
        aria-label="Toggle network telemetry panel"
        className={clsx('fixed right-0 top-1/2 -translate-y-1/2 z-40 p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-l-lg transition-transform',
          open ? 'translate-x-[-320px]' : 'translate-x-0')}>
        <ChevronLeft size={16} className={open ? 'rotate-180' : ''} />
      </button>

      <aside aria-label="Network Telemetry Command Rail"
        className={clsx('fixed right-0 top-16 bottom-0 z-30 w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-5 overflow-y-auto transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full')}>
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 mb-5 flex items-center gap-2">
          <Server size={14} className="text-blue-600" /> Network Telemetry
        </h3>

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-1">
              <Activity size={11} className="text-blue-500" />
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-450">Block Height</p>
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-white font-mono">{blockHeight.toLocaleString()}</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-450">Network Congestion</p>
              <span className={`text-[10px] font-bold ${congestion.color}`}>{congestion.label}</span>
            </div>
            <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className={clsx('h-full transition-all', congestion.label === 'Low' ? 'bg-emerald-500' : congestion.label === 'Moderate' ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${gas}%` }} />
            </div>
            <p className="text-[10px] text-zinc-450 mt-1 font-mono">{gas} gwei</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Network size={11} className="text-indigo-500" />
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-450">Peer Trust Graph</p>
            </div>
            <TrustGraph />
          </div>
        </div>
      </aside>
    </>
  );
}
