import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { sendSafeError } from '../_lib/security.js';
import { provisionSubscriptionServer } from '../_lib/provisioning.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

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
    const eventId = event.id || `evt_${Date.now()}`;

    console.log(`[RAZORPAY WEBHOOK VERIFIED] Event: ${eventType}, Event ID: ${eventId}`);

    // Check Idempotency for Webhook Event
    const eventDocRef = adminDb.collection('processed_webhook_events').doc(eventId);
    const eventDoc = await eventDocRef.get();
    if (eventDoc.exists) {
      return res.status(200).json({ status: 'ok', message: 'Event already processed' });
    }

    // Process payment.captured or order.paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity && paymentEntity.status === 'captured') {
        const notes = paymentEntity.notes || {};
        const userId = notes.userId;
        const userEmail = notes.userEmail || paymentEntity.email;

        if (userId && userEmail) {
          await provisionSubscriptionServer({
            userId,
            userEmail,
            userName: notes.userName || 'Investor',
            userPhone: paymentEntity.contact,
            planId: notes.planId,
            planName: notes.planName,
            totalMinor: paymentEntity.amount,
            gatewayOrderId: paymentEntity.order_id,
            gatewayPaymentId: paymentEntity.id,
            paymentMode: (paymentEntity.method || 'UNKNOWN').toUpperCase(),
            paymentMethod: paymentEntity.method || 'Razorpay Gateway',
            bank: paymentEntity.bank,
            wallet: paymentEntity.wallet,
            vpa: paymentEntity.vpa,
            cardNetwork: paymentEntity.card?.network,
            cardLast4: paymentEntity.card?.last4,
            cardName: paymentEntity.card?.name,
            cardIssuer: paymentEntity.card?.issuer,
            cardType: paymentEntity.card?.type,
            cardSubType: paymentEntity.card?.sub_type,
            cardInternational: paymentEntity.card?.international,
            emiDuration: paymentEntity.emi_duration,
            international: paymentEntity.international,
            razorpayFeeMinor: paymentEntity.fee,
            razorpayTaxMinor: paymentEntity.tax
          });
        }
      }
    }

    // Mark event as processed
    await eventDocRef.set({
      eventId,
      eventType,
      processedAt: new Date().toISOString()
    });

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
