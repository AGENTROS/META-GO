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
  const biometricHash = landmarksToHash(landmarks);
  const walletSecret = addressToSecret(walletAddress);
  const ts = BigInt(Math.floor(Date.now() / 1000));
  const commitment = poseidonSimHash([biometricHash, walletSecret]);
  const nullifier = poseidonSimHash([biometricHash, walletSecret, ts]);

  // Attempt real snarkjs Groth16. If circuit files absent or any failure, fall back.
  let real = false;
  let proof: any = null;
  let publicSignals: any = null;

  try {
    const snarkjs: any = await Promise.race([
      // @ts-ignore
      import('snarkjs').catch(() => null),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500)),
    ]);
    if (snarkjs) {
      const input = {
        biometricHash: biometricHash.toString(),
        walletSecret: walletSecret.toString(),
        timestamp: ts.toString(),
        commitment: commitment.toString(),
        nullifier: nullifier.toString(),
      };
      const res = await Promise.race([
        snarkjs.groth16.fullProve(input, '/circuits/identity.wasm', '/circuits/identity_0001.zkey'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
      ]);
      proof = (res as any).proof;
      publicSignals = (res as any).publicSignals;
      real = true;
    }
  } catch {
    real = false;
  }

  if (!real) {
    // Simulation proof - deterministic, browser-only, no on-chain validity.
    proof = {
      pi_a: [commitment.toString(), nullifier.toString(), '1'],
      pi_b: [[commitment.toString(), nullifier.toString()], [biometricHash.toString(), walletSecret.toString()], ['1', '0']],
      pi_c: [walletSecret.toString(), biometricHash.toString(), '1'],
      protocol: 'groth16',
      curve: 'bn128',
    };
    publicSignals = [commitment.toString(), nullifier.toString(), '1', ts.toString()];
  }

  const hashShort = commitment.toString(16).padStart(64, '0').slice(0, 60);
  const proofHash = real ? `ZK-SNARK-0x${hashShort}` : `SIM-SNARK-${hashShort}`;

  return {
    proofHash,
    proof,
    publicSignals,
    nullifier: nullifier.toString(),
    algorithm: real ? 'groth16-bn128' : 'simulation-bn128',
    isReal: real,
    integrityScore: real ? 100 : 85,
    generatedAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 3600 * 1000,
  };
}
