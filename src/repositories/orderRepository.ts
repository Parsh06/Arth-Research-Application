// src/repositories/orderRepository.ts
import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Order, Payment, Subscription, Entitlement } from '../schemas/subscription.schema';
import { calculateExpiryTimestamp } from '../utils/datetime';

const COLLECTION_ORDERS = 'orders';
const COLLECTION_PAYMENTS = 'payments';
const COLLECTION_SUBSCRIPTIONS = 'subscriptions';
const COLLECTION_ENTITLEMENTS = 'entitlements';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

export interface CreateOrderParams {
  userId: string;
  planId: string;
  planVersionId?: string;
  planName: string;
  priceMinor: number;
  discountMinor?: number;
  couponCode?: string;
  validityDays: number;
}

export const orderRepository = {
  /**
   * Creates an order with 18% GST calculation in minor units.
   */
  async createOrder(params: CreateOrderParams): Promise<Order> {
    const now = new Date().toISOString();
    const discountMinor = params.discountMinor || 0;
    const taxableAmountMinor = Math.max(0, params.priceMinor - discountMinor);
    const taxMinor = Math.round(taxableAmountMinor * 0.18); // 18% GST
    const totalMinor = taxableAmountMinor + taxMinor;

    const orderRef = doc(collection(db, COLLECTION_ORDERS));
    const orderPayload: any = {
      id: orderRef.id,
      userId: params.userId,
      planId: params.planId,
      planVersionId: params.planVersionId || 'version_1',
      priceMinor: params.priceMinor,
      discountMinor,
      taxMinor,
      totalMinor,
      status: 'created',
      currency: 'INR',
      createdAt: now,
      updatedAt: now
    };

    if (params.couponCode) {
      orderPayload.couponCode = params.couponCode;
    }

    const order = sanitizeForFirestore(orderPayload) as Order;

    const batch = writeBatch(db);
    batch.set(orderRef, order);
    await batch.commit();

    return order;
  },

  /**
   * Completes payment, updates order status, creates active subscription, and provisions entitlements atomically.
   */
  async completePaymentAndProvision(
    order: Order,
    paymentDetails: {
      gatewayPaymentId?: string;
      gatewayOrderId?: string;
      gatewaySignature?: string;
      validityDays: number;
      planName: string;
    }
  ): Promise<{ paymentId: string; subscriptionId: string }> {
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    // 1. Create Payment Record
    const paymentRef = doc(collection(db, COLLECTION_PAYMENTS));
    const paymentId = paymentRef.id;
    const paymentPayload: any = {
      id: paymentId,
      orderId: order.id,
      userId: order.userId,
      amountMinor: order.totalMinor,
      currency: 'INR',
      provider: 'razorpay',
      gatewayPaymentId: paymentDetails.gatewayPaymentId || `pay_mock_${Date.now()}`,
      gatewayOrderId: paymentDetails.gatewayOrderId || `order_mock_${Date.now()}`,
      gatewaySignature: paymentDetails.gatewaySignature || `sig_mock_${Math.random().toString(36).substring(2)}`,
      status: 'captured',
      paidAt: now,
      createdAt: now
    };
    const payment = sanitizeForFirestore(paymentPayload) as Payment;
    batch.set(paymentRef, payment);

    // 2. Update Order Status
    const orderRef = doc(db, COLLECTION_ORDERS, order.id);
    batch.update(orderRef, {
      status: 'completed',
      updatedAt: now
    });

    // 3. Create Subscription Record
    const subscriptionRef = doc(collection(db, COLLECTION_SUBSCRIPTIONS));
    const subscriptionId = subscriptionRef.id;
    const expiresAt = calculateExpiryTimestamp(paymentDetails.validityDays);

    const subscriptionPayload: any = {
      id: subscriptionId,
      userId: order.userId,
      planId: order.planId,
      planVersionId: order.planVersionId || 'version_1',
      planName: paymentDetails.planName,
      orderId: order.id,
      paymentId: paymentId,
      pricePaidMinor: order.totalMinor,
      validityDays: paymentDetails.validityDays,
      status: 'active',
      startsAt: now,
      expiresAt: expiresAt,
      createdAt: now,
      updatedAt: now
    };
    const subscription = sanitizeForFirestore(subscriptionPayload) as Subscription;
    batch.set(subscriptionRef, subscription);

    // 4. Provision Comprehensive Feature Entitlements
    const features = [
      'feature_portfolio_analytics',
      'feature_research_signals',
      'feature_custom_watchlist',
      'feature_priority_support',
      'feature_factor_radar',
      `access_plan_${order.planId}`
    ];

    for (const featureKey of features) {
      const entitlementId = `${order.userId}_${featureKey}`;
      const entitlementRef = doc(db, COLLECTION_ENTITLEMENTS, entitlementId);
      const entitlementPayload: any = {
        id: entitlementId,
        userId: order.userId,
        planId: order.planId,
        featureKey,
        isActive: true,
        expiresAt: expiresAt
      };
      const entitlement = sanitizeForFirestore(entitlementPayload) as Entitlement;
      batch.set(entitlementRef, entitlement, { merge: true });
    }

    await batch.commit();

    return { paymentId, subscriptionId };
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    const q = query(collection(db, COLLECTION_ORDERS), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Order);
  },

  async getOrder(orderId: string): Promise<Order | null> {
    const docRef = doc(db, COLLECTION_ORDERS, orderId);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as Order) : null;
  }
};
