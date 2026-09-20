// src/repositories/auditRepository.ts
// REGULATORY COMPLIANCE: Audit logs are write-once (append-only).
// The clearAllLogs() method has been intentionally removed — audit trails are immutable.
// Database Security Rules also enforce this at the DB layer (update/delete: false).
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

export type AuditEntityType =
  | 'user'
  | 'portfolio'
  | 'plan'
  | 'order'
  | 'subscription'
  | 'entitlement'
  | 'cms'
  | 'support_ticket'
  | 'security_event'
  | 'system';

export interface AuditLog {
  id?: string;
  // Who performed the action
  adminId: string;
  adminEmail: string;
  // What was done
  action: string;
  // What was affected
  entityType: AuditEntityType;
  entityId: string;
  // Optional context
  details?: Record<string, unknown>;
  // Client forensics
  ipAddress?: string;
  userAgent?: string;
  // Immutable timestamp written server-side
  timestamp: string;
}

export const auditRepository = {
  /**
   * Appends an immutable audit log entry.
   * Firestore Security Rules prohibit any subsequent update or delete on this document.
   */
  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        ...log,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('[AuditRepository] Failed to write audit log:', e);
    }
  },

  /**
   * Records a security anomaly, rate violation, or authorization rejection event.
   */
  async logSecurityEvent(
    action: string,
    entityId: string,
    details?: Record<string, unknown>,
    actorUid: string = 'system',
    actorEmail: string = 'system@security.guard'
  ): Promise<void> {
    return this.logAction({
      adminId: actorUid,
      adminEmail: actorEmail,
      action: `[SECURITY] ${action}`,
      entityType: 'security_event',
      entityId,
      details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      ipAddress: 'client'
    });
  },

  /**
   * Fetches the N most recent audit log entries (admin-only page).
   */
  async getRecentLogs(maxLogs: number = 50): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(maxLogs)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    } catch (e) {
      console.error('[AuditRepository] Failed to get audit logs:', e);
      return [];
    }
  },

  /**
   * Fetches all audit logs for a specific entity (e.g. a single portfolio or user).
   * Useful for per-record compliance inspection.
   */
  async getLogsByEntity(entityType: AuditEntityType, entityId: string): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    } catch (e) {
      console.error('[AuditRepository] Failed to get entity audit logs:', e);
      return [];
    }
  },

  /**
   * Fetches all audit logs for a specific admin user.
   */
  async getLogsByAdmin(adminId: string, maxLogs: number = 100): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, 'auditLogs'),
        where('adminId', '==', adminId),
        orderBy('timestamp', 'desc'),
        limit(maxLogs)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
    } catch (e) {
      console.error('[AuditRepository] Failed to get admin audit logs:', e);
      return [];
    }
  }

  // ⛔ clearAllLogs() has been intentionally removed.
  // Audit logs are regulatory compliance records.
  // They are immutable at both the application and Firestore Security Rules layers.
  // If purging is needed for legal data retention, it must be done via a
  // privileged Firebase Admin SDK server function with explicit legal authorization.
};
