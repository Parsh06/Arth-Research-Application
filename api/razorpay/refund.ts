import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/razorpay/refund
 *
 * Initiates a full or partial refund via Razorpay using server-side Basic Auth.
 * Body: { paymentId, amountMinor?, reason?, notes? }
 * If amountMinor is omitted, a full refund is issued.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
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
    const { paymentId, amountMinor, reason, notes } = req.body || {};

    if (!paymentId || !paymentId.startsWith('pay_')) {
      res.status(400).json({ error: 'Valid paymentId (e.g. pay_xxx) is required' });
      return;
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

    if (!keyId || !keySecret) {
      res.status(500).json({ error: 'Razorpay API credentials not configured on backend server' });
      return;
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    // Build refund request body
    const refundBody: Record<string, any> = {
      speed: 'normal' // 'normal' = T+5-7, 'optimum' = fastest available route
    };

    // Include amount if partial refund; omit for full refund
    if (amountMinor && amountMinor > 0) {
      refundBody.amount = Math.round(amountMinor);
    }

    // Razorpay valid reason values
    const validReasons = ['duplicate', 'fraudulent', 'order_change', 'customer_request', 'other'];
    if (reason && validReasons.includes(reason)) {
      refundBody.notes = { reason };
    }

    if (notes && typeof notes === 'object') {
      refundBody.notes = { ...refundBody.notes, ...notes };
    }

    const rzpResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refundBody)
    });

    const rzpData: any = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('[RAZORPAY REFUND ERROR]', rzpData);
      res.status(rzpResponse.status).json({
        success: false,
        error: rzpData.error?.description || 'Failed to initiate refund',
        details: rzpData
      });
      return;
    }

    console.log(
      `[RAZORPAY REFUND INITIATED] Payment: ${paymentId}, Refund ID: ${rzpData.id}, Amount: ₹${(rzpData.amount || 0) / 100}`
    );

    res.status(200).json({
      success: true,
      refundId: rzpData.id,
      paymentId: rzpData.payment_id,
      amountMinor: rzpData.amount,
      currency: rzpData.currency,
      status: rzpData.status, // 'processed' | 'pending' | 'failed'
      speed: rzpData.speed_processed || rzpData.speed_requested || 'normal',
      createdAt: rzpData.created_at ? new Date(rzpData.created_at * 1000).toISOString() : new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[RAZORPAY REFUND SERVER ERROR]', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error during refund' });
  }
}
