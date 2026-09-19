import { create } from 'zustand';
import { type User as FirebaseUser, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { portfolioRepository } from '../repositories/portfolioRepository';

import { SubscriptionStatus, Role } from '../types/models';

interface AuthState {
  user: FirebaseUser | null;
  dbUser: any | null;
  isAdmin: boolean;
  isInitializing: boolean;
  subscriptionStatus: SubscriptionStatus;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initAuthListener: () => void;
}

const authChannel = new BroadcastChannel('auth_sync_channel');

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  dbUser: null,
  isAdmin: false,
  isInitializing: true,
  subscriptionStatus: SubscriptionStatus.NONE,

  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      let dbUser = null;
      if (userSnap.exists()) {
        dbUser = userSnap.data();
      } else {
        const now = new Date().toISOString();
        const initialTheme = (localStorage.getItem('arth_theme') as 'dark' | 'light') || 'dark';
        dbUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Client',
          photoURL: user.photoURL || '',
          role: 'user',
          status: 'active',
          theme: initialTheme,
          emailVerified: user.emailVerified || false,
          profileVersion: 1,
          createdAt: now,
          updatedAt: now
        };
        await setDoc(userRef, dbUser, { merge: true });

        // Trigger Welcome & Orientation Email
        if (user.email) {
          import('../services/emailService').then(({ emailService }) => {
            emailService.sendWelcomeEmail(user.email!, {
              userName: user.displayName || 'Client',
              userEmail: user.email!,
              portalUrl: window.location.origin + '/dashboard'
            }).catch(e => console.warn('[AuthStore] Welcome email error:', e));
          });
        }
      }

      // Trigger Security Login Alert
      if (user.email) {
        import('../services/emailService').then(({ emailService }) => {
          emailService.sendSecurityAlertEmail(user.email!, {
            userName: user.displayName || dbUser?.displayName || 'Client',
            userEmail: user.email!,
            device: navigator.userAgent || 'Web Browser',
            ipAddress: 'Authorized Client Session',
            location: 'India Standard Time',
            timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
          }).catch(e => console.warn('[AuthStore] Security email error:', e));
        });
      }

      if (dbUser?.theme) {
        import('./themeStore').then(({ useThemeStore }) => {
          useThemeStore.getState().setTheme(dbUser.theme, false);
        });
      }

      set({ 
        user, 
        dbUser, 
        isAdmin: dbUser?.role === 'admin' || dbUser?.role === Role.SUPER_ADMIN 
      });
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, dbUser: null, isAdmin: false, subscriptionStatus: SubscriptionStatus.NONE });
    authChannel.postMessage('LOGOUT');
  },

  initAuthListener: () => {
    authChannel.onmessage = (event) => {
      if (event.data === 'LOGOUT') {
        set({ user: null, dbUser: null, isAdmin: false, subscriptionStatus: SubscriptionStatus.NONE });
      }
    };

    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const dbUser = userSnap.exists() ? userSnap.data() : null;
          
          if (dbUser?.theme) {
            import('./themeStore').then(({ useThemeStore }) => {
              useThemeStore.getState().setTheme(dbUser.theme, false);
            });
          }

          const portfolios = await portfolioRepository.getUserPortfolios(user.uid);
          let subStatus: SubscriptionStatus = SubscriptionStatus.NONE;
          
          if (portfolios && portfolios.length > 0) {
            const hasActive = portfolios.some(p => p.status === 'active' && (!p.expiresAt || Date.now() <= p.expiresAt));
            const hasPending = portfolios.some(p => p.status === 'pending');
            const hasRejected = portfolios.some(p => p.status === 'rejected');
            const hasExpired = portfolios.some(p => p.status === 'active' && p.expiresAt && Date.now() > p.expiresAt);

            if (hasActive) {
              subStatus = SubscriptionStatus.ACTIVE;
            } else if (hasPending) {
              subStatus = SubscriptionStatus.PENDING;
            } else if (hasRejected) {
              subStatus = SubscriptionStatus.REJECTED;
            } else if (hasExpired) {
              subStatus = SubscriptionStatus.EXPIRED;
            }
          }

          set({ user, dbUser, isAdmin: dbUser?.role === 'admin' || dbUser?.role === Role.SUPER_ADMIN, subscriptionStatus: subStatus, isInitializing: false });
        } catch (err) {
          console.error("Auth listener error", err);
          set({ isInitializing: false });
        }
      } else {
        set({ user: null, dbUser: null, isAdmin: false, subscriptionStatus: SubscriptionStatus.NONE, isInitializing: false });
      }
    });
  }
}));
