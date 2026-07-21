import { create } from 'zustand';

interface TrustState {
  compositeScore: number;
  humanityScore: number;
  riskScore: number;
  fraudProbability: number;
  setTrustMetrics: (metrics: Partial<TrustState>) => void;
}

export const useTrustStore = create<TrustState>((set) => ({
  compositeScore: 0,
  humanityScore: 0,
  riskScore: 0,
  fraudProbability: 0,
  setTrustMetrics: (metrics) => set((state) => ({ ...state, ...metrics })),
}));
