// src/schemas/subscription.schema.ts
import { z } from 'zod';

export const SubscriptionStatusEnum = z.enum([
  'none',
  'pending',
  'active',
  'rejected',
  'expired',
  'cancelled'
]);

export const OrderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().optional(),
  userName: z.string().optional(),
  planId: z.string().min(1),
  planName: z.string().optional(),
  planVersionId: z.string().optional(),
  validityDays: z.number().optional(),
  priceMinor: z.number().int().nonnegative(),
  taxMinor: z.number().int().nonnegative().default(0),
  discountMinor: z.number().int().nonnegative().default(0),
  gatewayFeeMinor: z.number().int().nonnegative().default(0),
  totalMinor: z.number().int().nonnegative(),
  couponCode: z.string().optional(),
  status: z.enum(['created', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).default('created'),
  currency: z.string().default('INR'),
  failureReason: z.string().optional(),
  errorCode: z.string().optional(),
  gatewayPaymentId: z.string().optional(),
  gatewayOrderId: z.string().optional(),
  gatewaySignature: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paidAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional()
});

export const PaymentSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().optional(),
  userName: z.string().optional(),
  planName: z.string().optional(),
  amountMinor: z.number().int().positive(),
  currency: z.string().default('INR'),
  provider: z.string().default('razorpay'),
  gatewayPaymentId: z.string().optional(),
  gatewayOrderId: z.string().optional(),
  gatewaySignature: z.string().optional(),
  status: z.enum(['created', 'authorized', 'captured', 'failed', 'refunded']).default('created'),
  failureReason: z.string().optional(),
  paidAt: z.string().optional(),
  createdAt: z.string()
});

export const SubscriptionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  planId: z.string().min(1),
  planVersionId: z.string().optional(),
  planName: z.string().min(1),
  orderId: z.string().optional(),
  paymentId: z.string().optional(),
  pricePaidMinor: z.number().int().nonnegative(),
  validityDays: z.number().int().positive(),
  status: SubscriptionStatusEnum.default('pending'),
  startsAt: z.string().optional(),
  expiresAt: z.number().positive(), // Epoch ms
  createdAt: z.string(),
  updatedAt: z.string().optional()
});

export const EntitlementSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  planId: z.string().min(1),
  featureKey: z.string().min(1),
  isActive: z.boolean().default(true),
  expiresAt: z.number().positive()
});

export type Order = z.infer<typeof OrderSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type Entitlement = z.infer<typeof EntitlementSchema>;
