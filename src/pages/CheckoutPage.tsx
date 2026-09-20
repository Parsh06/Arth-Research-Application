import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CreditCard, Lock, LogIn, Tag, CheckCircle2, AlertCircle, X, Sparkles, Check } from 'lucide-react';
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
  
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  const { user, dbUser, loginWithGoogle } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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

      // 1. Create order record in Firestore
      const order = await orderRepository.createOrder({
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || 'Valued Investor',
        planId: plan.id,
        planName: plan.name,
        priceMinor: basePriceMinor,
        discountMinor,
        gatewayFeeMinor,
        couponCode: couponApplied ? couponCode.trim().toUpperCase() : undefined,
        validityDays: plan.validityDays
      });

      // 2. Launch Razorpay Standard Checkout SDK
      const { paymentService } = await import('../services/paymentService');

      await paymentService.launchRazorpayCheckout({
        planName: plan.name,
        amountMinor: totalMinor,
        userName: user.displayName || 'Valued Investor',
        userEmail: user.email || '',
        receipt: `ARTH_${order.id.slice(0, 8)}`,
        onSuccess: async (rzpResponse) => {
          try {
            // 3. Complete payment & provision in Firestore
            const { subscriptionId } = await orderRepository.completePaymentAndProvision(order, {
              gatewayPaymentId: rzpResponse.razorpay_payment_id,
              gatewayOrderId: rzpResponse.razorpay_order_id,
              gatewaySignature: rzpResponse.razorpay_signature,
              validityDays: plan.validityDays,
              planName: plan.name,
              userEmail: user.email || '',
              userName: user.displayName || 'Valued Investor'
            });

            // 4. Generate official Tax Invoice PDF & send via email with attachment
            if (user.email) {
              const { emailService } = await import('../services/emailService');
              const { getInvoicePdfBase64 } = await import('../utils/invoicePdfGenerator');

              const invoiceData = {
                invoiceNumber: `INV-ARTH-${new Date().getFullYear()}-${order.id.slice(0, 6).toUpperCase()}`,
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
                totalMinor
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
                  paymentMethod: `Razorpay (${rzpResponse.razorpay_payment_id})`,
                  period: `${plan.validityDays} Days Operational Mandate`,
                  invoiceUrl: window.location.origin + `/history`
                },
                attachments
              ).catch(emailErr => {
                console.warn('[CheckoutPage] Tax invoice email error:', emailErr);
              });
            }

            setIsProcessing(false);
            setShowPaymentModal(false);

            // Navigate to checkout confirmation success page
            navigate(`/checkout/success?planId=${plan.id}&subscriptionId=${subscriptionId}`, {
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
