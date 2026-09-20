import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { applyCors, sendSafeError } from '../_lib/security';
import { verifyPaymentSchema } from '../_lib/schemas';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strict CORS & Preflight handling
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method not allowed. Only POST is supported.');
  }

  try {
    const parseResult = verifyPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map(i => i.message).join('; ');
      return sendSafeError(res, 400, `Invalid payment verification payload: ${issueMsg}`);
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parseResult.data;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keySecret) {
      return sendSafeError(res, 500, 'RAZORPAY_KEY_SECRET not configured on backend server');
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(String(razorpaySignature), 'utf-8');
    const isAuthentic = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (isAuthentic) {
      console.log(`[RAZORPAY PAYMENT VERIFIED] Payment ID: ${razorpayPaymentId}, Order ID: ${razorpayOrderId}`);
      res.status(200).json({
        success: true,
        verified: true,
        message: 'Razorpay signature verified successfully.'
      });
    } else {
      console.warn(`[RAZORPAY SIGNATURE MISMATCH] Expected: ${expectedSignature}, Received: ${razorpaySignature}`);
      res.status(400).json({
        success: false,
        verified: false,
        error: 'Cryptographic signature mismatch. Payment verification failed.'
      });
    }
  } catch (err: any) {
    console.error('[RAZORPAY VERIFY SERVER ERROR]', err);
    res.status(500).json({ error: err.message || 'Internal server error during payment verification' });
  }
}
