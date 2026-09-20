import { z } from 'zod';

export const couponSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2, 'Coupon code must be at least 2 characters').max(30, 'Coupon code max 30 chars').toUpperCase(),
  name: z.string().trim().min(2, 'Coupon name required').max(100),
  description: z.string().trim().max(300).optional().default(''),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.number().min(0.01, 'Discount value must be greater than 0'),
  
  // Plan Scope
  appliesTo: z.enum(['all_plans', 'specific_plan']).default('all_plans'),
  planId: z.string().optional().default(''),
  planName: z.string().optional().default(''),
  
  // User Scope
  targetUserType: z.enum(['all_users', 'specific_user']).default('all_users'),
  userEmail: z.string().email('Invalid email').optional().or(z.literal('')).default(''),
  
  // Constraints & Limits
  minOrderAmountRupees: z.number().min(0).default(0),
  usageLimit: z.number().min(0).default(0), // 0 means unlimited
  timesUsed: z.number().min(0).default(0),
  
  validFrom: z.string(), // ISO String
  validUntil: z.string(), // ISO String
  isActive: z.boolean().default(true),
  
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type Coupon = z.infer<typeof couponSchema>;
