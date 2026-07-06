import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setJWTToken } from '@/lib/tokenManager';

function recalculateMetrics(state: any) {
  if (!state.identityMetrics) return null;
  const sbts = state.soulboundTokens || [];
  const creds = state.credentials || [];
  const peers = state.peers || [];
  const activeSbtCount = sbts.filter((t: any) => t.status === 'VALID' || t.status === 'ACTIVE').length;
  const activeCredCount = creds.filter((c: any) => c.revocationStatus === 'VALID').length;
  const dynamicTrust = Math.min(100, Math.floor(65 + (activeSbtCount * 6) + (activeCredCount * 3) + (peers.length * 2)));
  const dynamicSovereignty = Math.min(100, Math.floor(70 + (activeSbtCount * 4)));
  const dynamicSecurity = Math.min(100, Math.floor(60 + (activeSbtCount > 0 ? 15 : 0) + (state.zkProof ? 15 : 0)));
  const dynamicIntegrity = Math.min(100, Math.floor(90 + (activeCredCount * 2)));
  const dynamicPresence = Math.min(100, Math.floor(50 + (activeSbtCount * 10)));
  return {
    sovereignty: dynamicSovereignty,
    trustScore: dynamicTrust,
    securityDepth: dynamicSecurity,
    dataIntegrity: dynamicIntegrity,
    presenceIndex: dynamicPresence,
  };
}

export interface SoulboundToken {
  id: string;
  name: string;
  issuer: string;
  issuedAt: number;
  expiresAt?: number;
  domain: 'GAMING' | 'ENTERPRISE' | 'EDUCATION' | 'COMMERCE';
  txHash: string;
  status: 'VALID' | 'EXPIRED' | 'REVOKED';
  description: string;
  chain: 'POLYGON' | 'ETHEREUM';
}

export interface Credential {
  id: string;
  name: string;
  issuer: string;
  issuedAt: number;
  expiresAt?: number;
  type: 'ON_CHAIN' | 'OFF_CHAIN';
  proofStrength: number;
  revocationStatus: 'VALID' | 'UNVERIFIED' | 'REVOKED';
  vcJson?: string;
  chain?: string;
  domain: string;
}

export interface Peer {
  address: string;
  trustWeight: number;
  direction: 'MUTUAL' | 'OUTBOUND' | 'INBOUND';
  sharedCredentials: number;
  trustScore: number;
}

export interface Notification {
  id: string;
  type: 'SBT_ISSUED' | 'THREAT_DETECTED' | 'PROOF_EXPIRING' | 'GUARDIAN_CONFIRMED' | 'SYSTEM';
  message: string;
  timestamp: number;
  read: boolean;
}

export interface LinkedAvatar {
  filename: string;
  linkedAt: number;
}

export interface ZKProofState {
  hash: string;
  algorithm: string;
  generatedAt: number;
  expiresAt: number;
  integrityScore: number;
}

interface IdentityStore {
  walletAddress: string | null;
  isAuthenticated: boolean;
  chainId: number | null;
  handle: string | null;
  did: string | null;
  fullDID: string | null;
  zkProof: ZKProofState | null;
  proofIntegrity: number;
  activeDomain: 'GAMING' | 'ENTERPRISE' | 'EDUCATION' | 'COMMERCE';
  soulboundTokens: SoulboundToken[];
  credentials: Credential[];
  peers: Peer[];
  linkedAvatar: LinkedAvatar | null;
  notifications: Notification[];
  unreadCount: number;
  wizardStep: number;
  guardians: string[];
  identityMetrics: {
    sovereignty: number;
    trustScore: number;
    securityDepth: number;
    dataIntegrity: number;
    presenceIndex: number;
  } | null;

  setWallet: (address: string, chainId: number) => void;
  setChainId: (chainId: number) => void;
  setHandle: (handle: string) => void;
  setDID: (did: string, fullDID: string) => void;
  setZKProof: (proof: ZKProofState) => void;
  setIdentityMetrics: (metrics: IdentityStore['identityMetrics']) => void;
  setActiveDomain: (domain: IdentityStore['activeDomain']) => void;
  addSBT: (token: SoulboundToken) => void;
  removeSBT: (id: string) => void;
  addCredential: (credential: Credential) => void;
  removeCredential: (id: string) => void;
  setPeers: (peers: Peer[]) => void;
  linkAvatar: (filename: string) => void;
  unlinkAvatar: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  setWizardStep: (step: number) => void;
  setGuardians: (guardians: string[]) => void;
  logout: () => void;
  hydrateMockData: () => void;
}

const INITIAL_STATE = {
  walletAddress: null,
  isAuthenticated: false,
  chainId: null,
  handle: null,
  did: null,
  fullDID: null,
  zkProof: null,
  proofIntegrity: 0,
  activeDomain: 'GAMING' as const,
  soulboundTokens: [],
  credentials: [],
  peers: [],
  linkedAvatar: null,
  notifications: [],
  unreadCount: 0,
  wizardStep: 0,
  guardians: [],
  identityMetrics: null,
};

function seedMetricsFromAddress(addr: string) {
  const segs = [addr.slice(2, 6), addr.slice(6, 10), addr.slice(10, 14), addr.slice(14, 18), addr.slice(18, 22)];
  const vals = segs.map(s => 50 + (parseInt(s, 16) % 50));
  return {
    sovereignty: vals[0],
    trustScore: vals[1],
    securityDepth: vals[2],
    dataIntegrity: vals[3],
    presenceIndex: vals[4],
  };
}

