import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/razorpay/fetch-payment?paymentId=pay_xxx
 *
 * Fetches FULL payment details from Razorpay using server-side Basic Auth.
 * Returns every available field: payment method, bank, VPA, card details,
 * acquirer data, Razorpay processing fees, error diagnostics, refund status.
 * Called AFTER signature verification to persist the real instrument used.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Only GET is supported.' });
    return;
  }

  try {
    const paymentId = req.query.paymentId as string;

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

    const rzpResponse = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    const p: any = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('[RAZORPAY FETCH PAYMENT ERROR]', p);
      res.status(rzpResponse.status).json({
        error: p.error?.description || 'Failed to fetch payment details',
        details: p
      });
      return;
    }

    const method: string = p.method || 'unknown';

    const result: Record<string, any> = {
      success: true,

      // ── Core identifiers ──────────────────────────────────────────────
      paymentId: p.id,
      orderId: p.order_id || '',
      method,
      status: p.status,                   // created | authorized | captured | failed | refunded
      captured: p.captured || false,
      international: p.international || false,

      // ── Amount & currency ─────────────────────────────────────────────
      amountMinor: p.amount,
      currency: p.currency || 'INR',
      amountRefundedMinor: p.amount_refunded || 0,
      refundStatus: p.refund_status || null,  // null | 'partial' | 'full'

      // ── Normalised display strings ────────────────────────────────────
      paymentMode: normaliseMode(method),
      paymentMethod: buildMethodLabel(p),

      // ── Customer details as provided to Razorpay ──────────────────────
      customerEmail: p.email || '',
      customerContact: p.contact || '',    // phone number

      // ── Instrument-specific fields ────────────────────────────────────
      bank: p.bank || '',                  // netbanking / EMI
      wallet: p.wallet || '',
      vpa: p.vpa || '',                    // UPI VPA

      // Card details
      cardNetwork: p.card?.network || '',  // Visa | Mastercard | RuPay | Amex | Diners
      cardLast4: p.card?.last4 || '',
      cardName: p.card?.name || '',        // card holder name
      cardIssuer: p.card?.issuer || '',
      cardType: p.card?.type || '',        // credit | debit | prepaid
      cardSubType: p.card?.sub_type || '', // consumer | corporate
      cardInternational: p.card?.international || false,
      cardEmi: p.card?.emi || false,

      // EMI
      emiDuration: p.emi_duration || null,
      emiPlan: p.emi_plan ? {
        issuer: p.emi_plan.issuer,
        duration: p.emi_plan.duration,
        interest: p.emi_plan.interest,
        type: p.emi_plan.type
      } : null,

      // ── Razorpay gateway fees ─────────────────────────────────────────
      razorpayFeeMinor: p.fee || 0,        // Razorpay processing fee (paise)
      razorpayTaxMinor: p.tax || 0,        // GST on Razorpay fee (paise)

      // ── Acquirer / bank telemetry ─────────────────────────────────────
      acquirerData: {
        authCode: p.acquirer_data?.auth_code || '',
        bankTransactionId: p.acquirer_data?.bank_transaction_id || '',
        rrn: p.acquirer_data?.rrn || '',                  // Retrieval Reference Number
        upiTransactionId: p.acquirer_data?.upi_transaction_id || '',
        vpaTxnId: p.acquirer_data?.vpa_txn_id || ''
      },

      // ── Error diagnostics (for failed payments) ───────────────────────
      errorCode: p.error_code || '',
      errorDescription: p.error_description || '',
      errorSource: p.error_source || '',   // business | bank | gateway | customer
      errorStep: p.error_step || '',       // payment_initiation | payment_authentication | payment_authorization
      errorReason: p.error_reason || '',

      // ── Timestamps ────────────────────────────────────────────────────
      razorpayCreatedAt: p.created_at ? new Date(p.created_at * 1000).toISOString() : ''
    };

    console.log(`[RAZORPAY FETCH PAYMENT] ID: ${paymentId}, Method: ${method}, Status: ${p.status}`);
    res.status(200).json(result);
  } catch (err: any) {
    console.error('[RAZORPAY FETCH PAYMENT SERVER ERROR]', err);
    res.status(500).json({ error: err.message || 'Internal server error while fetching payment' });
  }
}

function normaliseMode(method: string): string {
  const map: Record<string, string> = {
    card: 'CARD',
    upi: 'UPI',
    netbanking: 'NETBANKING',
    wallet: 'WALLET',
    emi: 'EMI',
    nach: 'NACH',
    cardless_emi: 'CARDLESS EMI'
  };
  return map[method] || method.toUpperCase();
}

function buildMethodLabel(p: any): string {
  switch (p.method) {
    case 'card': {
      const network = p.card?.network || 'Card';
      const last4 = p.card?.last4 ? ` •••• ${p.card.last4}` : '';
      const type = p.card?.type ? ` (${p.card.type})` : '';
      return `${network}${last4}${type}`;
    }
    case 'upi':
      return p.vpa ? `UPI — ${p.vpa}` : 'UPI';
    case 'netbanking':
      return p.bank ? `Net Banking — ${p.bank}` : 'Net Banking';
    case 'wallet':
      return p.wallet ? `Wallet — ${p.wallet}` : 'Wallet';
    case 'emi':
      return p.bank ? `EMI — ${p.bank}` : 'EMI';
    default:
      return p.method ? p.method.replace(/_/g, ' ').toUpperCase() : 'Unknown';
  }
}
