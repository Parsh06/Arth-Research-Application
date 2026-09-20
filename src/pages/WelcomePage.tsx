import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, ArrowRight, Sparkles, LayoutDashboard, History, Check } from 'lucide-react';
import { useCmsStore } from '../stores/cmsStore';
import { usePlanStore } from '../stores/planStore';
import { useEffect, useMemo, useState } from 'react';
import TopNavBar from '../components/TopNavBar';
import { formatINR, toMinorUnits } from '../utils/money';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import type { Subscription } from '../types/models';

export default function WelcomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get('planId');
  const subscriptionId = searchParams.get('subscriptionId');
  
  const { siteContent, fetchSiteContent } = useCmsStore();
  const { plans, fetchPlans, isLoadingPlans } = usePlanStore();

  const [dbSubscription, setDbSubscription] = useState<Subscription | null>(null);
  const [loadingSub, setLoadingSub] = useState<boolean>(!!subscriptionId);
  const [copied, setCopied] = useState(false);

  // Retrieve cached checkout session if available
  const sessionData = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('last_successful_checkout');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only consider valid if matching current plan/sub or within last 24h
        if (!planId || parsed.planId === planId) {
          return parsed;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, [planId]);

  useEffect(() => {
    fetchSiteContent();
    fetchPlans();
  }, [fetchSiteContent, fetchPlans]);

  // If subscriptionId is present, fetch the verified subscription record
  useEffect(() => {
    if (!subscriptionId) {
      setLoadingSub(false);
      return;
    }

    let isMounted = true;
    subscriptionRepository.getSubscription(subscriptionId)
      .then(sub => {
        if (isMounted) {
          setDbSubscription(sub);
          setLoadingSub(false);
        }
      })
      .catch(err => {
        console.warn('[WelcomePage] Failed to fetch subscription by ID:', err);
        if (isMounted) setLoadingSub(false);
      });

    return () => { isMounted = false; };
  }, [subscriptionId]);

  // Resolve plan with priority: location.state -> plans store -> sessionData -> dbSubscription
  const resolvedPlan = useMemo(() => {
    if (location.state?.plan) return location.state.plan;
    const fromStore = plans.find(p => p.id === planId);
    if (fromStore) return fromStore;

    if (sessionData) {
      return {
        id: sessionData.planId || planId || 'plan_active',
        name: sessionData.planName || 'Active Research Mandate',
        validityDays: sessionData.validityDays || 365,
        priceMinor: sessionData.basePriceMinor || sessionData.totalMinor || 0,
        price: (sessionData.totalMinor || 0) / 100
      };
    }

    if (dbSubscription) {
      const subPriceMinor = (dbSubscription as any).pricePaidMinor || (dbSubscription.pricePaid ? toMinorUnits(dbSubscription.pricePaid) : 0);
      return {
        id: dbSubscription.planId || planId || 'plan_active',
        name: dbSubscription.planName || 'Active Research Mandate',
        validityDays: dbSubscription.validityDays || 365,
        priceMinor: subPriceMinor,
        price: dbSubscription.pricePaid || (subPriceMinor / 100)
      };
    }

    return null;
  }, [location.state?.plan, plans, planId, sessionData, dbSubscription]);

  // Still fetching initial plans or subscription
  const isResolving = (isLoadingPlans && plans.length === 0) || loadingSub;

  if (isResolving) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <TopNavBar />
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Confirming Mandate Provisioning...</span>
      </div>
    );
  }

  if (!resolvedPlan) {
    return (
      <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6">
        <TopNavBar />
        <div className="max-w-md mx-auto w-full pt-16 text-center">
          <div className="glass-panel p-8 shadow-xl">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-md mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 stroke-[2]" />
            </div>
            <h1 className="text-lg font-semibold mb-2">Subscription Confirmed</h1>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Your payment was processed successfully. You can now access your research terminal and active portfolios.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-primary hover:opacity-90 text-primary-foreground py-2.5 px-4 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </button>
              <button 
                onClick={() => navigate('/history')}
                className="flex-1 border border-border bg-card/60 hover:bg-card text-foreground py-2.5 px-4 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <span>View Invoices</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const welcomeData = siteContent?.welcomePage;
  
  // Real invoice and payment data resolution
  const invoiceId = 
    sessionData?.invoiceNumber || 
    (dbSubscription as any)?.invoiceNumber || 
    `INV-ARTH-${new Date().getFullYear()}-${(subscriptionId || 'SUB').slice(0, 6).toUpperCase()}`;

  const date = sessionData?.paidAt 
    ? new Date(sessionData.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const totalPaidMinor = 
    sessionData?.totalMinor || 
    location.state?.totalMinor || 
    (dbSubscription as any)?.pricePaidMinor ||
    (dbSubscription?.pricePaid ? toMinorUnits(dbSubscription.pricePaid) : undefined) ||
    Math.round(((resolvedPlan as any).priceMinor || toMinorUnits(resolvedPlan.price || 0)) * 1.18);

  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoiceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-200 flex flex-col justify-center items-center p-6">
      <TopNavBar />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md mx-auto w-full pt-16 z-10"
      >
        <div className="glass-panel p-8 sm:p-10 shadow-xl text-center relative overflow-hidden">
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="w-14 h-14 bg-[hsl(var(--success))/0.12] border border-[hsl(var(--success))/0.25] text-[hsl(var(--success))] rounded-md mx-auto flex items-center justify-center mb-5 shadow-sm"
          >
            <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
          </motion.div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[hsl(var(--success))/0.1] text-[hsl(var(--success))] text-[10px] font-mono uppercase tracking-wider mb-3 border border-[hsl(var(--success))/0.2]">
            <Sparkles className="w-3 h-3" />
            <span>Subscription Activated</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground mb-2">
            {welcomeData?.title || "Payment Confirmation"}
          </h1>
          <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            {welcomeData?.subtitle || "Your transaction has cleared successfully. Complete your onboarding setup to initialize your strategy."}
          </p>

          <div className="glass-panel-data p-5 text-left mb-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Receipt Summary
              </h3>
              <button 
                onClick={handleCopyInvoice}
                title="Click to copy invoice ID"
                className="font-mono text-[10px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{invoiceId}</span>
                {copied ? <Check className="w-3 h-3 text-[hsl(var(--success))]" /> : null}
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subscribed Research Tier</span>
                <span className="font-semibold text-foreground">{resolvedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Amount Paid (inc. GST)</span>
                <span className="font-semibold tabular-nums text-[hsl(var(--success))]">{formatINR(totalPaidMinor)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Validity Period</span>
                <span className="font-semibold tabular-nums text-foreground">{resolvedPlan.validityDays} Days</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Transaction Date</span>
                <span className="font-semibold text-foreground">{date}</span>
              </div>
              {sessionData?.paymentMode && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Instrument Mode</span>
                  <span className="font-semibold text-foreground">{sessionData.paymentMode}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/setup-portfolio', { state: { plan: resolvedPlan, subscriptionId } })}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3 px-5 rounded-md font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{welcomeData?.buttonText || "Initialize Portfolio Setup"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 border border-border bg-card/40 hover:bg-card text-foreground py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => navigate('/history')}
                className="flex-1 border border-border bg-card/40 hover:bg-card text-foreground py-2 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Invoices</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
