import { create } from 'zustand';
import type { SupportTicket } from '../types/models';

interface SupportState {
  tickets: SupportTicket[];
  isLoading: boolean;
  
  fetchTickets: () => Promise<void>;
}

export const useSupportStore = create<SupportState>((set) => ({
  tickets: [],
  isLoading: false,

  fetchTickets: async () => {
    // Mock for now until repository is fully wired up
    set({ isLoading: true });
    setTimeout(() => {
      set({ tickets: [], isLoading: false });
    }, 500);
  }
}));
