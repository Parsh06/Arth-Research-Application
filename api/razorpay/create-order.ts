import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors, sendSafeError } from '../_lib/security';
import { createOrderSchema } from '../_lib/schemas';

// Simple in-memory rate limiting map for order creation (per IP, 1-minute window)
const orderRateLimitMap = new Map<string, { count: number; resetAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strict CORS & Preflight handling
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method not allowed. Only POST is supported.');
  }

  // Rate limiting check
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const clientRate = orderRateLimitMap.get(clientIp);

  if (clientRate && now < clientRate.resetAt) {
    if (clientRate.count >= 20) {
      return sendSafeError(res, 429, 'Too many order requests. Please wait a minute before retrying.');
    }
    clientRate.count++;
  } else {
    orderRateLimitMap.set(clientIp, { count: 1, resetAt: now + 60 * 1000 });
  }

  try {
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map(i => i.message).join('; ');
      return sendSafeError(res, 400, `Invalid order request payload: ${issueMsg}`);
    }

    const { amountMinor, receipt, notes } = parseResult.data;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId || !keySecret) {
      return sendSafeError(res, 500, 'Razorpay API credentials not configured on backend server');
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amountMinor),
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {}
      })
    });

    const rzpData: any = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('[RAZORPAY CREATE ORDER ERROR]', rzpData);
      res.status(rzpResponse.status).json({
        error: rzpData.error?.description || 'Failed to create Razorpay order',
        details: rzpData
      });
      return;
    }

    console.log(`[RAZORPAY ORDER CREATED] Order ID: ${rzpData.id}, Amount: ₹${rzpData.amount / 100}`);

    res.status(200).json({
      success: true,
      orderId: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency,
      keyId: keyId
    });
  } catch (err: any) {
    console.error('[RAZORPAY CREATE ORDER SERVER ERROR]', err);
    res.status(500).json({ error: err.message || 'Internal server error during order creation' });
  }
}
