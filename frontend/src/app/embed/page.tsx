'use client';
import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { WalletConnector } from '@/components/auth/WalletConnector';
import dynamic from 'next/dynamic';
const BiometricScanner = dynamic(
  () => import('@/components/auth/BiometricScanner').then(mod => mod.BiometricScanner),
  { ssr: false }
);
import { ZKPForge } from '@/components/auth/ZKPForge';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { checkHandleAvailability } from '@/lib/bloomFilter';
import { CheckCircle2, Fingerprint, XCircle } from 'lucide-react';
import { useIdentityStore } from '@/store/useIdentityStore';

function generateSecureNonce(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2, 15);
}

function parseJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function EmbedPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const store = useIdentityStore();
  const [step, setStep] = useState(0);
  const [startedAt] = useState(Date.now());
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle');
  const [faceLandmarks, setFaceLandmarks] = useState<number[][] | null>(null);
  const [proofHash, setProofHash] = useState('');
  const [done, setDone] = useState(false);
  const [operationId] = useState(() => 'op-' + generateSecureNonce());

  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [validatedParentOrigin, setValidatedParentOrigin] = useState<string | null>(null);
  const activeNonceRef = useRef<string | null>(null);

  useEffect(() => {
    if (window.parent && window.parent !== window) {
      let parentOrigin = '';
      if (typeof document !== 'undefined' && document.referrer) {
        try {
          parentOrigin = new URL(document.referrer).origin;
        } catch (e) {}
      }

      const rawOrigins = process.env.NEXT_PUBLIC_APPROVED_EMBED_ORIGINS || '';
      const APPROVED_ORIGINS = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
      const isAllowed = parentOrigin && (APPROVED_ORIGINS.includes(parentOrigin) || parentOrigin === window.location.origin);

      if (!isAllowed) {
        setAuthError("Authentication Error: Parent origin is unauthorized or unvalidated.");
        return;
      }

      setValidatedParentOrigin(parentOrigin);

      const handshakeNonce = generateSecureNonce();
      activeNonceRef.current = handshakeNonce;

      const expirationTimeout = setTimeout(() => {
        if (activeNonceRef.current === handshakeNonce) {
          activeNonceRef.current = null;
          setAuthError("Authentication Error: Handshake timed out.");
        }
      }, 10000);

      const handleTokenDelivery = (event: MessageEvent) => {
        if (event.origin !== parentOrigin) return;
        const msg = event.data;
        if (msg && msg.type === 'metago:token') {
          if (msg.nonce !== handshakeNonce) {
            setAuthError("Authentication Error: Nonce mismatch.");
            return;
          }
          if (msg.token) {
            const parsed = parseJWT(msg.token);
            if (!parsed || !parsed.exp || parsed.exp < Date.now() / 1000) {
              setAuthError("Authentication Error: Expired token.");
              return;
            }
            setJwtToken(msg.token);
          }
          clearTimeout(expirationTimeout);
          window.removeEventListener('message', handleTokenDelivery);
        }
      };
      window.addEventListener('message', handleTokenDelivery);
      window.parent.postMessage({ type: 'metago:request-token', nonce: handshakeNonce }, parentOrigin);
    }
  }, []);

  async function checkHandle(val: string) {
    setHandle(val);
    if (val.length < 3) { setHandleStatus('idle'); return; }
    setHandleStatus('checking');
    const { available } = await checkHandleAvailability(val);
    setHandleStatus(available ? 'available' : 'taken');
  }

  function finish(realProof: any, hash: string) {
    setProofHash(hash);
    const did = `did:metago:${address?.toLowerCase()}`;
    store.setHandle(handle);
    store.setDID(did, `did:metago:polygon:${address?.toLowerCase()}`);
    if (process.env.NEXT_PUBLIC_TEST_MODE === '1') {
      store.hydrateMockData();
    }

    // Sync with backend (best effort) and trigger real on-chain mint
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwtToken) {
      syncHeaders['Authorization'] = `Bearer ${jwtToken}`;
    }

    fetch(`${backend}/api/user/sync`, {
      method: 'POST', credentials: 'include',
      headers: syncHeaders,
      body: JSON.stringify({
        handle, walletAddress: address, did,
        operationId,
        zkProof: {
          proofHash: hash,
          nullifier: realProof?.nullifier || `nul-${Date.now()}`,
          algorithm: realProof?.algorithm || 'simulation-bn128',
          isReal: !!realProof?.isReal,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
          integrityScore: realProof?.integrityScore || 85,
        },
      }),
    }).catch(() => {});

    setDone(true);
    // Post message to parent with validated target origin
    if (window.parent && window.parent !== window) {
      let targetOrigin = validatedParentOrigin;
      if (!targetOrigin && typeof window !== 'undefined') {
        let parentOrigin = '';
        if (typeof document !== 'undefined' && document.referrer) {
          try {
            parentOrigin = new URL(document.referrer).origin;
          } catch (e) {}
        }
        const rawOrigins = process.env.NEXT_PUBLIC_APPROVED_EMBED_ORIGINS || '';
        const APPROVED_ORIGINS = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
        const isAllowed = parentOrigin && (APPROVED_ORIGINS.includes(parentOrigin) || parentOrigin === window.location.origin);
        if (isAllowed) {
          targetOrigin = parentOrigin;
        }
      }
      
      if (targetOrigin) {
        window.parent.postMessage({
          type: 'metago:identity-forged',
          did, handle, proofHash: hash,
          durationMs: Date.now() - startedAt,
        }, targetOrigin);
      } else {
        console.error("Could not post message: parent origin is not validated.");
      }
    }
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full border border-red-500/20 bg-red-950/10 p-6 rounded-xl space-y-4">
          <XCircle className="text-red-500 mx-auto w-12 h-12" />
          <h2 className="text-lg font-bold text-red-400">Authentication Error</h2>
          <p className="text-xs text-zinc-400">{authError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950/20 flex flex-col">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-600/30 flex items-center justify-center">
          <Fingerprint size={14} className="text-blue-600" />
        </div>
        <span className="font-bold text-sm">Meta<span className="text-blue-600"> Go</span></span>
        <span className="ml-auto text-[10px] font-mono uppercase text-zinc-500">embed v1.0</span>
      </div>

      <main className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="flex justify-between mb-4">
          {['Handle', 'Wallet', 'Face', 'ZK Proof', 'Done'].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500'
              }`}>{i + 1}</div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${i === step ? 'text-blue-600' : 'text-zinc-400'}`}>{s}</span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Pick your handle</h2>
            <p className="text-xs text-zinc-500">This is your unique identifier on Meta Go.</p>
            <div className="relative">
              <NeonInput value={handle} onChange={e => checkHandle(e.target.value.toLowerCase())}
                placeholder="username" data-testid="embed-handle"
                icon={<span className="text-zinc-450 text-sm font-semibold">@</span>} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {handleStatus === 'checking' && <div className="w-3 h-3 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />}
                {handleStatus === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {handleStatus === 'taken' && <XCircle size={16} className="text-red-500" />}
              </div>
            </div>
            <NeonButton onClick={() => setStep(1)} disabled={handleStatus !== 'available'} className="w-full">Continue →</NeonButton>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Connect your wallet</h2>
            <WalletConnector onSuccess={() => setStep(2)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Liveness scan</h2>
            <BiometricScanner onComplete={lm => { setFaceLandmarks(lm); setStep(3); }} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Generating proof…</h2>
            <ZKPForge faceLandmarks={faceLandmarks} walletAddress={address || ''}
              onComplete={(hash, realProof) => { finish(realProof, hash); setStep(4); }} />
          </div>
        )}

        {step === 4 && done && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Identity Forged</h2>
            <p className="text-xs text-zinc-500 mb-4 font-mono break-all">{proofHash}</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">@{handle} is now verified on the Meta Go protocol.</p>
          </div>
        )}
      </main>
    </div>
  );
}
