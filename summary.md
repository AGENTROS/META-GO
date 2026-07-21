# MetaGo Project Summary & Architecture Document

MetaGo is a decentralized sovereign identity and verification protocol. It integrates local WebGL biometric face-mesh extraction, Poseidon zero-knowledge commitments, and on-chain Soulbound Tokens (SBTs) to provide secure, privacy-preserving identity attestation.

---

## 1. Directory Layout

- **`frontend/`**: Next.js application built with TypeScript, React, and Tailwind CSS.
  - `src/components/auth/`: Contains the biometric scanning pipeline (`BiometricScanner.tsx`, `BiometricVerificationPipeline.tsx`).
  - `src/hooks/`: Custom state hooks like `useSIWE.ts` for signing in.
- **`backend/`**: Python FastAPI microservice providing off-chain identity verification and blockchain relayer features.
  - `server.py`: FastAPI server exposing authentication, DID resolution, and proof verification endpoints.
  - `tests/`: Pytest integration and performance testing suite.
- **`contracts-hardhat/`**: EVM smart contract and ZK-SNARK compilation directory.
  - `contracts/`: Solidity smart contracts (`IdentityRegistry.sol`, `CredentialVault.sol`, `Verifier.sol`).
  - `circuits/`: Circom circuits (`identity.circom`) for generating Zero-Knowledge proofs.
  - `scripts/`: Deployment and testing scripts.
- **`sdk/`**: SDK module to simplify third-party client integrations.

---

## 2. Key Tech Stack & Libraries

- **Frontend**: Next.js 16, React, Wagmi/Viem (Web3 Provider), Tailwind CSS, TensorFlow.js (FaceMesh liveness detection).
- **Backend**: FastAPI, PyMongo (for audit logs/metadata), PyJWT, Web3.py (relayer interaction), Python SIWE (Sign-in with Ethereum).
- **Blockchain & ZK**: Hardhat (EVM simulator), Solidity, Circom / SnarkJS (Groth16 Zero-Knowledge proof generation).

---

## 3. Local Startup & Run Steps

### Step 1: Start local blockchain node
Navigate to the `contracts-hardhat/` directory and spin up a Hardhat network node:
```bash
cd contracts-hardhat
npm install
npx hardhat node
```

### Step 2: Deploy smart contracts
In a separate terminal, deploy the registry and verifier contracts onto the local node:
```bash
cd contracts-hardhat
npx hardhat run scripts/deploy.ts --network localhost
```

### Step 3: Run the FastAPI backend
Navigate to the `backend/` directory, set up your python environment, and start the FastAPI uvicorn server:
```bash
cd backend
# Create virtual environment if not exists
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run backend in test mode
$env:TEST_MODE="1"
$env:DEPLOYER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
python -m uvicorn backend.server:app --port 8001 --host 0.0.0.0
```

### Step 4: Run the Next.js frontend
Navigate to the `frontend/` directory, install dependencies, and start the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
