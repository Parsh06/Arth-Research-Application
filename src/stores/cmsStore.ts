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
          // Institutional defaults if document is uninitialized
          const institutionalDefaults: Record<string, any> = {
            landingPage: {
              badgeText: "Quantitative Research & Wealth Management",
              title: "Institutional Factor Models for Systematic Alpha",
              subtitle: "SEBI Registered Research Analyst advisory engineered for high-net-worth portfolios."
            },
            welcomePage: {
              title: "Advisory Mandate Initialized",
              subtitle: "Welcome to Arth Research. Proceed to configure your initial portfolio holdings."
            },
            plansPage: {
              title: "Institutional Advisory Mandates",
              subtitle: "Select the quantitative factor strategy engineered for your capital scale and risk tolerance."
            },
            investmentEntryPage: {
              badgeText: "Strategy Model Basket",
              title: "Configure Initial Executed Holdings",
              subtitle: "Register your executed stock entries and average buy prices for analyst desk verification."
            },
            loginPage: {
              title: "Access Your Wealth Engine",
              subtitle: "Institutional quantitative portfolio analytics and automated research signals."
            },
            dashboardPage: {
              welcomeText: "Institutional Terminal Access • Risk Parity Quant Engine",
              marketStatus: "MARKET ACTIVE",
              chartTitle: "Equity Curve & NAV Trajectory"
            }
          };
          const defaultData = institutionalDefaults[col] || {
            title: "Arth Research Institutional Portal",
            subtitle: "Systematic quantitative research and algorithmic advisory."
          };
          await setDoc(docRef, defaultData, { merge: true });
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
