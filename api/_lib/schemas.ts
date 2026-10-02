import { z } from 'zod';

export const createOrderSchema = z.object({
  planId: z.string().trim().min(1).max(100).optional(),
  duration: z.string().trim().max(50).optional(),
  couponCode: z.string().trim().max(50).optional(),
  amountMinor: z.number().int().positive().max(50000000).optional(), // Max ₹5,00,000 in paise (fallback/custom)
  receipt: z.string().trim().max(100).optional(),
  notes: z.record(z.string(), z.any()).optional()
}).strict().refine((data) => data.planId || data.amountMinor, {
  message: 'Either planId or amountMinor must be provided'
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().trim().min(1).max(100),
  razorpayPaymentId: z.string().trim().min(1).max(100),
  razorpaySignature: z.string().trim().min(1).max(256),
  planId: z.string().trim().max(100).optional(),
  planVersionId: z.string().trim().max(100).optional(),
  planName: z.string().trim().max(200).optional(),
  validityDays: z.number().int().positive().optional(),
  priceMinor: z.number().int().nonnegative().optional(),
  discountMinor: z.number().int().nonnegative().optional(),
  couponCode: z.string().trim().max(50).optional(),
  taxMinor: z.number().int().nonnegative().optional(),
  gatewayFeeMinor: z.number().int().nonnegative().optional(),
  totalMinor: z.number().int().nonnegative().optional(),
  userPhone: z.string().trim().max(20).optional()
}).strict();

export const sendEmailSchema = z.object({
  to: z.string().email().max(255),
  subject: z.string().trim().min(1).max(300),
  html: z.string().max(250000).optional(),
  text: z.string().max(50000).optional(),
  fromName: z.string().trim().max(100).optional(),
  attachments: z.array(
    z.object({
      filename: z.string().max(150),
      content: z.string().max(5000000), // Base64 or string
      contentType: z.string().max(100).optional()
    })
  ).max(5).optional()
}).strict().refine((data) => data.html || data.text, {
  message: 'Either html or text content must be provided'
});

export const refundSchema = z.object({
  paymentId: z.string().trim().startsWith('pay_').max(100),
  amountMinor: z.number().int().positive().max(50000000).optional(),
  reason: z.string().trim().max(255).optional(),
  notes: z.record(z.string(), z.string().max(255)).optional()
}).strict();
