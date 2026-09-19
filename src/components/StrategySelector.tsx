import React from 'react';
import { motion } from 'framer-motion';
import { usePortfolioStore } from '../stores/portfolioStore';
import { AlertCircle, Clock, RefreshCw, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StrategySelectorProps {
  showBanners?: boolean;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({ showBanners = true }) => {
  const navigate = useNavigate();
  const { userPortfolios, activePortfolioId, setActivePortfolioId, userPortfolio } = usePortfolioStore();

  if (!userPortfolios || userPortfolios.length === 0) {
    return null;
  }

  const getStatusBadge = (status: string, expiresAt?: number) => {
    const isExpired = expiresAt ? Date.now() > expiresAt : false;
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-destructive/10 text-destructive border border-destructive/20">
          <Clock className="w-2.5 h-2.5" />
          Expired
        </span>
      );
    }
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border border-[hsl(var(--success))/0.3]">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
          Active
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Clock className="w-2.5 h-2.5" />
          Under Review
        </span>
      );
    }
    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="w-2.5 h-2.5" />
          Revision Needed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground">
        Draft
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Strategy Switcher Bar */}
      <div className="glass-panel p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
              Advisory Mandate {userPortfolios.length > 1 ? `(${userPortfolios.length} Active)` : ''}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {userPortfolio?.planName || 'Select Research Strategy'}
            </span>
          </div>
        </div>

        {/* Multi-plan selector tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {userPortfolios.map((portfolio) => {
            const isSelected = portfolio.id === activePortfolioId;
            return (
              <button
                key={portfolio.id}
                onClick={() => setActivePortfolioId(portfolio.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-foreground shadow-xs font-semibold'
                    : 'glass-panel border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
              >
                <span className="truncate max-w-[140px] sm:max-w-[180px]">{portfolio.planName}</span>
                {getStatusBadge(portfolio.status, portfolio.expiresAt)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contextual Status Alerts for the Selected Plan */}
      {showBanners && userPortfolio && (
        <>
          {userPortfolio.status === 'rejected' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-destructive flex items-center gap-2">
                    <span>Mandate Revision Requested for {userPortfolio.planName}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-1">
                    {userPortfolio.rejectionReason || 'Our quantitative analyst team has requested adjustments to your submitted stock quantities and execution prices.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate(`/setup-portfolio?planId=${userPortfolio.planId || ''}&portfolioId=${userPortfolio.id}`)}
                className="bg-destructive text-white hover:opacity-90 px-4 py-2 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Update & Resubmit Holdings</span>
              </button>
            </motion.div>
          )}

          {userPortfolio.status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4 text-xs font-mono"
            >
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-500 flex items-center gap-2">
                    <span>Analyst Clearance in Progress for {userPortfolio.planName}</span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-1">
                    Your executed entries are undergoing quantitative factor verification (SLA: 24–48 Hours). You will be notified when live rebalancing triggers activate.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default StrategySelector;
