// src/schemas/research.schema.ts
import { z } from 'zod';

export const CallTypeEnum = z.enum(['BUY', 'SELL', 'HOLD', 'ACCUMULATE']);
export const CallStatusEnum = z.enum(['ACTIVE', 'TARGET_ACHIEVED', 'STOPLOSS_TRIGGERED', 'CLOSED']);
export const HorizonEnum = z.enum(['INTRADAY', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']);

export const ResearchCallSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  companyName: z.string().min(1),
  exchange: z.string().default('NSE'),
  callType: CallTypeEnum.default('BUY'),
  entryPriceMinor: z.number().int().positive(), // in paise
  targetPriceMinor: z.number().int().positive(),
  stopLossMinor: z.number().int().positive(),
  timeHorizon: HorizonEnum.default('MEDIUM_TERM'),
  potentialUpsidePercent: z.number(),
  rationale: z.string().min(1),
  status: CallStatusEnum.default('ACTIVE'),
  planCategory: z.string().default('all'), // 'all' | 'equity' | 'fno' | 'hybrid'
  authorEmail: z.string().default('analyst@arth.com'),
  publishedAt: z.string(),
  updatedAt: z.string().optional()
});

export type ResearchCall = z.infer<typeof ResearchCallSchema>;
