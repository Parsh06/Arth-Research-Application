import { adminDb } from './firebaseAdmin.js';

export interface ProvisioningParams {
  userId: string;
  userEmail: string;
  userName?: string;
  userPhone?: string;
  planId?: string;
  planName?: string;
  planVersionId?: string;
  validityDays?: number;
  priceMinor?: number;
  discountMinor?: number;
  taxMinor?: number;
  gatewayFeeMinor?: number;
  totalMinor?: number;
  couponCode?: string;
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature?: string;
  paymentMode?: string;
  paymentMethod?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  cardNetwork?: string;
  cardLast4?: string;
  cardName?: string;
  cardIssuer?: string;
  cardType?: string;
  cardSubType?: string;
  cardInternational?: boolean;
  emiDuration?: number | null;
  international?: boolean;
  razorpayFeeMinor?: number;
  razorpayTaxMinor?: number;
  acquirerAuthCode?: string;
  acquirerBankTxnId?: string;
  acquirerRrn?: string;
  acquirerUpiTxnId?: string;
}

export async function provisionSubscriptionServer(params: ProvisioningParams): Promise<{
  success: boolean;
  orderId: string;
  paymentId: string;
  subscriptionId: string;
}> {
  const now = new Date().toISOString();

  // 1. Check idempotency: If this payment has already been provisioned, return existing record
  const existingPaymentSnap = await adminDb.collection('payments')
    .where('gatewayPaymentId', '==', params.gatewayPaymentId)
    .limit(1)
    .get();

  if (!existingPaymentSnap.empty) {
    const existingPayment = existingPaymentSnap.docs[0].data();
    return {
      success: true,
      orderId: existingPayment.orderId,
      paymentId: existingPaymentSnap.docs[0].id,
      subscriptionId: existingPayment.subscriptionId || ''
    };
  }

  // 2. Resolve Plan details if not passed completely
  let planName = params.planName || 'Advisory Plan';
  let validityDays = params.validityDays || 365;
  let priceMinor = params.priceMinor || params.totalMinor || 0;
  let totalMinor = params.totalMinor || priceMinor;

  if (params.planId) {
    try {
      const planDoc = await adminDb.collection('plans').doc(params.planId).get();
      if (planDoc.exists) {
        const pData = planDoc.data() || {};
        planName = pData.name || planName;
        validityDays = pData.validityDays || validityDays;
        if (!priceMinor && pData.priceMinor) {
          priceMinor = pData.priceMinor;
        }
      }
    } catch (pErr) {
      console.warn('[Provisioning] Failed to fetch plan from Firestore:', pErr);
    }
  }

  // Calculate validity expiry timestamp
  const expiresAtMs = Date.now() + validityDays * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(expiresAtMs).toISOString();

  const orderRef = adminDb.collection('orders').doc();
  const orderId = orderRef.id;
  const paymentRef = adminDb.collection('payments').doc();
  const paymentId = paymentRef.id;
  const subscriptionRef = adminDb.collection('subscriptions').doc();
  const subscriptionId = subscriptionRef.id;

  const invoiceNumber = `INV-ARTH-${new Date().getFullYear()}-${orderId.slice(0, 6).toUpperCase()}`;

  const orderPayload = {
    id: orderId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName || 'Investor',
    userPhone: params.userPhone || '',
    planId: params.planId || 'standard_plan',
    planName,
    planVersionId: params.planVersionId || 'version_1',
    validityDays,
    priceMinor,
    discountMinor: params.discountMinor || 0,
    taxMinor: params.taxMinor || Math.round(priceMinor * 0.18),
    gatewayFeeMinor: params.gatewayFeeMinor || 0,
    totalMinor,
    currency: 'INR',
    status: 'completed',
    invoiceNumber,
    gatewayPaymentId: params.gatewayPaymentId,
    gatewayOrderId: params.gatewayOrderId,
    gatewaySignature: params.gatewaySignature || '',
    paymentMode: params.paymentMode || 'UNKNOWN',
    paymentMethod: params.paymentMethod || 'Razorpay Gateway',
    vpa: params.vpa || '',
    cardNetwork: params.cardNetwork || '',
    cardLast4: params.cardLast4 || '',
    cardName: params.cardName || '',
    cardIssuer: params.cardIssuer || '',
    cardType: params.cardType || '',
    cardSubType: params.cardSubType || '',
    cardInternational: params.cardInternational || false,
    bank: params.bank || '',
    wallet: params.wallet || '',
    emiDuration: params.emiDuration || null,
    international: params.international || false,
    razorpayFeeMinor: params.razorpayFeeMinor || 0,
    razorpayTaxMinor: params.razorpayTaxMinor || 0,
    acquirerAuthCode: params.acquirerAuthCode || '',
    acquirerBankTxnId: params.acquirerBankTxnId || '',
    acquirerRrn: params.acquirerRrn || '',
    acquirerUpiTxnId: params.acquirerUpiTxnId || '',
    paidAt: now,
    createdAt: now,
    updatedAt: now,
    ...(params.couponCode ? { couponCode: params.couponCode } : {})
  };

  const paymentPayload = {
    id: paymentId,
    orderId,
    subscriptionId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName || 'Investor',
    userPhone: params.userPhone || '',
    planName,
    amountMinor: totalMinor,
    currency: 'INR',
    provider: 'razorpay',
    gatewayPaymentId: params.gatewayPaymentId,
    gatewayOrderId: params.gatewayOrderId,
    gatewaySignature: params.gatewaySignature || '',
    paymentMode: params.paymentMode || 'UNKNOWN',
    paymentMethod: params.paymentMethod || 'Razorpay Gateway',
    bank: params.bank || '',
    wallet: params.wallet || '',
    vpa: params.vpa || '',
    cardNetwork: params.cardNetwork || '',
    cardLast4: params.cardLast4 || '',
    cardName: params.cardName || '',
    cardIssuer: params.cardIssuer || '',
    cardType: params.cardType || '',
    cardSubType: params.cardSubType || '',
    cardInternational: params.cardInternational || false,
    emiDuration: params.emiDuration || null,
    international: params.international || false,
    razorpayFeeMinor: params.razorpayFeeMinor || 0,
    razorpayTaxMinor: params.razorpayTaxMinor || 0,
    acquirerAuthCode: params.acquirerAuthCode || '',
    acquirerBankTxnId: params.acquirerBankTxnId || '',
    acquirerRrn: params.acquirerRrn || '',
    acquirerUpiTxnId: params.acquirerUpiTxnId || '',
    status: 'captured',
    paidAt: now,
    createdAt: now
  };

  const subscriptionPayload = {
    id: subscriptionId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName || 'Investor',
    planId: params.planId || 'standard_plan',
    planVersionId: params.planVersionId || 'version_1',
    planName,
    orderId,
    paymentId,
    pricePaidMinor: totalMinor,
    validityDays,
    status: 'active',
    startsAt: now,
    expiresAt,
    createdAt: now,
    updatedAt: now
  };

  const batch = adminDb.batch();

  batch.set(orderRef, orderPayload);
  batch.set(paymentRef, paymentPayload);
  batch.set(subscriptionRef, subscriptionPayload);

  // 4. Update User Document with Active Mandate
  const userRef = adminDb.collection('users').doc(params.userId);
  batch.set(userRef, {
    subscriptionStatus: 'active',
    activePlanId: params.planId || 'standard_plan',
    activePlanName: planName,
    subscriptionExpiresAt: expiresAt,
    updatedAt: now
  }, { merge: true });

  // 5. Provision Entitlements
  const features = [
    'feature_portfolio_analytics',
    'feature_research_signals',
    'feature_custom_watchlist',
    'feature_priority_support',
    'feature_factor_radar',
    params.planId ? `access_plan_${params.planId}` : 'access_plan_standard'
  ];

  for (const featureKey of features) {
    const entitlementId = `${params.userId}_${featureKey}`;
    const entitlementRef = adminDb.collection('entitlements').doc(entitlementId);
    batch.set(entitlementRef, {
      id: entitlementId,
      userId: params.userId,
      planId: params.planId || 'standard_plan',
      featureKey,
      grantedAt: now,
      expiresAt,
      isActive: true,
      updatedAt: now
    }, { merge: true });
  }

  // 6. Record Audit Log Entry
  const auditRef = adminDb.collection('auditLogs').doc();
  batch.set(auditRef, {
    action: 'SUBSCRIPTION_PROVISIONED_SERVER',
    actorId: 'system_privileged_engine',
    actorEmail: params.userEmail,
    targetUserId: params.userId,
    details: {
      orderId,
      paymentId,
      subscriptionId,
      planId: params.planId,
      amountMinor: totalMinor,
      gatewayPaymentId: params.gatewayPaymentId
    },
    timestamp: now
  });

  await batch.commit();

  // 7. Increment coupon usage if used
  if (params.couponCode) {
    try {
      const couponQuery = await adminDb.collection('coupons')
        .where('code', '==', params.couponCode.toUpperCase().trim())
        .limit(1)
        .get();

      if (!couponQuery.empty) {
        const couponDoc = couponQuery.docs[0];
        const currentUsed = couponDoc.data().timesUsed || 0;
        await couponDoc.ref.update({
          timesUsed: currentUsed + 1,
          updatedAt: now
        });
      }
    } catch (cErr) {
      console.warn('[Provisioning] Failed to increment coupon usage:', cErr);
    }
  }

  // 8. Server-side Guaranteed Email Dispatch
  // Guarantees payment confirmation & portfolio onboarding link is delivered even if user closes browser or network drops
  try {
    const { sendServerPaymentConfirmationEmail } = await import('./mailer.js');
    sendServerPaymentConfirmationEmail({
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName || 'Valued Investor',
      orderId,
      paymentId,
      subscriptionId,
      planId: params.planId || 'standard_plan',
      planName,
      validityDays,
      totalMinor,
      priceMinor,
      taxMinor: params.taxMinor || Math.round(priceMinor * 0.18),
      gatewayFeeMinor: params.gatewayFeeMinor || 0,
      invoiceNumber,
      paymentMode: params.paymentMode || 'RAZORPAY',
      paymentMethod: params.paymentMethod || 'Razorpay Gateway',
      paidAt: now
    }).catch(e => console.warn('[Provisioning] Server email background error:', e));
  } catch (mErr) {
    console.warn('[Provisioning] Server email import error:', mErr);
  }

  return {
    success: true,
    orderId,
    paymentId,
    subscriptionId
  };
}
