import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ResearchCallSchema } from '../schemas/research.schema';
import type { ResearchCall } from '../schemas/research.schema';

const COLLECTION = 'researchCalls';

export const researchRepository = {
  /**
   * Subscribe to live research calls / signals stream (bounded to latest 100)
   */
  subscribeToCalls(callback: (calls: ResearchCall[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      orderBy('publishedAt', 'desc'),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const calls = snapshot.docs
          .map(doc => {
            const res = ResearchCallSchema.safeParse({
              id: doc.id,
              ...doc.data()
            });
            return res.success ? res.data : null;
          })
          .filter((c): c is ResearchCall => c !== null);
        callback(calls);
      },
      (error) => {
        console.warn('[researchRepository] Snapshot listener notice:', error.message);
        callback([]);
      }
    );
  },

  /**
   * Fetch research calls once (bounded to latest 100)
   */
  async getCalls(maxItems: number = 100): Promise<ResearchCall[]> {
    const q = query(
      collection(db, COLLECTION),
      orderBy('publishedAt', 'desc'),
      limit(maxItems)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(d => {
        const res = ResearchCallSchema.safeParse({
          id: d.id,
          ...d.data()
        });
        return res.success ? res.data : null;
      })
      .filter((c): c is ResearchCall => c !== null);
  },

  /**
   * Publish a new research recommendation
   */
  async publishCall(callData: Omit<ResearchCall, 'id' | 'publishedAt'>): Promise<string> {
    const docRef = doc(collection(db, COLLECTION));
    const now = new Date().toISOString();
    const parsed = ResearchCallSchema.parse({
      ...callData,
      id: docRef.id,
      publishedAt: now
    });

    await setDoc(docRef, parsed);
    return docRef.id;
  },

  /**
   * Update the status of a call (e.g. TARGET_HIT, SL_HIT, CLOSED)
   */
  async updateCallStatus(id: string, status: ResearchCall['status']): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      status,
      closedAt: status === 'ACTIVE' ? null : new Date().toISOString()
    });
  }
};
