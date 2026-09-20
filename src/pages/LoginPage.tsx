import { motion } from 'framer-motion';
import { ShieldCheck, Lock, CheckCircle2, Sparkles, Activity, Shield, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCmsStore } from '../stores/cmsStore';
import { useState, useEffect } from 'react';
import TopNavBar from '../components/TopNavBar';
import LegalDocumentModal from '../components/LegalDocumentModal';
import type { LegalDocType } from '../types/legal';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();
  const { siteContent, fetchSiteContent } = useCmsStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [selectedLegalDoc, setSelectedLegalDoc] = useState<LegalDocType>('terms');
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

  const openLegalModal = (docType: LegalDocType, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedLegalDoc(docType);
    setLegalModalOpen(true);
  };

  useEffect(() => {
    fetchSiteContent();
  }, [fetchSiteContent]);

  const loginData = siteContent?.loginPage || {
    title: "Access Your Wealth Engine",
    subtitle: "Institutional quantitative portfolio analytics and automated research signals.",
    securityText: "Institutional Quantitative Advisory Security Standard"
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error("Authentication Error:", err);
      const code = err?.code || "";
      if (code === 'auth/popup-closed-by-user') {
        setError("Sign-in window was closed before completing. Please click below to try again.");
      } else if (code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked by your browser. Please enable popups to continue.");
      } else if (code === 'auth/network-request-failed') {
        setError("Network connection error. Please verify your internet connection and try again.");
      } else {
        setError("Authentication service is temporarily unavailable. Please try again shortly.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      title: "Direct Non-Custodial Demat Execution",
      desc: "Zero custody handover. Execute model portfolio rebalances directly within your personal broker (Zerodha, Groww, AngelOne, Upstox)."
    },
    {
      title: "Factor-Based Risk Parity Model Alerts",
      desc: "Systematic momentum factor scoring, real-time risk parity weight monitoring, and quantitative research alerts."
    },
    {
      title: "Encrypted Identity & Account Verification",
      desc: "End-to-end encrypted investor records and institutional regulatory compliance standards."
    }
  ];

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-primary selection:text-primary-foreground transition-colors duration-200 overflow-x-hidden">
      {/* Ambient luminous glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <TopNavBar label="Home" backTo="/" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 glass-panel rounded-2xl overflow-hidden relative z-10 shadow-2xl border border-border mt-14 sm:mt-16"
      >
        {/* Left Column: Brand & Institutional Value Proposition */}
        <div className="lg:col-span-7 bg-card/85 dark:bg-[#0B101A]/90 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border relative">
          <div className="space-y-6">
            {/* Brand Logo & Identifier */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 dark:bg-primary/20 border border-primary/30 flex items-center justify-center p-1.5 shadow-xs shrink-0">
                <img src="/logo1.png" alt="Arth Jain Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-foreground font-display">
                    ARTH JAIN
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-mono font-medium block">
                  Research Terminal
                </span>
              </div>
            </div>

            {/* Category Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-mono font-medium tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Institutional Research Platform</span>
            </div>

            {/* Main Headline & Subtitle */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground leading-tight">
                {loginData.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                {loginData.subtitle}
              </p>
            </div>

            {/* Key Platform Highlights */}
            <div className="space-y-3 pt-1">
              {features.map((feat, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-background/60 dark:bg-card/50 border border-border/80 hover:border-primary/40 transition-colors shadow-2xs"
                >
                  <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block tracking-tight">
                      {feat.title}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed block mt-0.5">
                      {feat.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Institutional Compliance Footer */}
          <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{loginData.securityText}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background/60 dark:bg-card/50 px-2.5 py-1 rounded-md border border-border shrink-0 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Encrypted & Secured</span>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Terminal Panel */}
        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-center bg-card/40 dark:bg-[#070A10]/95 backdrop-blur-md">
          <div className="mb-6 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                Secure Session
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <Activity className="w-3 h-3 text-emerald-500" />
                <span>Gateway Live</span>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-foreground">
              Client Terminal Access
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Authenticate securely using your Google identity.
            </p>
          </div>

          <div className="space-y-4">
            {/* Error Diagnostics Banner */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1"
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span>Authentication Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-destructive/90 pl-5">
                  {error}
                </p>
              </motion.div>
            )}
            
            {/* Google Authentication Trigger Button — Primary Yellow/Gold Theme */}
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-primary hover:opacity-90 active:scale-[0.99] text-primary-foreground font-bold py-3.5 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer shadow-md hover:shadow-primary/25 border border-primary/40"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-2xs shrink-0 p-0.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
              )}
              <span className="tracking-tight text-sm font-bold">
                {isLoading ? "Authenticating Session..." : "Continue with Google"}
              </span>
              {!isLoading && <ArrowRight className="w-4 h-4 opacity-80 group-hover:translate-x-1 group-hover:opacity-100 transition-all ml-auto shrink-0" />}
            </button>
            
            {/* Compliance & Security Section Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/80"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                <span className="px-2.5 bg-card dark:bg-[#070A10] text-muted-foreground font-semibold">
                  Compliance & Security
                </span>
              </div>
            </div>

            {/* Legal Notice Box */}
            <div className="p-3.5 rounded-xl bg-background/60 dark:bg-card/40 border border-border/70 flex items-start gap-2.5">
              <Lock className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                By entering the platform, you agree to our{' '}
                <button
                  type="button"
                  onClick={(e) => openLegalModal('terms', e)}
                  className="text-foreground hover:text-primary underline underline-offset-2 transition-colors font-medium cursor-pointer"
                >
                  Terms of Service
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={(e) => openLegalModal('guidelines', e)}
                  className="text-foreground hover:text-primary underline underline-offset-2 transition-colors font-medium cursor-pointer"
                >
                  Advisory Guidelines
                </button>
                , and{' '}
                <button
                  type="button"
                  onClick={(e) => openLegalModal('privacy', e)}
                  className="text-foreground hover:text-primary underline underline-offset-2 transition-colors font-medium cursor-pointer"
                >
                  Privacy Policy
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interactive Compliance & Legal Document Reader Modal */}
      <LegalDocumentModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialDoc={selectedLegalDoc}
      />
    </div>
  );
}
              