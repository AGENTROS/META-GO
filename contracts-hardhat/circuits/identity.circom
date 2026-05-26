pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

// =============================================================================
// Meta Go Identity Circuit
// =============================================================================
// Proves the following knowledge claims:
//   1. The prover knows a biometric hash B and a wallet secret W
//   2. The Poseidon commitment C = Poseidon(B, W) equals the public input
//   3. The nullifier N = Poseidon(B, W, timestamp) is correctly bound
//   4. The timestamp is within the valid window (anti-replay)
//
// Public inputs:
//   commitment   — Poseidon(biometricHash, walletSecret)
//   nullifier    — Poseidon(biometricHash, walletSecret, timestamp)
//   minTimestamp — earliest valid window edge
//   maxTimestamp — latest valid window edge
//
// Private inputs:
//   biometricHash — hash of the 468-point face mesh (computed in browser)
//   walletSecret  — secret derived from wallet address (HKDF-like)
//   timestamp     — UNIX seconds at proof generation
//
// =============================================================================

template MetaGoIdentity() {
    // Private inputs
    signal input biometricHash;
    signal input walletSecret;
    signal input timestamp;

    // Public inputs
    signal input commitment;
    signal input nullifier;
    signal input minTimestamp;
    signal input maxTimestamp;

    // 1. Commitment binds biometric + wallet
    component commitHasher = Poseidon(2);
    commitHasher.inputs[0] <== biometricHash;
    commitHasher.inputs[1] <== walletSecret;
    commitment === commitHasher.out;

    // 2. Nullifier additionally binds timestamp (one-time-use proof)
    component nullifierHasher = Poseidon(3);
    nullifierHasher.inputs[0] <== biometricHash;
    nullifierHasher.inputs[1] <== walletSecret;
    nullifierHasher.inputs[2] <== timestamp;
    nullifier === nullifierHasher.out;

    // 3. Timestamp must be within window
    component lowerCheck = GreaterEqThan(64);
    lowerCheck.in[0] <== timestamp;
    lowerCheck.in[1] <== minTimestamp;
    lowerCheck.out === 1;

    component upperCheck = LessEqThan(64);
    upperCheck.in[0] <== timestamp;
    upperCheck.in[1] <== maxTimestamp;
    upperCheck.out === 1;
}

component main { public [commitment, nullifier, minTimestamp, maxTimestamp] } = MetaGoIdentity();
