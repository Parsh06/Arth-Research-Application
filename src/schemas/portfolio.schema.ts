// src/schemas/portfolio.schema.ts
import { z } from 'zod';

export const PortfolioStatusEnum = z.enum([
  'not_created',
  'draft',
  'pending',
  'in_review',
  'active',
  'rejected',
  'expired'
]);

export const PortfolioHoldingSchema = z.object({
  id: z.string().optional(),
  portfolioId: z.string().optional(),
  versionId: z.string().optional(),
  instrumentId: z.string().default(''),
  symbol: z.string().min(1),
  companyName: z.string().min(1),
  exchange: z.string().default('NSE'),
  quantity: z.number().int().positive(),
  quantityScale: z.number().int().default(0),
  buyPriceMinor: z.number().int().positive(), // in paise
  investedAmountMinor: z.number().int().positive(), // quantity * buyPriceMinor
  currentPriceMinor: z.number().int().optional(),
  currentValueMinor: z.number().int().optional(),
  pnlMinor: z.number().int().optional(),
  allocationBps: z.number().int().optional(), // Basis points (e.g. 1500 = 15.00%)
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export const PortfolioVersionSchema = z.object({
  id: z.string().optional(),
  portfolioId: z.string(),
  versionNumber: z.number().int().positive(),
  status: PortfolioStatusEnum,
  source: z.enum(['user_submitted', 'admin_approved', 'admin_correction', 'rebalanced']),
  previousVersionId: z.string().optional(),
  totalInvestmentMinor: z.number().int().nonnegative(),
  stockCount: z.number().int().nonnegative(),
  changeReason: z.string().optional(),
  submittedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  calculationVersion: z.number().int().default(1),
  createdAt: z.string()
});

export const PortfolioSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  planId: z.string().min(1),
  planName: z.string().min(1),
  status: PortfolioStatusEnum.default('pending'),
  currentVersionId: z.string().optional(),
  totalInvestmentMinor: z.number().int().nonnegative().default(0),
  currentValueMinor: z.number().int().optional(),
  stockCount: z.number().int().nonnegative().default(0),
  expiresAt: z.number().optional(), // Milliseconds epoch timestamp
  submittedAt: z.string().optional(),
  approvedAt: z.string().optional(),
  approvedBy: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectedBy: z.string().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional()
});

export const PortfolioSnapshotSchema = z.object({
  id: z.string().optional(),
  portfolioId: z.string(),
  date: z.string(), // YYYY-MM-DD
  investedAmountMinor: z.number().int().nonnegative(),
  marketValueMinor: z.number().int().nonnegative(),
  pnlMinor: z.number().int(),
  pnlPercentBps: z.number().int(),
  calculationVersion: z.number().int().default(1),
  createdAt: z.string()
});

export type PortfolioHolding = z.infer<typeof PortfolioHoldingSchema>;
export type PortfolioVersion = z.infer<typeof PortfolioVersionSchema>;
export type Portfolio = z.infer<typeof PortfolioSchema>;
export type PortfolioSnapshot = z.infer<typeof PortfolioSnapshotSchema>;
