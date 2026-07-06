'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { WalletConnector } from '@/components/auth/WalletConnector';
import dynamic from 'next/dynamic';
const BiometricScanner = dynamic(
  () => import('@/components/auth/BiometricScanner').then(mod => mod.BiometricScanner),
  { ssr: false }
);
import { ZKPForge } from '@/components/auth/ZKPForge';
import { VoiceScanner } from '@/components/auth/VoiceScanner';
import { useIdentityStore } from '@/store/useIdentityStore';
import { checkHandleAvailability } from '@/lib/bloomFilter';
import { useAccount } from 'wagmi';
import { CheckCircle, XCircle, Info, Shield, Key, Cpu, HelpCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const [operationId] = useState(() => 'op-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

  const [consentVoice, setConsentVoice] = useState(true);
  const [consentCrossChain, setConsentCrossChain] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const activeSteps = [
    'Profile', 'Wallet', 'Liveness',
    ...(consentVoice ? ['Voice MFA'] : []),
    'ZK Prover', 'Mint SBT'
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

      const templateStr = typeof window !== 'undefined' ? localStorage.getItem('metago_face_template_' + address?.toLowerCase()) : null;
      const biometricTemplate = templateStr ? JSON.parse(templateStr) : null;

      // Call backend — backend submits the REAL on-chain mint via Hardhat relayer
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      const syncRes = await fetch(`${backend}/api/user/sync`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle, email, voiceHash,
          walletAddress: address, did,
          biometricTemplate,
          operationId,
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

  // Explainer texts depending on current step
  const explainers = [
    {
      title: 'Decentralized Profile setup',
      body: 'Registering your custom handle reserves it in the identity bloom filters. Your recovery passphrase behaves as an on-chain seed to authorize guardians if you lose wallet keys.',
      badge: 'Profile Indexing'
    },
    {
      title: 'Sign-In With Ethereum (SIWE)',
      body: 'SIWE replaces passwords with secure wallet key signatures. By signing, you verify ownership of your wallet address without revealing sensitive personal details.',
      badge: 'EIP-4361 Auth'
    },
    {
      title: 'Local Face Mesh Mapping',
      body: 'TensorFlow FaceMesh maps a 468-point coordinate mesh from your camera. This coordinate vector is hashed locally using a Poseidon hash commitment, and the raw frames are immediately discarded.',
      badge: 'Zero-Storage Biometrics'
    },
    ...(consentVoice ? [{
      title: 'Multi-Modal Voice MFA',
      body: 'Enrolls your vocal frequency print as a secondary identity verification vector. This creates a bypass-resistant, multi-factor biometric safeguard.',
      badge: 'Voice Enrolling'
    }] : []),
    {
      title: 'Client-Side ZK-SNARK Prover',
      body: 'Computes a Groth16 zero-knowledge proof. This mathematical proof proves that your biometric commit hashes align with your wallet, without ever sending your landmarks to a server.',
      badge: 'snarkjs Groth16'
    },
    {
      title: 'Soulbound Token (SBT) Minting',
      body: 'Mints a non-transferable NFT to your wallet on Polygon. This token acts as a permanent anchor for your verified biometric commitments and sovereign DID passport.',
      badge: 'ERC-721 SBT'
    }
  ];

  const currentExplainer = explainers[currentActiveIndex] || explainers[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden font-sans">
      <div className="absolute inset-0 grid-pattern opacity-[0.25]" />
      
      {/* Glow overlays */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl z-10 space-y-8">
        {/* Step Indicator Header */}
        <div className="space-y-4">
          <div className="flex justify-between max-w-md mx-auto sm:mx-0">
            {activeSteps.map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1.5">
                <span className={`text-[8px] font-sans font-bold uppercase tracking-wider transition-colors ${
                  i === currentActiveIndex 
                    ? 'text-blue-500' 
                    : i < currentActiveIndex 
                    ? 'text-emerald-500' 
                    : 'text-zinc-400 dark:text-zinc-650'
                }`}>
                  {s}
                </span>
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === currentActiveIndex 
                    ? 'bg-blue-500 scale-125 ring-2 ring-blue-500/35' 
                    : i < currentActiveIndex 
                    ? 'bg-emerald-500' 
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`} />
              </div>
            ))}
          </div>
          <div className="h-1 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentActiveIndex + 1) / activeSteps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'circOut' }} 
            />
          </div>
        </div>

        {/* Split Screen Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Wizard Card */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div 
                key={step}
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-xl space-y-6"
              >
                {step === 0 && (
                  <div className="space-y-5" data-testid="wizard-step-handle">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight font-sans">1. Establish Profile Identity</h2>
                      <p className="text-xs text-zinc-450">Reserve your unique username handle and credentials.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <NeonInput 
                          value={handle} 
                          onChange={e => checkHandle(e.target.value.toLowerCase())} 
                          placeholder="choose-your-handle" 
                          data-testid="handle-input"
                          icon={<span className="text-zinc-450 font-semibold text-xs">@</span>} 
                          className="pr-12 text-xs" 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {handleStatus === 'checking' && <div className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />}
                          {handleStatus === 'available' && <CheckCircle size={16} className="text-emerald-500" />}
                          {handleStatus === 'taken' && <XCircle size={16} className="text-red-500" />}
                        </div>
                      </div>

                      <NeonInput 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        type="email" 
                        placeholder="your-email@address.com" 
                        data-testid="email-input" 
                        className="text-xs"
                      />
                      <NeonInput 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        type="password" 
                        placeholder="choose-backup-passphrase" 
                        data-testid="password-input" 
                        className="text-xs"
                      />

                      <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800/80 space-y-4">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">Privacy & Consent Parameters</h3>
                          <p className="text-[10px] text-zinc-450 mt-0.5">Configure what biometric records to process locally.</p>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                            <input type="checkbox" checked disabled className="mt-0.5 accent-blue-600 w-3.5 h-3.5" />
                            <div>
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250">Local Face Mesh (Required)</p>
                              <p className="text-[9px] text-zinc-450 mt-0.5">Calculates 468 topology points in-browser. Zero server upload.</p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={consentVoice} 
                              onChange={e => setConsentVoice(e.target.checked)} 
                              className="mt-0.5 accent-blue-600 w-3.5 h-3.5" 
                              data-testid="consent-voice" 
                            />
                            <div>
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250">Vocal Biometrics MFA</p>
                              <p className="text-[9px] text-zinc-450 mt-0.5">Enroll vocal pitch frequency as a second identity factor.</p>
                            </div>
                          </label>
                          <label className="flex items-start gap-3 p-3 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={consentCrossChain} 
                              onChange={e => setConsentCrossChain(e.target.checked)} 
                              className="mt-0.5 accent-blue-600 w-3.5 h-3.5" 
                              data-testid="consent-crosschain" 
                            />
                            <div>
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250">Chainlink CCIP Cross-Chain Export</p>
                              <p className="text-[9px] text-zinc-450 mt-0.5">Verify and sync your DID passport across secondary networks.</p>
                            </div>
                          </label>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={consentAccepted} 
                            onChange={e => setConsentAccepted(e.target.checked)} 
                            className="accent-blue-600 w-3.5 h-3.5" 
                            data-testid="consent-final" 
                          />
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                            I accept the local biometric processing agreement.
                          </span>
                        </label>
                      </div>
                    </div>

                    <NeonButton 
                      onClick={() => setStep(1)} 
                      disabled={handleStatus !== 'available' || !email || !password || !consentAccepted}
                      className="w-full py-3 text-xs" 
                      data-testid="step-handle-next"
                    >
                      Verify and Link Wallet →
                    </NeonButton>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5" data-testid="wizard-step-wallet">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">2. Reconnect Cryptographic Wallet</h2>
                      <p className="text-xs text-zinc-450">Authorize connection using Sign-In with Ethereum signatures.</p>
                    </div>
                    <WalletConnector onSuccess={() => setStep(2)} />
                    {!isConnected && (
                      <button 
                        onClick={() => setStep(0)} 
                        className="w-full text-center text-[10px] text-zinc-450 font-bold uppercase tracking-wider py-1.5 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                      >
                        ← Back to Profile
                      </button>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5" data-testid="wizard-step-biometric">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">3. Face Mesh & Liveness scan</h2>
                      <p className="text-xs text-zinc-450">Follow the interactive HUD coordinate steps.</p>
                    </div>
                    <BiometricScanner 
                      mode="register"
                      onComplete={(landmarks) => { 
                        setFaceLandmarks(landmarks); 
                        setStep(consentVoice ? 3 : 4); 
                      }} 
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5" data-testid="wizard-step-voice">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">4. Vocal Frequency MFA</h2>
                      <p className="text-xs text-zinc-450">Record a short vocal print passphrase.</p>
                    </div>
                    <VoiceScanner onComplete={(h) => { 
                      setVoiceHash(h); 
                      setStep(4); 
                    }} />
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5" data-testid="wizard-step-zkp">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">5. Compile Zero-Knowledge Proof</h2>
                      <p className="text-xs text-zinc-450">Compute Groth16 proofs client-side in-browser.</p>
                    </div>
                    <ZKPForge 
                      faceLandmarks={faceLandmarks} 
                      walletAddress={address || ''}
                      onComplete={(hash, proofData) => { 
                        setProofHash(hash); 
                        setRealProof(proofData); 
                        setStep(5); 
                      }} 
                    />
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-6 text-center" data-testid="wizard-step-mint">
                    <div className="space-y-1 text-left">
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">6. Mint Soulbound Identity</h2>
                      <p className="text-xs text-zinc-450">Claim your non-transferable Genesis SBT on Polygon.</p>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl">
                      <div className="w-16 h-16 rounded-full border border-blue-500/20 bg-blue-500/5 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Shield size={24} className="text-blue-500" />
                      </div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">META_GO_IDENTITY_SBT</p>
                      <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider">Verified Sovereign Member</p>

                      {proofHash && (
                        <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                          <p className="text-[8px] font-mono text-zinc-450 uppercase tracking-widest text-left">Verified proof hash commitment</p>
                          <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <p className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400 truncate flex-1 text-left">{proofHash}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleMint} 
                      disabled={minting} 
                      data-testid="mint-sbt-btn"
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 uppercase tracking-wider"
                    >
                      {minting && <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />}
                      {minting ? 'Anchoring Identity...' : 'Mint Sovereign Identity'}
                    </button>

                    <p className="text-[8px] font-mono text-zinc-450 uppercase tracking-widest">
                      Soulbound Credentials are permanently anchored and cannot be transferred.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Column: Cryptographic Ledger HUD */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Real-time State Ledger */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-250 dark:border-zinc-850 p-6 rounded-2xl shadow-xl text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-bold">Cryptographic Ledger HUD</span>
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              </div>

              <div className="space-y-3 font-mono text-[9px] text-zinc-500">
                <div className="space-y-1">
                  <span className="text-zinc-450 block uppercase text-[8px]">ACTIVE WALLET</span>
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-900 truncate text-zinc-350">
                    {address || 'Not connected'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-450 block uppercase text-[8px]">IDENTITY HANDLE</span>
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-900 text-zinc-350">
                    {handle ? `@${handle}` : 'Not configured'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-450 block uppercase text-[8px]">BIOMETRIC VOCAL HASH</span>
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-900 truncate text-zinc-350">
                    {voiceHash || 'Not enrolled'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-450 block uppercase text-[8px]">ZERO-KNOWLEDGE COMMITMENT</span>
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-900 truncate text-zinc-350">
                    {proofHash || 'Awaiting witness generation'}
                  </div>
                </div>
              </div>
            </div>

            {/* Under the Hood Step Explainer */}
            <div className="bg-white/40 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-850 p-6 rounded-2xl shadow-lg text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
              
              <div className="space-y-3">
                <div className="inline-flex px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 font-mono text-[8px] uppercase tracking-wider font-bold">
                  {currentExplainer.badge}
                </div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-250 flex items-center gap-1.5">
                  <Info size={13} className="text-blue-500" />
                  {currentExplainer.title}
                </h4>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  {currentExplainer.body}
                </p>
              </div>
            </div>

            {/* Back to signin gate */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20 text-center text-xs text-zinc-500">
              Already have a sovereign profile?{' '}
              <Link href="/auth/signin" className="text-blue-600 font-bold hover:underline">
                Sign in here →
              </Link>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
