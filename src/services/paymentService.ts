// src/services/paymentService.ts
import { getApiEndpoint } from '../config/api';
import { auth } from '../config/firebase';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      return { 'Authorization': `Bearer ${token}` };
    }
  } catch (err) {
    console.warn('[PaymentService] Failed to retrieve Firebase ID token:', err);
  }
  return {};
}

export interface RazorpayOrderResponse {
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  error?: string;
}

export interface RazorpayPaymentSuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentDetails {
  success: boolean;
  paymentId: string;
  orderId?: string;
  method: string;           // raw: 'card' | 'upi' | 'netbanking' | 'wallet' | 'emi'
  paymentMode: string;      // normalised: 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET' | 'EMI'
  paymentMethod: string;    // human label: 'Visa •••• 4242 (credit)' etc.
  status: string;
  captured?: boolean;
  international?: boolean;
  amountMinor: number;
  amountRefundedMinor?: number;
  refundStatus?: string;    // null | 'partial' | 'full'
  currency: string;
  // Customer
  customerEmail?: string;
  customerContact?: string; // phone from Razorpay
  // Instrument-specific
  bank?: string;
  wallet?: string;
  vpa?: string;
  cardNetwork?: string;
  cardLast4?: string;
  cardName?: string;
  cardIssuer?: string;
  cardType?: string;        // 'credit' | 'debit' | 'prepaid'
  cardSubType?: string;     // 'consumer' | 'corporate'
  cardInternational?: boolean;
  cardEmi?: boolean;
  emiDuration?: number | null;
  emiPlan?: { issuer: string; duration: number; interest: number; type: string } | null;
  // Razorpay gateway fees
  razorpayFeeMinor?: number;
  razorpayTaxMinor?: number;
  // Acquirer data
  acquirerData?: {
    authCode?: string;
    bankTransactionId?: string;
    rrn?: string;
    upiTransactionId?: string;
    vpaTxnId?: string;
  };
  // Error diagnostics
  errorCode?: string;
  errorDescription?: string;
  errorSource?: string;
  errorStep?: string;
  errorReason?: string;
  // Timestamps
  razorpayCreatedAt?: string;
  error?: string;
}

export interface RazorpayRefundResponse {
  success: boolean;
  refundId?: string;
  paymentId?: string;
  amountMinor?: number;
  currency?: string;
  status?: string;         // 'processed' | 'pending' | 'failed'
  speed?: string;
  createdAt?: string;
  error?: string;
}

