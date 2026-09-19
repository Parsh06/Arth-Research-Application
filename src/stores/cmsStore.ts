import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CmsState {
  siteContent: any;
  isLoadingSiteContent: boolean;
  
  fetchSiteContent: () => Promise<void>;
  updateSiteContent: (collectionName: string, docId: string, data: any) => Promise<void>;
}

export const useCmsStore = create<CmsState>((set, get) => ({
  siteContent: {
    landingPage: null,
    welcomePage: null,
    plansPage: null,
    investmentEntryPage: null
  },
  isLoadingSiteContent: false,

  fetchSiteContent: async () => {
    set({ isLoadingSiteContent: true });
    try {
      const collections = ['landingPage', 'welcomePage', 'plansPage', 'investmentEntryPage', 'loginPage', 'dashboardPage'];
      const newContent: any = {};
      
      for (const col of collections) {
        const docRef = doc(db, 'settings', col);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          newContent[col] = snap.data();
        } else {
          // Defaults if missing
          const defaultData = {
            title: `Default ${col} Title`,
            subtitle: `Default ${col} Subtitle`
          };
          await setDoc(docRef, defaultData);
          newContent[col] = defaultData;
        }
      }
      
      set({ siteContent: newContent, isLoadingSiteContent: false });
    } catch (error) {
      console.error("Error fetching site content:", error);
      set({ isLoadingSiteContent: false });
    }
  },

  updateSiteContent: async (collectionName: string, docId: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data, { merge: true });
      await get().fetchSiteContent(); // Refresh
    } catch (error) {
      console.error("Error updating CMS content", error);
    }
  }
}));
