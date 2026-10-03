import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateClientRequest, parseRequestBody, sendSafeError } from '../_lib/security.js';
import { createOrderSchema } from '../_lib/schemas.js';
import { requireAuth } from '../_lib/auth.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Defense-in-depth gatekeeper (blocks Postman, scrapers, invalid origins, abusive rates)
  if (validateClientRequest(req, res, { rateLimit: { key: 'create_order', max: 30, windowMs: 60000 } })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendSafeError(res, 405, 'Method not allowed. Only POST is supported.');
  }

  // Zero-Trust Authentication Guard
  const user = await requireAuth(req, res);
  if (!user) {
    return; // Response already handled with 401
  }

  try {
    const rawBody = parseRequestBody(req.body);
    const parseResult = createOrderSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issueMsg = parseResult.error.issues.map(i => i.message).join('; ');
      return sendSafeError(res, 400, `Invalid order request payload: ${issueMsg}`);
    }

    const { planId, duration, couponCode, receipt, notes, amountMinor: clientAmountMinor } = parseResult.data;
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId || !keySecret) {
      return sendSafeError(res, 500, 'Razorpay API credentials not configured on backend server');
    }

    let calculatedAmountMinor: number;
    let planName = notes?.planName || 'Advisory Plan';

    // SERVER-SIDE CANONICAL PRICE RESOLUTION
    if (planId) {
      const planDoc = await adminDb.collection('plans').doc(planId).get();
      if (!planDoc.exists) {
        return sendSafeError(res, 404, `Selected plan "${planId}" not found in system.`);
      }

      const planData = planDoc.data() || {};
      if (planData.isActive === false) {
        return sendSafeError(res, 400, 'This advisory strategy plan is currently deactivated.');
      }

      planName = planData.name || planName;
      let basePriceMinor = planData.priceMinor || 0;

      // Adjust for duration multipliers/discounts if plan specifies duration structures
      if (duration === 'quarterly' && planData.quarterlyPriceMinor) {
        basePriceMinor = planData.quarterlyPriceMinor;
      } else if (duration === 'half_yearly' && planData.halfYearlyPriceMinor) {
        basePriceMinor = planData.halfYearlyPriceMinor;
      } else if (duration === 'yearly' && planData.yearlyPriceMinor) {
        basePriceMinor = planData.yearlyPriceMinor;
      }

      let discountMinor = 0;

      // SERVER-SIDE COUPON VALIDATION
      if (couponCode) {
        const cleanCode = couponCode.trim().toUpperCase();
        const couponQuery = await adminDb.collection('coupons')
          .where('code', '==', cleanCode)
          .limit(1)
          .get();

        if (!couponQuery.empty) {
          const couponData = couponQuery.docs[0].data();
          const couponActive = couponData.isActive !== false;
          const notExpired = !couponData.expiresAt || new Date(couponData.expiresAt).getTime() > Date.now();
          const hasUsesRemaining = !couponData.maxUses || (couponData.timesUsed || 0) < couponData.maxUses;

          if (couponActive && notExpired && hasUsesRemaining) {
            if (couponData.discountType === 'percentage') {
              discountMinor = Math.round((basePriceMinor * (couponData.discountValue || 0)) / 100);
            } else if (couponData.discountType === 'flat') {
              discountMinor = Math.min(basePriceMinor, (couponData.discountValueMinor || (couponData.discountValue * 100) || 0));
            }
          }
        }
      }

      const taxableAmountMinor = Math.max(0, basePriceMinor - discountMinor);
      const taxMinor = Math.round(taxableAmountMinor * 0.18); // 18% GST
      const gatewayFeeMinor = Math.round((taxableAmountMinor + taxMinor) * 0.03); // 3% Razorpay gateway fee
      calculatedAmountMinor = taxableAmountMinor + taxMinor + gatewayFeeMinor;
    } else if (clientAmountMinor) {
      // Fallback for custom administrative invoice links
      calculatedAmountMinor = clientAmountMinor;
    } else {
      return sendSafeError(res, 400, 'Unable to determine order amount.');
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(calculatedAmountMinor),
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: {
          ...(notes || {}),
          planId: planId || '',
          planName,
          userId: user.uid,
          userEmail: user.email
        }
      })
    });

    const rzpData: any = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('[RAZORPAY CREATE ORDER ERROR]', rzpData);
      return sendSafeError(res, rzpResponse.status, rzpData.error?.description || 'Failed to create payment order');
    }

    console.log(`[RAZORPAY ORDER CREATED] Order ID: ${rzpData.id}, Amount: ₹${rzpData.amount / 100} for User: ${user.uid}`);

    res.status(200).json({
      success: true,
      orderId: rzpData.id,
      amount: rzpData.amount,
      currency: rzpData.currency,
      keyId: keyId
    });
  } catch (err: any) {
    return sendSafeError(res, 500, 'Internal server error during order creation', err);
  }
}
