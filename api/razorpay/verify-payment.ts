import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { applyCors, parseRequestBody, sendSafeError } from '../_lib/security.js';
import { verifyPaymentSchema } from '../_lib/schemas.js';
import { requireAuth } from '../_lib/auth.js';
import { provisionSubscriptionServer } from '../_lib/provisioning.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Strict CORS & Preflight handling
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method not allowed. Only POST is supported.');
  }

  // Zero-Trust Authentication Guard
  const user = await requireAuth(req, res);
  if (!user) {
    return;
  }

  try {
    const rawBody = parseRequestBody(req.body);
    const parseResult = verifyPaymentSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map(i => i.message).join('; ');
      return sendSafeError(res, 400, `Invalid payment verification payload: ${issueMsg}`);
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      planId,
      planVersionId,
      planName,
      validityDays,
      priceMinor,
      discountMinor,
      couponCode,
      taxMinor,
      gatewayFeeMinor,
      totalMinor,
      userPhone
    } = parseResult.data;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keySecret) {
      return sendSafeError(res, 500, 'RAZORPAY_KEY_SECRET not configured on backend server');
    }

    // 1. Timing-Attack Safe Cryptographic Signature Verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const receivedBuf = Buffer.from(String(razorpaySignature), 'utf-8');
    const isAuthentic = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isAuthentic) {
      console.warn(`[RAZORPAY SIGNATURE MISMATCH] Expected: ${expectedSignature}, Received: ${razorpaySignature}`);
      return sendSafeError(res, 400, 'Cryptographic signature mismatch. Payment verification failed.');
    }

    // 2. Fetch Verified Instrument Telemetry directly from Razorpay
    let rzpPayment: any = {};
    if (keyId && keySecret) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzpPayRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
          headers: { 'Authorization': authHeader }
        });
        if (rzpPayRes.ok) {
          rzpPayment = await rzpPayRes.json();
        }
      } catch (fErr) {
        console.warn('[VerifyPayment] Failed to query Razorpay payment instrument:', fErr);
      }
    }

    // 3. Privileged Server-Side Provisioning
    const provisionResult = await provisionSubscriptionServer({
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName,
      userPhone: userPhone || rzpPayment.contact,
      planId,
      planName,
      planVersionId,
      validityDays,
      priceMinor,
      discountMinor,
      couponCode,
      taxMinor,
      gatewayFeeMinor,
      totalMinor: rzpPayment.amount || totalMinor,
      gatewayOrderId: razorpayOrderId,
      gatewayPaymentId: razorpayPaymentId,
      gatewaySignature: razorpaySignature,
      paymentMode: (rzpPayment.method || 'UNKNOWN').toUpperCase(),
      paymentMethod: rzpPayment.method || 'Razorpay Gateway',
      bank: rzpPayment.bank,
      wallet: rzpPayment.wallet,
      vpa: rzpPayment.vpa,
      cardNetwork: rzpPayment.card?.network,
      cardLast4: rzpPayment.card?.last4,
      cardName: rzpPayment.card?.name,
      cardIssuer: rzpPayment.card?.issuer,
      cardType: rzpPayment.card?.type,
      cardSubType: rzpPayment.card?.sub_type,
      cardInternational: rzpPayment.card?.international,
      emiDuration: rzpPayment.emi_duration,
      international: rzpPayment.international,
      razorpayFeeMinor: rzpPayment.fee,
      razorpayTaxMinor: rzpPayment.tax,
      acquirerAuthCode: rzpPayment.acquirer_data?.auth_code,
      acquirerBankTxnId: rzpPayment.acquirer_data?.bank_transaction_id,
      acquirerRrn: rzpPayment.acquirer_data?.rrn,
      acquirerUpiTxnId: rzpPayment.acquirer_data?.upi_transaction_id
    });

    console.log(`[RAZORPAY PAYMENT VERIFIED & PROVISIONED] Order: ${provisionResult.orderId}, Sub: ${provisionResult.subscriptionId}`);

    res.status(200).json({
      success: true,
      verified: true,
      message: 'Razorpay signature verified and subscription provisioned successfully.',
      orderId: provisionResult.orderId,
      subscriptionId: provisionResult.subscriptionId,
      paymentId: provisionResult.paymentId
    });
  } catch (err: any) {
    console.error('[RAZORPAY VERIFY SERVER ERROR]', err);
    res.status(500).json({ error: err.message || 'Internal server error during payment verification' });
  }
}
