// src/components/Preloader.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PreloaderProps {
  isReady?: boolean;
}

const STATUS_STEPS = [
  'Initializing encrypted workspace',
  'Calibrating quantitative factor models',
  'Synchronizing real-time portfolio ledger',
  'Connecting to compliance telemetry',
  'Preparing institutional desk',
];

export default function Preloader({ isReady = true }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1400; // Fast, elegant 1.4s entrance

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const raw = Math.min(elapsed / duration, 1);
      // Luxurious ease-out cubic
      const eased = 1 - Math.pow(1 - raw, 3);
      const pct = Math.round(eased * 100);

      setProgress(pct);
      setStepIndex(Math.min(Math.floor((pct / 100) * STATUS_STEPS.length), STATUS_STEPS.length - 1));

      if (elapsed >= duration) {
        setProgress(100);
        setStepIndex(STATUS_STEPS.length - 1);
        setMinTimeElapsed(true);
        window.clearInterval(interval);
      }
    }, 20);

    return () => window.clearInterval(interval);
  }, []);

  const shouldShow = !(minTimeElapsed && isReady) && !hasFinished;

  return (
    <AnimatePresence onExitComplete={() => setHasFinished(true)}>
      {shouldShow && (
        <motion.div
          key="arth-preloader-overlay"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.99,
            filter: 'blur(8px)',
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between overflow-hidden bg-[#06090F] text-slate-100 select-none px-6 py-12"
          style={{ pointerEvents: shouldShow ? 'auto' : 'none' }}
        >
          {/* Ambient Lighting & Luminous Orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px]" />
            <div className="absolute right-[-10%] top-[-10%] h-[350px] w-[350px] rounded-full bg-emerald-500/5 blur-[120px]" />
            <div className="absolute left-[-10%] bottom-[-10%] h-[350px] w-[350px] rounded-full bg-primary/5 blur-[120px]" />
          </div>

          {/* Top Subtle Status Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">
              Institutional Terminal
            </span>
          </motion.div>

          {/* Center Brand Hero */}
          <div className="relative z-10 flex flex-col items-center text-center my-auto">
            {/* Logo Emblem */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-b from-primary/20 to-transparent blur-xl opacity-80" />
              <div className="relative rounded-2xl bg-[#0C121D] border border-white/10 p-3.5 shadow-2xl shadow-black/80 flex items-center justify-center">
                <img
                  src="/logo1.png"
                  alt="Arth Research"
                  className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-lg drop-shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                />
              </div>
            </motion.div>

            {/* Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white"
            >
              Arth Research
            </motion.h1>

            {/* Geometric Accent Divider */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="my-3.5 flex items-center gap-2.5"
            >
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/70" />
              <span className="h-1.5 w-1.5 rotate-45 bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary/70" />
            </motion.div>

            {/* Sub-headings */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-[11px] font-mono uppercase tracking-[0.3em] text-slate-300 font-medium"
            >
              Quantitative Advisory
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="text-[10px] sm:text-[11px] font-mono tracking-[0.2em] uppercase text-[#C6A15B]/70 mt-1"
            >
              Quantitative Equities Research &bull; Institutional Advisory
            </motion.p>
          </div>

          {/* Bottom Progress & Status Bar */}
          <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-3">
            {/* Progress Track */}
            <div className="relative h-1 w-full rounded-full bg-white/[0.06] overflow-hidden border border-white/[0.04]">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-emerald-400 to-primary rounded-full shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.15 }}
              />
            </div>

            {/* Telemetry Indicator */}
            <div className="flex w-full items-center justify-between font-mono text-[11px]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stepIndex}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.25 }}
                  className="text-slate-400 font-medium tracking-wider"
                >
                  {STATUS_STEPS[stepIndex]}...
                </motion.span>
              </AnimatePresence>
              <span className="font-semibold tabular-nums text-primary font-mono">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}