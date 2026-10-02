import { motion } from 'framer-motion';
import { ArrowRight, Check, Shield, Sparkles, Award, Sliders, RefreshCw, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { usePlanStore } from '../stores/planStore';
import { useCmsStore } from '../stores/cmsStore';
import { useEffect, useState } from 'react';
import TopNavBar from '../components/TopNavBar';
import { formatINR, toMinorUnits } from '../utils/money';

// Institutional Risk Meter Component (Strictly visual indicators, no predictive return curves)
const RiskMeter = ({ level }: { level?: string }) => {
  const safeLevel = (level || 'medium').toLowerCase();
  const blocks = 4;
  const activeBlocks = safeLevel === 'low' ? 1 : safeLevel === 'medium' ? 2 : safeLevel === 'high' ? 3 : 4;
  
  return (
    <div className="flex items-center gap-1.5">
      {[...Array(blocks)].map((_, i) => (
        <div 
          key={i} 
          className={`h-1.5 w-4 rounded-xs transition-all ${
            i < activeBlocks 
              ? (activeBlocks > 2 ? 'bg-[hsl(var(--destructive))]' : activeBlocks > 1 ? 'bg-primary' : 'bg-[hsl(var(--success))]') 
              : 'bg-muted'
          }`}
        />
      ))}
      <span className="ml-2 font-mono text-[11px] text-muted-foreground capitalize">{level || 'Standard'} Risk</span>
    </div>
  );
};

export default function PlansPage() {
  const navigate = useNavigate();
  const { user, dbUser } = useAuthStore();
  const { plans, fetchPlans, isLoadingPlans } = usePlanStore();
  const { siteContent, fetchSiteContent } = useCmsStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchPlans();
    fetchSiteContent();
  }, [fetchPlans, fetchSiteContent]);

  const plansData = siteContent?.plansPage;

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout/${planId}`);
  };

  const getCalculatedPriceMinor = (plan: any) => {
    const baseMinor = plan.priceMinor || toMinorUnits(plan.price || 0);
    return billingCycle === 'yearly' ? Math.floor(baseMinor * 10 * 0.8) : baseMinor;
  };

  const userActivePlanId = (dbUser as any)?.activePlanId;
  const isSubscribed = Boolean(userActivePlanId);

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-200 pb-24">
      <TopNavBar 
        backTo={user ? '/dashboard' : '/'} 
        label={user ? 'Dashboard' : 'Home'} 
      />

      <div className="max-w-7xl mx-auto pt-24 px-6 lg:px-12 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase tracking-wider mb-4 shadow-xs"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Quantitative Advisory Mandates</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-5xl font-display font-semibold tracking-tight text-foreground mb-4"
          >
            {plansData?.title || "Quantitative Research Subscriptions"}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto"
          >
            {plansData?.subtitle || "Systematic equity research models engineered for disciplined non-custodial capital compounding."}
          </motion.p>

          {/* Billing Cycle Switcher */}
          <div className="inline-flex items-center p-1 rounded-lg glass-panel border border-border shadow-xs">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer font-mono ${
                billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard Mandate
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-2 cursor-pointer font-mono ${
                billingCycle === 'yearly' 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual Mandate</span>
              <span className="bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] text-[10px] px-1.5 py-0.2 rounded font-bold border border-[hsl(var(--success))/0.25]">
                20% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Plans Showcase Grid */}
        {isLoadingPlans ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Strategies...</span>
          </div>
        ) : plans.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 sm:p-12 max-w-3xl mx-auto text-center relative overflow-hidden mb-16 shadow-2xl border border-primary/20"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Factor Model Calibration in Progress</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-foreground mb-3">
              Quantitative Strategies Launching Soon
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8 font-mono">
              Our quantitative research desk is currently calibrating and validating the next cohort of algorithmic advisory models.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-6 py-2.5 rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <span>{user ? 'Back to Dashboard' : 'Access Research Terminal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16 items-stretch">
            {plans.map((plan, idx) => {
              const priceMinor = getCalculatedPriceMinor(plan);
              const isCurrentPlan = userActivePlanId === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`relative flex flex-col glass-panel transition-all duration-300 rounded-xl overflow-hidden ${
                    isCurrentPlan
                      ? 'border-primary ring-2 ring-primary/25 shadow-2xl'
                      : plan.isPopular 
                        ? 'border-primary/80 shadow-xl' 
                        : 'border-border hover:border-primary/40'
                  }`}
                >
                  {/* Top Accent Gradient Stripe */}
                  <div className={`h-1 w-full ${isCurrentPlan ? 'bg-[hsl(var(--success))]' : plan.isPopular ? 'bg-primary' : 'bg-muted'}`} />

                  {/* Plan Identification Badges */}
                  {isCurrentPlan ? (
                    <div className="absolute top-4 right-4 bg-[hsl(var(--success))/0.15] border border-[hsl(var(--success))/0.3] text-[hsl(var(--success))] font-mono font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1 z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Active Mandate</span>
                    </div>
                  ) : plan.isPopular ? (
                    <div className="absolute top-4 right-4 bg-primary/10 border border-primary/25 text-primary text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1 z-10">
                      <Award className="w-3 h-3" />
                      <span>Recommended</span>
                    </div>
                  ) : null}
                  
                  <div className="p-6 pb-0 flex-1">
                    {/* Plan Header */}
                    <div className="mb-4 pr-16">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
                        Systematic Strategy
                      </span>
                      <h3 className="text-lg font-semibold text-foreground tracking-tight">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{plan.description}</p>
                    </div>
                    
                    {/* Pricing Box */}
                    <div className="mb-5 pb-5 border-b border-border">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-mono tabular-nums font-semibold text-foreground">
                          {formatINR(priceMinor)}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          /{billingCycle === 'monthly' ? `${plan.validityDays} Days` : 'Yearly'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground block mt-1">
                        Exclusive of 18% statutory GST. Official tax invoice provided.
                      </span>
                    </div>

                    {/* Quantitative Strategy Specifications (Clean data pills, NO charts or return commitments) */}
                    <div className="space-y-3.5 mb-6">
                      <div className="glass-panel-data p-3 rounded-lg border border-border/70 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-primary" /> Risk Profile:
                          </span>
                          <RiskMeter level={plan.riskLevel} />
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-2">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 text-primary" /> Rebalancing:
                          </span>
                          <span className="text-foreground font-semibold">Event-Driven Signals</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-border/50 pt-2">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-primary" /> Execution:
                          </span>
                          <span className="text-foreground font-semibold">100% Non-Custodial</span>
                        </div>
                      </div>

                      {/* Capabilities List */}
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2.5">
                          Strategy Capabilities
                        </span>
                        <ul className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="mt-0.5 rounded-full bg-primary/10 p-0.5 text-primary shrink-0">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </div>
                              <span className="text-xs text-foreground leading-tight">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Plan CTA Button */}
                  <div className="p-6 pt-0 mt-auto">
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-3 px-4 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-2 group cursor-pointer font-mono shadow-xs ${
                        isCurrentPlan
                          ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border border-[hsl(var(--success))/0.3] hover:bg-[hsl(var(--success))/0.25]'
                          : plan.isPopular 
                            ? 'bg-primary hover:opacity-90 text-primary-foreground' 
                            : 'glass-panel text-foreground hover:bg-muted/60 border-border'
                      }`}
                    >
                      <span>
                        {isCurrentPlan 
                          ? 'Active Mandate (Manage / Extend)' 
                          : isSubscribed 
                            ? 'Switch Strategy Mandate' 
                            : 'Select Advisory Mandate'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom Trust & Non-Custodial Security Banner */}
        <div className="max-w-4xl mx-auto glass-panel p-6 sm:p-7 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm border border-border">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">100% Non-Custodial Capital Architecture</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Arth Research never holds, manages, or executes transactions with your funds. You execute recommended positions in your personal broker Demat account (Zerodha, Groww, Upstox, Angel One) with full control.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/support')}
            className="shrink-0 text-xs font-mono font-medium text-primary hover:underline flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-center"
          >
            <span>Advisory Desk Support</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Regulatory Risk Disclaimer */}
        <div className="max-w-4xl mx-auto mt-6 text-center text-[10px] font-mono text-muted-foreground leading-relaxed px-4">
          Securities investments are subject to market risks. Read all scheme-related documents carefully before investing. No assurance or guarantee of returns is provided by the research desk or platform.
        </div>

      </div>
    </div>
  );
}
