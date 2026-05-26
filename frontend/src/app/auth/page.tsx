'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Fingerprint, ArrowRight, LogIn } from 'lucide-react';

export default function AuthGate() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      // Already connected, send to dashboard or signup as relevant
      const cookie = typeof document !== 'undefined' && document.cookie.includes('celestial_auth=1');
      if (cookie) router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-28 pb-20 px-4 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-600/30 items-center justify-center mb-5">
            <Fingerprint size={28} className="text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-3">
            Welcome to <span className="gradient-text">Meta Go</span>
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Forge a new sovereign identity or sign back into your existing one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/auth/signup" data-testid="signup-card-cta"
            className="group p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500/40 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Fingerprint size={18} className="text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Forge New Identity</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">5-step wizard: handle → wallet → biometric → voice → ZK proof → SBT mint.</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">Start Forge <ArrowRight size={12} /></span>
          </Link>

          <Link href="/auth/signin" data-testid="signin-card-cta"
            className="group p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500/40 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <LogIn size={18} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Restore Identity</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">Reconnect your wallet and verify liveness to restore your sovereign identity.</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">Sign back in <ArrowRight size={12} /></span>
          </Link>
        </div>

        <div className="mt-12 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 text-center">
          <p className="text-xs text-zinc-500">
            Lost wallet? <Link href="/recovery" className="text-blue-600 font-bold hover:underline">Initiate social recovery →</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
