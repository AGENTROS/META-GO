import { create } from 'zustand';

interface GuardianState {
  recommendations: any[];
  status: string;
  setRecommendations: (recs: any[]) => void;
  setStatus: (status: string) => void;
}

export const useGuardianStore = create<GuardianState>((set) => ({
  recommendations: [],
  status: 'idle',
  setRecommendations: (recs) => set({ recommendations: recs }),
  setStatus: (status) => set({ status }),
}));
