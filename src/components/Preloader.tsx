// src/components/Preloader.tsx
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Lock, Activity, Sparkles, Cpu } from 'lucide-react';

interface PreloaderProps {
  isReady?: boolean;
}

const STATUS_STEPS = [
  {
    tag: 'AUTH_01',
    label: 'Authenticating Institutional Session',
    detail: 'Zero-Knowledge Demat Guard',
    icon: Lock,
  },
  {
    tag: 'FEED_02',
    label: 'Calibrating Quantitative Telemetry',
    detail: 'Factor Momentum & Risk Parity',
    icon: Cpu,
  },
  {
    tag: 'PORT_03',
    label: 'Synchronizing Position Ledger',
    detail: 'Multi-Strategy Allocation Desk',
    icon: Activity,
  },
  {
    tag: 'DESK_04',
    label: 'Initializing Research Terminal',
    detail: 'SEBI RA Mandate Cleared',
    icon: ShieldCheck,
  },
];

export default function Preloader({
  isReady = true,
}: PreloaderProps) {
  const prefersReducedMotion = useReducedMotion();

  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1800; // Snappy 1.8s luxury transition

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Smooth custom ease-out curve for natural deceleration
      const easedProgress = 1 - Math.pow(1 - rawProgress, 2.8);
      const percentage = Math.round(easedProgress * 100);

      setProgress(percentage);

      const nextStep = Math.min(
        Math.floor((percentage / 100) * STATUS_STEPS.length),
        STATUS_STEPS.length - 1
      );

      setStepIndex(nextStep);

      if (elapsed >= duration) {
        setProgress(100);
        setStepIndex(STATUS_STEPS.length - 1);
        setMinTimeElapsed(true);
        window.clearInterval(interval);
      }
    }, 25);

    return () => window.clearInterval(interval);
  }, []);

  const shouldShow = !(minTimeElapsed && isReady);
  const currentStep = STATUS_STEPS[stepIndex];
  const StepIcon = currentStep.icon;

  const formattedProgress = useMemo(
    () => progress.toString().padStart(3, '0'),
    [progress]
  );

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="arth-luxury-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.015,
            filter: 'blur(8px)',
            transition: {
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className="fixed inset-0 z-[99999] overflow-hidden bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground select-none"
        >
          {/* AMBIENT RADIAL LIGHTING ENGINE */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Primary Warm Brass Bloom */}
            <div className="absolute left-1/2 top-1/2 h-[550px] w-[550px] sm:h-[700px] sm:w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px]" />
            {/* Secondary Deep Sapphire Hue */}
            <div className="absolute right-[-10%] top-[-10%] h-[450px] w-[450px] rounded-full bg-secondary/10 blur-[120px]" />
            {/* Subtle Counter Bloom */}
            <div className="absolute left-[-10%] bottom-[-10%] h-[450px] w-[450px] rounded-full bg-primary/8 blur-[140px]" />
            {/* Fine Sub-Pixel Noise Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.04)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
          </div>

          {/* TOP HEADER: BRAND METRICS & SECURITY STATUS */}
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10 sm:py-7 border-b border-border/40 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded flex items-center justify-center p-0.5 bg-primary/15 border border-primary/25">
                <img src="/logo1.png" alt="Arth Research" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xs sm:text-sm font-semibold tracking-tight text-foreground">
                  Arth Research
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-primary">
                  Institutional Desk
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 font-mono text-[9px] uppercase tracking-wider text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>TLS 1.3 • High Precision</span>
            </div>
          </motion.header>

          {/* CENTRAL EXPERIENCE: THE QUANT VAULT */}
          <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[480px] glass-panel p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-primary/25 text-center"
            >
              {/* Top Accent Stripe */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

              {/* LOGO EMBLEM PRESENTATION */}
              <div className="relative mb-5 flex items-center justify-center">
                {/* Orbital Outer Glow */}
                <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-primary/15 blur-xl pointer-events-none -z-10" />

                {/* Rotating Delicate Orbital Ring */}
                {!prefersReducedMotion && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                    className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-dashed border-primary/30 pointer-events-none"
                  />
                )}

                {/* Logo Canvas Container */}
                <motion.div
                  animate={prefersReducedMotion ? undefined : { scale: [1, 1.025, 1] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-card/80 backdrop-blur-md border border-primary/30 p-3 shadow-lg flex items-center justify-center relative z-10"
                >
                  <img
                    src="/logo1.png"
                    alt="Arth Research Logo"
                    className="w-full h-full object-contain select-none filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                  />
                </motion.div>
              </div>

              {/* BRAND TITLE & INSTITUTIONAL SUBTITLE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mb-6"
              >
                <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight">
                  Arth Research
                </h1>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-2">
                  <span>Quantitative Advisory</span>
                  <span className="text-primary">•</span>
                  <span>SEBI Registered RA</span>
                </p>
              </motion.div>

              {/* PROGRESS TELEMETRY ENGINE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="w-full space-y-3"
              >
                {/* Status Step Header & Counter */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-left truncate">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-primary/15 text-primary shrink-0 border border-primary/25">
                      <StepIcon className="w-3 h-3 animate-pulse" />
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={stepIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="truncate"
                      >
                        <span className="font-semibold text-foreground block text-[11.5px] truncate">
                          {currentStep.label}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          {currentStep.detail}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="font-mono text-sm tabular-nums font-bold text-primary shrink-0 pl-2">
                    {formattedProgress}%
                  </div>
                </div>

                {/* Shimmering Progress Bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/60 border border-border">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-amber-500 to-secondary"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                  {!prefersReducedMotion && (
                    <motion.div
                      animate={{ x: ['-100%', '400%'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px]"
                    />
                  )}
                </div>

                {/* Micro Step Pips */}
                <div className="flex items-center justify-between pt-1">
                  {STATUS_STEPS.map((step, idx) => (
                    <div
                      key={step.tag}
                      className="flex items-center gap-1 text-[9px] font-mono tracking-wider transition-colors duration-200"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                          idx <= stepIndex
                            ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]'
                            : 'bg-muted-foreground/30'
                        }`}
                      />
                      <span
                        className={`hidden sm:inline ${
                          idx <= stepIndex ? 'text-foreground font-semibold' : 'text-muted-foreground/50'
                        }`}
                      >
                        {step.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* STATUTORY TRUST BADGE */}
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center gap-2 text-[10px] font-mono text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary shrink-0" />
                <span>Non-Custodial Multi-Factor Analytics Architecture</span>
              </div>
            </motion.div>
          </main>

          {/* FOOTER: STATUTORY DECLARATION */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 px-6 py-4 sm:px-10 sm:py-5 border-t border-border/40 font-mono text-[9px] text-muted-foreground uppercase tracking-wider backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">SEBI REG. INH00001234</span>
              <span>•</span>
              <span>CIN: U67190MH2026PTC123456</span>
            </div>
            <div>
              <span>&copy; {new Date().getFullYear()} Arth Research Advisory. All Rights Reserved.</span>
            </div>
          </motion.footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
