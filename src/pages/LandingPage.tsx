import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp, Shield, Zap, ChevronDown, BarChart3, Lock, CheckCircle2, Sparkles, Activity, PieChart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCmsStore } from '../stores/cmsStore';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ThemeToggle';

const FAQS = [
  { 
    question: "How does the Arth quantitative portfolio algorithm work?", 
    answer: "Our engine executes mathematical factor analysis combining momentum, low volatility, earnings quality, and macro regime indicators. It continuously computes optimal position sizing to maximize risk-adjusted alpha while defending against downside drawdowns." 
  },
  { 
    question: "Is my investment capital safe and non-custodial?", 
    answer: "100% Non-Custodial. We never take custody or access your funds. All capital remains securely in your personal SEBI-regulated Demat account (Zerodha, Groww, Upstox, ICICI Direct). You execute recommendations directly with one-click fidelity." 
  },
  { 
    question: "Can I cancel or upgrade my research subscription at any time?", 
    answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any point from your billing dashboard. Access continues seamlessly until the conclusion of your active billing period." 
  },
  { 
    question: "What is the expected target CAGR and risk profile?", 
    answer: "Our proprietary aggressive alpha models target a 20-30% CAGR over rolling multi-year market cycles. Every portfolio includes automated stop-loss protocols and dynamic cash hedging during extreme market turbulence." 
  },
  {
    question: "How do I receive allocation rebalance alerts?",
    answer: "Whenever our quantitative models trigger a sector rotation or stock rebalance, you receive instant real-time notifications in your portal, email, and mobile alert feed with exact entry prices and allocation percentages."
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

  const heroData = siteContent?.landingPage || {
    heroTitle: "Quantitative Alpha Architecture",
    heroSubtitle: "Institutional-grade research strategies, automated risk-parity allocations, and algorithmic market signals engineered for discerning wealth builders.",
    aboutTitle: "Disciplined Math.\nZero Emotion.",
    aboutText: "We eliminate behavioral bias and speculative noise. By fusing multi-factor quantitative models with rigorous volatility regimes, our research delivers structured capital compounding."
  };

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
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 h-16 transition-colors duration-200">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6 lg:px-12">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center overflow-hidden">
              <img src="/logo1.png" alt="Arth Jain Logo" className="w-5 h-5 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                ARTH JAIN
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">Alpha</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono tracking-wide">Research & Portfolio Analytics</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide text-muted-foreground">
            <a href="#philosophy" className="hover:text-foreground transition-colors">Philosophy</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <button onClick={() => navigate('/plans')} className="hover:text-foreground transition-colors">Research Plans</button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <button 
                onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-all flex items-center gap-2"
              >
                <span>{isAdmin ? 'Admin Terminal' : 'Portfolio Terminal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-all flex items-center gap-2"
              >
                <span>Client Access</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:px-12 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono tracking-wide mb-6"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Quant Engine v2.0 • Non-Custodial Architecture</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold tracking-tight text-foreground leading-[1.1] mb-6"
            >
              {heroData.heroTitle}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground font-normal leading-relaxed max-w-2xl mb-8"
            >
              {heroData.heroSubtitle}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4"
            >
              <button 
                onClick={() => navigate('/plans')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-6 py-3 rounded-md shadow-sm flex items-center justify-center gap-2 transition-all group"
              >
                <span>Explore Research Tiers</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/login')}
                className="glass-panel text-foreground hover:bg-muted/50 font-medium text-xs px-5 py-3 rounded-md transition-all shadow-sm flex items-center gap-2"
              >
                <span>Institutional Sign In</span>
              </button>
            </motion.div>

            {/* Metrics */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 pt-8 border-t border-border grid grid-cols-3 gap-4"
            >
              <div>
                <div className="text-2xl font-mono tabular-nums font-semibold text-foreground">20–30%</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Cycle CAGR</div>
              </div>
              <div>
                <div className="text-2xl font-mono tabular-nums font-semibold text-[hsl(var(--success))]">100%</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Demat Custody</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-primary">Multi-Factor</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Dynamic Risk</div>
              </div>
            </motion.div>
          </div>

          {/* Live Strategy Feed Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="glass-panel p-6 shadow-xl">
              {/* Header bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">Live Strategy Feed</span>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border border-[hsl(var(--success))/0.3]">
                  REGIME: RISK-ON
                </span>
              </div>

              {/* Simulated Chart/Metrics */}
              <div className="my-5 space-y-4">
                <div className="glass-panel-data p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">Flagship Growth</span>
                      <div className="text-base font-semibold text-foreground mt-0.5">Aggressive Alpha Tier</div>
                    </div>
                    <span className="tabular-nums text-[hsl(var(--success))] text-xs font-mono font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +31.4% (1Y)
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase">
                      <span>Risk Parity Index</span>
                      <span className="text-foreground">94 / 100</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="w-[94%] h-full bg-primary rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Allocation breakdown */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-panel-data p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <PieChart className="w-3.5 h-3.5 text-secondary" />
                      <span className="text-[11px]">Core Equities</span>
                    </div>
                    <span className="text-base font-mono tabular-nums font-semibold text-foreground">70.0%</span>
                  </div>

                  <div className="glass-panel-data p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px]">Dynamic Gold/Cash</span>
                    </div>
                    <span className="text-base font-mono tabular-nums font-semibold text-foreground">30.0%</span>
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <button 
                onClick={() => navigate('/plans')}
                className="w-full py-2.5 rounded-md bg-muted/60 hover:bg-muted text-foreground font-medium text-xs tracking-wider uppercase transition-colors flex items-center justify-center gap-2 border border-border"
              >
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span>View Portfolio Models</span>
              </button>
            </div>
          </motion.div>
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
                QUANT FACTOR MODELING
              </span>
              <span className="text-border">•</span>
              <span className="text-[hsl(var(--success))] font-semibold">MAX ALPHA GENERATION</span>
              <span className="text-border">•</span>
              <span className="text-foreground">SEBI RESEARCH FRAMEWORK</span>
              <span className="text-border">•</span>
              <span className="text-secondary">DYNAMIC DRAWDOWN DEFENSE</span>
              <span className="text-border">•</span>
              <span className="text-foreground">DIRECT DEMAT EXECUTION</span>
              <span className="text-border">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Philosophy Section */}
      <section id="philosophy" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-wider mb-4 border border-primary/20">
              Core Philosophy
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground tracking-tight leading-tight mb-6 whitespace-pre-wrap">
              {heroData.aboutTitle}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap mb-8">
              {heroData.aboutText}
            </p>
            
            <div className="space-y-3">
              {[
                "Systematic multi-factor quantitative screening",
                "Automated risk parity portfolio construction",
                "Dynamic cash and gold volatility hedging",
                "Pure execution transparency with zero hidden fees"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Cards Grid */}
          <div id="architecture" className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-secondary/15 text-secondary flex items-center justify-center mb-3 border border-secondary/30">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Multi-Factor Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quantitative algorithms evaluate balance sheet resilience, momentum velocity, and earnings valuation.
              </p>
            </div>

            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-primary/15 text-primary flex items-center justify-center mb-3 border border-primary/30">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Dynamic Risk Parity</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated position limits defend wealth by adjusting exposure in response to market volatility surges.
              </p>
            </div>

            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-primary/15 text-primary flex items-center justify-center mb-3 border border-primary/30">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Real-Time Alerts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant SMS and portal notifications detailing precise rebalance allocations and target price levels.
              </p>
            </div>

            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-secondary/15 text-secondary flex items-center justify-center mb-3 border border-secondary/30">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">100% Non-Custodial</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Maintain absolute custody in your personal broker account. You retain full control over every rupee.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 lg:px-12 bg-muted/20 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
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
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">{faq.question}</span>
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
                      <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
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
      <section className="py-20 px-6 lg:px-12 bg-card/60 border-t border-border text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-semibold text-foreground tracking-tight mb-4 leading-tight">
            Elevate Your Portfolio With Systematic Quantitative Alpha
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            Join discerning investors building long-term generational wealth with institutional factor research.
          </p>
          <button 
            onClick={() => navigate('/plans')}
            className="inline-flex bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-6 py-3.5 rounded-md items-center justify-center gap-2 shadow-sm transition-all group"
          >
            <span>Start Building Wealth</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
      
      {/* Absolute Regulatory Footer */}
      <footer className="bg-card/90 border-t border-border py-8 px-6 lg:px-12 text-center transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-mono text-muted-foreground">
            &copy; {new Date().getFullYear()} Arth Jain Research Application. All rights reserved. SEBI Compliant Research.
          </p>
          <div className="flex items-center gap-6 text-[11px] font-mono text-muted-foreground">
            <a href="#philosophy" className="hover:text-foreground">Philosophy</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <button onClick={() => navigate('/plans')} className="hover:text-foreground">Plans</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
