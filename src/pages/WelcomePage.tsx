import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { useCmsStore } from '../stores/cmsStore';
import { usePlanStore } from '../stores/planStore';
import { useEffect, useMemo } from 'react';
import TopNavBar from '../components/TopNavBar';
import { formatINR, toMinorUnits } from '../utils/money';

export default function WelcomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const planId = searchParams.get('planId');
  const subscriptionId = searchParams.get('subscriptionId');
  
  const { siteContent, fetchSiteContent } = useCmsStore();
  const { plans, fetchPlans } = usePlanStore();

  useEffect(() => {
    fetchSiteContent();
    fetchPlans();
  }, [fetchSiteContent, fetchPlans]);

  const plan = useMemo(() => {
    if (location.state?.plan) return location.state.plan;
    return plans.find(p => p.id === planId);
  }, [location.state?.plan, plans, planId]);

  if (!plan) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col items-center justify-center gap-4 text-slate-500">
        <h1 className="text-sm font-semibold">No active plan selection found.</h1>
        <button 
          onClick={() => navigate('/plans')}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Return to Research Plans
        </button>
      </div>
    );
  }

  const welcomeData = siteContent?.welcomePage;
  const invoiceId = `INV-${Math.floor(Math.random() * 900000 + 100000)}`;
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const basePriceMinor = (plan as any).priceMinor || toMinorUnits(plan.price || 0);
  const totalWithGstMinor = Math.round(basePriceMinor * 1.18);

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
              <span className="font-mono text-[10px] text-muted-foreground font-semibold">{invoiceId}</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subscribed Research Tier</span>
                <span className="font-semibold text-foreground">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Amount Paid (inc. GST)</span>
                <span className="font-semibold tabular-nums text-[hsl(var(--success))]">{formatINR(totalWithGstMinor)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Validity Period</span>
                <span className="font-semibold tabular-nums text-foreground">{plan.validityDays} Days</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Transaction Date</span>
                <span className="font-semibold text-foreground">{date}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/setup-portfolio', { state: { plan, subscriptionId } })}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3 px-5 rounded-md font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>{welcomeData?.buttonText || "Initialize Portfolio Setup"}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
