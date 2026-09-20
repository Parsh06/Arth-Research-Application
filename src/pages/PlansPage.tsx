import { motion } from 'framer-motion';
import { ArrowRight, Check, Activity, Shield, Sparkles, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlanStore } from '../stores/planStore';
import { useCmsStore } from '../stores/cmsStore';
import { useEffect, useState } from 'react';
import TopNavBar from '../components/TopNavBar';
import { formatINR, toMinorUnits } from '../utils/money';

// Sparkline Component
const Sparkline = ({ cagr }: { cagr: number }) => {
  const points = cagr > 20 
    ? "0,35 15,30 30,35 45,20 60,22 75,10 90,12 100,2" 
    : "0,35 20,30 40,26 60,20 80,14 100,6";
    
  return (
    <div className="h-14 w-full rounded-md glass-panel-data relative overflow-hidden mt-3 p-2">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`grad-${cagr}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline 
          fill="none" 
          stroke="hsl(var(--success))" 
          strokeWidth="2" 
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points} 
        />
      </svg>
      <div className="absolute top-1.5 right-2 text-[10px] font-mono tabular-nums font-semibold text-[hsl(var(--success))] flex items-center gap-1">
        <Activity className="w-3 h-3" />
        {cagr}% Target CAGR
      </div>
    </div>
  );
};

// Risk Meter Component
const RiskMeter = ({ level }: { level: string }) => {
  const blocks = 5;
  const activeBlocks = level.toLowerCase() === 'low' ? 1 : level.toLowerCase() === 'medium' ? 3 : 5;
  
  return (
    <div className="flex items-center gap-1.5">
      {[...Array(blocks)].map((_, i) => (
        <div 
          key={i} 
          className={`h-1.5 w-4 rounded-xs transition-all ${
            i < activeBlocks 
              ? (activeBlocks > 3 ? 'bg-[hsl(var(--destructive))]' : activeBlocks > 1 ? 'bg-primary' : 'bg-[hsl(var(--success))]') 
              : 'bg-muted'
          }`}
        />
      ))}
      <span className="ml-2 font-mono text-[11px] text-muted-foreground capitalize">{level} Risk</span>
    </div>
  );
};

export default function PlansPage() {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-200 pb-24">
      <TopNavBar backTo="/" label="Home" />

      <div className="max-w-7xl mx-auto pt-24 px-6 lg:px-12 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase tracking-wider mb-4"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Quantitative Research Strategies</span>
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
            className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8"
          >
            {plansData?.subtitle || "Select the algorithmic strategy engineered for your capital scale, risk tolerance, and wealth targets."}
          </motion.p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 rounded-md glass-panel">
            <button 
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 text-xs font-medium rounded-xs transition-all ${
                billingCycle === 'monthly' 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard Cycle
            </button>
            <button 
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 text-xs font-medium rounded-xs transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly' 
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual Plan</span>
              <span className="bg-[hsl(var(--success))/0.2] text-[hsl(var(--success))] text-[10px] px-1 rounded font-mono font-bold">SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid / Empty State */}
        {isLoadingPlans ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Strategies...</span>
          </div>
        ) : plans.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 sm:p-12 max-w-3xl mx-auto text-center relative overflow-hidden mb-16 shadow-2xl border-primary/20"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pipeline Calibration & Factor Audit</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-foreground mb-3">
              New Quantitative Strategies Launching Soon
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8 font-mono">
              Our quantitative research desk is currently stress-testing, factor-auditing, and calibrating the next cohort of algorithmic advisory models.
            </p>

            {/* Upcoming Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
              <div className="glass-panel-data p-4 rounded-lg">
                <div className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Factor Momentum</h4>
                <p className="text-[11px] text-muted-foreground mt-1">Multi-factor trend filtering with regime switching.</p>
              </div>

              <div className="glass-panel-data p-4 rounded-lg">
                <div className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Dynamic Risk Parity</h4>
                <p className="text-[11px] text-muted-foreground mt-1">Downside tail-risk guards and automated rebalancing.</p>
              </div>

              <div className="glass-panel-data p-4 rounded-lg">
                <div className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center mb-2.5">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-foreground">Direct Execution</h4>
                <p className="text-[11px] text-muted-foreground mt-1">100% non-custodial broker portfolio synchronization.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-6 py-2.5 rounded-md shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Access Research Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => navigate('/portfolio')}
                className="w-full sm:w-auto glass-panel text-foreground hover:bg-muted/50 text-xs font-mono px-5 py-2.5 rounded-md transition-colors cursor-pointer"
              >
                View Portfolio Terminal
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 items-stretch">
            {plans.map((plan, idx) => {
              const priceMinor = getCalculatedPriceMinor(plan);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex flex-col glass-panel transition-all duration-300 ${
                    plan.isPopular 
                      ? 'border-primary shadow-xl lg:-translate-y-1' 
                      : 'hover:border-primary/40'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-mono uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                      <Award className="w-3 h-3" />
                      <span>Most Subscribed</span>
                    </div>
                  )}
                  
                  <div className="p-6 pb-0 flex-1">
                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-foreground tracking-tight">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 min-h-[32px]">{plan.description}</p>
                    </div>
                    
                    <div className="mb-5 pb-5 border-b border-border">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-display tabular-nums font-semibold text-foreground">{formatINR(priceMinor)}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">/{billingCycle === 'monthly' ? `${plan.validityDays} Days` : 'Year'}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="block text-[11px] font-mono text-muted-foreground uppercase mb-1.5">Risk Classification</span>
                        <RiskMeter level={plan.riskLevel} />
                      </div>
                      
                      <div>
                        <span className="block text-[11px] font-mono text-muted-foreground uppercase">Target Trajectory</span>
                        <Sparkline cagr={plan.expectedCagr} />
                      </div>

                      <div className="pt-2">
                        <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2.5">Included Capabilities</span>
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

                  <div className="p-6 pt-5 mt-auto">
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-2.5 px-4 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                        plan.isPopular 
                          ? 'bg-primary hover:opacity-90 text-primary-foreground shadow-sm' 
                          : 'glass-panel text-foreground hover:bg-muted/50 border-border'
                      }`}
                    >
                      <span>Deploy Strategy</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Bottom Trust Guarantee */}
        <div className="max-w-4xl mx-auto glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">100% Non-Custodial Capital Security</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">You retain complete custody of all assets in your own verified Demat account.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="shrink-0 text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Have questions? Speak to research desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
