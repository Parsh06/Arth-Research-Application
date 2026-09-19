// src/repositories/instrumentRepository.ts
import { collection, doc, getDoc, getDocs, setDoc, query, where, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Instrument, MarketPrice } from '../schemas/instrument.schema';

const COLLECTION_INSTRUMENTS = 'instruments';
const COLLECTION_PRICES = 'latestPrices';

// Canonical Top Indian Equities
export const DEFAULT_CANONICAL_INSTRUMENTS: Omit<Instrument, 'updatedAt'>[] = [
  { id: 'NSE_EQ_RELIANCE', symbol: 'RELIANCE', companyName: 'Reliance Industries Limited', isin: 'INE002A01018', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Energy & Petrochemicals', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_TCS', symbol: 'TCS', companyName: 'Tata Consultancy Services Limited', isin: 'INE467B01029', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Information Technology', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_HDFCBANK', symbol: 'HDFCBANK', companyName: 'HDFC Bank Limited', isin: 'INE040A01034', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Banking & Financials', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_INFY', symbol: 'INFY', companyName: 'Infosys Limited', isin: 'INE009A01021', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Information Technology', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_ICICIBANK', symbol: 'ICICIBANK', companyName: 'ICICI Bank Limited', isin: 'INE090A01021', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Banking & Financials', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_BHARTIARTL', symbol: 'BHARTIARTL', companyName: 'Bharti Airtel Limited', isin: 'INE397D01024', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Telecommunications', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_SBIN', symbol: 'SBIN', companyName: 'State Bank of India', isin: 'INE062A01020', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Banking & Financials', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_ITC', symbol: 'ITC', companyName: 'ITC Limited', isin: 'INE154A01025', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'FMCG', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_LT', symbol: 'LT', companyName: 'Larsen & Toubro Limited', isin: 'INE018A01030', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Capital Goods & Infrastructure', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_TATAMOTORS', symbol: 'TATAMOTORS', companyName: 'Tata Motors Limited', isin: 'INE155A01022', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Automobile', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_KOTAKBANK', symbol: 'KOTAKBANK', companyName: 'Kotak Mahindra Bank Limited', isin: 'INE237A01028', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Banking & Financials', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true },
  { id: 'NSE_EQ_BAJFINANCE', symbol: 'BAJFINANCE', companyName: 'Bajaj Finance Limited', isin: 'INE296A01024', exchange: 'NSE', instrumentType: 'EQUITY', sector: 'Financial Services', currency: 'INR', lotSize: 1, priceScale: 2, quantityScale: 0, isActive: true }
];

export const instrumentRepository = {
  async searchInstruments(searchTerm: string): Promise<Instrument[]> {
    const term = searchTerm.trim().toUpperCase();
    if (!term) return [];

    try {
      const q = query(
        collection(db, COLLECTION_INSTRUMENTS),
        where('symbol', '>=', term),
        where('symbol', '<=', term + '\uf8ff'),
        limit(10)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Instrument);
      }
    } catch {
      // Fall back to memory list if Firestore offline/unseeded
    }

    // Match against default canonical set
    return DEFAULT_CANONICAL_INSTRUMENTS.filter(
      inst => inst.symbol.toUpperCase().includes(term) || inst.companyName.toUpperCase().includes(term)
    ).map(inst => ({ ...inst, updatedAt: new Date().toISOString() }));
  },

  async getInstrumentBySymbol(symbol: string): Promise<Instrument | null> {
    const cleanSymbol = symbol.trim().toUpperCase();
    const fallback = DEFAULT_CANONICAL_INSTRUMENTS.find(i => i.symbol === cleanSymbol);
    if (fallback) {
      return { ...fallback, updatedAt: new Date().toISOString() };
    }

    try {
      const q = query(collection(db, COLLECTION_INSTRUMENTS), where('symbol', '==', cleanSymbol), limit(1));
      const snap = await getDocs(q);
      return snap.empty ? null : (snap.docs[0].data() as Instrument);
    } catch {
      return null;
    }
  },

  async seedCanonicalInstruments(): Promise<void> {
    const now = new Date().toISOString();
    for (const inst of DEFAULT_CANONICAL_INSTRUMENTS) {
      const ref = doc(db, COLLECTION_INSTRUMENTS, inst.id);
      await setDoc(ref, { ...inst, updatedAt: now }, { merge: true });
    }
  },

  async getLatestPrice(instrumentId: string, fallbackPriceMinor = 0): Promise<MarketPrice> {
    try {
      const ref = doc(db, COLLECTION_PRICES, instrumentId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as MarketPrice;
      }
    } catch {
      // Fallback
    }

    return {
      instrumentId,
      symbol: instrumentId.replace('NSE_EQ_', ''),
      ltpMinor: fallbackPriceMinor,
      changeMinor: 0,
      changePercentBps: 0,
      volume: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};
