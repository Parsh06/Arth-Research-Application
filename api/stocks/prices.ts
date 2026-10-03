import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientRequest, sendSafeError } from '../_lib/security.js';
import { getStockPricesCollection, type StockPriceDocument } from '../_lib/mongodb.js';
import { BSE_TOP_EQUITIES } from '../_lib/bseEquitiesMaster.js';

const BSE_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.bseindia.com',
  'Referer': 'https://www.bseindia.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

const YAHOO_HEADERS = {
  'Accept': '*/*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
};

/**
 * Resolves a BSE scrip code to its ticker symbol using curated registry or BSE search endpoint
 */
async function resolveSymbolFromScripCode(scripCode: string): Promise<{ symbol: string; companyName: string } | null> {
  // Check curated registry first (0ms)
  const curated = BSE_TOP_EQUITIES.find(e => e.scripCode === scripCode);
  if (curated) {
    return { symbol: curated.symbol.toUpperCase(), companyName: curated.companyName };
  }

  // Fallback to BSE search API (which allows datacenter IPs)
  try {
    const sUrl = `https://api.bseindia.com/MSource/1D/GetQuoteAllSearchDatabeta.aspx?searchString=${encodeURIComponent(scripCode)}`;
    const res = await fetch(sUrl, { headers: BSE_HEADERS, signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const symbol = String(item.shortName || item.scripName || '').trim().toUpperCase();
        const companyName = String(item.scripName || item.shortName || scripCode).trim();
        if (symbol) return { symbol, companyName };
      }
    }
  } catch {}

  return null;
}

/**
 * Multi-source Live Price Resolver:
 * 1. Tries BSE India getScripHeaderData (primary direct exchange feed)
 * 2. If BSE returns 403 (common on AWS/Vercel serverless IPs) or times out, falls back to institutional Yahoo BSE feed ({SYMBOL}.BO)
 */
