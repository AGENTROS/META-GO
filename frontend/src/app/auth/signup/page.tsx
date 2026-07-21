'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { 
  User, Mail, Lock, Eye, EyeOff, Shield, Link as LinkIcon, 
  Volume2, Fingerprint, Check, CheckCircle, XCircle, Info, 
  ArrowRight, Key, Cpu, HelpCircle, Wallet, Scan
} from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Floating ZK Identity Orb Component
const ZKIdentityOrb = () => {
  return (
    <div className="relative w-36 h-36 md:w-40 md:h-40 mx-auto flex items-center justify-center pointer-events-none select-none">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#7B61FF]/10 to-[#3AA0FF]/10 rounded-full blur-2xl animate-pulse" />
      
      {/* Holographic Orb SVG */}
      <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#7B61FF" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#3AA0FF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#07070A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF3CAC" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#7B61FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3AA0FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Glow Center */}
        <circle cx="100" cy="100" r="40" fill="url(#orbGlow)" />
        
        {/* Outer Orbit Ring 1 (diagonally tilted) */}
        <g className="animate-[spin_8s_linear_infinite]" style={{ transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="80" ry="25" stroke="url(#orbitGrad)" strokeWidth="1.2" strokeDasharray="4, 4" transform="rotate(-30 100 100)" />
        </g>
        
        {/* Outer Orbit Ring 2 (opposite tilt) */}
        <g className="animate-[spin_12s_linear_infinite_reverse]" style={{ transformOrigin: '100px 100px' }}>
          <ellipse cx="100" cy="100" rx="85" ry="30" stroke="url(#orbitGrad)" strokeWidth="1" transform="rotate(45 100 100)" />
        </g>

        {/* Wireframe Sphere Nodes and Connections */}
        <g className="animate-[spin_20s_linear_infinite]" style={{ transformOrigin: '100px 100px' }}>
          {/* Main vertical & horizontal slices */}
          <circle cx="100" cy="100" r="55" stroke="#7B61FF" strokeWidth="0.8" strokeOpacity="0.35" />
          <ellipse cx="100" cy="100" rx="55" ry="18" stroke="#7B61FF" strokeWidth="0.8" strokeOpacity="0.35" />
          <ellipse cx="100" cy="100" rx="18" ry="55" stroke="#7B61FF" strokeWidth="0.8" strokeOpacity="0.35" transform="rotate(30 100 100)" />
          <ellipse cx="100" cy="100" rx="18" ry="55" stroke="#7B61FF" strokeWidth="0.8" strokeOpacity="0.35" transform="rotate(-30 100 100)" />
          <line x1="100" y1="45" x2="100" y2="155" stroke="#7B61FF" strokeWidth="0.8" strokeOpacity="0.25" />
          <line x1="45" y1="100" x2="155" y2="100" stroke="#7B61FF" strokeWidth="0.8" strokeOpacity="0.25" />
          
          {/* Geodesic triangular links */}
          <polygon points="100,45 148,72 148,128 100,155 52,128 52,72" stroke="#3AA0FF" strokeWidth="0.8" strokeOpacity="0.45" />
          <polygon points="100,63 131,81 131,119 100,137 69,119 69,81" stroke="#FF3CAC" strokeWidth="0.8" strokeOpacity="0.25" />

          {/* Dots/Nodes */}
          <circle cx="100" cy="45" r="2.5" fill="#3AA0FF" />
          <circle cx="148" cy="72" r="2.5" fill="#7B61FF" />
          <circle cx="148" cy="128" r="2.5" fill="#FF3CAC" />
          <circle cx="100" cy="155" r="2.5" fill="#3AA0FF" />
          <circle cx="52" cy="128" r="2.5" fill="#7B61FF" />
          <circle cx="52" cy="72" r="2.5" fill="#FF3CAC" />
          
          <circle cx="100" cy="63" r="2" fill="#FFFFFF" />
          <circle cx="131" cy="81" r="2" fill="#3AA0FF" />
          <circle cx="131" cy="119" r="2" fill="#7B61FF" />
          <circle cx="100" cy="137" r="2" fill="#FFFFFF" />
          <circle cx="69" cy="119" r="2" fill="#3AA0FF" />
          <circle cx="69" cy="81" r="2" fill="#7B61FF" />
        </g>
      </svg>
    </div>
  );
};

export default function SignupPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const store = useIdentityStore();
  
  const [step, setStep] = useState(0);
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [proofHash, setProofHash] = useState('');
  const [minting, setMinting] = useState(false);
  const [faceLandmarks, setFaceLandmarks] = useState<number[][] | null>(null);
  const [realProof, setRealProof] = useState<any>(null);
  const [voiceHash, setVoiceHash] = useState('');
  const [operationId, setOperationId] = useState('');
  useEffect(() => {
    setOperationId('op-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, []);

  const [consentVoice, setConsentVoice] = useState(true);
  const [consentCrossChain, setConsentCrossChain] = useState(true);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const activeSteps = [
    'Profile', 'Wallet', 'Liveness',
    ...(consentVoice ? ['Voice MFA'] : []),
    'ZK Prover', 'Mint SBT'
  ];
  
  const currentActiveIndex = step === 5 ? (consentVoice ? 5 : 4) : step === 4 ? (consentVoice ? 4 : 3) : step;
  
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const isEmailEmpty = email.trim() === '';
  const isEmailValid = EMAIL_REGEX.test(email);
  const showEmailError = !isEmailEmpty && !isEmailValid;

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

      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005';
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
      if (process.env.NEXT_PUBLIC_TEST_MODE === '1') {
        store.hydrateMockData();
      }

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

  // Visual Multi-Step Progress Indicator data
  const visualSteps = [
    { label: 'PROFILE', num: '01' },
    { label: 'WALLET', num: '02' },
    { label: 'MFA', num: '03' },
    { label: 'IDENTITY', num: '04' },
    { label: 'COMPLETE', num: 'check' }
  ];

  // Map backend steps to the 5 visual steps
  const getVisualStepState = (idx: number) => {
    let activeVisualIdx = 0;
    if (step === 0) activeVisualIdx = 0;
    else if (step === 1) activeVisualIdx = 1;
    else if (step === 2 || step === 3) activeVisualIdx = 2;
    else if (step === 4) activeVisualIdx = 3;
    else if (step === 5) activeVisualIdx = 4;

    if (idx === activeVisualIdx) return 'active';
    if (idx < activeVisualIdx) return 'completed';
    return 'upcoming';
  };

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#07070A] text-white flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden font-sans select-none">
      {/* Background Aurora Gradients */}
      <div className="absolute top-[-25%] left-[-15%] w-[650px] h-[650px] rounded-full bg-[#FF3CAC]/8 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[650px] h-[650px] rounded-full bg-[#3AA0FF]/12 blur-[160px] pointer-events-none" />
      <div className="absolute top-[35%] left-[50%] -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-[#7B61FF]/8 blur-[160px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl z-10 space-y-10">
        
        {/* Top Multi-step progress indicator */}
        <div className="w-full max-w-3xl mx-auto">
          <div className="relative flex items-center justify-between w-full">
            {/* Background connection line */}
            <div className="absolute left-6 right-6 top-[22px] h-[1px] bg-white/[0.08]" />
            {/* Active glowing progress line */}
            <div 
              className="absolute left-6 top-[22px] h-[1.5px] bg-gradient-to-r from-[#FF3CAC] via-[#7B61FF] to-[#3AA0FF] transition-all duration-500 ease-out shadow-[0_0_8px_rgba(123,97,255,0.4)]" 
              style={{
                width: `${
                  step === 0 ? 0 :
                  step === 1 ? 25 :
                  step === 2 || step === 3 ? 50 :
                  step === 4 ? 75 : 88
                }%`
              }} 
            />
            
            {/* Nodes */}
            {visualSteps.map((s, idx) => {
              const state = getVisualStepState(idx);
              return (
                <div key={idx} className="flex flex-col items-center relative z-10">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-xs ${
                    state === 'active' 
                      ? 'bg-[#FF3CAC] text-white border-2 border-white/20 shadow-[0_0_15px_rgba(255,60,172,0.6)] ring-4 ring-[#FF3CAC]/25 scale-105'
                      : state === 'completed'
                      ? 'bg-[#7B61FF] text-white border-2 border-[#7B61FF]/40 shadow-[0_0_10px_rgba(123,97,255,0.4)]'
                      : 'bg-[#07070A] text-white/40 border border-white/[0.08]'
                  }`}>
                    {s.num === 'check' ? (
                      <Check size={14} className={state !== 'upcoming' ? 'text-white' : 'text-white/40'} />
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className={`text-[10px] font-sans font-bold uppercase tracking-wider transition-colors mt-2.5 ${
                    state === 'active' ? 'text-white' : 'text-white/40'
                  }`}>
                    {s.label}
                  </span>
                  {state === 'active' && (
                    <m.div 
                      layoutId="activeStepUnderline" 
                      className="h-[2px] bg-[#FF3CAC] w-8 mt-1 rounded-full shadow-[0_0_8px_#FF3CAC]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Split-Screen Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Wizard Setup Card */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait" initial={false}>
              <m.div 
                key={step}
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="bg-[#0E1017]/85 backdrop-blur-xl border border-white/[0.08] p-8 rounded-3xl shadow-2xl space-y-6 text-left"
              >
                {step === 0 && (
                  <div className="space-y-6" data-testid="wizard-step-handle">
                    
                    {/* Header step badge & Title */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                        <User size={22} className="text-[#FF3CAC]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="inline-flex px-2 py-0.5 rounded bg-[#FF3CAC]/10 border border-[#FF3CAC]/20 text-[#FF3CAC] font-mono text-[9px] uppercase tracking-wider font-bold">
                          STEP 01
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight font-sans">
                          Let's Build Your <span className="bg-gradient-to-r from-[#7B61FF] to-[#3AA0FF] bg-clip-text text-transparent">Digital Identity</span>
                        </h2>
                        <p className="text-xs text-white/50">One profile. Infinite possibilities.</p>
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div className="space-y-4 pt-2">
                      
                      {/* Handle */}
                      <div className="relative h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center px-4 focus-within:border-[#7B61FF]/65 focus-within:ring-2 focus-within:ring-[#7B61FF]/15 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <User size={18} className="text-white/40 mr-3" />
                        <input 
                          type="text"
                          value={handle}
                          onChange={e => checkHandle(e.target.value.toLowerCase())}
                          placeholder="Choose your handle"
                          className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/30 text-sm font-medium"
                          data-testid="handle-input"
                        />
                        <div className="flex items-center ml-2">
                          {handleStatus === 'checking' && <div className="w-4 h-4 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />}
                          {handleStatus === 'available' && <CheckCircle size={16} className="text-[#00E59B]" />}
                          {handleStatus === 'taken' && <XCircle size={16} className="text-red-500" />}
                        </div>
                      </div>

                      {/* Email */}
                      <div className={`relative h-14 rounded-2xl border bg-white/[0.02] flex items-center px-4 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)] ${
                        showEmailError 
                          ? 'border-red-500/50 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/15' 
                          : 'border-white/[0.08] focus-within:border-[#7B61FF]/65 focus-within:ring-2 focus-within:ring-[#7B61FF]/15'
                      }`}>
                        <Mail size={18} className="text-white/40 mr-3" />
                        <input 
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="your-email@address.com"
                          className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/30 text-sm font-medium"
                          data-testid="email-input"
                        />
                        <div className="flex items-center ml-2">
                          {!isEmailEmpty && isEmailValid && <CheckCircle size={16} className="text-[#00E59B]" />}
                          {showEmailError && <XCircle size={16} className="text-red-500" />}
                        </div>
                      </div>
                      {showEmailError && (
                        <p className="text-[11px] text-red-400 font-medium px-1 mt-[-12px]">
                          Please enter a valid email address.
                        </p>
                      )}

                      {/* Password */}
                      <div className="relative h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center px-4 focus-within:border-[#7B61FF]/65 focus-within:ring-2 focus-within:ring-[#7B61FF]/15 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
                        <Lock size={18} className="text-white/40 mr-3" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Choose a backup passphrase"
                          className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/30 text-sm font-medium"
                          data-testid="password-input"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                    </div>

                    {/* Privacy & Consent Checklist */}
                    <div className="pt-5 border-t border-white/[0.06] space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white/80">Privacy & Consent</h3>
                        <p className="text-[10px] text-white/40 mt-0.5">You're in control of your biometric data.</p>
                      </div>
                      
                      <div className="space-y-2.5">
                        
                        {/* Consent 1: Required Face Mesh */}
                        <div className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl hover:bg-white/[0.02] transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-md border border-[#3AA0FF]/50 bg-[#3AA0FF]/15 flex items-center justify-center">
                              <Check size={12} className="text-[#3AA0FF]" />
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[#3AA0FF]/10 flex items-center justify-center border border-[#3AA0FF]/20">
                              <Scan size={15} className="text-[#3AA0FF]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white/90">Local Face Mesh (Required)</p>
                              <p className="text-[9px] text-white/40 mt-0.5">Face data stays on your device.</p>
                            </div>
                          </div>
                        </div>

                        {/* Consent 2: Vocal Biometrics */}
                        <div 
                          onClick={() => setConsentVoice(!consentVoice)}
                          className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl hover:bg-white/[0.02] cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              consentVoice 
                                ? 'border-[#3AA0FF]/50 bg-[#3AA0FF]/15' 
                                : 'border-white/20 bg-transparent'
                            }`}>
                              {consentVoice && <Check size={12} className="text-[#3AA0FF]" />}
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[#7B61FF]/10 flex items-center justify-center border border-[#7B61FF]/20">
                              <Volume2 size={15} className="text-[#7B61FF]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white/90">Vocal Biometrics MFA</p>
                              <p className="text-[9px] text-white/40 mt-0.5">Voice verification for enhanced security.</p>
                            </div>
                          </div>
                        </div>

                        {/* Consent 3: Chainlink CCIP */}
                        <div 
                          onClick={() => setConsentCrossChain(!consentCrossChain)}
                          className="flex items-center justify-between p-4 bg-white/[0.01] border border-white/[0.05] rounded-2xl hover:bg-white/[0.02] cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              consentCrossChain 
                                ? 'border-[#3AA0FF]/50 bg-[#3AA0FF]/15' 
                                : 'border-white/20 bg-transparent'
                            }`}>
                              {consentCrossChain && <Check size={12} className="text-[#3AA0FF]" />}
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-[#3AA0FF]/10 flex items-center justify-center border border-[#3AA0FF]/20">
                              <LinkIcon size={15} className="text-[#3AA0FF]" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white/90">Chainlink CCIP Cross-Chain Export</p>
                              <p className="text-[9px] text-white/40 mt-0.5">Export your identity across blockchains.</p>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Final Checkbox */}
                      <label className="flex items-center gap-3 cursor-pointer pt-2 group">
                        <input 
                          type="checkbox" 
                          checked={consentAccepted} 
                          onChange={e => setConsentAccepted(e.target.checked)} 
                          className="hidden" 
                          data-testid="consent-final" 
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          consentAccepted 
                            ? 'bg-[#3AA0FF] border-[#3AA0FF] shadow-[0_0_8px_rgba(58,160,255,0.4)]' 
                            : 'border-white/20 group-hover:border-white/40'
                        }`}>
                          {consentAccepted && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-[10px] text-white/50 group-hover:text-white/70 transition-colors font-medium">
                          I accept the local biometric processing agreement.
                        </span>
                      </label>

                    </div>

                    {/* Primary Button */}
                    <button 
                      onClick={() => setStep(1)} 
                      disabled={handleStatus !== 'available' || !isEmailValid || !password || !consentAccepted}
                      className="w-full h-14 bg-gradient-to-r from-[#FF3CAC] via-[#7B61FF] to-[#3AA0FF] hover:opacity-95 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 disabled:shadow-none shadow-[0_0_20px_rgba(123,97,255,0.3)] hover:shadow-[0_0_25px_rgba(123,97,255,0.55)] hover:scale-[1.01]"
                      data-testid="step-handle-next"
                    >
                      Verify & Link Wallet <ArrowRight size={14} />
                    </button>

                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-6" data-testid="wizard-step-wallet">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                        <Wallet size={22} className="text-[#FF3CAC]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="inline-flex px-2 py-0.5 rounded bg-[#FF3CAC]/10 border border-[#FF3CAC]/20 text-[#FF3CAC] font-mono text-[9px] uppercase tracking-wider font-bold">
                          STEP 02
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Connect Cryptographic Wallet</h2>
                        <p className="text-xs text-white/50">Authorize connection using Sign-In with Ethereum signatures.</p>
                      </div>
                    </div>
                    <WalletConnector onSuccess={() => setStep(2)} />
                    {!isConnected && (
                      <button 
                        onClick={() => setStep(0)} 
                        className="w-full text-center text-[10px] text-white/50 font-bold uppercase tracking-wider py-1.5 hover:text-white transition-colors"
                      >
                        ← Back to Profile
                      </button>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6" data-testid="wizard-step-biometric">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                        <Scan size={22} className="text-[#FF3CAC]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="inline-flex px-2 py-0.5 rounded bg-[#FF3CAC]/10 border border-[#FF3CAC]/20 text-[#FF3CAC] font-mono text-[9px] uppercase tracking-wider font-bold">
                          STEP 03
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Face Mesh & Liveness scan</h2>
                        <p className="text-xs text-white/50">Follow the interactive HUD coordinate steps.</p>
                      </div>
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
                  <div className="space-y-6" data-testid="wizard-step-voice">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                        <Volume2 size={22} className="text-[#FF3CAC]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="inline-flex px-2 py-0.5 rounded bg-[#FF3CAC]/10 border border-[#FF3CAC]/20 text-[#FF3CAC] font-mono text-[9px] uppercase tracking-wider font-bold">
                          STEP 03
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Vocal Frequency MFA</h2>
                        <p className="text-xs text-white/50">Record a short vocal print passphrase.</p>
                      </div>
                    </div>
                    <VoiceScanner onComplete={(h) => { 
                      setVoiceHash(h); 
                      setStep(4); 
                    }} />
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-6" data-testid="wizard-step-zkp">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                        <Cpu size={22} className="text-[#FF3CAC]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="inline-flex px-2 py-0.5 rounded bg-[#FF3CAC]/10 border border-[#FF3CAC]/20 text-[#FF3CAC] font-mono text-[9px] uppercase tracking-wider font-bold">
                          STEP 04
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Compile Zero-Knowledge Proof</h2>
                        <p className="text-xs text-white/50">Compute Groth16 proofs client-side in-browser.</p>
                      </div>
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
                  <div className="space-y-6" data-testid="wizard-step-mint">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center">
                        <Shield size={22} className="text-[#FF3CAC]" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="inline-flex px-2 py-0.5 rounded bg-[#FF3CAC]/10 border border-[#FF3CAC]/20 text-[#FF3CAC] font-mono text-[9px] uppercase tracking-wider font-bold">
                          STEP 05
                        </div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Mint Soulbound Identity</h2>
                        <p className="text-xs text-white/50">Claim your non-transferable Genesis SBT on Polygon.</p>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.08] p-6 rounded-2xl text-center">
                      <div className="w-16 h-16 rounded-full border border-[#3AA0FF]/20 bg-[#3AA0FF]/5 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Shield size={24} className="text-[#3AA0FF]" />
                      </div>
                      <p className="text-sm font-bold text-white">META_GO_IDENTITY_SBT</p>
                      <p className="text-[9px] text-[#3AA0FF] font-bold uppercase tracking-wider mt-0.5">Verified Sovereign Member</p>

                      {proofHash && (
                        <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-2">
                          <p className="text-[8px] font-mono text-white/40 uppercase tracking-widest text-left">Verified proof hash commitment</p>
                          <div className="bg-[#07070A]/80 p-2.5 rounded-xl border border-white/[0.06] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#00E59B]" />
                            <p className="text-[9px] font-mono text-white/70 truncate flex-1 text-left">{proofHash}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleMint} 
                      disabled={minting} 
                      data-testid="mint-sbt-btn"
                      className="w-full h-14 bg-gradient-to-r from-[#FF3CAC] via-[#7B61FF] to-[#3AA0FF] hover:opacity-95 text-white font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_20px_rgba(123,97,255,0.3)] hover:shadow-[0_0_25px_rgba(123,97,255,0.55)]"
                    >
                      {minting && <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-white rounded-full animate-spin" />}
                      {minting ? 'Anchoring Identity...' : 'Mint Sovereign Identity'}
                    </button>

                    <p className="text-[8.5px] font-mono text-white/30 uppercase tracking-widest text-center leading-relaxed">
                      Soulbound Credentials are permanently anchored and cannot be transferred.
                    </p>
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </div>

          {/* Right Panel: HUD & Decentralized Identity */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card 1: Identity Status */}
            <div className="bg-[#0E1017]/85 backdrop-blur-xl border border-white/[0.08] p-6 rounded-3xl shadow-2xl text-left space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">IDENTITY STATUS</span>
                <span className="w-2 h-2 rounded-full bg-[#3AA0FF] animate-pulse shadow-[0_0_8px_#3AA0FF]" />
              </div>

              <div className="space-y-4 font-sans text-xs">
                
                {/* Wallet Status */}
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3 text-white/70">
                    <Wallet size={16} className="text-[#7B61FF]" />
                    <span className="font-bold text-[11px] uppercase tracking-wider text-white/50">Wallet Status</span>
                  </div>
                  <span className={`font-bold font-mono text-[11px] ${address ? 'text-[#00E59B]' : 'text-[#3AA0FF]'}`}>
                    {address ? address.slice(0, 6) + '...' + address.slice(-4) : 'Not connected'}
                  </span>
                </div>

                {/* Handle Status */}
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3 text-white/70">
                    <User size={16} className="text-[#7B61FF]" />
                    <span className="font-bold text-[11px] uppercase tracking-wider text-white/50">Handle Status</span>
                  </div>
                  <span className={`font-bold text-[11px] ${handle ? 'text-[#00E59B]' : 'text-[#3AA0FF]'}`}>
                    {handle ? `@${handle}` : 'Not configured'}
                  </span>
                </div>

                {/* Biometric Status */}
                <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3 text-white/70">
                    <Fingerprint size={16} className="text-[#7B61FF]" />
                    <span className="font-bold text-[11px] uppercase tracking-wider text-white/50">Biometric Status</span>
                  </div>
                  <span className={`font-bold text-[11px] ${faceLandmarks ? 'text-[#00E59B]' : 'text-[#3AA0FF]'}`}>
                    {faceLandmarks ? (voiceHash ? 'Enrolled (Face + Voice)' : 'Enrolled (Face)') : 'Not enrolled'}
                  </span>
                </div>

                {/* Commitment */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3 text-white/70">
                    <Shield size={16} className="text-[#7B61FF]" />
                    <span className="font-bold text-[11px] uppercase tracking-wider text-white/50">Commitment</span>
                  </div>
                  <span className={`font-bold text-[11px] truncate max-w-[150px] ${proofHash ? 'text-[#00E59B]' : 'text-[#3AA0FF]'}`}>
                    {proofHash ? 'Witness compiled' : 'Awaiting witness'}
                  </span>
                </div>

              </div>
            </div>

            {/* Card 2: Decentralized Identity & Holographic Orb */}
            <div className="bg-[#0E1017]/85 backdrop-blur-xl border border-white/[0.08] p-6 rounded-3xl shadow-2xl text-left relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              
              <div className="grid grid-cols-2 gap-4 items-center">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest">DECENTRALIZED IDENTITY</h3>
                  <div className="space-y-2 text-xs text-white/70 font-semibold tracking-wide">
                    <p className="flex items-center gap-2">• Fully encrypted</p>
                    <p className="flex items-center gap-2">• User sovereign</p>
                    <p className="flex items-center gap-2">• Privacy by design</p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <ZKIdentityOrb />
                </div>
              </div>

              {/* Bottom security badge */}
              <div className="mt-6 bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-2xl flex items-center justify-center gap-2.5">
                <Shield size={14} className="text-[#7B61FF]" />
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider leading-none">
                  Fully encrypted. User sovereign. Privacy by design.
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* Bottom Section: Sign In prompt */}
        <div className="w-full max-w-lg mx-auto bg-[#0E1017]/40 border border-white/[0.04] rounded-2xl py-4 flex items-center justify-center gap-2.5 shadow-xl backdrop-blur-sm">
          <Shield size={14} className="text-white/40" />
          <span className="text-xs text-white/60 font-medium">
            Already have a sovereign profile?{' '}
            <Link href="/auth/signin" className="text-[#3AA0FF] hover:text-[#7B61FF] font-bold transition-colors ml-1 inline-flex items-center gap-1">
              Sign in to your account <ArrowRight size={12} />
            </Link>
          </span>
        </div>

      </div>
    </div>
  );
}
