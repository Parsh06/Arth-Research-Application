import { create } from 'zustand';
import { supportRepository } from '../repositories/supportRepository';
import { useAuthStore } from './authStore';
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
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ tickets: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const userTickets = await supportRepository.getUserTickets(user.uid);
      set({ tickets: userTickets as unknown as SupportTicket[], isLoading: false });
    } catch (error) {
      console.error("Failed to fetch user support tickets:", error);
      set({ tickets: [], isLoading: false });
    }
  }
}));