async function fetchResilientLivePrice(scripCode: string, providedSymbol?: string): Promise<StockPriceDocument | null> {
  let symbol = (providedSymbol || '').trim().toUpperCase();
  let companyName = symbol;

  // 1. Resolve ticker symbol if missing
  if (!symbol) {
    const resolved = await resolveSymbolFromScripCode(scripCode);
    if (resolved) {
      symbol = resolved.symbol;
      companyName = resolved.companyName;
    }
  }

  // Attempt 1: Direct BSE Header Feed
  try {
    const bseUrl = `https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Debtflag=&scripcode=${scripCode}&seriesid=`;
    const bseRes = await fetch(bseUrl, {
      headers: BSE_HEADERS,
      signal: AbortSignal.timeout(2000)
    });

    if (bseRes.ok) {
      const data: any = await bseRes.json();
      const currRate = data?.CurrRate || {};
      const header = data?.Header || {};
      const cmpName = data?.Cmpname || {};

      const ltpStr = currRate.LTP || header.LTP || '0';
      const ltp = parseFloat(String(ltpStr).replace(/,/g, '')) || 0;
      if (ltp > 0) {
        const ltpPaise = Math.round(ltp * 100);
        const change = parseFloat(String(currRate.Chg || '0').replace(/,/g, '')) || 0;
        const percentChange = parseFloat(String(currRate.PcChg || '0').replace(/,/g, '')) || 0;

        return {
          scripCode,
          shortName: (cmpName.ShortN || symbol || '').toUpperCase(),
          scripName: cmpName.FullN || companyName || scripCode,
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
      }
    }
  } catch {}

  // Attempt 2: Resilient Cloud Fallback via Yahoo BSE ({SYMBOL}.BO or {SYMBOL}.NS)
  const candidateSymbols: string[] = [];
  if (symbol) candidateSymbols.push(symbol);
  if (symbol === 'TATAMOTORS' || scripCode === '500570') candidateSymbols.push('TMPV');
  if (providedSymbol && !candidateSymbols.includes(providedSymbol.toUpperCase())) {
    candidateSymbols.push(providedSymbol.toUpperCase());
  }

  for (const sym of candidateSymbols) {
    for (const suffix of ['.BO', '.NS']) {
      try {
        const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}${suffix}?interval=1d`;
        const yRes = await fetch(yUrl, {
          headers: YAHOO_HEADERS,
          signal: AbortSignal.timeout(2500)
        });

        if (yRes.ok) {
          const yData: any = await yRes.json();
          const meta = yData?.chart?.result?.[0]?.meta;
          if (meta && meta.regularMarketPrice > 0) {
            const ltp = Number(meta.regularMarketPrice);
            const prevClose = Number(meta.chartPreviousClose || meta.previousClose || ltp);
            const change = parseFloat((ltp - prevClose).toFixed(2));
            const percentChange = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;

            return {
              scripCode,
              shortName: symbol || sym,
              scripName: companyName || symbol || sym,
              category: 'Equity',
              ltp,
              ltpPaise: Math.round(ltp * 100),
              change,
              percentChange,
              prevClose,
              open: Number(meta.regularMarketDayHigh || ltp),
              high: Number(meta.regularMarketDayHigh || ltp),
              low: Number(meta.regularMarketDayLow || ltp),
              asOn: new Date().toISOString(),
              source: 'BSE_CLOUD_FEED',
              updatedAt: new Date()
            };
          }
        }
      } catch (yErr) {
        // Continue to next candidate
      }
    }
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (validateClientRequest(req, res, { rateLimit: { key: 'stocks_prices', max: 120, windowMs: 60000 } })) {
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

  // Layer 1: Query MongoDB Cache safely (gracefully bypasses if DB is unreachable or non-whitelisted)
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
  } catch (dbErr) {
    // Non-fatal, proceeding directly with live fetch
  }

  // Layer 2: Live Fetch for any missing requested scrip codes
  const missingCodes = codes.filter(c => !foundCodes.has(c));
  if (missingCodes.length > 0) {
    const fetchPromises = missingCodes.slice(0, 15).map(async (code) => {
      // Find known symbol if any
      const known = BSE_TOP_EQUITIES.find(e => e.scripCode === code);
      const liveDoc = await fetchResilientLivePrice(code, known?.symbol);
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

  // Also resolve any symbols requested that weren't found by scripCode
  for (const sym of syms) {
    const existing = docs.find(d => (d.shortName || '').toUpperCase() === sym);
    if (!existing) {
      const known = BSE_TOP_EQUITIES.find(e => e.symbol.toUpperCase() === sym);
      const scrip = known?.scripCode || sym;
      const liveDoc = await fetchResilientLivePrice(scrip, sym);
      if (liveDoc) {
        docs.push(liveDoc as any);
      }
    }
  }

  // Build fast lookup dictionary indexed by both scripCode and shortName
  const dict: Record<string, any> = {};
  const cleanList: any[] = [];
  const seenScrips = new Set<string>();

  docs.forEach(doc => {
    const cleanDoc = {
      scripCode: doc.scripCode,
      shortName: doc.shortName,
      scripName: doc.scripName,
      isin: doc.isin,
      category: doc.category || 'Equity',
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
    if (doc.scripCode === '500570') {
      dict['TATAMOTORS'] = cleanDoc;
      dict['TMPV'] = cleanDoc;
    }
    syms.forEach(s => {
      const match = BSE_TOP_EQUITIES.find(e => e.symbol.toUpperCase() === s && e.scripCode === doc.scripCode);
      if (match) dict[s] = cleanDoc;
    });

    if (doc.scripCode && !seenScrips.has(doc.scripCode)) {
      seenScrips.add(doc.scripCode);
      cleanList.push(cleanDoc);
    }
  });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=180');
  return res.status(200).json({
    success: true,
    count: cleanList.length,
    data: dict,
    list: cleanList
  });
}
