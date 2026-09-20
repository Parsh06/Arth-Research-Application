// src/schemas/research.schema.ts
import { z } from 'zod';

export const CallTypeEnum = z.enum(['BUY', 'SELL', 'HOLD', 'ACCUMULATE']);
export const CallStatusEnum = z.enum(['ACTIVE', 'TARGET_ACHIEVED', 'STOPLOSS_TRIGGERED', 'CLOSED']);
export const HorizonEnum = z.enum(['INTRADAY', 'SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']);

export const ResearchCallSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  companyName: z.string().default(''),
  exchange: z.string().default('NSE'),
  callType: CallTypeEnum.default('BUY'),
  entryPriceMinor: z.number().int().nonnegative().default(0), // in paise (0 if market CMP)
  targetPriceMinor: z.number().int().nonnegative().default(0), // in paise (0 if open target)
  stopLossMinor: z.number().int().nonnegative().default(0), // in paise (0 if trailing/open)
  timeHorizon: HorizonEnum.default('MEDIUM_TERM'),
  potentialUpsidePercent: z.number().default(0),
  rationale: z.string().default(''),
  status: CallStatusEnum.default('ACTIVE'),
  planCategory: z.string().default('all'), // 'all' | 'equity' | 'fno' | 'hybrid'
  targetAudienceType: z.enum(['all', 'plans', 'users']).default('all').optional(),
  targetPlanNames: z.array(z.string()).default([]).optional(),
  targetUserIds: z.array(z.string()).default([]).optional(),
  authorEmail: z.string().default('analyst@arth.com'),
  publishedAt: z.string(),
  updatedAt: z.string().optional()
});

export type ResearchCall = z.infer<typeof ResearchCallSchema>;

