import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'portfolio' | 'rebalance' | 'research' | 'system';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

const COLLECTION = 'notifications';

export const notificationRepository = {
  /**
   * Subscribe to live real-time notifications for a user
   */
  subscribeToUserNotifications(userId: string, callback: (notifications: AppNotification[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppNotification));
      callback(notifications);
    });
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, notificationId);
    await updateDoc(docRef, {
      isRead: true,
      readAt: new Date().toISOString()
    });
  },

  /**
   * Create a new notification for a user
   */
  async createNotification(data: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  }
};
