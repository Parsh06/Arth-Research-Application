// src/schemas/instrument.schema.ts
import { z } from 'zod';

export const InstrumentTypeEnum = z.enum([
  'EQUITY',
  'ETF',
  'INDEX',
  'FUTURES',
  'OPTIONS',
  'MUTUAL_FUND'
]);

export const InstrumentSchema = z.object({
  id: z.string().min(1), // e.g. "NSE_EQ_RELIANCE"
  symbol: z.string().min(1),
  companyName: z.string().min(1),
  isin: z.string().optional(),
  exchange: z.enum(['NSE', 'BSE', 'MCX']).default('NSE'),
  instrumentType: InstrumentTypeEnum.default('EQUITY'),
  sector: z.string().default('General'),
  industry: z.string().optional(),
  currency: z.string().default('INR'),
  lotSize: z.number().int().positive().default(1),
  priceScale: z.number().int().default(2), // 2 decimals for INR
  quantityScale: z.number().int().default(0), // 0 for integer shares
  isActive: z.boolean().default(true),
  updatedAt: z.string()
});

export const MarketPriceSchema = z.object({
  instrumentId: z.string().min(1),
  symbol: z.string().min(1),
  ltpMinor: z.number().int().nonnegative(), // Last Traded Price in paise
  changeMinor: z.number().int().default(0),
  changePercentBps: z.number().int().default(0), // Basis points (1% = 100 bps)
  openMinor: z.number().int().optional(),
  highMinor: z.number().int().optional(),
  lowMinor: z.number().int().optional(),
  closeMinor: z.number().int().optional(),
  volume: z.number().int().default(0),
  lastUpdated: z.string()
});

export type Instrument = z.infer<typeof InstrumentSchema>;
export type MarketPrice = z.infer<typeof MarketPriceSchema>;
