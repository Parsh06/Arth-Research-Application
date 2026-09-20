import { motion } from 'framer-motion';
import { ShieldCheck, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCmsStore } from '../stores/cmsStore';
import { useState, useEffect } from 'react';
import TopNavBar from '../components/TopNavBar';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();
  const { siteContent, fetchSiteContent } = useCmsStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const from = location.state?.from || '/dashboard';

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
        setError("Sign-in popup was closed before completing. Please click below to try again.");
      } else if (code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked by your browser. Please allow popups for localhost/this domain.");
      } else if (code === 'auth/unauthorized-domain') {
        setError("This domain/port is not authorized in Firebase Console (Authentication > Settings > Authorized Domains).");
      } else if (code === 'auth/operation-not-allowed') {
        setError("Google sign-in provider is not enabled in Firebase Console (Authentication > Sign-in Method).");
      } else if (code === 'auth/network-request-failed') {
        setError("Network connection issue. Please check your internet connection and try again.");
      } else {
        setError(err.message || "Failed to authenticate with Google. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6 relative selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      <TopNavBar />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 glass-panel overflow-hidden relative z-10 shadow-2xl mt-12"
      >
        {/* Left Side - Brand & Institutional Proof */}
        <div className="lg:col-span-6 bg-card/80 p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border relative overflow-hidden">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                <img src="/logo1.png" alt="Arth Jain Logo" className="w-5 h-5 object-contain" />
              </div>
              <div>
                <span className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-1.5">
                  ARTH JAIN
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">Alpha</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono block">Research Terminal</span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tracking-wider mb-4">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Institutional Research Platform</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-foreground mb-3 leading-tight">
              {loginData.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-8">
              {loginData.subtitle}
            </p>

            <div className="space-y-3">
              {[
                "Direct Non-Custodial Demat Execution",
                "Factor-Based Risk Parity Model Alerts",
                "Encrypted Identity & KYC Verification"
              ].map((text, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-10 pt-5 border-t border-border flex items-center gap-2 text-muted-foreground text-[11px] font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--success))] shrink-0" />
            <span>{loginData.securityText}</span>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-card/40">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold tracking-tight text-foreground mb-1">Client Terminal Access</h2>
            <p className="text-xs text-muted-foreground">Authenticate securely using your Google identity.</p>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}
            
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3 px-5 rounded-md font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                  <path fill="currentColor" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="currentColor" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-1.9z" />
                  <path fill="currentColor" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
              )}
              <span>{isLoading ? "Authenticating Session..." : "Continue with Google"}</span>
            </button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                <span className="px-2 bg-card text-muted-foreground">Compliance & Security</span>
              </div>
            </div>

            <div className="p-3.5 rounded-md glass-panel-data flex items-start gap-2.5">
              <Lock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                By entering the platform, you agree to our Terms of Service, Advisory Guidelines, and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
