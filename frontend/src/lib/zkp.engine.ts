// ZK Proof Generation Engine
// Tries real Groth16 via snarkjs (if circuits exist). Falls back to deterministic simulation.

export interface ZKProofResult {
  proofHash: string;
  proof: any;
  publicSignals: any;
  nullifier: string;
  algorithm: string;
  isReal: boolean;
  integrityScore: number;
  generatedAt: number;
  expiresAt: number;
}

function poseidonSimHash(values: (string | number | bigint)[]): bigint {
  // Deterministic non-cryptographic hash used as a simulation stand-in.
  let acc = BigInt(0x12345);
  for (const v of values) {
    const x = typeof v === 'bigint' ? v : BigInt(typeof v === 'number' ? Math.floor(v) : parseInt(String(v).slice(0, 12), 36) || 1);
    acc = (acc * BigInt(31) + x) % BigInt('0x30644E72E131A029B85045B68181585D2833E84879B9709143E1F593F0000001');
  }
  return acc;
}

export function landmarksToHash(landmarks: number[][] | null): bigint {
  if (!landmarks || landmarks.length === 0) {
    return BigInt(Math.floor(Math.random() * 1e15));
  }
  const flat: number[] = [];
  for (const p of landmarks) flat.push(...p);
  return poseidonSimHash(flat.slice(0, 100));
}

export function addressToSecret(addr: string): bigint {
  if (!addr) return BigInt(0);
  return BigInt('0x' + addr.replace('0x', '').slice(0, 32).padEnd(32, '0'));
}

export async function generateZKProof(landmarks: number[][] | null, walletAddress: string): Promise<ZKProofResult> {
  let real = false;
  let proof: any = null;
  let publicSignals: any = null;

  let biometricHashVal = landmarksToHash(landmarks);
  let walletSecretVal = addressToSecret(walletAddress);
  let tsVal = BigInt(Math.floor(Date.now() / 1000));
  let commitmentVal = poseidonSimHash([biometricHashVal, walletSecretVal]);
  let nullifierVal = poseidonSimHash([biometricHashVal, walletSecretVal, tsVal]);

  try {
    const circomlibjs = await import('circomlibjs');
    const poseidonBuilder = await circomlibjs.buildPoseidon();
    
    // Compute real cryptographic values
    const realBiometricHash = await landmarksToRealHash(landmarks);
    const realWalletSecret = walletSecretVal;
    const realTs = tsVal;
    
    // Real Poseidon commitments
    const cHash = poseidonBuilder([realBiometricHash, realWalletSecret]);
    const realCommitment = BigInt(poseidonBuilder.F.toString(cHash));
    
    const nHash = poseidonBuilder([realBiometricHash, realWalletSecret, realTs]);
    const realNullifier = BigInt(poseidonBuilder.F.toString(nHash));

    // Time window bounds (timestamp must fall between minTimestamp and maxTimestamp)
    const minTimestamp = realTs - BigInt(3600); // 1 hour window
    const maxTimestamp = realTs + BigInt(3600);

    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === '1';
    const snarkjs: any = await Promise.race([
      // @ts-ignore
      import('snarkjs').catch(() => null),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500)),
    ]);

    if (!isTestMode && (!snarkjs || !snarkjs.groth16)) {
      throw new Error('SnarkJS library failed to load or initialize in production mode.');
    }

    if (snarkjs && snarkjs.groth16) {
      const input = {
        biometricHash: realBiometricHash.toString(),
        walletSecret: realWalletSecret.toString(),
        timestamp: realTs.toString(),
        commitment: realCommitment.toString(),
        nullifier: realNullifier.toString(),
        minTimestamp: minTimestamp.toString(),
        maxTimestamp: maxTimestamp.toString(),
      };
      
      const res = await Promise.race([
        snarkjs.groth16.fullProve(input, '/circuits/identity.wasm', '/circuits/identity_0001.zkey'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000)),
      ]);

      if (!isTestMode && (!res || !(res as any).proof)) {
        throw new Error('Failed to generate real ZK SnarkJS proof parameters.');
      }
      
      proof = (res as any).proof;
      publicSignals = (res as any).publicSignals;
      real = true;
      biometricHashVal = realBiometricHash;
      commitmentVal = realCommitment;
      nullifierVal = realNullifier;
    }
  } catch (err) {
    console.warn('Real ZK proof generation failed, falling back to simulated proof:', err);
    real = false;
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === '1';
    if (!isTestMode) {
      throw new Error(`ZK proof generation failed: SnarkJS proving error. Details: ${err}`);
    }
  }

  if (!real) {
    // Simulation proof - deterministic, browser-only, no on-chain validity.
    proof = {
      pi_a: [commitmentVal.toString(), nullifierVal.toString(), '1'],
      pi_b: [[commitmentVal.toString(), nullifierVal.toString()], [biometricHashVal.toString(), walletSecretVal.toString()], ['1', '0']],
      pi_c: [walletSecretVal.toString(), biometricHashVal.toString(), '1'],
      protocol: 'simulation',
      curve: 'bn128',
    };
    publicSignals = [commitmentVal.toString(), nullifierVal.toString(), '1', tsVal.toString()];
  }

  const hashShort = commitmentVal.toString(16).padStart(64, '0').slice(0, 60);
  const proofHash = real ? `ZK-SNARK-0x${hashShort}` : `SIM-SNARK-${hashShort}`;

  return {
    proofHash,
    proof,
    publicSignals,
    nullifier: nullifierVal.toString(),
    algorithm: real ? 'groth16-bn128' : 'simulation-bn128',
    isReal: real,
    integrityScore: real ? 100 : 85,
    generatedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
  };
}

async function landmarksToRealHash(landmarks: number[][] | null): Promise<bigint> {
  if (!landmarks || landmarks.length === 0) {
    return BigInt(123456789);
  }
  const flat: number[] = [];
  for (const p of landmarks) flat.push(...p);
  
  // We hash the coordinates using SHA-256 to map arbitrary length to a single BN128 scalar
  const encoder = new TextEncoder();
  const data = encoder.encode(flat.join(','));
  let hashBuffer;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  } else {
    // Node fallback for tests / SSR
    const crypto = require('crypto');
    hashBuffer = crypto.createHash('sha256').update(flat.join(',')).digest();
  }
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const bn = BigInt('0x' + hex);
  const r = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
  return bn % r;
}
