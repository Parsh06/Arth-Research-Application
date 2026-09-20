import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  HelpCircle, 
  Activity, 
  ArrowRight, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import TopNavBar from '../components/TopNavBar';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 relative selection:bg-primary selection:text-primary-foreground transition-colors duration-200 overflow-x-hidden">
      {/* Ambient luminous glow accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <TopNavBar label="Home" backTo="/" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="max-w-2xl w-full glass-panel rounded-2xl overflow-hidden relative z-10 shadow-2xl border border-border mt-14 sm:mt-16"
      >
        {/* Terminal Header Bar */}
        <div className="px-5 sm:px-7 py-3.5 border-b border-border bg-card/90 flex items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
            <span className="font-semibold text-destructive uppercase tracking-wider">
              Page Not Found
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Protected Session</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-10 space-y-6">
          {/* Visual Icon & 404 Display */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/25 flex items-center justify-center text-destructive shadow-inner mb-1">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-4xl sm:text-6xl font-black font-mono tracking-tighter text-foreground block">
                404
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-foreground">
                System Route Not Found
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                The requested terminal page does not exist or access has been restricted.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Primary Return Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary hover:opacity-90 active:scale-[0.99] text-primary-foreground font-bold py-3.5 px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-primary/25 border border-primary/40"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="tracking-tight text-sm font-bold">
                Return to Terminal
              </span>
              <ArrowRight className="w-4 h-4 ml-auto opacity-80 shrink-0" />
            </button>

            {/* Secondary Navigation Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => navigate('/plans')}
                className="p-3 rounded-xl bg-card hover:bg-muted/70 border border-border text-xs font-semibold text-foreground flex items-center gap-2.5 transition-all hover:border-primary/40 cursor-pointer text-left"
              >
                <Compass className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="block font-semibold">Advisory Plans</span>
                  <span className="text-[10px] text-muted-foreground block font-normal">Explore research tiers</span>
                </div>
              </button>

              <button
                onClick={() => navigate('/support')}
                className="p-3 rounded-xl bg-card hover:bg-muted/70 border border-border text-xs font-semibold text-foreground flex items-center gap-2.5 transition-all hover:border-primary/40 cursor-pointer text-left"
              >
                <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="block font-semibold">Terminal Support</span>
                  <span className="text-[10px] text-muted-foreground block font-normal">Contact investor desk</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-5 sm:px-7 py-3 border-t border-border bg-card/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Arth Jain Research Terminal</span>
          </div>
          <span>Institutional Standard Compliance</span>
        </div>
      </motion.div>
    </div>
  );
}
