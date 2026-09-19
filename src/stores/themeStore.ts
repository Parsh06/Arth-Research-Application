// src/stores/themeStore.ts
import { create } from 'zustand';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme, persistToDb?: boolean) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // Default to luxury dark institutional theme

  setTheme: (theme: Theme, persistToDb: boolean = true) => {
    localStorage.setItem('arth_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });

    // If user is logged in and persistToDb is true, update user doc in Firestore
    if (persistToDb && auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      updateDoc(userRef, { 
        theme, 
        updatedAt: new Date().toISOString() 
      }).catch(err => {
        console.warn("Could not persist theme to Firestore:", err);
      });
    }
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next, true);
  },

  initTheme: () => {
    const saved = localStorage.getItem('arth_theme') as Theme | null;
    if (saved) {
      get().setTheme(saved, false);
    } else {
      // Default to dark mode for institutional look
      get().setTheme('dark', false);
    }
  }
}));
