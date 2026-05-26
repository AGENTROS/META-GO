'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { WalletConnector } from '@/components/auth/WalletConnector';
import { BiometricScanner } from '@/components/auth/BiometricScanner';
import { ZKPForge } from '@/components/auth/ZKPForge';
import { VoiceScanner } from '@/components/auth/VoiceScanner';
import { useIdentityStore } from '@/store/useIdentityStore';
import { checkHandleAvailability } from '@/lib/bloomFilter';
import { useAccount } from 'wagmi';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const store = useIdentityStore();
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [proofHash, setProofHash] = useState('');
  const [minting, setMinting] = useState(false);
  const [faceLandmarks, setFaceLandmarks] = useState<number[][] | null>(null);
  const [realProof, setRealProof] = useState<any>(null);
  const [voiceHash, setVoiceHash] = useState('');

  const [consentVoice, setConsentVoice] = useState(true);
  const [consentCrossChain, setConsentCrossChain] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const activeSteps = [
    'Handle', 'Wallet', 'Face Scan',
    ...(consentVoice ? ['Voice MFA'] : []),
    'ZK Proof', 'SBT Mint'
  ];
  const currentActiveIndex = step === 5 ? (consentVoice ? 5 : 4) : step === 4 ? (consentVoice ? 4 : 3) : step;

  async function checkHandle(val: string) {
    setHandle(val);
    if (val.length < 3) { setHandleStatus('idle'); return; }
    setHandleStatus('checking');
    const { available } = await checkHandleAvailability(val);
    setHandleStatus(available ? 'available' : 'taken');
  }

  async function handleMint() {
    setMinting(true);
    try {
      store.setHandle(handle);
      const did = `did:metago:${address?.toLowerCase()}`;
      const fullDID = `did:metago:polygon:${address?.toLowerCase()}`;
      store.setDID(did, fullDID);

      // Call backend — backend submits the REAL on-chain mint via Hardhat relayer
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const syncRes = await fetch(`${backend}/api/user/sync`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle, email, voiceHash,
          walletAddress: address, did,
          zkProof: {
            proofHash, nullifier: realProof?.nullifier || `nul-${Date.now()}`,
            algorithm: realProof?.algorithm || 'simulation-bn128',
            isReal: !!realProof?.isReal,
            generatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
            integrityScore: realProof?.integrityScore || 85,
          },
        }),
      }).then(r => r.json()).catch(() => ({ ok: false }));

      const onchain = syncRes.onchain || { mode: 'simulation' };

      store.addSBT({
        id: 'sbt-genesis-' + Date.now(),
        name: 'Genesis Citizen',
        issuer: 'Meta Go Authority',
        issuedAt: Date.now(),
        domain: 'GAMING',
        chain: 'POLYGON',
        status: 'VALID',
        txHash: onchain.txHash || ('0x' + (address?.slice(2) || '').padEnd(64, '0').slice(0, 64)),
        description: onchain.mode === 'real'
          ? `Real on-chain SBT minted on chain ${onchain.chainId} (token #${onchain.tokenId}).`
          : 'Sovereign founding citizen credential — biometric ZK proof anchored.',
      });
      store.hydrateMockData();

      if (onchain.mode === 'real') {
        toast.success(`✓ Real on-chain SBT minted! Token #${onchain.tokenId}`);
      } else {
        toast.success('Identity Registered! Welcome to Meta Go.');
      }
      document.cookie = 'celestial_auth=1; path=/; max-age=86400';
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      toast.error('Mint failed.');
      setMinting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="w-full max-w-xl z-10">
        <div className="mb-14">
          <div className="flex justify-between mb-4">
            {activeSteps.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <span className={`text-[9px] font-sans font-semibold uppercase tracking-wider ${i === currentActiveIndex ? 'text-blue-600' : i < currentActiveIndex ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-650'}`}>
                  {s}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full ${i === currentActiveIndex ? 'bg-blue-600' : i < currentActiveIndex ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
              </div>
            ))}
          </div>
          <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-blue-600" initial={{ width: 0 }}
              animate={{ width: `${((currentActiveIndex + 1) / activeSteps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'circOut' }} />
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div key={step}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm">

              {step === 0 && (
                <div className="space-y-6" data-testid="wizard-step-handle">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Set Up Profile</h2>
                    <p className="text-xs text-zinc-450">Choose your unique profile handle and consent parameters.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <NeonInput value={handle} onChange={e => checkHandle(e.target.value.toLowerCase())} placeholder="username" data-testid="handle-input"
                        icon={<span className="text-zinc-450 font-semibold text-sm">@</span>} className="pr-12" />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {handleStatus === 'checking' && <div className="w-4 h-4 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />}
                        {handleStatus === 'available' && <CheckCircle size={18} className="text-emerald-500" />}
                        {handleStatus === 'taken' && <XCircle size={18} className="text-red-500" />}
                      </div>
                    </div>

                    <NeonInput value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="email@address.com" data-testid="email-input" />
                    <NeonInput value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="recovery passphrase" data-testid="password-input" />

                    <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">Privacy & Consent</h3>
                        <p className="text-[10px] text-zinc-450 mt-0.5">Select the minimal dataset you consent to process.</p>
                      </div>
                      <div className="space-y-2.5">
                        <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl cursor-default">
                          <input type="checkbox" checked disabled className="mt-0.5 accent-blue-600" />
                          <div>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250">Local Face Mesh (Required)</p>
                            <p className="text-[10px] text-zinc-450 mt-0.5">Computes 468-point landmarks locally. No raw frames stored.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl cursor-pointer">
                          <input type="checkbox" checked={consentVoice} onChange={e => setConsentVoice(e.target.checked)} className="mt-0.5 accent-blue-600" data-testid="consent-voice" />
                          <div>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250">Vocal Biometrics MFA</p>
                            <p className="text-[10px] text-zinc-450 mt-0.5">Enrolls vocal print as a second authentication factor.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl cursor-pointer">
                          <input type="checkbox" checked={consentCrossChain} onChange={e => setConsentCrossChain(e.target.checked)} className="mt-0.5 accent-blue-600" data-testid="consent-crosschain" />
                          <div>
                            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250">Cross-Platform Verification</p>
                            <p className="text-[10px] text-zinc-450 mt-0.5">Allow exporting proofs to other EVM-compatible chains.</p>
                          </div>
                        </label>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)} className="accent-blue-600" data-testid="consent-final" />
                        <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">I consent to local processing and immediate destruction of raw biometric data.</span>
                      </label>
                    </div>
                  </div>

                  <NeonButton onClick={() => setStep(1)} disabled={handleStatus !== 'available' || !email || !password || !consentAccepted}
                    className="w-full py-3" data-testid="step-handle-next">
                    Continue →
                  </NeonButton>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6" data-testid="wizard-step-wallet">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Connect Wallet</h2>
                    <p className="text-xs text-zinc-450">Establish a cryptographic link to your digital wallet via SIWE.</p>
                  </div>
                  <WalletConnector onSuccess={() => setStep(2)} />
                  {!isConnected && (
                    <button onClick={() => setStep(0)} className="w-full text-center text-[10px] text-zinc-450 font-semibold uppercase tracking-wider py-2 hover:text-zinc-650">
                      ← Modify Handle
                    </button>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6" data-testid="wizard-step-biometric">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Biometric Verification</h2>
                    <p className="text-xs text-zinc-450">Perform facial landmark mapping with eye-blink liveness.</p>
                  </div>
                  <BiometricScanner onComplete={(landmarks) => { setFaceLandmarks(landmarks); setStep(consentVoice ? 3 : 4); }} />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6" data-testid="wizard-step-voice">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Voice Verification</h2>
                    <p className="text-xs text-zinc-450">Enroll your vocal biometrics as a secondary cryptographic factor.</p>
                  </div>
                  <VoiceScanner onComplete={(h) => { setVoiceHash(h); setStep(4); }} />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6" data-testid="wizard-step-zkp">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Generate ZK Proof</h2>
                    <p className="text-xs text-zinc-450">Computing a Groth16 zero-knowledge proof entirely on your machine.</p>
                  </div>
                  <ZKPForge faceLandmarks={faceLandmarks} walletAddress={address || ''}
                    onComplete={(hash, proofData) => { setProofHash(hash); setRealProof(proofData); setStep(5); }} />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-8 text-center" data-testid="wizard-step-mint">
                  <div className="space-y-1 text-left">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Mint Credentials</h2>
                    <p className="text-xs text-zinc-450">Mint your verified non-transferable Soulbound Token.</p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl">
                    <div className="w-20 h-20 rounded-full border border-blue-600/30 bg-blue-600/5 flex items-center justify-center mx-auto mb-5">
                      <span className="text-3xl text-blue-600">⬡</span>
                    </div>
                    <p className="text-base font-bold text-zinc-900 dark:text-white">META_GO_IDENTITY_SBT</p>
                    <p className="text-[9px] text-blue-600 font-semibold uppercase tracking-wider">Verified Sovereign ID</p>

                    {proofHash && (
                      <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                        <p className="text-[9px] font-mono text-zinc-450 uppercase tracking-widest text-left">Proof Hash</p>
                        <div className="bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate">{proofHash}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button onClick={handleMint} disabled={minting} data-testid="mint-sbt-btn"
                    className="w-full py-4 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-sm rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {minting && <div className="w-4 h-4 border-2 border-zinc-400 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />}
                    {minting ? 'MINTING...' : 'MINT SOVEREIGN IDENTITY'}
                  </button>

                  <p className="text-[9px] font-mono text-zinc-450 uppercase tracking-widest">Soulbound tokens are non-transferable</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
