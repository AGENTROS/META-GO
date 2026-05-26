'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Navbar } from '@/components/layout/Navbar';
import { WalletConnector } from '@/components/auth/WalletConnector';
import { BiometricScanner } from '@/components/auth/BiometricScanner';
import { Shield, CheckCircle2 } from 'lucide-react';
import { useIdentityStore } from '@/store/useIdentityStore';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { hydrateMockData, setDID, addNotification } = useIdentityStore();
  const [step, setStep] = useState<'wallet' | 'biometric' | 'done'>('wallet');

  function complete() {
    if (address) {
      setDID(`did:metago:${address.toLowerCase()}`, `did:metago:polygon:${address.toLowerCase()}`);
      hydrateMockData();
    }
    addNotification({ type: 'SYSTEM', message: 'Identity restored via wallet + biometric liveness' });
    document.cookie = 'celestial_auth=1; path=/; max-age=86400';
    toast.success('Welcome back to Meta Go');
    router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-28 pb-20 px-4 max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/30 items-center justify-center mb-4">
            <Shield size={24} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-2">Restore Identity</h1>
          <p className="text-sm text-zinc-450">Wallet + biometric liveness to unlock your Meta Go session.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-6">
          {step === 'wallet' && (
            <>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Step 1 — Connect wallet</h2>
              <WalletConnector onSuccess={() => setStep('biometric')} />
            </>
          )}
          {step === 'biometric' && (
            <>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">Step 2 — Liveness check</h2>
              <BiometricScanner onComplete={() => { setStep('done'); setTimeout(complete, 800); }} />
            </>
          )}
          {step === 'done' && (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
              <p className="text-base font-bold">Identity restored — redirecting...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
