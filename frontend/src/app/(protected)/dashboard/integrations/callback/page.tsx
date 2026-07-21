'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function IntegrationCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const provider = searchParams.get('provider');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const { setIntegrationStatus } = useIdentityStore();

  useEffect(() => {
    if (!provider) {
      router.push('/dashboard');
      return;
    }

    const completeConnection = async () => {
      try {
        // Simulate a slight delay to show the awesome verification UI
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const res = await fetch(`http://localhost:8005/api/integrations/callback/${provider}`, {
          method: 'POST'
        });
        
        if (res.ok) {
          setStatus('success');
          // Update local store immediately for snappier feeling
          setIntegrationStatus(provider, true);
          
          // Redirect back to dashboard after showing success state
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    completeConnection();
  }, [provider, router, setIntegrationStatus]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
      <div className="card p-8 bg-[#0f0f14]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col items-center w-full max-w-md shadow-2xl shadow-blue-500/5">
        <div className={`w-20 h-20 mb-6 flex items-center justify-center rounded-full border ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : status === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
          {status === 'verifying' && <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />}
          {status === 'success' && <CheckCircle2 className="w-10 h-10 text-emerald-400" />}
          {status === 'error' && <AlertCircle className="w-10 h-10 text-red-400" />}
        </div>
        
        <h2 className="text-2xl font-bold mb-2">
          {status === 'verifying' ? 'Verifying Connection' : status === 'success' ? 'Connection Successful' : 'Connection Failed'}
        </h2>
        
        <p className="text-gray-400 text-center text-sm mb-6">
          {status === 'verifying' 
            ? `Securely authenticating your identity with ${provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'the provider'}...` 
            : status === 'success' 
            ? 'Your identity has been verified. Redirecting to your dashboard...'
            : 'There was a problem authenticating with the provider. Redirecting...'}
        </p>

        {status === 'verifying' && (
           <div className="w-full bg-white/5 rounded-full h-1.5 mb-2 overflow-hidden">
             <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
           </div>
        )}
      </div>
    </div>
  );
}
