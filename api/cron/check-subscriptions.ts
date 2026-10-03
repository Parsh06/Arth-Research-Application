import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, sendSafeError } from '../_lib/security.js';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { getStockPricesCollection, type StockPriceDocument } from '../_lib/mongodb.js';

interface PlanHoldingInfo {
  scripCode?: string;
  symbol: string;
  companyName?: string;
  isin?: string;
}

const BSE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.bseindia.com',
  'Referer': 'https://www.bseindia.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function resolveScripCode(symbol: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.bseindia.com/MSource/1D/GetQuoteAllSearchDatabeta.aspx?searchString=${encodeURIComponent(symbol)}`, {
      headers: BSE_HEADERS
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const match = data.find((d: any) => d.shortName?.toUpperCase() === symbol.toUpperCase()) || data[0];
      return match?.strSricpCode || null;
    }
  } catch {
    // Ignore resolution errors
  }
  return null;
}

async function fetchBseQuote(scripCode: string): Promise<any> {
  const url = `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&scripcode=${scripCode}&seriesid=`;
  const res = await fetch(url, { headers: BSE_HEADERS });
  if (!res.ok) {
    throw new Error(`BSE header request failed with status ${res.status}`);
  }
  return await res.json();
}

/**
 * Fetches active plans either via Firebase Admin SDK or Firestore REST API fallback
 */
