import { getApiEndpoint } from '../config/api';

declare global {
  interface Window {
    Razorpay?: any;
  }
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      options.onFailure({ description: 'Unable to initialize Razorpay payment gateway.' });
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
      options.onFailure({ description: orderRes.error || 'Failed to initialize payment order.' });
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
          options.onFailure({ reason: 'Payment window closed by investor.' });
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
            options.onSuccess(response);
          } else {
            options.onFailure({ description: verifyRes.error || 'Signature verification failed.' });
          }
        } catch (vErr: any) {
          options.onFailure({ description: vErr.message || 'Signature verification error.' });
        }
      }
    };

    const rzpInstance = new window.Razorpay(razorpayOptions);
    rzpInstance.on('payment.failed', (resp: any) => {
      options.onFailure(resp.error || { description: 'Payment declined.' });
    });

    rzpInstance.open();
  }
};
