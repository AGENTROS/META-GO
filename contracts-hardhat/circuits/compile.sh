#!/usr/bin/env bash
# =============================================================================
# Meta Go — Circom Circuit Compilation Pipeline
# =============================================================================
# Compiles identity.circom into the WASM + zkey artefacts the browser uses
# for client-side zk-SNARK proof generation.
#
# Prerequisites (install once):
#   1. Install Rust:    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
#   2. Install circom:  cargo install --git https://github.com/iden3/circom.git
#   3. Install snarkjs: npm install -g snarkjs
#   4. Install circomlib:  npm install circomlib
#
# Usage:  bash compile.sh
# Output: identity.wasm, identity_0001.zkey, verification_key.json
#         (copied automatically to /app/frontend/public/circuits/)
# =============================================================================

set -euo pipefail
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$BASE_DIR/build"
PUBLIC_DIR="/app/frontend/public/circuits"
PTAU_SIZE=12  # supports up to 2^12 constraints (more than enough)

mkdir -p "$OUT_DIR" "$PUBLIC_DIR"
cd "$BASE_DIR"

echo "▶ Compiling identity.circom..."
circom identity.circom --r1cs --wasm --sym -o "$OUT_DIR" \
  -l "$(npm root -g)" -l "./node_modules"

echo "▶ Downloading powers-of-tau (one-time)..."
PTAU_FILE="$OUT_DIR/pot${PTAU_SIZE}_final.ptau"
if [ ! -f "$PTAU_FILE" ]; then
  curl -L -o "$PTAU_FILE" "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PTAU_SIZE}.ptau"
fi

echo "▶ Generating proving key (Groth16 phase 2)..."
snarkjs groth16 setup "$OUT_DIR/identity.r1cs" "$PTAU_FILE" "$OUT_DIR/identity_0000.zkey"

echo "▶ Contributing to phase 2 ceremony..."
snarkjs zkey contribute "$OUT_DIR/identity_0000.zkey" "$OUT_DIR/identity_0001.zkey" \
  --name="meta-go-1" -v -e="$(date +%s%N)"

echo "▶ Exporting verification key..."
snarkjs zkey export verificationkey "$OUT_DIR/identity_0001.zkey" "$OUT_DIR/verification_key.json"

echo "▶ Exporting Solidity verifier (replaces mock)..."
snarkjs zkey export solidityverifier "$OUT_DIR/identity_0001.zkey" "$BASE_DIR/contracts/Groth16Verifier.sol"

echo "▶ Copying artefacts to frontend public/circuits/..."
cp "$OUT_DIR/identity_js/identity.wasm" "$PUBLIC_DIR/identity.wasm"
cp "$OUT_DIR/identity_0001.zkey" "$PUBLIC_DIR/identity_0001.zkey"
cp "$OUT_DIR/verification_key.json" "$PUBLIC_DIR/verification_key.json"

echo ""
echo "✅ Circuit compilation complete!"
echo "   WASM:           $PUBLIC_DIR/identity.wasm"
echo "   Proving key:    $PUBLIC_DIR/identity_0001.zkey"
echo "   Verification:   $PUBLIC_DIR/verification_key.json"
echo "   Verifier.sol:   $BASE_DIR/contracts/Groth16Verifier.sol  (replaces mock)"
echo ""
echo "Next: redeploy contracts with the real verifier:"
echo "      cd $BASE_DIR && npm run deploy:amoy"
