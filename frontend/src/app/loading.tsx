'use client';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="relative flex flex-col items-center gap-4">
        {/* Glowing Ambient Sphere */}
        <div className="absolute w-24 h-24 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-xl animate-pulse pointer-events-none" />
        
        {/* Rotating Circular Indicator */}
        <div className="relative w-12 h-12 rounded-full border-2 border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        
        <div className="text-center space-y-1 z-10">
          <p className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-850 dark:text-zinc-200">
            META<span className="text-blue-600">GO</span>
          </p>
          <p className="text-[10px] font-mono text-zinc-450 uppercase tracking-[0.15em] animate-pulse">
            Syncing Credentials...
          </p>
        </div>
      </div>
    </div>
  );
}
