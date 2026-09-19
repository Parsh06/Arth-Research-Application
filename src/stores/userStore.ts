import { create } from 'zustand';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types/models';

interface UserState {
  allUsers: User[];
  isLoadingUsers: boolean;
  
  fetchAllUsers: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  allUsers: [],
  isLoadingUsers: false,

  fetchAllUsers: async () => {
    set({ isLoadingUsers: true });
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as User));
      set({ allUsers: users, isLoadingUsers: false });
    } catch (e) {
      console.error("Error fetching all users", e);
      set({ isLoadingUsers: false });
    }
  }
}));
