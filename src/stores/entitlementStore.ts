// src/stores/entitlementStore.ts
import { create } from 'zustand';
import { entitlementRepository, type FeatureKey } from '../repositories/entitlementRepository';
import type { Entitlement } from '../schemas/subscription.schema';
import { useAuthStore } from './authStore';

interface EntitlementState {
  entitlements: Entitlement[];
  isLoading: boolean;
  unsubscribeListener: (() => void) | null;
  initEntitlementListener: (userId: string) => void;
  unsubscribe: () => void;
  hasEntitlement: (featureKey: FeatureKey) => boolean;
  isSubscriber: () => boolean;
  activePlanIds: () => string[];
}

export const useEntitlementStore = create<EntitlementState>((set, get) => ({
  entitlements: [],
  isLoading: true,
  unsubscribeListener: null,

  initEntitlementListener: (userId: string) => {
    // Unsubscribe existing listener if present
    if (get().unsubscribeListener) {
      get().unsubscribeListener!();
    }

    set({ isLoading: true });

    const unsub = entitlementRepository.subscribeToUserEntitlements(
      userId,
      (data) => {
        set({ entitlements: data, isLoading: false });
      },
      (_err) => {
        set({ entitlements: [], isLoading: false });
      }
    );

    set({ unsubscribeListener: unsub });
  },

  unsubscribe: () => {
    const unsub = get().unsubscribeListener;
    if (unsub) {
      unsub();
      set({ unsubscribeListener: null, entitlements: [] });
    }
  },

  hasEntitlement: (featureKey: FeatureKey) => {
    const auth = useAuthStore.getState();
    // Super Admins & Admins have root override access to all capabilities
    if (auth.isAdmin) return true;

    const now = Date.now();
    const match = get().entitlements.find(
      e => e.featureKey === featureKey && e.isActive && e.expiresAt > now
    );

    return Boolean(match);
  },

  isSubscriber: () => {
    const auth = useAuthStore.getState();
    if (auth.isAdmin) return true;

    const now = Date.now();
    return get().entitlements.some(e => e.isActive && e.expiresAt > now);
  },

  activePlanIds: () => {
    const now = Date.now();
    const active = get().entitlements.filter(e => e.isActive && e.expiresAt > now);
    const planIds = new Set(active.map(e => e.planId));
    return Array.from(planIds);
  }
}));
