import { create } from 'zustand';

interface PassportState {
  verificationStatus: string;
  humanityStatus: string;
  walletLinks: string[];
  setPassportData: (data: Partial<PassportState>) => void;
}

export const usePassportStore = create<PassportState>((set) => ({
  verificationStatus: 'unverified',
  humanityStatus: 'pending',
  walletLinks: [],
  setPassportData: (data) => set((state) => ({ ...state, ...data })),
}));
