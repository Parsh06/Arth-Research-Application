import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
    return;
  }

  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ error: 'Missing razorpayOrderId, razorpayPaymentId, or razorpaySignature' });
      return;
    }

    if (!keySecret) {
      res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not configured on backend server' });
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpaySignature;

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
