// src/repositories/entitlementRepository.ts
import { collection, doc, getDoc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Entitlement } from '../schemas/subscription.schema';
import { calculateExpiryTimestamp } from '../utils/datetime';

const COLLECTION_ENTITLEMENTS = 'entitlements';

export const FeatureKeys = {
  PORTFOLIO_ANALYTICS: 'feature_portfolio_analytics',
  RESEARCH_SIGNALS: 'feature_research_signals',
  CUSTOM_WATCHLIST: 'feature_custom_watchlist',
  PRIORITY_SUPPORT: 'feature_priority_support',
  FACTOR_RADAR: 'feature_factor_radar'
} as const;

export type FeatureKey = typeof FeatureKeys[keyof typeof FeatureKeys] | string;

export const entitlementRepository = {
  /**
   * Provisions a complete set of active entitlements for a user linked to an advisory plan.
   */
  async provisionEntitlements(
    userId: string,
    planId: string,
    validityDays: number,
    customFeatures?: string[]
  ): Promise<Entitlement[]> {
    const expiresAt = calculateExpiryTimestamp(validityDays);
    const batch = writeBatch(db);

    const baseFeatures = customFeatures && customFeatures.length > 0
      ? customFeatures
      : [
          FeatureKeys.PORTFOLIO_ANALYTICS,
          FeatureKeys.RESEARCH_SIGNALS,
          FeatureKeys.CUSTOM_WATCHLIST,
          FeatureKeys.PRIORITY_SUPPORT,
          FeatureKeys.FACTOR_RADAR,
          `access_plan_${planId}`
        ];

    const entitlements: Entitlement[] = [];

    for (const featureKey of baseFeatures) {
      const entitlementId = `${userId}_${featureKey}`;
      const entitlementRef = doc(db, COLLECTION_ENTITLEMENTS, entitlementId);

      const data: Entitlement = {
        id: entitlementId,
        userId,
        planId,
        featureKey,
        isActive: true,
        expiresAt
      };

      batch.set(entitlementRef, data, { merge: true });
      entitlements.push(data);
    }

    await batch.commit();
    return entitlements;
  },

  /**
   * Extends all existing user entitlements by additional days.
   */
  async extendUserEntitlements(userId: string, additionalDays = 30): Promise<void> {
    const userEntitlements = await this.getUserEntitlements(userId);
    if (userEntitlements.length === 0) return;

    const additionalMs = additionalDays * 24 * 60 * 60 * 1000;
    const batch = writeBatch(db);

    for (const ent of userEntitlements) {
      const entRef = doc(db, COLLECTION_ENTITLEMENTS, ent.id);
      const baseTime = Math.max(ent.expiresAt, Date.now());
      const newExpiresAt = baseTime + additionalMs;

      batch.update(entRef, {
        expiresAt: newExpiresAt,
        isActive: true
      });
    }

    await batch.commit();
  },

  /**
   * Fetches all entitlements for a specific user.
   */
  async getUserEntitlements(userId: string): Promise<Entitlement[]> {
    const q = query(
      collection(db, COLLECTION_ENTITLEMENTS),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Entitlement);
  },

  /**
   * Subscribes to real-time entitlement changes for a specific user.
   */
  subscribeToUserEntitlements(
    userId: string,
    callback: (entitlements: Entitlement[]) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTION_ENTITLEMENTS),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const entitlements = snapshot.docs.map(d => d.data() as Entitlement);
      callback(entitlements);
    }, (error) => {
      console.error("Entitlement subscription error:", error);
    });
  },

  /**
   * Checks if a single feature entitlement is currently active and non-expired.
   */
  async hasActiveEntitlement(userId: string, featureKey: string): Promise<boolean> {
    const entitlementId = `${userId}_${featureKey}`;
    const snap = await getDoc(doc(db, COLLECTION_ENTITLEMENTS, entitlementId));
    if (!snap.exists()) return false;
    const data = snap.data() as Entitlement;
    return data.isActive && data.expiresAt > Date.now();
  },

  /**
   * Deactivates all entitlements for a user (e.g., plan cancellation or refund).
   */
  async deactivateUserEntitlements(userId: string): Promise<void> {
    const userEntitlements = await this.getUserEntitlements(userId);
    if (userEntitlements.length === 0) return;

    const batch = writeBatch(db);
    for (const ent of userEntitlements) {
      const entRef = doc(db, COLLECTION_ENTITLEMENTS, ent.id);
      batch.update(entRef, { isActive: false });
    }
    await batch.commit();
  }
};
