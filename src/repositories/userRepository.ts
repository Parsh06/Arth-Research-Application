// src/repositories/userRepository.ts
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UserPrivate, UserCompliance } from '../schemas/user.schema';
import type { User } from '../types/models';
import { auditRepository } from './auditRepository';

const COLLECTION_USERS = 'users';
const COLLECTION_PRIVATE = 'userPrivate';
const COLLECTION_COMPLIANCE = 'userCompliance';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export const userRepository = {
  async getUser(uid: string): Promise<User | null> {
    const docRef = doc(db, COLLECTION_USERS, uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as User) : null;
  },

  async createUser(uid: string, data: Partial<User>): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, COLLECTION_USERS, uid);
    const payload = sanitizeForFirestore({
      uid,
      createdAt: now,
      updatedAt: now,
      role: 'user',
      status: 'active',
      emailVerified: false,
      profileVersion: 1,
      ...data
    });
    await setDoc(docRef, payload, { merge: true });
  },

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, COLLECTION_USERS, uid);
    const payload = sanitizeForFirestore({ ...updates, updatedAt: new Date().toISOString() });
    await updateDoc(docRef, payload);
  },

  async updateUserRole(uid: string, role: string, adminUid?: string): Promise<void> {
    const docRef = doc(db, COLLECTION_USERS, uid);
    await updateDoc(docRef, { role, updatedAt: new Date().toISOString() });
    if (adminUid) {
      await auditRepository.logAction({
        adminId: adminUid,
        adminEmail: 'admin@arthadvisory.com',
        action: 'UPDATE_USER_ROLE',
        targetType: 'user',
        targetId: uid,
        details: { newRole: role }
      });
    }
  },

  async updateUserStatus(uid: string, status: string, adminUid?: string): Promise<void> {
    const docRef = doc(db, COLLECTION_USERS, uid);
    await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    if (adminUid) {
      await auditRepository.logAction({
        adminId: adminUid,
        adminEmail: 'admin@arthadvisory.com',
        action: 'UPDATE_USER_STATUS',
        targetType: 'user',
        targetId: uid,
        details: { newStatus: status }
      });
    }
  },

  async revokeUserAccess(uid: string, reason: string, adminUid: string, adminEmail: string): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, COLLECTION_USERS, uid);
    await updateDoc(docRef, {
      status: 'revoked',
      revocationReason: reason.trim(),
      revokedAt: now,
      revokedBy: adminEmail,
      updatedAt: now
    });

    await auditRepository.logAction({
      adminId: adminUid,
      adminEmail,
      action: 'REVOKE_USER_ACCESS',
      targetType: 'user',
      targetId: uid,
      details: {
        reason: reason.trim(),
        revokedAt: now
      }
    });
  },

  async reactivateUserAccess(uid: string, adminUid: string, adminEmail: string): Promise<void> {
    const now = new Date().toISOString();
    const docRef = doc(db, COLLECTION_USERS, uid);
    await updateDoc(docRef, {
      status: 'active',
      revocationReason: null,
      revokedAt: null,
      revokedBy: null,
      updatedAt: now
    });

    await auditRepository.logAction({
      adminId: adminUid,
      adminEmail,
      action: 'REACTIVATE_USER_ACCESS',
      targetType: 'user',
      targetId: uid,
      details: {
        reactivatedAt: now
      }
    });
  },

  async deleteUserPermanently(uid: string, email: string, adminUid: string, adminEmail: string): Promise<void> {
    const { adminMaintenanceService } = await import('../services/adminMaintenanceService');
    await adminMaintenanceService.purgeUserDataByEmail(email);

    await auditRepository.logAction({
      adminId: adminUid,
      adminEmail,
      action: 'DELETE_USER_PERMANENTLY',
      targetType: 'user',
      targetId: uid,
      details: {
        email,
        deletedAt: new Date().toISOString()
      }
    });
  },

  // --- Domain Segregation: Private Contact Data ---
  async getUserPrivate(uid: string): Promise<UserPrivate | null> {
    const docRef = doc(db, COLLECTION_PRIVATE, uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserPrivate) : null;
  },

  async updateUserPrivate(uid: string, data: Partial<UserPrivate>): Promise<void> {
    const docRef = doc(db, COLLECTION_PRIVATE, uid);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  },

  // --- Domain Segregation: Compliance & KYC ---
  async getUserCompliance(uid: string): Promise<UserCompliance | null> {
    const docRef = doc(db, COLLECTION_COMPLIANCE, uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserCompliance) : null;
  },

  async updateUserCompliance(uid: string, data: Partial<UserCompliance>): Promise<void> {
    const docRef = doc(db, COLLECTION_COMPLIANCE, uid);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  }
};
