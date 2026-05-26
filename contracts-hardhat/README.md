# Meta Go — Smart Contracts (Hardhat)

This folder contains the Solidity sources for the Meta Go DZBIP protocol.

## Contracts
- **Groth16Verifier.sol** — Mock ZK verifier (replace with `snarkjs zkey export solidityverifier`)
- **IdentityRegistry.sol** — DID + handle anchoring with on-chain ZK proof verification
- **CelestialSBT.sol** — Non-transferable Soulbound Token
- **CredentialVault.sol** — Off-chain Verifiable Credential anchoring

## Local Hardhat deployment

```bash
cd contracts-hardhat
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init        # accept defaults
npx hardhat node        # leaves a local chain running on 127.0.0.1:8545
npx hardhat run scripts/deploy.ts --network localhost
```

## Polygon Amoy deployment

1. Get testnet POL from [faucet.polygon.technology](https://faucet.polygon.technology/)
2. Set `PRIVATE_KEY` and `AMOY_RPC_URL` in `.env`
3. `npx hardhat run scripts/deploy.ts --network amoy`
4. Copy deployed addresses into `/app/frontend/.env`:
   ```
   NEXT_PUBLIC_IDENTITY_REGISTRY_ADDR=0x...
   NEXT_PUBLIC_SBT_ADDR=0x...
   NEXT_PUBLIC_VAULT_ADDR=0x...
   ```
5. Restart frontend: `sudo supervisorctl restart frontend`

The frontend will detect non-zero contract addresses and submit real on-chain
mint transactions through MetaMask instead of running in simulation mode.
