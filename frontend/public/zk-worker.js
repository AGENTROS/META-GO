// Web Worker for ZK proof generation — runs off the main thread for
// smooth UX on low-end devices. Falls back to deterministic simulation
// if circuit files or snarkjs are unavailable.

self.onmessage = async (e) => {
  const { biometricHash, walletSecret, timestamp, commitment, nullifier } = e.data;
  try {
    // Heavy compute happens here in worker thread.
    const snarkjs = await import('snarkjs');
    const input = {
      biometricHash: String(biometricHash),
      walletSecret: String(walletSecret),
      timestamp: String(timestamp),
      commitment: String(commitment),
      nullifier: String(nullifier),
    };
    const start = performance.now();
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      '/circuits/identity.wasm',
      '/circuits/identity_0001.zkey',
    );
    self.postMessage({ ok: true, proof, publicSignals, elapsed: performance.now() - start });
  } catch (err) {
    self.postMessage({ ok: false, error: String(err) });
  }
};
