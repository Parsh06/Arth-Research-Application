import { getApiEndpoint, CLIENT_API_HEADERS } from '../config/api';

export interface LiveStockPrice {
  scripCode: string;
  shortName: string;
  scripName: string;
  isin?: string;
  category?: string;
  ltp: number;
  ltpPaise: number;
  change: number;
  percentChange: number;
  prevClose: number;
  open: number;
  high: number;
  low: number;
  asOn: string;
  updatedAt: string;
}

export interface StockPricesResponse {
  success: boolean;
  count: number;
  data: Record<string, LiveStockPrice>;
  list: LiveStockPrice[];
}

export const stockService = {
  /**
   * Fetches latest stock prices from MongoDB cache via serverless API.
   */
  async getLatestPrices(scripCodes?: string[], symbols?: string[]): Promise<Record<string, LiveStockPrice>> {
    try {
      const params = new URLSearchParams();
      if (scripCodes && scripCodes.length > 0) {
        params.set('scripCodes', scripCodes.join(','));
      }
      if (symbols && symbols.length > 0) {
        params.set('symbols', symbols.join(','));
      }

      const queryString = params.toString();
      const url = getApiEndpoint(`/stocks/prices${queryString ? `?${queryString}` : ''}`);
      
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...CLIENT_API_HEADERS
        }
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error(`Failed to fetch stock prices, status: ${res.status}`);
      }

      const json: StockPricesResponse = await res.json();
      return json.data || {};
    } catch (err) {
      console.warn('[StockService] Price retrieval error:', err);
      return {};
    }
  }
};
