import { create } from 'zustand';

interface AvatarState {
  activeAvatarId: string | null;
  provider: string | null;
  thumbnail: string | null;
  setAvatar: (id: string, provider: string, thumbnail: string) => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  activeAvatarId: null,
  provider: null,
  thumbnail: null,
  setAvatar: (id, provider, thumbnail) => set({ activeAvatarId: id, provider, thumbnail }),
}));
