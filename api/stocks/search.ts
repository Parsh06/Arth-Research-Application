import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, sendSafeError } from '../_lib/security.js';

interface BseSearchResult {
  strSricpCode?: string;
  shortName?: string;
  scripName?: string;
  Isin?: string;
  SEOUrl?: string;
  Type?: string;
}

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

  try {
    const targetUrl = `https://api.bseindia.com/MSource/1D/GetQuoteAllSearchDatabeta.aspx?searchString=${encodeURIComponent(query)}`;
    
    const bseResponse = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.bseindia.com',
        'Referer': 'https://www.bseindia.com/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
      }
    });

    if (!bseResponse.ok) {
      throw new Error(`BSE API responded with status ${bseResponse.status}`);
    }

    const rawData = await bseResponse.json() as BseSearchResult[];

    if (!Array.isArray(rawData)) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const qUpper = query.toUpperCase();

    const sanitized = rawData.map(item => {
      const scripCode = String(item.strSricpCode || '').trim();
      const symbol = String(item.shortName || item.scripName || '').trim();
      const companyName = String(item.scripName || item.shortName || '').trim();
      const isin = String(item.Isin || '').trim();
      const type = String(item.Type || '').trim();
      const seoUrl = String(item.SEOUrl || '').trim();

      // Calculate relevance score
      let score = 0;
      const symUpper = symbol.toUpperCase();
      const nameUpper = companyName.toUpperCase();

      if (scripCode === qUpper || symUpper === qUpper) {
        score += 100;
      } else if (symUpper.startsWith(qUpper)) {
        score += 70;
      } else if (nameUpper.startsWith(qUpper)) {
        score += 50;
      } else if (symUpper.includes(qUpper)) {
        score += 30;
      } else if (nameUpper.includes(qUpper)) {
        score += 20;
      }

      // Prioritize Equity over Derivatives/Futures/Options
      if (type.toLowerCase().includes('equity')) {
        score += 25;
      } else if (type.toLowerCase().includes('derivative')) {
        score -= 20;
      }

      return {
        scripCode,
        symbol,
        companyName,
        isin,
        type,
        seoUrl,
        score
      };
    })
    .filter(item => item.scripCode && item.symbol)
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...item }) => item);

    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    return res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized.slice(0, 25)
    });
  } catch (err: any) {
    console.error('[BSE Search Proxy Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to query BSE stock search index'
    });
  }
}
