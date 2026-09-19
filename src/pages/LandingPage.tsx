import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp, Shield, Zap, ChevronDown, BarChart3, CheckCircle2, Sparkles, Activity, Headphones, FileCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCmsStore } from '../stores/cmsStore';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ThemeToggle';

const FAQS = [
  { 
    question: "What is Arth Research and how does the advisory model work?", 
    answer: "Arth Research is a quantitative equities research and advisory platform. Our algorithmic models analyze momentum, quality, valuation, and volatility regimes to generate high-conviction portfolio recommendations and rebalancing alerts for discerning wealth builders." 
  },
  { 
    question: "Is my investment capital non-custodial and secure?", 
    answer: "100% Non-Custodial. Arth Research never holds, transfers, or touches your capital. All investments reside strictly within your personal broker Demat account (e.g., Zerodha, Groww, Upstox, ICICI Direct). You maintain total execution custody and ownership." 
  },
  { 
    question: "How does the portfolio onboarding and review workflow work?", 
    answer: "After selecting an advisory plan, you submit your existing holdings or target capital. Our research desk analyzes your allocations against our quantitative model baskets, provides compliance-audited adjustments, and issues approval snapshots with scheduled validity." 
  },
  { 
    question: "How do I receive research signals and rebalance alerts?", 
    answer: "Subscribers receive instant access to real-time research signals in the portal, accompanied by email notifications detailing entry prices, stop-loss benchmarks, factor rationale, and recommended portfolio weights." 
  },
  { 
    question: "What support and advisory assistance is available?", 
    answer: "Every subscriber has direct access to our Support & Inquiry Desk, allowing real-time communication with analysts for portfolio clarifications, mandate extensions, and technical guidance." 
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
    heroSubtitle: "Institutional-grade research strategies, disciplined factor allocations, and algorithmic market signals engineered for sustainable capital compounding.",
    aboutTitle: "Disciplined Quantitative Models.\nZero Speculative Bias.",
    aboutText: "We eliminate emotional noise through systematic factor modeling. Combining price momentum, fundamental quality metrics, and dynamic risk parity, our advisory delivers structured alpha."
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
            <div className="w-8 h-8 rounded-md bg-[#0C121D] border border-white/10 flex items-center justify-center overflow-hidden p-1 shadow-sm">
              <img src="/logo1.png" alt="Arth Research Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5 font-display">
                ARTH RESEARCH
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">Quant</span>
              </span>
              <span className="text-[9.5px] text-muted-foreground font-mono tracking-wide">SEBI Registered Research Advisory</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide text-muted-foreground">
            <a href="#philosophy" className="hover:text-foreground transition-colors">Philosophy</a>
            <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <button onClick={() => navigate('/plans')} className="hover:text-foreground transition-colors cursor-pointer">Advisory Plans</button>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <button 
                onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-2 cursor-pointer font-mono"
              >
                <span>{isAdmin ? 'Admin Terminal' : 'Client Terminal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-2 cursor-pointer font-mono"
              >
                <span>Investor Sign In</span>
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
              <span>SEBI-Compliant Advisory &bull; 100% Non-Custodial</span>
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
                className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs px-6 py-3 rounded-md shadow-xs flex items-center justify-center gap-2 transition-all group cursor-pointer font-mono"
              >
                <span>Explore Advisory Plans</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={() => navigate('/login')}
                className="glass-panel text-foreground hover:bg-muted/50 font-medium text-xs px-5 py-3 rounded-md transition-all shadow-xs flex items-center gap-2 cursor-pointer font-mono"
              >
                <span>Client Portal Access</span>
              </button>
            </motion.div>

            {/* Core Metrics */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 pt-8 border-t border-border grid grid-cols-3 gap-4"
            >
              <div>
                <div className="text-2xl font-mono tabular-nums font-semibold text-foreground">100%</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Demat Custody</div>
              </div>
              <div>
                <div className="text-2xl font-mono tabular-nums font-semibold text-[hsl(var(--success))]">Verified</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">SEBI Framework</div>
              </div>
              <div>
                <div className="text-2xl font-mono font-semibold text-primary">Multi-Factor</div>
                <div className="text-[11px] font-mono text-muted-foreground mt-0.5 uppercase tracking-wider">Quant Models</div>
              </div>
            </motion.div>
          </div>

          {/* Interactive Feature Terminal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="glass-panel p-6 shadow-xl space-y-4">
              {/* Header bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                  <span className="text-xs font-mono uppercase tracking-widest text-foreground font-semibold">Research Terminal</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  SYSTEM READY
                </span>
              </div>

              {/* Terminal Capabilities Snippet */}
              <div className="space-y-3">
                <div className="glass-panel-data p-3.5 rounded-md flex items-start gap-3">
                  <div className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Portfolio Diagnostics & Parity</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Live validation of holding integrity, sector weights, and compliance rules.</p>
                  </div>
                </div>

                <div className="glass-panel-data p-3.5 rounded-md flex items-start gap-3">
                  <div className="w-7 h-7 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Quantitative Research Signals</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">High-conviction equity calls with target valuations and risk controls.</p>
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
                <span>View Strategy Tiers</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
              <span className="text-[hsl(var(--success))] font-semibold">NON-CUSTODIAL ASSET SAFETY</span>
              <span className="text-border">•</span>
              <span className="text-foreground">SEBI RESEARCH ANALYST FRAMEWORK</span>
              <span className="text-border">•</span>
              <span className="text-primary font-semibold">DYNAMIC FACTOR REBALANCING</span>
              <span className="text-border">•</span>
              <span className="text-foreground">DIRECT INVESTOR DESK SUPPORT</span>
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
                "Strict non-custodial capital protection in client Demat",
                "Regulatory audit trail with tamper-evident records",
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
          <div id="capabilities" className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3 border border-primary/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Multi-Factor Screening</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluating price momentum, balance sheet quality, earnings growth, and volatility regimes across Indian equities.
              </p>
            </div>

            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 border border-emerald-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">100% Non-Custodial</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You retain complete custody of all funds and equities in your verified broker Demat account at all times.
              </p>
            </div>

            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 border border-amber-500/20">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">Real-Time Signal Alerts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instant notifications on tactical allocations, target weights, stop-loss benchmarks, and rebalance actions.
              </p>
            </div>

            <div className="glass-panel p-6 hover:border-primary/50 transition-colors">
              <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 border border-blue-500/20">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">SEBI Governance Audit</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Complete compliance auditing, version snapshots for portfolio approvals, and statutory invoice generation.
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
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none cursor-pointer"
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
            Elevate Your Portfolio With Systematic Quantitative Research
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xl mx-auto">
            Experience non-custodial capital growth with institutional quantitative advisory models.
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
      
      {/* Absolute Regulatory Footer */}
      <footer className="bg-card/90 border-t border-border py-8 px-6 lg:px-12 text-center transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-mono text-muted-foreground">
            &copy; {new Date().getFullYear()} Arth Research &bull; SEBI Compliant Research Advisory. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] font-mono text-muted-foreground">
            <a href="#philosophy" className="hover:text-foreground">Philosophy</a>
            <a href="#capabilities" className="hover:text-foreground">Capabilities</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <button onClick={() => navigate('/plans')} className="hover:text-foreground cursor-pointer">Advisory Plans</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
