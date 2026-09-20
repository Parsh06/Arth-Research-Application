import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Lock, AlertTriangle, Scale } from 'lucide-react';
import type { LegalDocType } from '../types/legal';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export default function LegalDocumentModal({
  isOpen,
  onClose,
  initialDoc = 'terms'
}: LegalDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialDoc);
      // Lock background scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialDoc]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 text-foreground"
        >
          {/* Header */}
          <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-border bg-card/90 backdrop-blur-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold font-display tracking-tight">
                    Regulatory & Legal Compliance
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Institutional Standard
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Arth Jain Institutional Quantitative Research Terminal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors border border-border"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-5 sm:px-7 pt-3 bg-muted/40 border-b border-border flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                activeTab === 'terms'
                  ? 'border-primary text-primary font-bold bg-background/60 rounded-t-lg shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>

            <button
              onClick={() => setActiveTab('guidelines')}
              className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                activeTab === 'guidelines'
                  ? 'border-primary text-primary font-bold bg-background/60 rounded-t-lg shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Advisory Guidelines & Disclosures</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                activeTab === 'privacy'
                  ? 'border-primary text-primary font-bold bg-background/60 rounded-t-lg shadow-2xs'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy & Security Policy</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {activeTab === 'terms' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 text-foreground flex items-start gap-3">
                  <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
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
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">1</span>
                    Platform Scope & Nature of Services
                  </h3>
                  <p>
                    Arth Jain Research Terminal provides systematic equity research, factor-based quantitative models, and algorithmic portfolio allocation signals. We operate strictly as an independent research provider under applicable Indian securities frameworks.
                  </p>
                  <p>
                    All research signals, rebalancing recommendations, and watchlist models are provided for informational and analytical execution purposes. <strong>We do not take custody of client funds or securities.</strong>
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">2</span>
                    Non-Custodial Broker Execution
                  </h3>
                  <p>
                    Subscribers execute rebalance actions directly within their self-directed demat accounts (e.g. Zerodha, Groww, Angel One, Upstox). The platform does not hold power of attorney (PoA) over your trading accounts or initiate unauthorized orders.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">3</span>
                    Subscription, Mandates & Payments
                  </h3>
                  <p>
                    Access to research tiers (Alpha Models, Factor Quant, Momentum Rotations) is granted via active subscription mandates. All fees are processed through authorized payment gateways (Razorpay, UPI, Cards, NetBanking) with verified GST invoicing.
                  </p>
                  <p>
                    Subscription fees are non-refundable once the advisory mandate period has commenced and proprietary research models have been accessed.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">4</span>
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
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">1</span>
                    Quantitative Model Risk & Volatility
                  </h3>
                  <p>
                    Factor-based models utilize historical mathematical distributions, momentum metrics, and volatility parity optimizations. Past performance and statistical backtests do not guarantee future returns in idiosyncratic market conditions.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">2</span>
                    Investor Suitability & Risk Profiling
                  </h3>
                  <p>
                    Subscribers are required to ensure that model portfolios align with their individual risk tolerance, liquidity horizon, and capital preservation thresholds. Our signals are calibrated for disciplined, multi-month quantitative execution.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">3</span>
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
                  <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
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
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">1</span>
                    Information We Collect
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Basic identity verified via Google OAuth (Name, verified Email Address, Account UID).</li>
                    <li>Payment confirmation identifiers, invoicing data, and subscription validity periods.</li>
                    <li>Investor portfolio entry allocations voluntarily inputted for model tracking.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">2</span>
                    Zero Broker Credential Storage
                  </h3>
                  <p>
                    We never prompt for or store your trading passwords, MPINs, 2FA OTPs, or master broker credentials. Non-custodial interactions happen purely on your authenticated client device.
                  </p>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-display">
                    <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-mono">3</span>
                    Data Retention & Deletion
                  </h3>
                  <p>
                    Subscribers may request permanent erasure of their account records and portfolio entries at any time by contacting institutional support at <span className="font-mono text-foreground font-semibold">support@arthresearch.com</span>.
                  </p>
                </section>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-7 py-3.5 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Compliant with Information Technology & Regulatory Standards</span>
            </div>
            <button
              onClick={onClose}
              className="bg-primary hover:opacity-90 active:scale-[0.98] text-primary-foreground font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-xs shrink-0 self-end sm:self-auto cursor-pointer"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
