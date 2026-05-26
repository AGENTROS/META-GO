import { createConfig, http } from 'wagmi';
import { polygon, polygonAmoy, hardhat, mainnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const SUPPORTED_CHAINS = [polygonAmoy, polygon, hardhat, mainnet] as const;
export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(c => c.id);

export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon, hardhat, mainnet],
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
    [mainnet.id]: http(),
  },
  ssr: true,
});

export const CONTRACTS = {
  IDENTITY_REGISTRY: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDR || '0x0000000000000000000000000000000000000000',
  SBT: process.env.NEXT_PUBLIC_SBT_ADDR || '0x0000000000000000000000000000000000000000',
  VAULT: process.env.NEXT_PUBLIC_VAULT_ADDR || '0x0000000000000000000000000000000000000000',
};

export const DEFAULT_CHAIN_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 80002);
