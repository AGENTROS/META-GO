'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useIdentityStore } from '@/store/useIdentityStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, ShieldAlert, Check, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

function AuthorizeClientContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { walletAddress, handle, did, linkedAvatar, isAuthenticated } = useIdentityStore();
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const clientId = searchParams.get('client_id') || 'unknown_client';
  const redirectUri = searchParams.get('redirect_uri') || '';
  const stateParam = searchParams.get('state') || '';
  const scope = searchParams.get('scope') || 'openid';

  const handleAuthorize = async () => {
    if (!walletAddress) {
      toast.error('Identity not loaded.');
      return;
    }
    setIsAuthorizing(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      // Request code from backend oauth authorize
      const res = await fetch(
        `${backend}/api/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&state=${stateParam}&scope=${scope}&walletAddress=${walletAddress}`
      );
      if (!res.ok) throw new Error('Authorization failed on BFF server');
      const data = await res.json();
      
      toast.success('Access approved. Redirecting to callback handler...');
      
      // Navigate browser to the callback endpoint (which triggers websocket relay and outputs success landing)
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to authorize client');
      setIsAuthorizing(false);
    }
  };

  const handleDeny = () => {
    toast.error('Authorization request denied.');
    if (redirectUri) {
      window.location.href = `${redirectUri}?error=access_denied&state=${stateParam}`;
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="w-full max-w-md">
      <GlassCard className="p-8 space-y-6 animate-fade-in" intensity="high">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500 mb-2 border border-blue-500/20">
            <Shield size={24} className="animate-pulse" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Meta Go <span className="gradient-text">OIDC Authorization</span>
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400">
            An external application is requesting access to your Sovereign identity.
          </p>
        </div>

        {/* Client identity details */}
        <div className="p-4 bg-zinc-900/5 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-2">
            <span>REQUESTING APPLICATION</span>
            <span className="text-blue-500 font-bold uppercase">{clientId.replace('_', ' ')}</span>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-mono text-zinc-450 uppercase">Requested Scopes:</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded">
                openid
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded">
                did:document
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded">
                3d:avatar
              </span>
            </div>
          </div>
        </div>

        {/* User Identity Details */}
        {isAuthenticated && walletAddress ? (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/5 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-blue-500/30">
                  {handle ? handle[0].toUpperCase() : 'M'}
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-150 truncate">@{handle || 'anonymous'}</p>
                  <p className="text-[10px] font-mono text-zinc-450 truncate">{walletAddress}</p>
                </div>
              </div>

              {linkedAvatar ? (
                <div className="flex items-center gap-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-emerald-500 text-[10px] font-mono">
                  <Check size={12} />
                  <span>Mannequin avatar ready ({linkedAvatar.filename})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg text-amber-500 text-[10px] font-mono">
                  <ShieldAlert size={12} />
                  <span>No avatar linked. Using anonymous engram.</span>
                </div>
              )}
            </div>

            {/* Approve / Deny Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDeny}
                disabled={isAuthorizing}
                className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 hover:border-red-500 hover:text-red-500 text-xs font-bold rounded-xl uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <X size={14} /> Deny
              </button>
              <button
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20"
              >
                {isAuthorizing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Authorizing...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Authorize
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-center space-y-2">
              <ShieldAlert size={20} className="mx-auto text-red-500" />
              <p className="text-xs font-bold text-red-500">Authentication Required</p>
              <p className="text-[10px] text-zinc-550 dark:text-zinc-400">
                You must sign in to your sovereign Meta Go wallet identity before granting permissions.
              </p>
            </div>
            <button
              onClick={() => router.push(`/auth?redirect=${encodeURIComponent(window.location.search)}`)}
              className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold rounded-xl uppercase tracking-wider transition-all"
            >
              Log in with Wallet
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function AuthorizeClientPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-mono text-zinc-450">Loading OIDC Authorize Core...</p>
        </div>
      }>
        <AuthorizeClientContent />
      </Suspense>
    </div>
  );
}
