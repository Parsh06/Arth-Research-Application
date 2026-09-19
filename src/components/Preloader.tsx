// src/components/Preloader.tsx
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface PreloaderProps {
  isReady?: boolean;
}

const STATUS_STEPS = [
  'Authenticating session',
  'Calibrating research telemetry',
  'Synchronizing portfolio ledger',
  'Preparing your desk',
];

export default function Preloader({ isReady = true }: PreloaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1800;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const raw = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - raw, 2.8);
      const pct = Math.round(eased * 100);

      setProgress(pct);
      setStepIndex(Math.min(Math.floor((pct / 100) * STATUS_STEPS.length), STATUS_STEPS.length - 1));

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

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="arth-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.01,
            filter: 'blur(6px)',
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-background text-foreground select-none"
        >
          {/* Restrained ambient light — no grid, no hard edges */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.08] blur-[140px]" />
            <div className="absolute right-[-8%] top-[-8%] h-[40vh] w-[40vh] rounded-full bg-secondary/[0.07] blur-[130px]" />
            {!prefersReducedMotion && (
              <motion.div
                aria-hidden
                className="absolute left-[-6%] bottom-[-6%] h-[42vh] w-[42vh] rounded-full bg-primary/[0.06] blur-[130px]"
                animate={{ x: [0, 16, 0], y: [0, -12, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>

          <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-6 text-center">
            {/* Logo — unboxed, presented as a mark, not a container */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-6 flex items-center justify-center"
            >
              <div className="absolute h-28 w-28 rounded-full bg-primary/[0.14] blur-2xl" />
              <motion.img
                src="/logo1.png"
                alt="Arth Research"
                className="relative h-14 w-14 object-contain drop-shadow-[0_6px_18px_hsl(var(--primary)/0.25)] sm:h-16 sm:w-16"
                animate={prefersReducedMotion ? undefined : { scale: [1, 1.035, 1] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <h1 className="font-display text-[clamp(1.9rem,6vw,2.75rem)] font-medium leading-none tracking-tight text-foreground">
                Arth Research
              </h1>

              {/* Richness ornament — thin rule, center lozenge, thin rule */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="mt-4 flex items-center gap-3"
              >
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-primary/70 sm:w-10" />
                <span className="h-[5px] w-[5px] rotate-45 bg-primary" />
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-primary/70 sm:w-10" />
              </motion.div>

              <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Quantitative Advisory
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.32em] text-muted-foreground/70">
                SEBI Registered Research Analyst
              </p>
            </motion.div>
          </div>

          {/* Progress — a single slim line, no bar chrome */}
          <div className="absolute bottom-14 left-1/2 flex w-[min(70vw,15rem)] -translate-x-1/2 flex-col items-center gap-3 sm:bottom-16">
            <div className="relative h-px w-full bg-border">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              />
            </div>

            <div className="flex w-full items-center justify-between">
              <AnimatePresence mode="wait">
                <motion.span
                  key={stepIndex}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="text-[9.5px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
                >
                  {STATUS_STEPS[stepIndex]}
                </motion.span>
              </AnimatePresence>
              <span className="font-display text-xs tabular-nums text-primary">{progress}%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}