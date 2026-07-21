'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import dynamic from 'next/dynamic';

const BiometricVerificationPipeline = dynamic(
  () => import('@/components/auth/BiometricVerificationPipeline').then(mod => mod.BiometricVerificationPipeline),
  { ssr: false }
);

import { Shield, CheckCircle2 } from 'lucide-react';
import { useIdentityStore } from '@/store/useIdentityStore';
import { m, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SignInPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { hydrateMockData, setDID, addNotification } = useIdentityStore();
  const [step, setStep] = useState<'pipeline' | 'done'>('pipeline');

  function complete() {
    if (address) {
      setDID(`did:metago:${address.toLowerCase()}`, `did:metago:polygon:${address.toLowerCase()}`);
      if (process.env.NEXT_PUBLIC_TEST_MODE === '1') {
        hydrateMockData();
      }
    }
    addNotification({ type: 'SYSTEM', message: 'Identity restored via multi-modal biometric verification pipeline' });
    document.cookie = 'celestial_auth=1; path=/; max-age=86400';
    toast.success('Welcome back to Meta Go');
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden font-sans">
      <div className="absolute inset-0 grid-pattern opacity-[0.25]" />
      
      {/* Glow overlays */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 space-y-8 flex flex-col items-center">
        
        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 items-center justify-center mb-3">
            <Shield size={22} className="text-blue-500" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Restore <span className="gradient-text font-bold">Sovereign Identity</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Multi-modal biometric risk engine check to establish passport session.</p>
        </div>

        {/* Central Restoration Container */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <m.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex justify-center w-full"
            >
              {step === 'pipeline' && (
                <BiometricVerificationPipeline
                  mode="verify"
                  onComplete={() => {
                    setStep('done');
                    setTimeout(complete, 1800);
                  }}
                />
              )}

              {step === 'done' && (
                <div className="w-full max-w-md bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl text-center py-12 space-y-4">
                  <CheckCircle2 size={44} className="text-emerald-500 mx-auto animate-bounce" />
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Session Restored Successfully</h2>
                    <p className="text-xs text-zinc-400 mt-1">Sovereign DID validated. Opening credentials dashboard...</p>
                  </div>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Navigation link */}
        {step === 'pipeline' && (
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20 text-center text-xs text-zinc-500 w-full max-w-md">
            New to Meta Go?{' '}
            <Link href="/auth/signup" className="text-blue-600 font-bold hover:underline">
              Forge a new profile passport →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

