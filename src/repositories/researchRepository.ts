import {
  collection,
  doc,
  getDocs,
  query,
  orderBy,
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
   * Subscribe to live research calls / signals stream
   */
  subscribeToCalls(callback: (calls: ResearchCall[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      orderBy('publishedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const calls = snapshot.docs.map(doc => ResearchCallSchema.parse({
        id: doc.id,
        ...doc.data()
      }));
      callback(calls);
    });
  },

  /**
   * Fetch all research calls once
   */
  async getCalls(): Promise<ResearchCall[]> {
    const q = query(
      collection(db, COLLECTION),
      orderBy('publishedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ResearchCallSchema.parse({
      id: d.id,
      ...d.data()
    }));
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
