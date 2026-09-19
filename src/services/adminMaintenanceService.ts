import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PurgeResult {
  email: string;
  userIds: string[];
  deletedUsers: number;
  deletedPrivate: number;
  deletedCompliance: number;
  deletedPortfolios: number;
  deletedHoldings: number;
  deletedVersions: number;
  deletedOrders: number;
  deletedSubscriptions: number;
  deletedPayments: number;
  deletedEntitlements: number;
  deletedNotifications: number;
  deletedTickets: number;
}

export const adminMaintenanceService = {
  /**
   * Complete purge of all user records, portfolios, orders, subscriptions and compliance for an email.
   */
  async purgeUserDataByEmail(email: string): Promise<PurgeResult> {
    const targetEmail = email.trim().toLowerCase();
    const result: PurgeResult = {
      email: targetEmail,
      userIds: [],
      deletedUsers: 0,
      deletedPrivate: 0,
      deletedCompliance: 0,
      deletedPortfolios: 0,
      deletedHoldings: 0,
      deletedVersions: 0,
      deletedOrders: 0,
      deletedSubscriptions: 0,
      deletedPayments: 0,
      deletedEntitlements: 0,
      deletedNotifications: 0,
      deletedTickets: 0
    };

    // 1. Find user by email
    const usersQ = query(collection(db, 'users'), where('email', '==', targetEmail));
    const usersSnap = await getDocs(usersQ);
    
    usersSnap.docs.forEach(d => {
      if (!result.userIds.includes(d.id)) {
        result.userIds.push(d.id);
      }
    });

    // Also check if any orders/portfolios have this email directly or matching user IDs
    for (const userId of result.userIds) {
      // Delete private
      try {
        await deleteDoc(doc(db, 'userPrivate', userId));
        result.deletedPrivate++;
      } catch (e) {
        console.warn(`Could not delete userPrivate/${userId}`, e);
      }

      // Delete compliance
      try {
        await deleteDoc(doc(db, 'userCompliance', userId));
        result.deletedCompliance++;
      } catch (e) {
        console.warn(`Could not delete userCompliance/${userId}`, e);
      }

      // Delete user doc
      try {
        await deleteDoc(doc(db, 'users', userId));
        result.deletedUsers++;
      } catch (e) {
        console.warn(`Could not delete users/${userId}`, e);
      }

      // 2. Delete Portfolios and Subcollections
      const portQ = query(collection(db, 'portfolios'), where('userId', '==', userId));
      const portSnap = await getDocs(portQ);
      for (const pDoc of portSnap.docs) {
        // Delete holdings subcollection
        const holdingsSnap = await getDocs(collection(db, 'portfolios', pDoc.id, 'holdings'));
        for (const hDoc of holdingsSnap.docs) {
          await deleteDoc(doc(db, 'portfolios', pDoc.id, 'holdings', hDoc.id));
          result.deletedHoldings++;
        }

        // Delete versions subcollection
        const versionsSnap = await getDocs(collection(db, 'portfolios', pDoc.id, 'versions'));
        for (const vDoc of versionsSnap.docs) {
          await deleteDoc(doc(db, 'portfolios', pDoc.id, 'versions', vDoc.id));
          result.deletedVersions++;
        }

        // Delete portfolio doc
        await deleteDoc(doc(db, 'portfolios', pDoc.id));
        result.deletedPortfolios++;
      }

      // 3. Delete Orders
      const orderQ = query(collection(db, 'orders'), where('userId', '==', userId));
      const orderSnap = await getDocs(orderQ);
      for (const oDoc of orderSnap.docs) {
        await deleteDoc(doc(db, 'orders', oDoc.id));
        result.deletedOrders++;
      }

      // 4. Delete Subscriptions
      const subQ = query(collection(db, 'subscriptions'), where('userId', '==', userId));
      const subSnap = await getDocs(subQ);
      for (const sDoc of subSnap.docs) {
        await deleteDoc(doc(db, 'subscriptions', sDoc.id));
        result.deletedSubscriptions++;
      }

      // 5. Delete Payments
      const payQ = query(collection(db, 'payments'), where('userId', '==', userId));
      const paySnap = await getDocs(payQ);
      for (const pyDoc of paySnap.docs) {
        await deleteDoc(doc(db, 'payments', pyDoc.id));
        result.deletedPayments++;
      }

      // 6. Delete Entitlements
      const entQ = query(collection(db, 'entitlements'), where('userId', '==', userId));
      const entSnap = await getDocs(entQ);
      for (const enDoc of entSnap.docs) {
        await deleteDoc(doc(db, 'entitlements', enDoc.id));
        result.deletedEntitlements++;
      }

      // 7. Delete Notifications
      const notifQ = query(collection(db, 'notifications'), where('userId', '==', userId));
      const notifSnap = await getDocs(notifQ);
      for (const nDoc of notifSnap.docs) {
        await deleteDoc(doc(db, 'notifications', nDoc.id));
        result.deletedNotifications++;
      }

      // 8. Delete Tickets
      const tickQ = query(collection(db, 'tickets'), where('userId', '==', userId));
      const tickSnap = await getDocs(tickQ);
      for (const tDoc of tickSnap.docs) {
        await deleteDoc(doc(db, 'tickets', tDoc.id));
        result.deletedTickets++;
      }
    }

    return result;
  },

  /**
   * Purges all auditLogs
   */
  async purgeAllAuditLogs(): Promise<number> {
    const snap = await getDocs(collection(db, 'auditLogs'));
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(doc(db, 'auditLogs', d.id));
      count++;
    }
    return count;
  }
};
