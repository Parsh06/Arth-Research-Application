import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { sendSafeError } from '../_lib/security';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method not allowed. Only POST is supported.');
  }

  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

  if (!webhookSecret) {
    return sendSafeError(res, 500, 'Razorpay webhook secret is not configured on server.');
  }

  if (!webhookSignature) {
    return sendSafeError(res, 400, 'Missing x-razorpay-signature header.');
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(String(webhookSignature), 'utf-8');

    const isAuthentic =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isAuthentic) {
      console.warn('[RAZORPAY WEBHOOK MISMATCH] Invalid webhook signature received.');
      return sendSafeError(res, 400, 'Invalid cryptographic webhook signature.');
    }

    const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`[RAZORPAY WEBHOOK VERIFIED] Event: ${eventType}, ID: ${event.payload?.payment?.entity?.id || 'N/A'}`);

    // Acknowledge receipt immediately with 200 OK (Razorpay expects HTTP 200 response)
    return res.status(200).json({
      status: 'ok',
      event: eventType,
      received: true
    });
  } catch (err: any) {
    console.error('[RAZORPAY WEBHOOK ERROR]', err);
    return sendSafeError(res, 500, 'Internal server error processing webhook');
  }
}
