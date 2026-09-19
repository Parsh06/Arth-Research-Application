import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

interface PreloaderProps {
  isReady?: boolean;
}

const STATUS_STEPS = [
  {
    label: 'Authenticating session',
    detail: 'SECURE SESSION',
  },
  {
    label: 'Syncing market intelligence',
    detail: 'MARKET DATA',
  },
  {
    label: 'Reconciling portfolio positions',
    detail: 'PORTFOLIO',
  },
  {
    label: 'Preparing your research desk',
    detail: 'ARTH RESEARCH',
  },
];

const RUNTIME_MESSAGES = [
  'Establishing secure connection',
  'Loading market intelligence',
  'Reconciling portfolio data',
  'Preparing research environment',
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
    const duration = 2000;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Natural ease-out curve
      const easedProgress = 1 - Math.pow(1 - rawProgress, 2.4);
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
    }, 30);

    return () => window.clearInterval(interval);
  }, []);

  const shouldShow = !(minTimeElapsed && isReady);
  const currentStep = STATUS_STEPS[stepIndex];

  const formattedProgress = useMemo(
    () => progress.toString().padStart(3, '0'),
    [progress]
  );

  const marketLines = [
    {
      name: 'NIFTY',
      value: '24,836.10',
      change: '+0.42%',
    },
    {
      name: 'SENSEX',
      value: '81,442.80',
      change: '+0.31%',
    },
    {
      name: 'BANKNIFTY',
      value: '51,208.35',
      change: '+0.58%',
    },
  ];

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          key="arth-premium-preloader"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.015,
            filter: 'blur(4px)',
            transition: {
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            },
          }}
          className="fixed inset-0 z-[99999] overflow-hidden bg-[#F8F7F4] dark:bg-[#0A0E16] text-[#171717] dark:text-[#F7F6F2] flex flex-col justify-between"
        >
          {/* AMBIENT LUXURY LIGHTING (NO GRID) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Primary Warm Glow */}
            <div className="absolute left-1/2 top-1/2 h-[680px] w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C7A35A]/[0.10] blur-[140px]" />
            {/* Secondary Sapphire Glow */}
            <div className="absolute right-[-10%] top-[-10%] h-[550px] w-[550px] rounded-full bg-[#2E5AA6]/[0.08] blur-[120px]" />
            {/* Subtle Bottom Ambient Refraction */}
            <div className="absolute left-[-10%] bottom-[-10%] h-[500px] w-[500px] rounded-full bg-[#C7A35A]/[0.07] blur-[130px]" />
          </div>

          {/* TOP NAV / BRAND STRIP */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8"
          >
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-[#6E6A63] dark:text-zinc-400">
                  Arth Research
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#8B877F] dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C7A35A] animate-pulse" />
              Private Research
            </div>
          </motion.div>

          {/* DECORATIVE LEFT MARKET DATA (DESKTOP) */}
          <div className="pointer-events-none absolute left-8 top-1/2 hidden -translate-y-1/2 flex-col gap-7 xl:flex z-10">
            {marketLines.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.7 + index * 0.12 }}
                className="w-32"
              >
                <div className="flex items-center justify-between font-mono text-[8px] tracking-[0.15em] text-[#9A958B] dark:text-zinc-500">
                  <span>{item.name}</span>
                  <span className="text-[#C7A35A]">LIVE</span>
                </div>
                <div className="mt-1 font-mono text-[12px] tabular-nums text-[#3B3935] dark:text-zinc-200 font-semibold">
                  {item.value}
                </div>
                <div className="mt-0.5 font-mono text-[9px] text-emerald-600 dark:text-emerald-400">
                  {item.change}
                </div>
              </motion.div>
            ))}
          </div>

          {/* DECORATIVE RIGHT QUANT PANEL (DESKTOP) */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 xl:block z-10"
          >
            <div className="w-36 border-l border-black/[0.08] dark:border-white/[0.1] pl-5">
              <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#AAA49A] dark:text-zinc-500">
                Research Engine
              </div>
              <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#69655E] dark:text-zinc-400">
                <motion.span
                  animate={prefersReducedMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  className="h-1.5 w-1.5 rounded-full bg-[#C7A35A]"
                />
                Initialising
              </div>
              <div className="mt-4 space-y-2">
                {[72, 48, 86, 61, 38].map((width, index) => (
                  <motion.div
                    key={index}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.8, delay: 1 + index * 0.08 }}
                    className="h-px bg-[#C7A35A]/30"
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* CENTRAL EXPERIENCE */}
          <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-8">
            <div className="flex w-full max-w-[520px] flex-col items-center text-center">
              
              {/* ENLARGED CLEAN LOGO MARK (NO BOXES, NO CIRCLES) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="relative mb-2 flex items-center justify-center"
              >
                {/* Subtle soft backdrop radial bloom for high logo clarity */}
                <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#C7A35A]/15 blur-2xl pointer-events-none -z-10" />

                <motion.img
                  src="/logo1.png"
                  alt="Arth Research Logo"
                  className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_12px_32px_rgba(199,163,90,0.25)] select-none"
                  animate={prefersReducedMotion ? undefined : { scale: [1, 1.03, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>

              {/* BRAND NAME */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6"
              >
                <h1 className="font-display text-[clamp(2.15rem,8vw,3.5rem)] font-bold leading-none tracking-tight text-[#1C1A17] dark:text-[#F7F6F2]">
                  Arth
                </h1>

                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#C7A35A]" />
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.34em] text-[#C7A35A] sm:text-xs">
                    Research
                  </span>
                  <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#C7A35A]" />
                </div>
              </motion.div>

              {/* TAGLINE */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.45 }}
                className="mt-3 max-w-[330px] font-sans text-[11px] leading-relaxed tracking-[0.015em] text-[#77726A] dark:text-zinc-400 sm:text-xs"
              >
                Institutional research, portfolio intelligence and quantitative insight.
              </motion.p>

              {/* PROGRESS SYSTEM */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.65 }}
                className="mt-8 w-full max-w-[380px]"
              >
                <div className="flex items-end justify-between">
                  <div className="text-left">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={stepIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="font-sans text-[11px] font-medium text-[#4F4B45] dark:text-zinc-300 sm:text-xs">
                          {currentStep.label}
                        </div>
                        <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-[#AAA49A] dark:text-zinc-500">
                          {currentStep.detail}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <motion.div
                    key={formattedProgress}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    className="font-mono text-[11px] tabular-nums font-semibold text-[#C7A35A]"
                  >
                    {formattedProgress}%
                  </motion.div>
                </div>

                {/* Main progress track */}
                <div className="relative mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[#E5E1D8] dark:bg-zinc-800">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#C6A15B] via-[#C7A35A] to-[#2E5AA6]"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                  {!prefersReducedMotion && (
                    <motion.div
                      animate={{ x: ['-20%', '420%'] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[1px]"
                    />
                  )}
                </div>

                {/* Step indicators */}
                <div className="mt-3 flex justify-between">
                  {STATUS_STEPS.map((step, index) => (
                    <div key={step.detail} className="flex items-center gap-1.5">
                      <motion.span
                        animate={{
                          scale: index === stepIndex ? 1.1 : 0.8,
                          opacity: index <= stepIndex ? 1 : 0.3,
                        }}
                        className="h-1.5 w-1.5 rounded-full bg-[#C7A35A]"
                      />
                      <span className="hidden font-mono text-[8px] uppercase tracking-[0.12em] text-[#A09A90] dark:text-zinc-500 sm:block">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* LIVE SYSTEM MESSAGE */}
              <div className="mt-6 h-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={stepIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <motion.span
                      animate={prefersReducedMotion ? undefined : { opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="h-1.5 w-1.5 rounded-full bg-[#C7A35A]"
                    />
                    <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#A29C92] dark:text-zinc-400">
                      {RUNTIME_MESSAGES[stepIndex]}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </main>

          {/* FOOTER */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="relative z-10 flex items-center justify-center px-6 py-6 sm:py-8"
          >
            <div className="flex items-center gap-3 font-mono text-[7px] uppercase tracking-[0.18em] text-[#AAA49A] dark:text-zinc-500 sm:text-[8px]">
              <span>Arth Research</span>
              <span className="h-3 w-px bg-black/[0.1] dark:bg-white/[0.1]" />
              <span>Secure Environment</span>
              <span className="hidden h-3 w-px bg-black/[0.1] dark:bg-white/[0.1] sm:block" />
              <span className="hidden sm:block">v1.0</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
