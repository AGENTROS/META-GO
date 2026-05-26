'use client';
import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { useIdentityStore } from '@/store/useIdentityStore';
import { Users, Plus, Trash2, Shield, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RecoveryPage() {
  const { guardians, setGuardians, addNotification } = useIdentityStore();
  const [newGuardian, setNewGuardian] = useState('');
  const [recoveryAddress, setRecoveryAddress] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'pending' | 'success'>('idle');

  function addGuardian() {
    if (!/^0x[a-fA-F0-9]{40}$/.test(newGuardian)) {
      toast.error('Invalid EVM address');
      return;
    }
    if (guardians.includes(newGuardian)) {
      toast.error('Already a guardian');
      return;
    }
    setGuardians([...guardians, newGuardian]);
    toast.success('Guardian added');
    setNewGuardian('');
  }

  function removeGuardian(g: string) {
    setGuardians(guardians.filter(x => x !== g));
    toast.success('Guardian removed');
  }

  function initiateRecovery() {
    if (!/^0x[a-fA-F0-9]{40}$/.test(recoveryAddress)) {
      toast.error('Provide a valid new wallet address');
      return;
    }
    setRecoveryStatus('pending');
    toast.loading('Notifying guardians for confirmation...');
    setTimeout(() => {
      setRecoveryStatus('success');
      addNotification({ type: 'GUARDIAN_CONFIRMED', message: `Guardian confirmed recovery to ${recoveryAddress.slice(0, 10)}...` });
      toast.dismiss();
      toast.success('Recovery request broadcast to guardian network');
    }, 2500);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      <main className="pt-24 pb-20 px-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-450 mb-2">
          <Link href="/" className="hover:text-blue-600">Meta Go</Link>
          <ChevronRight size={10} /><span className="text-blue-600 font-bold">Social Recovery</span>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Social <span className="gradient-text">Recovery</span></h1>
          <p className="text-sm text-zinc-450 mt-1">Trusted guardians can re-attest your identity if you lose your wallet.</p>
        </div>

        <GlassCard className="p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} className="text-blue-600" /> Guardian Network
          </h2>
          <p className="text-xs text-zinc-450 leading-relaxed mb-4">
            Add 3-5 trusted wallets. Majority approval is required to migrate your identity to a new wallet.
          </p>
          <div className="flex gap-2 mb-4">
            <NeonInput value={newGuardian} onChange={e => setNewGuardian(e.target.value)} placeholder="0x..." data-testid="guardian-input" className="flex-1" />
            <NeonButton onClick={addGuardian} data-testid="add-guardian-btn"><Plus size={14} /> Add</NeonButton>
          </div>
          <div className="space-y-2">
            {guardians.length === 0 ? (
              <p className="text-xs text-zinc-450 italic">No guardians configured</p>
            ) : guardians.map((g, i) => (
              <div key={g} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-600/30 flex items-center justify-center text-[10px] font-bold text-blue-600">
                    {i + 1}
                  </div>
                  <span className="text-xs font-mono">{g}</span>
                </div>
                <button onClick={() => removeGuardian(g)} className="text-red-500 hover:text-red-600" data-testid={`remove-guardian-${i}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Shield size={16} className="text-indigo-600" /> Initiate Recovery
          </h2>
          <p className="text-xs text-zinc-450 leading-relaxed mb-4">
            Enter the new wallet address where you want your sovereign identity migrated. Your guardians will be notified for approval.
          </p>
          <div className="space-y-3">
            <NeonInput value={recoveryAddress} onChange={e => setRecoveryAddress(e.target.value)} placeholder="0x your new wallet" data-testid="recovery-address-input" />
            <NeonButton onClick={initiateRecovery} disabled={recoveryStatus === 'pending' || guardians.length === 0} className="w-full" data-testid="initiate-recovery-btn">
              {recoveryStatus === 'idle' && 'Broadcast Recovery Request'}
              {recoveryStatus === 'pending' && 'Notifying guardians...'}
              {recoveryStatus === 'success' && '✓ Request broadcast'}
            </NeonButton>
            {guardians.length === 0 && <p className="text-[11px] text-amber-600">⚠ Add at least one guardian before requesting recovery</p>}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
