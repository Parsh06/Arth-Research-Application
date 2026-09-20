// src/components/NoActiveStrategyGate.tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';

interface NoActiveStrategyGateProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function NoActiveStrategyGate({
  title = "No Active Advisory Strategy",
  description = "You haven't subscribed to an algorithmic quant advisory plan yet. Browse available strategies to begin.",
  className = ""
}: NoActiveStrategyGateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`max-w-xl mx-auto py-8 sm:py-14 px-4 ${className}`}
    >
      <div className="glass-panel p-8 sm:p-10 text-center shadow-xl border border-border relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-48 h-20 bg-primary/10 blur-2xl rounded-full pointer-events-none" />

        {/* Top Tag */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono uppercase tracking-wider mb-5">
          <Sparkles className="w-3 h-3" />
          <span>Institutional Advisory Required</span>
        </div>

        {/* Center Icon */}
        <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Title & Description */}
        <h3 className="text-xl sm:text-2xl font-display font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/plans"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-6 py-3 rounded-lg text-xs font-semibold shadow-sm transition-all group"
          >
            <span>Explore Research Plans</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Key Features Pill Bar */}
        <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-2 gap-3 text-left">
          <div className="p-2.5 rounded-md bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase font-semibold mb-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Factor Alpha</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">Systematic equities with risk-weighted rebalancing.</p>
          </div>
          <div className="p-2.5 rounded-md bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1.5 text-primary text-[10px] font-mono uppercase font-semibold mb-0.5">
              <Sparkles className="w-3 h-3" />
              <span>Instant Signals</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-tight">Direct allocation weights and trade triggers.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
