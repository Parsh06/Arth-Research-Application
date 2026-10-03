import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, sendSafeError } from '../_lib/security.js';
import { getStockPricesCollection, type StockPriceDocument } from '../_lib/mongodb.js';
import { BSE_TOP_EQUITIES } from '../_lib/bseEquitiesMaster.js';

const BSE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.bseindia.com',
  'Referer': 'https://www.bseindia.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

let lastBseDebug = '';

async function fetchLiveBseHeader(scripCode: string): Promise<StockPriceDocument | null> {
  try {
    const url = `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&scripcode=${scripCode}&seriesid=`;
    const res = await fetch(url, {
      headers: BSE_HEADERS,
      signal: AbortSignal.timeout(3500)
    });
    lastBseDebug = `BSE status: ${res.status}`;
    if (!res.ok) {
      lastBseDebug += ` (text: ${(await res.text()).slice(0, 100)})`;
      return null;
    }
    const data: any = await res.json();

    const currRate = data?.CurrRate || {};
    const header = data?.Header || {};
    const cmpName = data?.Cmpname || {};

    const ltpStr = currRate.LTP || header.LTP || '0';
    const ltp = parseFloat(String(ltpStr).replace(/,/g, '')) || 0;
    const ltpPaise = Math.round(ltp * 100);
    const change = parseFloat(String(currRate.Chg || '0').replace(/,/g, '')) || 0;
    const percentChange = parseFloat(String(currRate.PcChg || '0').replace(/,/g, '')) || 0;

    return {
      scripCode,
      shortName: (cmpName.ShortN || '').toUpperCase(),
      scripName: cmpName.FullN || cmpName.ShortN || scripCode,
      category: cmpName.Category || 'Listed',
      ltp,
      ltpPaise,
      change,
      percentChange,
      prevClose: parseFloat(String(header.PrevClose || '0').replace(/,/g, '')) || 0,
      open: parseFloat(String(header.Open || '0').replace(/,/g, '')) || 0,
      high: parseFloat(String(header.High || '0').replace(/,/g, '')) || 0,
      low: parseFloat(String(header.Low || '0').replace(/,/g, '')) || 0,
      asOn: header.Ason || new Date().toISOString(),
      source: 'BSE_INDIA_LIVE',
      updatedAt: new Date()
    };
  } catch (err) {
    console.warn(`[BSE Header Fetch Error/Timeout for ${scripCode}]`, err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return sendSafeError(res, 405, 'Method not allowed. Use GET.');
  }

  const scripCodesParam = (req.query.scripCodes as string || '').trim();
  const symbolsParam = (req.query.symbols as string || '').trim();

  let codes = scripCodesParam ? scripCodesParam.split(',').map(s => s.trim()).filter(Boolean) : [];
  const syms = symbolsParam ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : [];

  // Map known symbols to scrip codes if codes weren't explicitly provided
  if (codes.length === 0 && syms.length > 0) {
    for (const sym of syms) {
      const match = BSE_TOP_EQUITIES.find(e => e.symbol.toUpperCase() === sym);
      if (match && !codes.includes(match.scripCode)) {
        codes.push(match.scripCode);
      }
    }
  }

  let docs: any[] = [];
  const foundCodes = new Set<string>();
  let collection: any = null;

  // Layer 1: Query MongoDB Cache safely (gracefully bypasses if DB is unreachable)
  let mongoErrInfo = '';
  try {
    collection = await getStockPricesCollection();
    let filter: any = {};
    if (codes.length > 0) {
      filter.scripCode = { $in: codes };
    } else if (syms.length > 0) {
      filter.shortName = { $in: syms };
    }

    docs = await collection.find(filter).toArray();
    docs.forEach(d => foundCodes.add(d.scripCode));
  } catch (dbErr: any) {
    mongoErrInfo = dbErr?.message || String(dbErr);
    console.warn('[MongoDB Cache Access Warning - Proceeding with Direct BSE Fetch]', dbErr);
  }

  // Layer 2: Live BSE Header Fetch for any missing requested scrip codes
  const missingCodes = codes.filter(c => !foundCodes.has(c));
  if (missingCodes.length > 0) {
    const fetchPromises = missingCodes.slice(0, 15).map(async (code) => {
      const liveDoc = await fetchLiveBseHeader(code);
      if (liveDoc) {
        docs.push(liveDoc as any);
        foundCodes.add(code);
        if (collection) {
          collection.updateOne(
            { scripCode: code },
            { $set: liveDoc },
            { upsert: true }
          ).catch(() => {});
        }
      }
    });
    await Promise.allSettled(fetchPromises);
  }

  // Build fast lookup dictionary indexed by both scripCode and shortName
  const dict: Record<string, any> = {};
  docs.forEach(doc => {
    const cleanDoc = {
      scripCode: doc.scripCode,
      shortName: doc.shortName,
      scripName: doc.scripName,
      isin: doc.isin,
      ltp: doc.ltp,
      ltpPaise: doc.ltpPaise,
      change: doc.change,
      percentChange: doc.percentChange,
      prevClose: doc.prevClose,
      open: doc.open,
      high: doc.high,
      low: doc.low,
      asOn: doc.asOn,
      updatedAt: doc.updatedAt
    };
    if (doc.scripCode) dict[doc.scripCode] = cleanDoc;
    if (doc.shortName) dict[doc.shortName.toUpperCase()] = cleanDoc;
  });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=180');
  return res.status(200).json({
    success: true,
    count: docs.length,
    data: dict,
    list: docs,
    ...(docs.length === 0 ? { debug: { mongoErrInfo, lastBseDebug, codes, missingCodes } } : {})
  });
}