export const useIdentityStore = create<IdentityStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setWallet: (address, chainId) => set(state => {
        if (state.walletAddress === address && state.chainId === chainId && state.isAuthenticated) return state;
        return { walletAddress: address, isAuthenticated: true, chainId };
      }),
      setChainId: (chainId) => set(state => state.chainId === chainId ? state : { chainId }),
      setHandle: (handle) => set(state => state.handle === handle ? state : { handle }),
      setDID: (did, fullDID) => set(state => state.did === did && state.fullDID === fullDID ? state : { did, fullDID }),
      setZKProof: (proof) => set(state => state.zkProof?.hash === proof.hash ? state : { zkProof: proof, proofIntegrity: proof.integrityScore }),
      setIdentityMetrics: (metrics) => set(state => {
        if (state.identityMetrics?.trustScore === metrics?.trustScore &&
            state.identityMetrics?.sovereignty === metrics?.sovereignty &&
            state.identityMetrics?.securityDepth === metrics?.securityDepth &&
            state.identityMetrics?.dataIntegrity === metrics?.dataIntegrity &&
            state.identityMetrics?.presenceIndex === metrics?.presenceIndex) return state;
        return { identityMetrics: metrics };
      }),
      setActiveDomain: (domain) => set(state => state.activeDomain === domain ? state : { activeDomain: domain }),

      addSBT: (token) => set(state => {
        if (state.soulboundTokens.some(t => t.id === token.id)) return state;
        const newTokens = [...state.soulboundTokens, token];
        const nextState = { ...state, soulboundTokens: newTokens };
        return { soulboundTokens: newTokens, identityMetrics: recalculateMetrics(nextState) || state.identityMetrics };
      }),
      removeSBT: (id) => set(state => {
        const newTokens = state.soulboundTokens.filter(t => t.id !== id);
        const nextState = { ...state, soulboundTokens: newTokens };
        return { soulboundTokens: newTokens, identityMetrics: recalculateMetrics(nextState) || state.identityMetrics };
      }),

      addCredential: (credential) => set(state => {
        if (state.credentials.some(c => c.id === credential.id)) return state;
        const newCreds = [...state.credentials, credential];
        const nextState = { ...state, credentials: newCreds };
        return { credentials: newCreds, identityMetrics: recalculateMetrics(nextState) || state.identityMetrics };
      }),
      removeCredential: (id) => set(state => {
        const newCreds = state.credentials.filter(c => c.id !== id);
        const nextState = { ...state, credentials: newCreds };
        return { credentials: newCreds, identityMetrics: recalculateMetrics(nextState) || state.identityMetrics };
      }),

      setPeers: (peers) => set(state => {
        const nextState = { ...state, peers };
        return { peers, identityMetrics: recalculateMetrics(nextState) || state.identityMetrics };
      }),

      linkAvatar: (filename) => set({ linkedAvatar: { filename, linkedAt: Date.now() } }),
      unlinkAvatar: () => set({ linkedAvatar: null }),

      addNotification: (notification) => {
        const newNotif: Notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now(),
          read: false,
          ...notification,
        };
        set(state => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }));
      },
      markNotificationRead: (id) => set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),
      markAllRead: () => set(state => ({ notifications: state.notifications.map(n => ({ ...n, read: true })), unreadCount: 0 })),
      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
      setWizardStep: (step) => set({ wizardStep: step }),
      setGuardians: (guardians) => set({ guardians }),

      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'celestial_auth=; Max-Age=0; path=/';
          document.cookie = 'celestial_admin=; Max-Age=0; path=/';
        }
        set(INITIAL_STATE);
        setJWTToken(null);
      },

      hydrateMockData: () => set(state => {
        if (!state.walletAddress || state.soulboundTokens.length > 0) return state;
        const addr = state.walletAddress;
        const sbts: SoulboundToken[] = [
          {
            id: 'sbt-genesis',
            name: 'Genesis Citizen',
            issuer: 'Meta Go Authority',
            issuedAt: Date.now() - 86400000 * 7,
            domain: 'GAMING',
            txHash: '0x' + addr.slice(2).padEnd(64, '0').slice(0, 64),
            status: 'VALID',
            description: 'Verified founding member of the Meta Go protocol with biometric ZK proof.',
            chain: 'POLYGON',
          },
        ];
        const creds: Credential[] = [
          {
            id: 'cred-zk-attestation',
            name: 'ZK Biometric Attestation',
            issuer: 'Meta Go Protocol',
            issuedAt: Date.now() - 86400000 * 3,
            type: 'ON_CHAIN',
            proofStrength: 92,
            revocationStatus: 'VALID',
            domain: 'IDENTITY',
            chain: 'POLYGON',
          },
        ];
        const peers: Peer[] = [
          { address: '0x' + addr.slice(2, 8) + '...a3f2', trustWeight: 0.8, direction: 'MUTUAL', sharedCredentials: 2, trustScore: 88 },
          { address: '0x' + addr.slice(4, 10) + '...b7c9', trustWeight: 0.5, direction: 'OUTBOUND', sharedCredentials: 1, trustScore: 72 },
          { address: '0x' + addr.slice(6, 12) + '...d4e1', trustWeight: 0.65, direction: 'INBOUND', sharedCredentials: 1, trustScore: 81 },
        ];
        const metrics = seedMetricsFromAddress(addr);
        return { soulboundTokens: sbts, credentials: creds, peers, identityMetrics: metrics };
      }),
    }),
    {
      name: 'metago-identity-store',
      partialize: (state) => ({
        walletAddress: state.walletAddress,
        isAuthenticated: state.isAuthenticated,
        handle: state.handle,
        did: state.did,
        fullDID: state.fullDID,
        activeDomain: state.activeDomain,
        soulboundTokens: state.soulboundTokens,
        credentials: state.credentials,
        peers: state.peers,
        linkedAvatar: state.linkedAvatar,
        identityMetrics: state.identityMetrics,
        guardians: state.guardians,
      }),
    }
  )
);
