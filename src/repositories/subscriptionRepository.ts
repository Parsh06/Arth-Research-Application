import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Subscription } from '../types/models';

const COLLECTION = 'subscriptions';

export const subscriptionRepository = {
  async getSubscription(id: string): Promise<Subscription | null> {
    const docRef = doc(db, COLLECTION, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Subscription) : null;
  },

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  },

  async createSubscription(data: Omit<Subscription, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), data);
    return docRef.id;
  },

  async updateSubscription(id: string, updates: Partial<Subscription>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, updates);
  },

  async getAllSubscriptions(): Promise<Subscription[]> {
    const snap = await getDocs(collection(db, COLLECTION));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
  },

  /**
   * Automated Subscription Lifecycle & Cron Inspector
   * Evaluates all active subscriptions for 7-day expiry warnings and expiration notices,
   * pulling verified user records directly from Firestore.
   */
  async checkAndDispatchExpiryWarnings(): Promise<{
    scanned: number;
    warningsSent: number;
    expiredSent: number;
    errors: string[];
    logs: string[];
  }> {
    const results = {
      scanned: 0,
      warningsSent: 0,
      expiredSent: 0,
      errors: [] as string[],
      logs: [] as string[]
    };

    try {
      const allSubs = await this.getAllSubscriptions();
      results.scanned = allSubs.length;
      const now = Date.now();

      const { emailService } = await import('../services/emailService');

      for (const sub of allSubs) {
        if (!sub.userId || !sub.expiresAt) continue;

        const subData = sub as any;
        const expiresTimestamp = typeof sub.expiresAt === 'number' ? sub.expiresAt : new Date(sub.expiresAt).getTime();
        const daysLeft = Math.ceil((expiresTimestamp - now) / (1000 * 60 * 60 * 24));

        // Fetch verified user doc from Firestore
        let userEmail = '';
        let userName = 'Valued Investor';

        try {
          const userSnap = await getDoc(doc(db, 'users', sub.userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            userEmail = userData.email || '';
            userName = userData.displayName || 'Valued Investor';
          }
        } catch (uErr: any) {
          results.errors.push(`Failed to fetch user ${sub.userId}: ${uErr.message}`);
          continue;
        }

        if (!userEmail) continue;

        // 1. Check 7-Day Expiry Warning (between 1 and 7 days left, not yet notified)
        if (sub.status === 'active' && daysLeft > 0 && daysLeft <= 7 && !subData.warningEmailSentAt) {
          const formattedExpiry = new Date(expiresTimestamp).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          await emailService.sendSubscriptionExpiryWarningEmail(userEmail, {
            userName,
            planName: sub.planName || 'Institutional Advisory Mandate',
            expiryDate: `${formattedExpiry} (${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining)`,
            renewalUrl: `${window?.location?.origin || 'https://arthresearch.com'}/plans`
          });

          // Mark flag in Firestore to avoid duplicate sends
          await this.updateSubscription(sub.id, {
            warningEmailSentAt: new Date().toISOString()
          } as any);

          results.warningsSent++;
          results.logs.push(`Dispatched 7-Day Warning to ${userEmail} for plan ${sub.planName}`);
        }

        // 2. Check Expired Status (expiresAt passed, not yet marked or notified)
        if (now >= expiresTimestamp && (sub.status === 'active' || !subData.expiredNoticeSentAt)) {
          const formattedExpiredDate = new Date(expiresTimestamp).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });

          if (!subData.expiredNoticeSentAt) {
            await emailService.sendSubscriptionExpiredEmail(userEmail, {
              userName,
              planName: sub.planName || 'Institutional Advisory Mandate',
              expirationDate: formattedExpiredDate,
              reactivateUrl: `${window?.location?.origin || 'https://arthresearch.com'}/plans`
            });
            results.expiredSent++;
            results.logs.push(`Dispatched Expired Notice to ${userEmail} for plan ${sub.planName}`);
          }

          // Transition subscription status to expired in Firestore
          await this.updateSubscription(sub.id, {
            status: 'expired',
            expiredNoticeSentAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as any);
        }
      }
    } catch (err: any) {
      console.error('[SubscriptionRepository] checkAndDispatchExpiryWarnings failed:', err);
      results.errors.push(err.message || 'Scan failed');
    }

    return results;
  }
};
