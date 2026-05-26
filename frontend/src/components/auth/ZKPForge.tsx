'use client';
import { useEffect, useState } from 'react';
import { Cpu, CheckCircle2 } from 'lucide-react';
import { generateZKProof } from '@/lib/zkp.engine';
import { useIdentityStore } from '@/store/useIdentityStore';

interface Props {
  faceLandmarks: number[][] | null;
  walletAddress: string;
  onComplete: (hash: string, proofData: any) => void;
}

const STEPS = [
  'Initializing Groth16 BN128 prover...',
  'Hashing biometric topology with Poseidon...',
  'Computing nullifier commitment...',
  'Generating zk-SNARK witness...',
  'Producing zero-knowledge proof...',
  'Sealing cryptographic envelope...',
];

export function ZKPForge({ faceLandmarks, walletAddress, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [hash, setHash] = useState('');
  const setZKProof = useIdentityStore(s => s.setZKProof);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return;
        setStep(i);
        setLogs(l => [...l, `[${new Date().toISOString().slice(11, 19)}] ${STEPS[i]}`]);
        await new Promise(r => setTimeout(r, 600));
      }
      const result = await generateZKProof(faceLandmarks, walletAddress);
      if (cancelled) return;
      setHash(result.proofHash);
      setLogs(l => [...l, `[${new Date().toISOString().slice(11, 19)}] ✓ ${result.isReal ? 'Real zk-SNARK' : 'Simulation proof'} generated`]);
      setZKProof({
        hash: result.proofHash,
        algorithm: result.algorithm,
        generatedAt: result.generatedAt,
        expiresAt: result.expiresAt,
        integrityScore: result.integrityScore,
      });
      setDone(true);
      setTimeout(() => onComplete(result.proofHash, result), 800);
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-zinc-950 text-emerald-400 rounded-xl p-4 font-mono text-[10px] h-56 overflow-y-auto border border-zinc-800">
        {logs.map((l, i) => (<div key={i} className="whitespace-pre-wrap">{l}</div>))}
        {!done && <div className="flex items-center gap-1.5 mt-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> processing...</div>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i < step ? 'bg-emerald-500' : i === step ? 'bg-blue-500 animate-pulse' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
        ))}
      </div>

      {done && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-start gap-3">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Proof Generated</p>
            <p className="text-[10px] font-mono text-emerald-600/70 truncate mt-0.5">{hash}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-450 uppercase tracking-wider">
        <Cpu size={11} /> CLIENT-SIDE PROOF — NO BIOMETRIC DATA LEAVES YOUR DEVICE
      </div>
    </div>
  );
}
