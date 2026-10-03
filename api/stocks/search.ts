import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, sendSafeError } from '../_lib/security.js';
import { getStockPricesCollection } from '../_lib/mongodb.js';
import { searchCuratedBseEquities } from '../_lib/bseEquitiesMaster.js';

interface BseSearchResult {
  strSricpCode?: string;
  shortName?: string;
  scripName?: string;
  Isin?: string;
  SEOUrl?: string;
  Type?: string;
}

const BSE_DESKTOP_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://www.bseindia.com',
  'Referer': 'https://www.bseindia.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return sendSafeError(res, 405, 'Method not allowed. Use GET.');
  }

  const query = (req.query.q as string || req.query.searchString as string || '').trim();

  if (!query || query.length < 1) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }

  const qUpper = query.toUpperCase();
  const seenCodes = new Set<string>();
  const combinedResults: any[] = [];

  // Layer 1: Attempt live BSE India Search with standard desktop headers and timeout
  try {
    const targetUrl = `https://api.bseindia.com/MSource/1D/GetQuoteAllSearchDatabeta.aspx?searchString=${encodeURIComponent(query)}`;
    const bseResponse = await fetch(targetUrl, {
      headers: BSE_DESKTOP_HEADERS,
      signal: AbortSignal.timeout(3500)
    });

    if (bseResponse.ok) {
      const rawData = await bseResponse.json() as BseSearchResult[];
      if (Array.isArray(rawData)) {
        for (const item of rawData) {
          const scripCode = String(item.strSricpCode || '').trim();
          const symbol = String(item.shortName || item.scripName || '').trim();
          const companyName = String(item.scripName || item.shortName || '').trim();
          const isin = String(item.Isin || '').trim();
          const type = String(item.Type || '').trim();
          const seoUrl = String(item.SEOUrl || '').trim();

          if (!scripCode || !symbol || seenCodes.has(scripCode)) continue;
          seenCodes.add(scripCode);

          let score = 0;
          const symUpper = symbol.toUpperCase();
          const nameUpper = companyName.toUpperCase();

          if (scripCode === qUpper || symUpper === qUpper) {
            score += 150;
          } else if (symUpper.startsWith(qUpper)) {
            score += 100;
          } else if (nameUpper.startsWith(qUpper)) {
            score += 70;
          } else if (symUpper.includes(qUpper)) {
            score += 40;
          } else if (nameUpper.includes(qUpper)) {
            score += 30;
          }

          if (type.toLowerCase().includes('equity')) {
            score += 25;
          } else if (type.toLowerCase().includes('derivative')) {
            score -= 20;
          }

          combinedResults.push({
            scripCode,
            symbol,
            companyName,
            isin,
            type: type || 'Equity',
            seoUrl,
            score
          });
        }
      }
    }
  } catch (liveErr) {
    console.warn('[BSE Live Search Timeout / Fallback Triggered]', liveErr);
  }

  // Layer 2: Query MongoDB Cached Securities in StockPrices collection
  try {
    const collection = await getStockPricesCollection();
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const dbStocks = await collection.find({
      $or: [
        { scripCode: { $regex: regex } },
        { shortName: { $regex: regex } },
        { scripName: { $regex: regex } }
      ]
    }).limit(15).toArray();

    for (const doc of dbStocks) {
      if (seenCodes.has(doc.scripCode)) continue;
      seenCodes.add(doc.scripCode);

      const symUpper = (doc.shortName || '').toUpperCase();
      let score = 50;
      if (symUpper === qUpper || doc.scripCode === qUpper) score += 100;
      else if (symUpper.startsWith(qUpper)) score += 60;

      combinedResults.push({
        scripCode: doc.scripCode,
        symbol: doc.shortName || doc.scripCode,
        companyName: doc.scripName || doc.shortName,
        isin: doc.isin || '',
        type: doc.category || 'Equity',
        score
      });
    }
  } catch (dbErr) {
    // Non-fatal, continue to Layer 3
  }

  // Layer 3: Curated BSE Top Equities offline registry fallback
  const curatedMatches = searchCuratedBseEquities(query, 20);
  for (const item of curatedMatches) {
    if (seenCodes.has(item.scripCode)) continue;
    seenCodes.add(item.scripCode);
    combinedResults.push({
      ...item,
      score: item.symbol.toUpperCase() === qUpper ? 120 : 60
    });
  }

  // Sort by highest score first
  combinedResults.sort((a, b) => b.score - a.score);
  const finalData = combinedResults.slice(0, 30).map(({ score, ...item }) => item);

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
  return res.status(200).json({
    success: true,
    count: finalData.length,
    data: finalData
  });
}
