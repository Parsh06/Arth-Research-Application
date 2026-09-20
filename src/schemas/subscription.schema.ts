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
  userPhone: z.string().optional(),
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
  refundId: z.string().optional(),
  refundedAt: z.string().optional(),
  refundStatus: z.enum(['pending', 'processed', 'failed']).optional(),
  refundAmountMinor: z.number().int().nonnegative().optional(),
  currency: z.string().default('INR'),
  failureReason: z.string().optional(),
  errorCode: z.string().optional(),
  errorDescription: z.string().optional(),
  errorSource: z.string().optional(),      // 'business' | 'bank' | 'gateway' | 'customer'
  errorStep: z.string().optional(),         // payment_initiation | payment_authentication | payment_authorization
  errorReason: z.string().optional(),
  gatewayPaymentId: z.string().optional(),
  gatewayOrderId: z.string().optional(),
  gatewaySignature: z.string().optional(),
  invoiceNumber: z.string().optional(),
  // ── Payment instrument ──────────────────────────────────────────
  paymentMode: z.string().optional(),       // 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'EMI'
  paymentMethod: z.string().optional(),     // human-readable label e.g. 'Visa •••• 4242'
  bank: z.string().optional(),
  wallet: z.string().optional(),
  vpa: z.string().optional(),
  cardNetwork: z.string().optional(),
  cardLast4: z.string().optional(),
  cardName: z.string().optional(),
  cardIssuer: z.string().optional(),
  cardType: z.string().optional(),          // 'credit' | 'debit' | 'prepaid'
  cardSubType: z.string().optional(),       // 'consumer' | 'corporate'
  cardInternational: z.boolean().optional(),
  emiDuration: z.number().optional(),
  international: z.boolean().optional(),
  // ── Razorpay gateway fees (different from our 3% surcharge) ────
  razorpayFeeMinor: z.number().int().nonnegative().optional(),
  razorpayTaxMinor: z.number().int().nonnegative().optional(),
  // ── Acquirer / bank settlement telemetry ───────────────────────
  acquirerAuthCode: z.string().optional(),
  acquirerBankTxnId: z.string().optional(),
  acquirerRrn: z.string().optional(),       // Retrieval Reference Number
  acquirerUpiTxnId: z.string().optional(),
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
  userPhone: z.string().optional(),
  planName: z.string().optional(),
  amountMinor: z.number().int().positive(),
  currency: z.string().default('INR'),
  provider: z.string().default('razorpay'),
  gatewayPaymentId: z.string().optional(),
  gatewayOrderId: z.string().optional(),
  gatewaySignature: z.string().optional(),
  // ── Payment instrument ──────────────────────────────────────────
  paymentMode: z.string().optional(),
  paymentMethod: z.string().optional(),
  bank: z.string().optional(),
  wallet: z.string().optional(),
  vpa: z.string().optional(),
  cardNetwork: z.string().optional(),
  cardLast4: z.string().optional(),
  cardName: z.string().optional(),
  cardIssuer: z.string().optional(),
  cardType: z.string().optional(),
  cardSubType: z.string().optional(),
  cardInternational: z.boolean().optional(),
  emiDuration: z.number().optional(),
  international: z.boolean().optional(),
  // ── Razorpay gateway fees ───────────────────────────────────────
  razorpayFeeMinor: z.number().int().nonnegative().optional(),
  razorpayTaxMinor: z.number().int().nonnegative().optional(),
  // ── Acquirer data ───────────────────────────────────────────────
  acquirerAuthCode: z.string().optional(),
  acquirerBankTxnId: z.string().optional(),
  acquirerRrn: z.string().optional(),
  acquirerUpiTxnId: z.string().optional(),
  // ── Error diagnostics ───────────────────────────────────────────
  errorCode: z.string().optional(),
  errorDescription: z.string().optional(),
  errorSource: z.string().optional(),
  errorStep: z.string().optional(),
  errorReason: z.string().optional(),
  // ── Status & refunds ────────────────────────────────────────────
  status: z.enum(['created', 'authorized', 'captured', 'failed', 'refunded']).default('created'),
  refundId: z.string().optional(),
  refundedAt: z.string().optional(),
  refundStatus: z.enum(['pending', 'processed', 'failed']).optional(),
  refundAmountMinor: z.number().int().nonnegative().optional(),
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
