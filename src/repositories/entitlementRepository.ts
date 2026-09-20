// src/repositories/entitlementRepository.ts
//
// ENTITLEMENT CONSISTENCY STRATEGY
// ---------------------------------
// Entitlements are a CACHE of derived capability flags.
// The canonical source of truth is the `subscriptions` collection.
//
// Rule: Any time a subscription is created, extended, cancelled, or expires —
// `syncEntitlementsFromSubscription()` must be called to reconcile the cache.
//
// This eliminates the duplicated provisioning logic that previously existed in:
//   - orderRepository.ts (completePaymentAndProvision)
//   - portfolioRepository.ts (approvePortfolio, extendPortfolio)
//   - subscriptionRepository.ts (checkAndDispatchExpiryWarnings)
//
// Going forward, call syncEntitlementsFromSubscription() as the single canonical
// entitlement write path. The other repositories retain their own logic only for
// backwards compatibility during migration.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
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

/** Returns the standard feature set granted by any active plan. */
function getStandardFeatureSet(planId: string): string[] {
  return [
    FeatureKeys.PORTFOLIO_ANALYTICS,
    FeatureKeys.RESEARCH_SIGNALS,
    FeatureKeys.CUSTOM_WATCHLIST,
    FeatureKeys.PRIORITY_SUPPORT,
    FeatureKeys.FACTOR_RADAR,
    `access_plan_${planId}`
  ];
}

export const entitlementRepository = {

  /**
   * CANONICAL ENTITLEMENT SYNC — The single source-of-truth write path.
   *
   * Call this after any subscription lifecycle event:
   *   - Payment successful → status: 'active'
   *   - Admin extends plan → status: 'active', new expiresAt
   *   - Admin cancels plan → status: 'inactive'
   *   - Subscription expires → status: 'inactive'
   *
   * This function atomically reconciles the entitlement cache with the
   * current subscription state in a single Firestore batch write.
   */
  async syncEntitlementsFromSubscription(
    userId: string,
    planId: string,
    expiresAtMs: number,
    isActive: boolean
  ): Promise<void> {
    const batch = writeBatch(db);
    const features = getStandardFeatureSet(planId);

    for (const featureKey of features) {
      const entitlementId = `${userId}_${featureKey}`;
      const entitlementRef = doc(db, COLLECTION_ENTITLEMENTS, entitlementId);

      const data: Entitlement = {
        id: entitlementId,
        userId,
        planId,
        featureKey,
        isActive,
        expiresAt: expiresAtMs
      };

      batch.set(entitlementRef, data, { merge: true });
    }

    await batch.commit();
  },

  /**
   * Provisions a complete set of active entitlements for a user linked to an advisory plan.
   * @deprecated Prefer syncEntitlementsFromSubscription() for consistency.
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
      : getStandardFeatureSet(planId);

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
   * Deactivates all entitlements for a user (e.g., plan cancellation, refund, or expiry).
   * This is the CANONICAL deactivation path — always call this, not manual batch updates.
   */
  async deactivateUserEntitlements(userId: string, planId?: string): Promise<void> {
    const userEntitlements = await this.getUserEntitlements(userId);
    if (userEntitlements.length === 0) return;

    const batch = writeBatch(db);
    for (const ent of userEntitlements) {
      // If planId is specified, only deactivate entitlements for that plan
      if (planId && ent.planId !== planId) continue;
      const entRef = doc(db, COLLECTION_ENTITLEMENTS, ent.id);
      batch.update(entRef, { isActive: false });
    }
    await batch.commit();
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
   * Used by UserLayout to gate feature access reactively.
   */
  subscribeToUserEntitlements(
    userId: string,
    callback: (entitlements: Entitlement[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const q = query(
      collection(db, COLLECTION_ENTITLEMENTS),
      where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
      const entitlements = snapshot.docs.map(d => d.data() as Entitlement);
      callback(entitlements);
    }, (error) => {
      console.warn('[EntitlementRepository] Subscription error:', error);
      if (onError) onError(error);
    });
  },

  /**
   * Checks if a single feature entitlement is currently active and non-expired.
   * Use this for server-side capability checks before rendering sensitive content.
   */
  async hasActiveEntitlement(userId: string, featureKey: string): Promise<boolean> {
    const entitlementId = `${userId}_${featureKey}`;
    const snap = await getDoc(doc(db, COLLECTION_ENTITLEMENTS, entitlementId));
    if (!snap.exists()) return false;
    const data = snap.data() as Entitlement;
    return data.isActive && data.expiresAt > Date.now();
  }
};
