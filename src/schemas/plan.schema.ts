// src/schemas/plan.schema.ts
import { z } from 'zod';

export const PlanHoldingSchema = z.object({
  symbol: z.string().min(1),
  companyName: z.string().min(1),
  sector: z.string().optional(),
  targetWeightPercent: z.number().nonnegative(),
  recommendedPriceMinor: z.number().int().nonnegative().optional(),
  notes: z.string().optional()
});

export const PlanVersionSchema = z.object({
  versionNumber: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string(),
  priceMinor: z.number().int().nonnegative(), // in paise (e.g. 129900 = ₹1,299.00)
  currency: z.string().default('INR'),
  validityDays: z.number().int().positive(),
  features: z.array(z.string()),
  category: z.enum(['equity', 'fno', 'hybrid', 'commodity']).default('equity'),
  riskLevel: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  expectedCagr: z.number().nonnegative(),
  minInvestmentMinor: z.number().int().nonnegative(), // in paise
  stockLimit: z.number().int().positive(),
  recommendedInstruments: z.array(z.string()).default([]),
  holdings: z.array(PlanHoldingSchema).default([]),
  publishedAt: z.string(),
  createdAt: z.string()
});

export const PlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  priceMinor: z.number().int().nonnegative(), // current active price in paise
  currency: z.string().default('INR'),
  validityDays: z.number().int().positive(),
  features: z.array(z.string()),
  category: z.string().default('equity'),
  riskLevel: z.string().default('Medium'),
  expectedCagr: z.number(),
  minInvestmentMinor: z.number().int().nonnegative(),
  stockLimit: z.number().int().positive(),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  recommendedStocks: z.array(z.string()).optional(),
  holdings: z.array(PlanHoldingSchema).default([]),
  currentVersionId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional()
});

export type PlanHolding = z.infer<typeof PlanHoldingSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type PlanVersion = z.infer<typeof PlanVersionSchema>;