export const paymentService = {
  /**
   * Loads the official Razorpay Checkout.js SDK dynamically
   */
  async loadRazorpayScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.Razorpay) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('[PaymentService] Failed to load Razorpay SDK');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },

  /**
   * Requests backend to generate an official Razorpay Order ID
   */
  async createRazorpayOrder(params: {
    amountMinor: number;
    receipt?: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResponse> {
    try {
      const endpoint = getApiEndpoint('/razorpay/create-order');
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[PaymentService] createRazorpayOrder failed:', err);
      return {
        success: false,
        orderId: '',
        amount: 0,
        currency: 'INR',
        keyId: '',
        error: err.message || 'Failed to create payment order'
      };
    }
  },

  /**
   * Sends cryptographic signature to backend for HMAC SHA256 validation
   */
  async verifyPaymentSignature(payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const endpoint = getApiEndpoint('/razorpay/verify-payment');
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (err: any) {
      console.error('[PaymentService] verifyPaymentSignature failed:', err);
      return {
        success: false,
        verified: false,
        error: err.message || 'Failed to verify payment signature'
      };
    }
  },

  /**
   * Unified trigger to launch the luxury Razorpay checkout window
   */
  async launchRazorpayCheckout(options: {
    planName: string;
    amountMinor: number;
    userName: string;
    userEmail: string;
    userPhone?: string;
    receipt?: string;
    onSuccess: (payment: RazorpayPaymentSuccessPayload) => void;
    onFailure: (error: { code?: string; description?: string; reason?: string }) => void;
  }): Promise<void> {
    // Single-shot settle guard to prevent multiple callbacks from firing on duplicate events
    let isSettled = false;

    const safeSuccess = (payment: RazorpayPaymentSuccessPayload) => {
      if (isSettled) return;
      isSettled = true;
      options.onSuccess(payment);
    };

    const safeFailure = (error: { code?: string; description?: string; reason?: string }) => {
      if (isSettled) return;
      isSettled = true;
      options.onFailure(error);
    };

    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      safeFailure({ description: 'Unable to initialize Razorpay payment gateway.' });
      return;
    }

    const orderRes = await this.createRazorpayOrder({
      amountMinor: options.amountMinor,
      receipt: options.receipt,
      notes: {
        planName: options.planName,
        userEmail: options.userEmail
      }
    });

    if (!orderRes.success || !orderRes.orderId) {
      safeFailure({ description: orderRes.error || 'Failed to initialize payment order.' });
      return;
    }

    const razorpayOptions = {
      key: orderRes.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TdoD9HIW3J4mEL',
      amount: orderRes.amount,
      currency: orderRes.currency || 'INR',
      name: 'Arth Research',
      description: `${options.planName} • Institutional Advisory Mandate`,
      image: '/logo1.png',
      order_id: orderRes.orderId,
      prefill: {
        name: options.userName,
        email: options.userEmail,
        contact: options.userPhone || ''
      },
      theme: {
        color: '#C6A15B' // Institutional Brass
      },
      modal: {
        ondismiss: () => {
          safeFailure({ reason: 'Payment window closed by investor.' });
        }
      },
      handler: async (response: RazorpayPaymentSuccessPayload) => {
        try {
          const verifyRes = await paymentService.verifyPaymentSignature({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });

          if (verifyRes.success && verifyRes.verified) {
            safeSuccess(response);
          } else {
            safeFailure({ description: verifyRes.error || 'Signature verification failed.' });
          }
        } catch (vErr: any) {
          safeFailure({ description: vErr.message || 'Signature verification error.' });
        }
      }
    };

    const rzpInstance = new window.Razorpay(razorpayOptions);
    rzpInstance.on('payment.failed', (resp: any) => {
      safeFailure(resp.error || { description: 'Payment declined.' });
    });

    rzpInstance.open();
  },

  /**
   * Fetches the actual payment instrument details from Razorpay via our backend.
   * Accepts either a payment ID (pay_xxx) or an order ID (order_xxx).
   * Called AFTER signature verification or during administrative sync reconciliation.
   */
  async fetchPaymentDetails(paymentIdOrOrderId: string): Promise<RazorpayPaymentDetails> {
    const cleanId = (paymentIdOrOrderId || '').trim();
    try {
      const paramKey = cleanId.startsWith('order_') ? 'orderId' : 'paymentId';
      const endpoint = getApiEndpoint(`/razorpay/fetch-payment?${paramKey}=${encodeURIComponent(cleanId)}`);
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          paymentId: cleanId,
          method: 'unknown',
          paymentMode: 'UNKNOWN',
          paymentMethod: 'Unknown',
          status: 'unknown',
          amountMinor: 0,
          currency: 'INR',
          error: data.error || 'Failed to fetch payment details'
        };
      }
      return data as RazorpayPaymentDetails;
    } catch (err: any) {
      console.error('[PaymentService] fetchPaymentDetails failed:', err);
      return {
        success: false,
        paymentId: cleanId,
        method: 'unknown',
        paymentMode: 'UNKNOWN',
        paymentMethod: 'Unknown',
        status: 'unknown',
        amountMinor: 0,
        currency: 'INR',
        error: err.message || 'Failed to fetch payment details'
      };
    }
  },

  /**
   * Initiates a full or partial refund via our backend.
   */
  async initiateRefund(params: {
    paymentId: string;
    amountMinor?: number;
    reason?: 'duplicate' | 'fraudulent' | 'order_change' | 'customer_request' | 'other';
    notes?: Record<string, string>;
  }): Promise<RazorpayRefundResponse> {
    try {
      const endpoint = getApiEndpoint('/razorpay/refund');
      const authHeaders = await getAuthHeaders();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Refund request failed'
        };
      }
      return data as RazorpayRefundResponse;
    } catch (err: any) {
      console.error('[PaymentService] initiateRefund failed:', err);
      return {
        success: false,
        error: err.message || 'Failed to initiate refund'
      };
    }
  }
};
