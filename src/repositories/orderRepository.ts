// src/repositories/orderRepository.ts
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  orderBy, 
  onSnapshot,
  type Unsubscribe 
} from 'firebase/firestore';
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
  userEmail?: string;
  userName?: string;
  planId: string;
  planVersionId?: string;
  planName: string;
  priceMinor: number;
  discountMinor?: number;
  couponCode?: string;
  validityDays: number;
  gatewayFeeMinor?: number;
}

export const orderRepository = {
  /**
   * Creates an order with 18% GST and 3% payment gateway calculation in minor units.
   */
  async createOrder(params: CreateOrderParams): Promise<Order> {
    const now = new Date().toISOString();
    const discountMinor = params.discountMinor || 0;
    const taxableAmountMinor = Math.max(0, params.priceMinor - discountMinor);
    const taxMinor = Math.round(taxableAmountMinor * 0.18); // 18% GST
    const subtotalBeforeGatewayMinor = taxableAmountMinor + taxMinor;
    const gatewayFeeMinor = params.gatewayFeeMinor ?? Math.round(subtotalBeforeGatewayMinor * 0.03); // 3% Gateway Surcharge
    const totalMinor = subtotalBeforeGatewayMinor + gatewayFeeMinor;

    const orderRef = doc(collection(db, COLLECTION_ORDERS));
    const orderPayload: any = {
      id: orderRef.id,
      userId: params.userId,
      userEmail: params.userEmail || '',
      userName: params.userName || '',
      planId: params.planId,
      planName: params.planName,
      planVersionId: params.planVersionId || 'version_1',
      validityDays: params.validityDays,
      priceMinor: params.priceMinor,
      discountMinor,
      taxMinor,
      gatewayFeeMinor,
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
      invoiceNumber?: string;
      userEmail?: string;
      userName?: string;
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
      userEmail: paymentDetails.userEmail || order.userEmail || '',
      userName: paymentDetails.userName || order.userName || '',
      planName: paymentDetails.planName || order.planName || '',
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

    // 2. Update Order Status & Gateway Identifiers
    const orderRef = doc(db, COLLECTION_ORDERS, order.id);
    batch.update(orderRef, {
      status: 'completed',
      gatewayPaymentId: paymentDetails.gatewayPaymentId || '',
      gatewayOrderId: paymentDetails.gatewayOrderId || '',
      gatewaySignature: paymentDetails.gatewaySignature || '',
      invoiceNumber: paymentDetails.invoiceNumber || `INV-ARTH-${new Date().getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`,
      paidAt: now,
      updatedAt: now
    });

    // 3. Create Subscription Record
    const subscriptionRef = doc(collection(db, COLLECTION_SUBSCRIPTIONS));
    const subscriptionId = subscriptionRef.id;
    const expiresAt = calculateExpiryTimestamp(paymentDetails.validityDays);

    const subscriptionPayload: any = {
      id: subscriptionId,
      userId: order.userId,
      userEmail: paymentDetails.userEmail || order.userEmail || '',
      userName: paymentDetails.userName || order.userName || '',
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

  /**
   * Marks an order as failed with exact failure reason and gateway diagnostic details.
   */
  async markOrderFailed(
    orderId: string,
    details: {
      failureReason: string;
      errorCode?: string;
      gatewayOrderId?: string;
      gatewayPaymentId?: string;
    }
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const orderRef = doc(db, COLLECTION_ORDERS, orderId);
      
      const updateData: any = {
        status: 'failed',
        failureReason: details.failureReason,
        updatedAt: now
      };

      if (details.errorCode) updateData.errorCode = details.errorCode;
      if (details.gatewayOrderId) updateData.gatewayOrderId = details.gatewayOrderId;
      if (details.gatewayPaymentId) updateData.gatewayPaymentId = details.gatewayPaymentId;

      const batch = writeBatch(db);
      batch.update(orderRef, updateData);

      // Also record in payments collection as a failed attempt
      const paymentRef = doc(collection(db, COLLECTION_PAYMENTS));
      batch.set(paymentRef, sanitizeForFirestore({
        id: paymentRef.id,
        orderId,
        status: 'failed',
        failureReason: details.failureReason,
        gatewayPaymentId: details.gatewayPaymentId || '',
        gatewayOrderId: details.gatewayOrderId || '',
        provider: 'razorpay',
        createdAt: now
      }));

      await batch.commit();
    } catch (err) {
      console.warn('[orderRepository] Failed to mark order as failed:', err);
    }
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
  },

  /**
   * Fetches all orders across all users for Super Admin financial audits.
   */
  async getAllOrders(): Promise<Order[]> {
    const q = query(collection(db, COLLECTION_ORDERS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Order);
  },

  /**
   * Real-time subscription to all orders for Super Admin financial overview.
   */
  subscribeToAllOrders(callback: (orders: Order[]) => void): Unsubscribe {
    const q = query(collection(db, COLLECTION_ORDERS), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const orders = snap.docs.map(d => d.data() as Order);
      callback(orders);
    }, (err) => {
      console.error('[orderRepository] Realtime orders listener error:', err);
      callback([]);
    });
  }
};
