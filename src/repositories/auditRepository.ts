import { collection, addDoc, getDocs, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface AuditLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId: string;
  targetType: 'user' | 'portfolio' | 'plan' | 'cms' | 'system';
  details?: Record<string, any>;
  timestamp: string;
}

export const auditRepository = {
  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        ...log,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to write audit log:", e);
    }
  },

  async getRecentLogs(maxLogs: number = 50): Promise<AuditLog[]> {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(maxLogs));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
    } catch (e) {
      console.error("Failed to get audit logs:", e);
      return [];
    }
  },

  async clearAllLogs(): Promise<number> {
    try {
      const snap = await getDocs(collection(db, 'auditLogs'));
      let count = 0;
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'auditLogs', d.id));
        count++;
      }
      return count;
    } catch (e) {
      console.error("Failed to clear audit logs:", e);
      throw e;
    }
  }
};
