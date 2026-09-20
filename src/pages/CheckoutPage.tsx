import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CreditCard, Lock, LogIn, Tag, CheckCircle2, AlertCircle, X, Sparkles, Check, Phone, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePlanStore } from '../stores/planStore';
import { orderRepository } from '../repositories/orderRepository';
import { userRepository } from '../repositories/userRepository';
import TopNavBar from '../components/TopNavBar';
import { formatINR, toMinorUnits } from '../utils/money';

export default function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('investor@okhdfcbank');
  const [phone, setPhone] = useState('');
  
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [activeSubscription, setActiveSubscription] = useState<any | null>(null);
  const [allowRepurchase, setAllowRepurchase] = useState<boolean>(false);
  
  const { user, dbUser, loginWithGoogle } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Prevent accidental page refresh while payment is processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'A transaction is in progress. Leaving or refreshing may interrupt your payment confirmation.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

  // If this plan was just purchased in current session (within last 2 hours), auto-forward to success confirmation
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('last_successful_checkout');
      if (raw) {
        const item = JSON.parse(raw);
        if (item.planId === planId && Date.now() - (item.timestamp || 0) < 2 * 60 * 60 * 1000) {
          navigate(`/checkout/success?planId=${planId}&subscriptionId=${item.subscriptionId || ''}`, {
            replace: true,
            state: item
          });
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [planId, navigate]);

  // Check if user already holds an active subscription for this plan in Firestore
  useEffect(() => {
    if (!user?.uid || !planId) return;
    let isMounted = true;
    import('../repositories/subscriptionRepository').then(({ subscriptionRepository }) => {
      return subscriptionRepository.getUserSubscriptions(user.uid);
    }).then(subs => {
      if (!isMounted) return;
      const now = Date.now();
      const match = subs.find(s => {
        if (s.planId !== planId) return false;
        if (s.status !== 'active') return false;
        if (!s.expiresAt) return true;
        const exp = typeof s.expiresAt === 'number' ? s.expiresAt : new Date(s.expiresAt).getTime();
        return exp > now;
      });
      setActiveSubscription(match || null);
    }).catch(err => {
      console.warn('[CheckoutPage] Check subscription error:', err);
    });
    return () => { isMounted = false; };
  }, [user?.uid, planId]);

  // Load existing phone from userPrivate or user profile if available
  useEffect(() => {
    if (user?.uid) {
      userRepository.getUserPrivate(user.uid).then(priv => {
        if (priv?.phone) {
          setPhone(priv.phone);
        } else if ((dbUser as any)?.phone) {
          setPhone((dbUser as any).phone);
        }
      }).catch(err => console.warn('[CheckoutPage] Load phone warning:', err));
    }
  }, [user?.uid, dbUser]);

  const plan = plans.find(p => p.id === planId);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Login during checkout failed", error);
    }
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'ARTH10' || code === 'WELCOME10') {
      setDiscountPercent(10);
      setCouponApplied(true);
      setCouponError('');
    } else if (code === 'ALPHA20' || code === 'EARLY20') {
      setDiscountPercent(20);
      setCouponApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid voucher code');
      setCouponApplied(false);
      setDiscountPercent(0);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Retrieving Strategy Parameters...</span>
      </div>
    );
  }

  // If user already holds an active subscription and hasn't chosen to re-buy, show existing mandate screen
  if (activeSubscription && !allowRepurchase) {
    const expDate = activeSubscription.expiresAt 
      ? new Date(typeof activeSubscription.expiresAt === 'number' ? activeSubscription.expiresAt : activeSubscription.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Lifetime Coverage';

    return (
      <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6">
        <TopNavBar />
        <div className="max-w-md mx-auto w-full pt-16 text-center">
          <div className="glass-panel p-8 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="w-14 h-14 bg-[hsl(var(--success))/0.12] border border-[hsl(var(--success))/0.25] text-[hsl(var(--success))] rounded-md mx-auto flex items-center justify-center mb-5 shadow-sm">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[hsl(var(--success))/0.1] text-[hsl(var(--success))] text-[10px] font-mono uppercase tracking-wider mb-3 border border-[hsl(var(--success))/0.2]">
              <Sparkles className="w-3 h-3" />
              <span>Mandate Active</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground mb-2">
              Subscription Already Active
            </h1>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              You already hold an active, verified subscription to the <span className="text-foreground font-semibold">{plan.name}</span> strategy. You do not need to make another payment.
            </p>

            <div className="glass-panel-data p-5 text-left mb-6 shadow-sm">
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Strategy Mandate</span>
                  <span className="font-semibold text-foreground">{plan.name}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Active Through</span>
                  <span className="font-semibold tabular-nums text-[hsl(var(--success))]">{expDate}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Mandate Status</span>
                  <span className="font-semibold text-[hsl(var(--success))] uppercase tracking-wider text-[10px]">Verified & Covered</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3 px-5 rounded-md font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open Terminal / Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/history')}
                className="w-full border border-border bg-card/40 hover:bg-card text-foreground py-2.5 px-4 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Invoices & Orders</span>
              </button>
              <button
                onClick={() => setAllowRepurchase(true)}
                className="text-[11px] text-muted-foreground hover:text-foreground font-mono transition-colors pt-2 underline underline-offset-4 cursor-pointer"
              >
                Renew or purchase additional mandate period anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const basePriceMinor = (plan as any).priceMinor || toMinorUnits(plan.price);
  const discountMinor = Math.round(basePriceMinor * (discountPercent / 100));
  const taxableAmountMinor = Math.max(0, basePriceMinor - discountMinor);
  const taxMinor = Math.round(taxableAmountMinor * 0.18); // 18% GST
  const subtotalBeforeGatewayMinor = taxableAmountMinor + taxMinor;
  const gatewayFeeMinor = Math.round(subtotalBeforeGatewayMinor * 0.03); // 3% Gateway Surcharge
  const totalMinor = subtotalBeforeGatewayMinor + gatewayFeeMinor;

  const handleExecutePayment = async () => {
    if (!user || !plan) return;
    
    setIsProcessing(true);
    
    try {
      if (!dbUser) {
        await userRepository.createUser(user.uid, {
          email: user.email || '',
          displayName: user.displayName || 'Investor',
          ...(user.photoURL ? { photoURL: user.photoURL } : {})
        });
      }

      const modeStr = paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'CARD' : 'NETBANKING';
      const methodStr = paymentMethod === 'upi' ? `UPI (${upiId})` : paymentMethod === 'card' ? 'Credit / Debit Card' : 'Net Banking';
      const userPhoneClean = phone.trim();

      // 1. Create order record in Firestore
      const order = await orderRepository.createOrder({
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || 'Valued Investor',
        userPhone: userPhoneClean || undefined,
        planId: plan.id,
        planName: plan.name,
        priceMinor: basePriceMinor,
        discountMinor,
        gatewayFeeMinor,
        couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
        validityDays: plan.validityDays,
        paymentMode: modeStr,
        paymentMethod: methodStr
      });

      // 2. Launch Razorpay Standard Checkout SDK
      const { paymentService } = await import('../services/paymentService');

      await paymentService.launchRazorpayCheckout({
        planName: plan.name,
        amountMinor: totalMinor,
        userName: user.displayName || 'Valued Investor',
        userEmail: user.email || '',
        userPhone: userPhoneClean || undefined,
        receipt: `ARTH_${order.id.slice(0, 8)}`,
        onSuccess: async (rzpResponse) => {
          try {
            // Save phone to user profile and private record if provided
            if (userPhoneClean) {
              userRepository.updateUserPrivate(user.uid, { phone: userPhoneClean }).catch(e => console.warn(e));
              userRepository.updateUser(user.uid, { phone: userPhoneClean }).catch(e => console.warn(e));
            }

            // 3a. Fetch REAL payment details from Razorpay API (actual instrument used)
            //     The handler callback only gives payment_id/order_id/signature — not the method.
            //     We must call our backend to get the actual card/UPI/netbanking details.
            let realPaymentMode = modeStr;
            let realPaymentMethod = methodStr;
            let realVpa: string | undefined = paymentMethod === 'upi' ? upiId : undefined;
            let realCardNetwork: string | undefined;
            let realCardLast4: string | undefined;
            let realCardName: string | undefined;
            let realCardIssuer: string | undefined;
            let realCardType: string | undefined;
            let realCardSubType: string | undefined;
            let realCardInternational: boolean | undefined;
            let realBank: string | undefined;
            let realWallet: string | undefined;
            let realEmiDuration: number | undefined;
            let realInternational: boolean | undefined;
            let realRazorpayFeeMinor: number | undefined;
            let realRazorpayTaxMinor: number | undefined;
            let realAcquirerAuthCode: string | undefined;
            let realAcquirerBankTxnId: string | undefined;
            let realAcquirerRrn: string | undefined;
            let realAcquirerUpiTxnId: string | undefined;

            try {
              const { paymentService: ps } = await import('../services/paymentService');
              const rzpDetails = await ps.fetchPaymentDetails(rzpResponse.razorpay_payment_id);
              if (rzpDetails.success) {
                realPaymentMode        = rzpDetails.paymentMode;
                realPaymentMethod      = rzpDetails.paymentMethod;
                realVpa                = rzpDetails.vpa;
                realCardNetwork        = rzpDetails.cardNetwork;
                realCardLast4          = rzpDetails.cardLast4;
                realCardName           = rzpDetails.cardName;
                realCardIssuer         = rzpDetails.cardIssuer;
                realCardType           = rzpDetails.cardType;
                realCardSubType        = rzpDetails.cardSubType;
                realCardInternational  = rzpDetails.cardInternational;
                realBank               = rzpDetails.bank;
                realWallet             = rzpDetails.wallet;
                realEmiDuration        = rzpDetails.emiDuration ?? undefined;
                realInternational      = rzpDetails.international;
                realRazorpayFeeMinor   = rzpDetails.razorpayFeeMinor;
                realRazorpayTaxMinor   = rzpDetails.razorpayTaxMinor;
                realAcquirerAuthCode   = rzpDetails.acquirerData?.authCode;
                realAcquirerBankTxnId  = rzpDetails.acquirerData?.bankTransactionId;
                realAcquirerRrn        = rzpDetails.acquirerData?.rrn;
                realAcquirerUpiTxnId   = rzpDetails.acquirerData?.upiTransactionId;
              }
            } catch (fetchErr) {
              console.warn('[CheckoutPage] fetchPaymentDetails failed, using pre-selected method:', fetchErr);
            }

            // 3b. Complete payment & provision in Firestore with all real payment data
            const { subscriptionId } = await orderRepository.completePaymentAndProvision(order, {
              gatewayPaymentId: rzpResponse.razorpay_payment_id,
              gatewayOrderId: rzpResponse.razorpay_order_id,
              gatewaySignature: rzpResponse.razorpay_signature,
              validityDays: plan.validityDays,
              planName: plan.name,
              userEmail: user.email || '',
              userName: user.displayName || 'Valued Investor',
              userPhone: userPhoneClean || undefined,
              paymentMode: realPaymentMode,
              paymentMethod: realPaymentMethod,
              vpa: realVpa,
              cardNetwork: realCardNetwork,
              cardLast4: realCardLast4,
              cardName: realCardName,
              cardIssuer: realCardIssuer,
              cardType: realCardType,
              cardSubType: realCardSubType,
              cardInternational: realCardInternational,
              bank: realBank,
              wallet: realWallet,
              emiDuration: realEmiDuration,
              international: realInternational,
              razorpayFeeMinor: realRazorpayFeeMinor,
              razorpayTaxMinor: realRazorpayTaxMinor,
              acquirerAuthCode: realAcquirerAuthCode,
              acquirerBankTxnId: realAcquirerBankTxnId,
              acquirerRrn: realAcquirerRrn,
              acquirerUpiTxnId: realAcquirerUpiTxnId
            });


            // 4. Generate official Tax Invoice PDF & send via email with attachment
            if (user.email) {
              const { emailService } = await import('../services/emailService');
              const { getInvoicePdfBase64 } = await import('../utils/invoicePdfGenerator');

              const invoiceNumber = `INV-ARTH-${new Date().getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`;

              const invoiceData = {
                invoiceNumber,
                paymentDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                paymentId: rzpResponse.razorpay_payment_id,
                orderId: order.id,
                userName: user.displayName || 'Valued Investor',
                userEmail: user.email || '',
                planName: plan.name,
                validityDays: plan.validityDays,
                basePriceMinor,
                discountMinor,
                discountPercent: couponApplied ? discountPercent : 0,
                taxMinor,
                gatewayFeeMinor,
                totalMinor,
                paymentMode: realPaymentMode,
                paymentMethod: realPaymentMethod
              };

              // Generate PDF base64
              let pdfBase64 = '';
              try {
                pdfBase64 = getInvoicePdfBase64(invoiceData);
              } catch (pdfErr) {
                console.warn('[CheckoutPage] PDF generation error:', pdfErr);
              }

              const attachments = pdfBase64 ? [
                {
                  filename: `tax_invoice_${invoiceData.invoiceNumber}.pdf`,
                  content: pdfBase64,
                  encoding: 'base64',
                  contentType: 'application/pdf'
                }
              ] : undefined;

              emailService.sendPaymentConfirmationEmail(
                user.email,
                {
                  userName: user.displayName || 'Valued Investor',
                  planName: plan.name,
                  invoiceNumber: invoiceData.invoiceNumber,
                  paymentDate: invoiceData.paymentDate,
                  amountPaid: formatINR(totalMinor),
                  baseAmount: formatINR(taxableAmountMinor),
                  gstAmount: `${formatINR(taxMinor)} (18% GST)`,
                  paymentMethod: `${realPaymentMethod} • Razorpay (${rzpResponse.razorpay_payment_id})`,
                  period: `${plan.validityDays} Days Operational Mandate`,
                  invoiceUrl: window.location.origin + `/history`
                },
                attachments
              ).catch(emailErr => {
                console.warn('[CheckoutPage] Tax invoice email error:', emailErr);
              });
            }

            // 5. Store completed checkout state in sessionStorage so refreshing or navigating never loses receipt or repeats payment
            try {
              sessionStorage.setItem('last_successful_checkout', JSON.stringify({
                planId: plan.id,
                planName: plan.name,
                subscriptionId,
                totalMinor,
                gatewayFeeMinor,
                taxMinor,
                taxableAmountMinor,
                basePriceMinor,
                discountMinor,
                invoiceNumber: `INV-ARTH-${new Date().getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`,
                paymentId: rzpResponse.razorpay_payment_id,
                paymentMode: realPaymentMode,
                paymentMethod: realPaymentMethod,
                validityDays: plan.validityDays,
                paidAt: new Date().toISOString(),
                timestamp: Date.now()
              }));
            } catch (storageErr) {
              console.warn('[CheckoutPage] Session storage cache error:', storageErr);
            }

            // 6. Instantly synchronize authStore so subscriptionStatus is ACTIVE in memory across the entire app
            useAuthStore.getState().initAuthListener();

            setIsProcessing(false);
            setShowPaymentModal(false);

            // 7. Navigate to checkout confirmation success page with replace: true
            navigate(`/checkout/success?planId=${plan.id}&subscriptionId=${subscriptionId}`, {
              replace: true,
              state: { plan, subscriptionId, totalMinor, gatewayFeeMinor, taxMinor }
            });
          } catch (provisionErr: any) {
            console.error('[CheckoutPage] Provisioning error:', provisionErr);
            setIsProcessing(false);
            alert(`Payment succeeded (Ref: ${rzpResponse.razorpay_payment_id}), but provisioning had an issue: ${provisionErr.message}`);
          }
        },
        onFailure: async (err) => {
          setIsProcessing(false);
          const failureMsg = err.description || err.reason || 'Payment processing was cancelled or declined.';
          console.warn('[CheckoutPage] Razorpay payment failure:', failureMsg);

          const isUserDismissal = err.reason === 'Payment window closed by investor.' || failureMsg.includes('closed by investor');

          // Log failed status in Firestore for Super Admin audit
          await orderRepository.markOrderFailed(order.id, {
            failureReason: failureMsg,
            errorCode: err.code
          });

          // Send payment failed email if it was an actual gateway failure, not a simple window close
          if (!isUserDismissal && user?.email && plan) {
            import('../services/emailService').then(({ emailService }) => {
              emailService.sendPaymentFailedEmail(user.email!, {
                userName: user.displayName || 'Valued Investor',
                planName: plan.name,
                amount: formatINR(totalMinor),
                attemptDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                reason: failureMsg,
                retryUrl: window.location.href
              }).catch(e => console.warn('[CheckoutPage] Payment failed email error:', e));
            });
          }

          if (!isUserDismissal) {
            alert(`Payment Error: ${failureMsg}`);
          }
        }
      });
    } catch (error: any) {
      console.error("Error creating payment and subscription:", error);
      setIsProcessing(false);
      const errMsg = error?.message || "Payment processing error. Please try again or contact support.";
      alert(errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-200 pb-20">
      <TopNavBar backTo="/plans" label="Plans" />
      
      <div className="max-w-4xl mx-auto pt-24 px-6 lg:px-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Secure Order Gateway</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-foreground mb-1">
            Confirm Subscription Order
          </h1>
          <p className="text-xs text-muted-foreground font-mono">Review your selected quantitative research plan parameters and complete activation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Order Summary & Coupon */}
          <div className="md:col-span-7 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    Selected Strategy
                  </span>
                  <h3 className="text-base font-semibold text-foreground mt-2">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">{plan.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-mono tabular-nums font-semibold text-foreground">{formatINR(basePriceMinor)}</span>
                  <span className="block text-[10px] font-mono text-muted-foreground">/{plan.validityDays} Days</span>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="pt-1">
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 flex items-center gap-1.5 uppercase">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Apply Promotional Voucher
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ALPHA20"
                    className="flex-1 glass-panel-data px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-1.5 rounded-xs text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-[11px] font-mono text-[hsl(var(--success))] mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Voucher active! {discountPercent}% reduction applied.
                  </p>
                )}
                {couponError && (
                  <p className="text-[11px] font-mono text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                  </p>
                )}
              </div>

              {/* Mobile Phone Input Section */}
              <div className="pt-3 border-t border-border mt-3">
                <label className="block text-[11px] font-mono text-muted-foreground mb-1.5 flex items-center gap-1.5 uppercase">
                  <Phone className="w-3.5 h-3.5 text-primary" /> Investor Contact Number (For Trade Signals & Alerts)
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full glass-panel-data px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground mt-1 block">
                  Synchronized with Razorpay checkout & investor compliance verification.
                </span>
              </div>
            </motion.div>

            {/* Price Breakdown */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-6 shadow-sm"
            >
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Statutory Billing Breakdown</h2>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Research Advisory Fee</span>
                  <span className="tabular-nums font-semibold text-foreground">{formatINR(basePriceMinor)}</span>
                </div>
                {discountMinor > 0 && (
                  <div className="flex justify-between text-[hsl(var(--success))]">
                    <span>Promotional Voucher Concession ({discountPercent}%)</span>
                    <span className="tabular-nums">-{formatINR(discountMinor)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Goods and Services Tax (GST 18%)</span>
                  <span className="tabular-nums font-semibold text-foreground">{formatINR(taxMinor)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment Gateway & Technology Surcharge (3%)</span>
                  <span className="tabular-nums font-semibold text-foreground">{formatINR(gatewayFeeMinor)}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">Total Amount Due</span>
                  <span className="text-2xl font-mono tabular-nums font-semibold text-primary">{formatINR(totalMinor)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Payment CTA Side Card */}
          <div className="md:col-span-5 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-panel p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-md bg-primary/15 text-primary flex items-center justify-center mb-3 border border-primary/30">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Encrypted Checkout</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                  Sandbox transaction gateway. Instant portfolio onboarding and compliance profile activation upon order confirmation.
                </p>
              </div>

              {user ? (
                <button
                  onClick={handleExecutePayment}
                  disabled={isProcessing}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs py-3.5 px-4 rounded-md shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>{isProcessing ? 'Initializing Razorpay...' : `Pay ${formatINR(totalMinor)} with Razorpay`}</span>
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs py-3 px-4 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Authenticate with Google</span>
                </button>
              )}
            </motion.div>

            <div className="glass-panel-data p-4 text-[11px] text-muted-foreground flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="leading-relaxed">Direct non-custodial stock recommendations with instant digital invoice generation.</span>
            </div>
          </div>

        </div>
      </div>

      {/* Simulated Payment Gateway Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">
                    ₹
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Razorpay Sandbox Gateway</h3>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 p-3 rounded glass-panel-data flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Order Amount</span>
                  <div className="text-lg font-mono tabular-nums font-semibold text-primary">{formatINR(totalMinor)}</div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border border-[hsl(var(--success))/0.3]">
                  TEST MODE
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 mb-5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">Select Payment Instrument</span>
                
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'card', 'netbanking'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`p-2 rounded text-xs font-mono uppercase tracking-wider transition-all cursor-pointer border ${
                        paymentMethod === m 
                          ? 'border-primary bg-primary/10 text-primary font-semibold' 
                          : 'border-border text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'upi' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground">Virtual Payment Address (VPA)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full glass-panel-data px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleExecutePayment}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isProcessing ? 'Authorizing Payment...' : `Simulate Payment ${formatINR(totalMinor)}`}</span>
                </button>
                <p className="text-[10px] font-mono text-center text-muted-foreground">
                  Simulated sandbox transaction. Direct database provisioning.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
