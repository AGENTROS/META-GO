'use client';
import { useEffect } from 'react';
import { AlertCircle, RotateCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Route Error Captured:', error);
  }, [error]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl space-y-6">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
          <AlertCircle size={22} />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Protocol Exception
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            An unexpected error occurred during execution. This session's state remains isolated.
          </p>
          <p className="text-[10px] font-mono text-zinc-400 bg-zinc-50 dark:bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-150 dark:border-zinc-850 truncate max-w-full">
            {error.message || 'Unknown Exception'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <RotateCw size={12} /> Retry Pipeline
          </button>
          <Link
            href="/"
            className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <Home size={12} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
