import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, FileText, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import TopNavBar from '../components/TopNavBar';
import type { LegalDocType } from '../types/legal';

export default function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as LegalDocType) || 'terms';
  const [activeTab, setActiveTab] = useState<LegalDocType>(
    ['terms', 'guidelines', 'privacy'].includes(initialTab) ? initialTab : 'terms'
  );

  const handleTabChange = (tab: LegalDocType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8 relative selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <TopNavBar label="Back" backTo="/" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl w-full mx-auto mt-16 sm:mt-20 space-y-6 relative z-10"
      >
        {/* Header Block */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-border shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-foreground">
                    Regulatory & Legal Compliance
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono mt-0.5">
                  Arth Jain Institutional Quantitative Research Terminal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Institutional Standard
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 pt-4 border-t border-border flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>

            <button
              onClick={() => handleTabChange('guidelines')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'guidelines'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Advisory Guidelines & Risk Disclosures</span>
            </button>

            <button
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy & Data Security Policy</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-border shadow-2xl leading-relaxed text-muted-foreground text-xs sm:text-sm space-y-6">
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 text-foreground flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs uppercase font-mono tracking-wider text-primary">
                    Terms of Service Agreement
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Effective Date: September 2026. By accessing or subscribing to the Arth Jain Research Terminal, you agree to be bound by these Terms of Service.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">1</span>
                  Platform Scope & Nature of Services
                </h3>
                <p>
                  Arth Jain Research Terminal provides systematic equity research, factor-based quantitative models, and algorithmic portfolio allocation signals. We operate strictly as an independent research provider under applicable securities frameworks.
                </p>
                <p>
                  All research signals, rebalancing recommendations, and watchlist models are provided for informational and analytical execution purposes. <strong>We do not take custody of client funds or securities.</strong>
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">2</span>
                  Non-Custodial Broker Execution
                </h3>
                <p>
                  Subscribers execute rebalance actions directly within their self-directed demat accounts (e.g. Zerodha, Groww, Angel One, Upstox). The platform does not hold power of attorney (PoA) over your trading accounts or initiate unauthorized orders.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">3</span>
                  Subscription, Mandates & Payments
                </h3>
                <p>
                  Access to research tiers (Alpha Models, Factor Quant, Momentum Rotations) is granted via active subscription mandates. All fees are processed through authorized payment gateways (Razorpay, UPI, Cards, NetBanking) with verified invoicing.
                </p>
                <p>
                  Subscription fees are non-refundable once the advisory mandate period has commenced and proprietary research models have been accessed.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">4</span>
                  Intellectual Property & Anti-Redistribution
                </h3>
                <p>
                  Proprietary algorithms, factor weighting methodologies, strategy triggers, and research documentation remain the exclusive intellectual property of Arth Jain. Redistribution, mirroring, or reselling of signals without explicit written consent is strictly prohibited and subject to immediate terminal revocation.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'guidelines' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <h4 className="font-semibold text-xs uppercase font-mono tracking-wider">
                    Statutory Regulatory Risk Disclosure
                  </h4>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    "Investments in securities markets are subject to market risks. Read all related documents carefully before investing. No assurance or guarantee of returns is provided by the research desk or platform."
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">1</span>
                  Quantitative Model Risk & Volatility
                </h3>
                <p>
                  Factor-based models utilize historical mathematical distributions, momentum metrics, and volatility parity optimizations. Past performance and statistical backtests do not guarantee future returns in idiosyncratic market conditions.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">2</span>
                  Investor Suitability & Risk Profiling
                </h3>
                <p>
                  Subscribers are required to ensure that model portfolios align with their individual risk tolerance, liquidity horizon, and capital preservation thresholds. Our signals are calibrated for disciplined, multi-month quantitative execution.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">3</span>
                  Conflict of Interest Disclosure
                </h3>
                <p>
                  The research analyst and associates adhere to strict personal trading policies prohibiting front-running or trading contrary to active research ratings within designated blackout windows.
                </p>
              </section>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs uppercase font-mono tracking-wider">
                    Client Data Privacy Standard
                  </h4>
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    We uphold zero broker credential storage, end-to-end transport encryption, and strict non-disclosure policies regarding subscriber identity and personal holdings.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">1</span>
                  Information We Collect
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Basic identity verified via Google OAuth (Name, verified Email Address, Account UID).</li>
                  <li>Payment confirmation identifiers, invoicing data, and subscription validity periods.</li>
                  <li>Investor portfolio entry allocations voluntarily inputted for model tracking.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">2</span>
                  Zero Broker Credential Storage
                </h3>
                <p>
                  We never prompt for or store your trading passwords, MPINs, 2FA OTPs, or master broker credentials. Non-custodial interactions happen purely on your authenticated client device.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-display">
                  <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">3</span>
                  Data Retention & Deletion
                </h3>
                <p>
                  Subscribers may request permanent erasure of their account records and portfolio entries at any time by contacting institutional support at <span className="font-mono text-foreground font-semibold">support@arthresearch.com</span>.
                </p>
              </section>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
