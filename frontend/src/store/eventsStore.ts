import { create } from 'zustand';

interface EventStoreState {
  events: any[];
  setEvents: (events: any[]) => void;
}

export const useEventsStore = create<EventStoreState>((set) => ({
  events: [],
  setEvents: (events) => set({ events }),
}));
