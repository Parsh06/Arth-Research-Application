import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Zap, 
  ChevronDown, 
  BarChart3, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Headphones, 
  Layers, 
  Target, 
  Check 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCmsStore } from '../stores/cmsStore';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ThemeToggle';

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Select Your Advisory Plan",
    subtitle: "Choose an equities strategy engineered for your investment capital, compounding target, and risk tolerance.",
    icon: Layers,
    badge: "Step 1"
  },
  {
    step: "02",
    title: "Unlock Stock Recommendations",
    subtitle: "Instantly access curated quantitative baskets featuring vetted buy ranges, target allocations, and conviction ratings.",
    icon: Target,
    badge: "Step 2"
  },
  {
    step: "03",
    title: "Execute in Your Personal Demat",
    subtitle: "Buy the recommended equities directly through your existing broker (Zerodha, Groww, Upstox, etc.). 100% non-custodial.",
    icon: Shield,
    badge: "Step 3"
  },
  {
    step: "04",
    title: "Track & Receive Rebalancing Signals",
    subtitle: "Register your executed entries in the portal to receive research desk verification, portfolio tracking, and real-time exit/rebalance alerts.",
    icon: Activity,
    badge: "Step 4"
  }
];

const FAQS = [
  { 
    question: "What is Arth Research and what services do you provide?", 
    answer: "Arth Research is a quantitative equities research and advisory platform. We offer transparent subscription plans that provide investors with high-conviction stock recommendations, model portfolio allocations, and real-time rebalancing signals built on mathematical factor models." 
  },
  { 
    question: "How do I setup my portfolio after subscribing?", 
    answer: "Once you subscribe to an advisory plan, you unlock the strategy's stock basket with target prices and weights. You buy the recommended stocks directly in your personal broker Demat account, enter your executed buy quantities into your Arth Research portal, and our research desk validates your setup." 
  },
  { 
    question: "Is my capital safe and non-custodial?", 
    answer: "Yes, 100%. Arth Research never holds, manages, or touches your money. All investments stay in your personal broker account (e.g., Zerodha, Groww, Angel One, ICICI Direct). You have complete control over buying and selling." 
  },
  { 
    question: "How do I receive stock recommendations and rebalance alerts?", 
    answer: "Subscribers receive instant access to active research recommendations inside their investor terminal, along with email notifications whenever new stocks are added, stop losses are adjusted, or profit-taking rebalances are triggered." 
  },
  { 
    question: "Can I get direct support if I have questions about my holdings?", 
    answer: "Yes. Every subscriber has access to our dedicated Support & Inquiry Desk inside the portal to submit questions directly to our research analysts regarding portfolio allocation, entries, and renewals." 
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  const { siteContent, fetchSiteContent, isLoadingSiteContent } = useCmsStore();
  const { user, isAdmin } = useAuthStore();

  useEffect(() => {
    fetchSiteContent();
  }, [fetchSiteContent]);

  // Robust fallback logic ensuring hero copy is centered around stock recommendations & subscription plans
  const heroTitle = siteContent?.landingPage?.heroTitle || siteContent?.landingPage?.title || "High-Conviction Stock Recommendations for Disciplined Investors";
  const heroSubtitle = siteContent?.landingPage?.heroSubtitle || siteContent?.landingPage?.subtitle || "Subscribe to institutional quantitative factor models. Get actionable stock recommendations, precise entry targets, and dynamic rebalancing alerts executed directly in your personal Demat.";
  const aboutTitle = siteContent?.landingPage?.aboutTitle || "Systematic Factor Modeling.\nZero Speculative Guesswork.";
  const aboutText = siteContent?.landingPage?.aboutText || "We eliminate emotional noise through quantitative factor modeling. Combining price momentum, fundamental quality metrics, and dynamic risk parity, our advisory plans deliver structured equities performance.";

  if (isLoadingSiteContent && !siteContent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-widest uppercase text-muted-foreground">Loading Research Terminal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      
      {/* Top Header Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 h-14 sm:h-16 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-12">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none" 
            onClick={() => navigate('/')}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-card border border-border flex items-center justify-center overflow-hidden p-1 shadow-xs shrink-0">
              <img src="/logo1.png" alt="Arth Research Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm sm:text-base font-semibold tracking-wide text-foreground font-display whitespace-nowrap">
              ARTH RESEARCH
            </span>
          </div>
          
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <button onClick={() => navigate('/plans')} className="hover:text-foreground transition-colors cursor-pointer">Advisory Plans</button>
          </div>

          {/* Action Button & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            {user ? (
              <button 
                onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer font-mono whitespace-nowrap"
              >
                <span>{isAdmin ? 'Admin Terminal' : 'Client Terminal'}</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-3 sm:px-4 py-1.5 sm:py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer font-mono whitespace-nowrap"
              >
                <span>Investor Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono tracking-wide mb-6">
              <Sparkles className="w-3 h-3 text-primary shrink-0" />
              <span>Quantitative Equities Advisory &bull; 100% Non-Custodial</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-foreground leading-[1.15] mb-6">
              {heroTitle}
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-normal leading-relaxed max-w-2xl mb-8">
              {heroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <button 
                onClick={() => navigate('/plans')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-6 py-3 rounded-md shadow-xs flex items-center justify-center gap-2 transition-all group cursor-pointer font-mono"
              >
                <span>Explore Advisory Plans</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/login')}
                className="glass-panel text-foreground hover:bg-muted/50 font-medium text-xs px-5 py-3 rounded-md transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <span>Client Portal Access</span>
              </button>
            </div>

            {/* Core Metrics */}
            <div className="mt-8 pt-6 sm:mt-10 sm:pt-8 border-t border-border grid grid-cols-3 gap-2 sm:gap-6">
              <div>
                <div className="text-lg sm:text-2xl font-mono tabular-nums font-semibold text-foreground">100%</div>
                <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Demat Custody</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-mono tabular-nums font-semibold text-[hsl(var(--success))]">Quant Alpha</div>
                <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Factor Models</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-mono font-semibold text-primary">Real-Time</div>
                <div className="text-[10px] sm:text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Rebalance Alerts</div>
              </div>
            </div>
          </div>

          {/* Interactive Feature Terminal Card */}
          <div className="lg:col-span-5">
            <div className="glass-panel p-5 sm:p-6 shadow-xl space-y-4">
              {/* Header bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">Advisory Terminal</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  SYSTEM READY
                </span>
              </div>

              {/* Terminal Capabilities Snippet */}
              <div className="space-y-3">
                <div className="glass-panel-data p-3.5 rounded-md flex items-start gap-3">
                  <div className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Curated Stock Recommendations</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Clear target buy ranges, factor conviction scores, and recommended allocations.</p>
                  </div>
                </div>

                <div className="glass-panel-data p-3.5 rounded-md flex items-start gap-3">
                  <div className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Dynamic Portfolio Rebalancing</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Instant alerts when model baskets trigger profit-taking, trimming, or new entries.</p>
                  </div>
                </div>

                <div className="glass-panel-data p-3.5 rounded-md flex items-start gap-3">
                  <div className="w-7 h-7 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Headphones className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Dedicated Advisory Desk</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Real-time support tickets and direct communication with research analysts.</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => navigate('/plans')}
                className="w-full py-2.5 rounded-md bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer font-mono shadow-xs mt-2"
              >
                <span>View Strategy Plans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Tape */}
      <div className="w-full overflow-hidden bg-card/50 border-y border-border py-2.5 flex whitespace-nowrap">
        <motion.div 
          animate={{ x: [0, -1200] }}
          transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          className="flex gap-8 items-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground"
        >
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <span className="text-foreground flex items-center gap-2 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                QUANT STOCK RECOMMENDATIONS
              </span>
              <span className="text-border">•</span>
              <span className="text-[hsl(var(--success))] font-semibold">100% NON-CUSTODIAL EXECUTION</span>
              <span className="text-border">•</span>
              <span className="text-foreground">DISCIPLINED SUBSCRIPTION PLANS</span>
              <span className="text-border">•</span>
              <span className="text-primary font-semibold">DYNAMIC FACTOR REBALANCING</span>
              <span className="text-border">•</span>
              <span className="text-foreground">DIRECT INVESTOR DESK SUPPORT</span>
              <span className="text-border">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Section 2: Step-by-Step Portfolio Setup Process */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-mono uppercase tracking-wider mb-3 border border-primary/20">
            Simple 4-Step Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground tracking-tight mb-4">
            How to Setup Your Portfolio with Arth Research
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            From subscribing to executing stock recommendations in your own broker Demat, getting started is straightforward, secure, and fully under your control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROCESS_STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div 
                key={idx}
                className="glass-panel p-6 relative flex flex-col justify-between hover:border-primary/50 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-mono font-bold text-primary/80 group-hover:text-primary transition-colors">
                      {step.step}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.subtitle}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-border/50 flex items-center gap-1.5 text-[10px] font-mono text-primary font-semibold uppercase tracking-wider">
                  <Check className="w-3 h-3 text-primary" />
                  <span>{step.badge}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features & Methodology Section */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-wider mb-4 border border-primary/20">
              Quantitative Methodology
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-foreground tracking-tight leading-tight mb-6 whitespace-pre-wrap">
              {aboutTitle}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap mb-8">
              {aboutText}
            </p>
            
            <div className="space-y-3">
              {[
                "Systematic multi-factor quantitative screening for Indian equities",
                "100% non-custodial capital safety in your personal Demat",
                "Clear entry targets, risk parity weightings, and stop-loss levels",
                "Direct advisory desk resolution and real-time alerts"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-5 sm:p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Multi-Factor Screening</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluating price momentum, balance sheet quality, earnings growth, and volatility regimes across Indian equities.
              </p>
            </div>

            <div className="glass-panel p-5 sm:p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 border border-emerald-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">100% Non-Custodial</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You retain complete custody of all funds and equities in your verified broker Demat account at all times.
              </p>
            </div>

            <div className="glass-panel p-5 sm:p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 border border-amber-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Real-Time Signal Alerts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant notifications on tactical allocations, target weights, stop-loss benchmarks, and rebalance actions.
              </p>
            </div>

            <div className="glass-panel p-5 sm:p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 border border-blue-500/20">
                <Headphones className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Dedicated Advisory Desk</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Direct analyst ticket resolution, mandate guidance, and portfolio clarification whenever you need it.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12 bg-muted/20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-wider mb-3 border border-primary/20">
              Clear & Transparent
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className="glass-panel overflow-hidden transition-all"
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus:outline-none cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-semibold text-foreground pr-4">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-12 bg-card/60 border-t border-border text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-foreground tracking-tight mb-4 leading-tight">
            Start Building Wealth with Quantitative Stock Recommendations
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            Choose an advisory plan and experience non-custodial equity growth powered by data and discipline.
          </p>
          <button 
            onClick={() => navigate('/plans')}
            className="inline-flex bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-6 py-3.5 rounded-md items-center justify-center gap-2 shadow-xs transition-all group cursor-pointer font-mono"
          >
            <span>Explore Advisory Plans</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-card/90 border-t border-border py-8 px-4 sm:px-6 lg:px-12 text-center transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] sm:text-[11px] font-mono text-muted-foreground">
            &copy; {new Date().getFullYear()} Arth Research &bull; Quantitative Equities Advisory. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-mono text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground">How It Works</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <button onClick={() => navigate('/plans')} className="hover:text-foreground cursor-pointer">Advisory Plans</button>
            <button onClick={() => navigate('/legal')} className="hover:text-foreground cursor-pointer">Compliance & Terms</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
