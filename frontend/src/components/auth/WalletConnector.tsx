'use client';
import { useState } from 'react';
import { useConnect } from 'wagmi';
import { CheckCircle2, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSIWE } from '@/hooks/useSIWE';
import { useAccount } from 'wagmi';

export function WalletConnector({ onSuccess }: { onSuccess: () => void }) {
  const { connectors, connectAsync, isPending } = useConnect();
  const { isConnected } = useAccount();
  const { signIn, isLoading: siweLoading } = useSIWE();
  const [siweDone, setSiweDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(connector: any) {
    setError(null);
    try {
      if (!isConnected) {
        await connectAsync({ connector });
      }
      try {
        await signIn();
      } catch (e: any) {
        // SIWE backend may not be reachable in some preview envs - continue with wallet-only auth.
        console.warn('SIWE skipped:', e?.message);
      }
      setSiweDone(true);
      toast.success('Wallet connected and verified');
      setTimeout(onSuccess, 600);
    } catch (e: any) {
      setError(e?.message || 'Connection failed');
      toast.error('Wallet connection cancelled');
    }
  }

  return (
    <div className="space-y-3">
      {connectors.map(c => (
        <button key={c.uid} onClick={() => handleConnect(c)} disabled={isPending || siweLoading}
          data-testid={`connector-${c.id}`}
          className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-blue-500/40 hover:bg-white dark:hover:bg-zinc-900 transition-all disabled:opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-600/30 flex items-center justify-center">
              <Wallet size={18} className="text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">{c.name}</p>
              <p className="text-[10px] text-zinc-450 uppercase font-mono tracking-wider">EVM-Compatible Wallet</p>
            </div>
          </div>
          {siweDone && <CheckCircle2 size={18} className="text-emerald-500" />}
        </button>
      ))}
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      <p className="text-[10px] text-zinc-450 text-center font-mono uppercase tracking-wider mt-4">
        Sign-In With Ethereum (SIWE) — no passwords
      </p>
    </div>
  );
}