async function fetchActivePlans(): Promise<any[]> {
  // 1. Try Firebase Admin SDK
  try {
    const snap = await adminDb.collection('plans').where('isActive', '==', true).get();
    if (snap && snap.docs) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  } catch (adminErr: any) {
    console.warn('[CRON] adminDb plans query unavailable, attempting Firestore REST fallback:', adminErr?.message);
  }

  // 2. Fallback to Firestore REST API (publicly allowed by firestore.rules for /plans)
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'researchapplication-3085c';
    const apiKey = process.env.VITE_FIREBASE_API_KEY || 'AIzaSyCi3tGd4zsfU_LpVZssmwHrVYG4g2ADzBQ';
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/plans?key=${apiKey}`;
    
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    if (!data.documents || !Array.isArray(data.documents)) return [];

    return data.documents.map((doc: any) => {
      const f = doc.fields || {};
      const id = doc.name.split('/').pop();
      const isActive = f.isActive?.booleanValue ?? true;
      if (!isActive) return null;

      // Extract holdings
      const holdingsRaw = f.holdings?.arrayValue?.values || [];
      const holdings = holdingsRaw.map((v: any) => {
        const hf = v.mapValue?.fields || {};
        return {
          symbol: hf.symbol?.stringValue || '',
          scripCode: hf.scripCode?.stringValue || '',
          companyName: hf.companyName?.stringValue || '',
          isin: hf.isin?.stringValue || ''
        };
      });

      // Extract recommendedStocks
      const recStocksRaw = f.recommendedStocks?.arrayValue?.values || [];
      const recommendedStocks = recStocksRaw.map((v: any) => v.stringValue || '');

      return {
        id,
        name: f.name?.stringValue || id,
        isActive,
        holdings,
        recommendedStocks
      };
    }).filter(Boolean);
  } catch (restErr) {
    console.error('[CRON] Failed to fetch plans via REST:', restErr);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strict CORS & Preflight handling
  if (applyCors(req, res)) {
    return;
  }

  // Authorization check (from cron-job.org Bearer token or ?secret= query param)
  const authHeader = (req.headers['authorization'] as string) || '';
  const querySecret = (req.query.secret as string) || '';
  const providedRaw = querySecret || authHeader.replace(/^Bearer\s+/i, '').trim();
  
  let providedDecoded = providedRaw;
  try {
    providedDecoded = decodeURIComponent(providedRaw);
  } catch {
    // Keep raw if decoding fails
  }

  const configuredSecret = (process.env.CRON_SECRET || '').trim();
  const providedNormalized = providedRaw.replace(/ /g, '+');
  const providedDecodedNormalized = providedDecoded.replace(/ /g, '+');

  const isAuthorized = configuredSecret && (
    providedRaw === configuredSecret ||
    providedDecoded === configuredSecret ||
    providedNormalized === configuredSecret ||
    providedDecodedNormalized === configuredSecret
  );

  if (!isAuthorized) {
    return sendSafeError(res, 401, 'Unauthorized cron request. Invalid or unconfigured CRON_SECRET token.');
  }

  try {
    const now = Date.now();
    console.log('[CRON] Executing 15-minute background evaluation cycle...');

    // -------------------------------------------------------------
    // TASK 1: SUBSCRIPTION LIFECYCLE EVALUATION
    // -------------------------------------------------------------
    let activeSubs = 0;
    let expiredSubs = 0;
    let warningSubs = 0;
    let totalSubsScanned = 0;
    let subStatus = 'CHECKED';

    try {
      const subsSnap = await adminDb.collection('subscriptions').get();
      totalSubsScanned = subsSnap.size;
      subsSnap.docs.forEach(doc => {
        const data = doc.data() || {};
        const status = (data.status || 'inactive').toLowerCase();
        
        let expiresAt = 0;
        if (typeof data.expiresAt === 'number') {
          expiresAt = data.expiresAt;
        } else if (typeof data.expiresAt === 'string') {
          expiresAt = new Date(data.expiresAt).getTime();
        }

        if (status === 'active') {
          if (expiresAt > 0 && expiresAt < now) {
            expiredSubs++;
          } else if (expiresAt > 0 && expiresAt - now <= 7 * 24 * 60 * 60 * 1000) {
            warningSubs++;
            activeSubs++;
          } else {
            activeSubs++;
          }
        }
      });
    } catch (subErr: any) {
      console.warn('[CRON] Subscription scan skipped (requires Firebase Service Account Key):', subErr?.message);
      subStatus = 'SKIPPED_CREDENTIALS_PENDING';
    }

    // -------------------------------------------------------------
    // TASK 2: BSE STOCK PRICE SYNCHRONIZATION & MONGODB PERSISTENCE
    // -------------------------------------------------------------
    const activePlans = await fetchActivePlans();
    
    // Aggregate unique stocks across all active plans
    const uniqueStocksMap = new Map<string, PlanHoldingInfo>();

    activePlans.forEach(plan => {
      const holdings = Array.isArray(plan.holdings) ? plan.holdings : [];
      holdings.forEach((h: any) => {
        const symbol = (h.symbol || '').trim().toUpperCase();
        const scripCode = (h.scripCode || '').trim();
        const key = scripCode || symbol;
        if (key && !uniqueStocksMap.has(key)) {
          uniqueStocksMap.set(key, {
            scripCode: scripCode || undefined,
            symbol,
            companyName: h.companyName || symbol,
            isin: h.isin
          });
        }
      });

      // Also process recommendedStocks array if present
      if (Array.isArray(plan.recommendedStocks)) {
        plan.recommendedStocks.forEach((sym: string) => {
          const cleanSym = String(sym || '').trim().toUpperCase();
          if (cleanSym && !uniqueStocksMap.has(cleanSym)) {
            uniqueStocksMap.set(cleanSym, {
              symbol: cleanSym,
              companyName: cleanSym
            });
          }
        });
      }
    });

    const mongoCollection = await getStockPricesCollection();

    // Also include any previously tracked equities in MongoDB to keep them continuously fresh
    try {
      const existingInDb = await mongoCollection.find({}, { projection: { scripCode: 1, shortName: 1, scripName: 1 } }).toArray();
      existingInDb.forEach((doc: any) => {
        if (doc.scripCode && !uniqueStocksMap.has(doc.scripCode)) {
          uniqueStocksMap.set(doc.scripCode, {
            scripCode: doc.scripCode,
            symbol: doc.shortName || doc.scripCode,
            companyName: doc.scripName
          });
        }
      });
    } catch (mongoReadErr) {
      console.warn('[CRON] Could not read existing tracked stocks from MongoDB:', mongoReadErr);
    }

    const stockItems = Array.from(uniqueStocksMap.values());
    console.log(`[CRON] Synchronizing ${stockItems.length} unique equities with BSE India...`);

    let pricesUpdated = 0;
    let pricesFailed = 0;

    if (stockItems.length > 0) {
      const bulkOps: any[] = [];

      for (const stock of stockItems) {
        try {
          let code = stock.scripCode;
          if (!code && stock.symbol) {
            code = await resolveScripCode(stock.symbol) || undefined;
          }

          if (!code) {
            console.warn(`[CRON] Unable to resolve BSE scripCode for symbol: ${stock.symbol}`);
            pricesFailed++;
            continue;
          }

          const quote = await fetchBseQuote(code);
          const currRate = quote?.CurrRate || {};
          const header = quote?.Header || {};
          const cmpName = quote?.Cmpname || {};

          const ltpStr = currRate.LTP || header.LTP || '0';
          const ltp = parseFloat(String(ltpStr).replace(/,/g, '')) || 0;
          const ltpPaise = Math.round(ltp * 100);

          const chgStr = currRate.Chg || '0';
          const change = parseFloat(String(chgStr).replace(/,/g, '')) || 0;

          const pcChgStr = currRate.PcChg || '0';
          const percentChange = parseFloat(String(pcChgStr).replace(/,/g, '')) || 0;

          const prevCloseStr = header.PrevClose || '0';
          const prevClose = parseFloat(String(prevCloseStr).replace(/,/g, '')) || 0;

          const openStr = header.Open || '0';
          const open = parseFloat(String(openStr).replace(/,/g, '')) || 0;

          const highStr = header.High || '0';
          const high = parseFloat(String(highStr).replace(/,/g, '')) || 0;

          const lowStr = header.Low || '0';
          const low = parseFloat(String(lowStr).replace(/,/g, '')) || 0;

          const stockDoc: StockPriceDocument = {
            scripCode: code,
            shortName: (cmpName.ShortN || stock.symbol || '').toUpperCase(),
            scripName: cmpName.FullN || stock.companyName || stock.symbol,
            isin: stock.isin,
            category: cmpName.Category || 'Listed',
            ltp,
            ltpPaise,
            change,
            percentChange,
            prevClose,
            open,
            high,
            low,
            asOn: header.Ason || new Date().toISOString(),
            source: 'BSE_INDIA',
            updatedAt: new Date()
          };

          bulkOps.push({
            updateOne: {
              filter: { scripCode: code },
              update: { $set: stockDoc },
              upsert: true
            }
          });

          pricesUpdated++;
        } catch (quoteErr) {
          console.error(`[CRON] Failed to fetch quote for ${stock.symbol} (${stock.scripCode}):`, quoteErr);
          pricesFailed++;
        }
      }

      if (bulkOps.length > 0) {
        await mongoCollection.bulkWrite(bulkOps);
        console.log(`[CRON] Upserted ${bulkOps.length} stock prices into MongoDB ArthResearch.StockPrices`);
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      cadence: '15_MINUTES_ACTIVE',
      subscriptions: {
        status: subStatus,
        totalScanned: totalSubsScanned,
        active: activeSubs,
        warning: warningSubs,
        expired: expiredSubs
      },
      stockPricing: {
        uniqueEquitiesMonitored: stockItems.length,
        pricesUpdated,
        pricesFailed
      },
      status: 'CRON_EVALUATED',
      message: `Evaluation completed successfully. Synchronized ${pricesUpdated} BSE stock prices into MongoDB. Next cycle in 15 minutes.`
    });
  } catch (cronErr: any) {
    console.error('[CRON EVALUATION ERROR]', cronErr);
    return res.status(500).json({
      success: false,
      error: cronErr.message || 'Subscription and stock price cron evaluation failed'
    });
  }
}
