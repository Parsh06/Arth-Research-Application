import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Layers, ShieldCheck, ChevronRight, Clock, CheckCircle2, RefreshCw, Lock, Activity, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useCmsStore } from '../stores/cmsStore';
import { formatINR } from '../utils/money';
import { useNavigate, Link } from 'react-router-dom';
import StrategySelector from '../components/StrategySelector';
import NoActiveStrategyGate from '../components/NoActiveStrategyGate';
import { useAdvisoryAccess } from '../hooks/useAdvisoryAccess';

const MetricCard = ({ title, value, icon: Icon, delay, subtitle, statusBadge }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-panel p-5 flex flex-col justify-between"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{title}</span>
      <div className="w-8 h-8 rounded-md bg-muted/60 text-foreground flex items-center justify-center border border-border">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
    
    <div>
      <div className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mb-1.5">
        {value}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">{subtitle}</span>
        {statusBadge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-semibold">
            {statusBadge}
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { dbUser } = useAuthStore();
  const { userPortfolio, userPortfolios, valuation, holdings } = usePortfolioStore();
  const { siteContent, fetchSiteContent } = useCmsStore();
  const { hasAccess, isLoading: isAccessLoading } = useAdvisoryAccess();
  const firstName = dbUser?.displayName?.split(' ')[0] || 'Investor';
  
  const isPendingApproval = userPortfolio?.status === 'pending';
  const hasActiveAccess = Boolean(hasAccess && userPortfolio && (userPortfolio.status as string) === 'active');
  
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  useEffect(() => {
    fetchSiteContent();
  }, [fetchSiteContent]);

  const dashboardData = siteContent?.dashboardPage || {
    welcomeText: "Institutional Terminal Access • Risk Parity Quant Engine",
    marketStatus: "TERMINAL ACTIVE",
    chartTitle: "Capital Allocation & Position Registry"
  };

  const totalInvestedMinor = valuation?.totalInvestedMinor || userPortfolio?.totalInvestmentMinor || 0;
  const activeHoldings = valuation?.holdings || holdings || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Regime Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              {greeting}, {firstName}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {dashboardData.welcomeText}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md glass-panel text-[11px] font-mono text-foreground border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            <span>{dashboardData.marketStatus}</span>
          </div>

          <div className="px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-[11px] font-mono font-medium">
            QUANT DESK ACTIVE
          </div>
        </div>
      </div>

      {/* Multi-Plan Strategy Selector */}
      {hasAccess && <StrategySelector />}

      {/* Conditional Rendering: If No Active Strategy */}
      {!isAccessLoading && !hasAccess && !userPortfolio && (!userPortfolios || userPortfolios.length === 0) ? (
        <NoActiveStrategyGate />
      ) : hasAccess && !userPortfolio && (!userPortfolios || userPortfolios.length === 0) ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 text-center space-y-4 max-w-2xl mx-auto my-8 border border-primary/25 shadow-xl relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[hsl(var(--success))/0.1] text-[hsl(var(--success))] text-[10px] font-mono uppercase tracking-wider border border-[hsl(var(--success))/0.2]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Advisory Mandate Cleared & Active</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Complete Your Strategy Portfolio Setup
          </h2>
          <p className="text-xs text-muted-foreground font-mono max-w-md mx-auto leading-relaxed">
            Your quantitative subscription is active. Submit your current stock positions to activate real-time portfolio analytics, weight monitoring, and rebalancing alerts.
          </p>
          <div className="pt-2">
            <Link
              to="/setup-portfolio"
              className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-5 py-2.5 rounded-md shadow-sm transition-all font-mono"
            >
              <span>Initialize Strategy Holdings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      ) : isPendingApproval ? (
        <div className="space-y-6">
          {/* Main Hero Clearance Notice Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 sm:p-8 relative overflow-hidden border border-amber-500/30"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 pb-6 border-b border-border">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[11px] font-mono tracking-wider uppercase">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Mandate Under Desk Verification</span>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground tracking-tight">
                  Clearance in Progress for {userPortfolio?.planName || 'Advisory Mandate'}
                </h2>
                
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl font-mono">
                  Your submitted executed entries are currently undergoing allocation and weight verification by our research team. Live portfolio tracking and rebalancing signals will activate automatically upon clearance.
                </p>
              </div>

              {/* Status SLA Pill */}
              <div className="glass-panel-data p-4 rounded-lg flex flex-col gap-1 min-w-[200px] border border-border shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Clearance SLA</span>
                <span className="text-sm font-semibold text-[hsl(var(--success))] font-mono">Within 24–48 Hours</span>
                <span className="text-[10px] font-mono text-muted-foreground">Real-time terminal auto-activation</span>
              </div>
            </div>

            {/* 4-Stage Interactive Clearance Pipeline */}
            <div className="mt-6 pt-2">
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
                Operational Clearance Pipeline:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="glass-panel-data p-3.5 rounded-md border border-[hsl(var(--success))/0.3] bg-[hsl(var(--success))/0.05]">
                  <div className="flex items-center gap-2 text-[hsl(var(--success))] text-xs font-semibold font-mono mb-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>1. Mandate Cleared</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">Subscription payment & advisory mandate recorded.</p>
                </div>

                <div className="glass-panel-data p-3.5 rounded-md border border-[hsl(var(--success))/0.3] bg-[hsl(var(--success))/0.05]">
                  <div className="flex items-center gap-2 text-[hsl(var(--success))] text-xs font-semibold font-mono mb-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>2. Holdings Logged</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">{userPortfolio?.stockCount || activeHoldings.length || 0} executed assets registered with entry prices.</p>
                </div>

                <div className="glass-panel-data p-3.5 rounded-md border border-amber-500/40 bg-amber-500/10">
                  <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold font-mono mb-1">
                    <Clock className="w-4 h-4 shrink-0 animate-spin" />
                    <span>3. Desk Factor Audit</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">Research analysts validating model weights & parity targets.</p>
                </div>

                <div className="glass-panel-data p-3.5 rounded-md border border-border bg-muted/20 opacity-70">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold font-mono mb-1">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>4. Terminal Live</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono">Unlocks verified allocation weights and rebalance feeds.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Submitted Holdings Registry Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 glass-panel p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Registered Execution Registry</h3>
                  <p className="text-[11px] font-mono text-muted-foreground">Snapshot of holdings undergoing desk clearance</p>
                </div>

                <Link
                  to={`/setup-portfolio?planId=${userPortfolio?.planId || ''}&portfolioId=${userPortfolio?.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-primary hover:bg-primary/10 border border-primary/20 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Revise Entries</span>
                </Link>
              </div>

              {activeHoldings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="text-[10px] uppercase text-muted-foreground border-b border-border">
                        <th className="pb-2">Ticker</th>
                        <th className="pb-2 text-right">Quantity</th>
                        <th className="pb-2 text-right">Avg Price</th>
                        <th className="pb-2 text-right">Capital Allocated</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {activeHoldings.map((h, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5">
                            <div className="font-semibold text-foreground">{h.symbol}</div>
                            <span className="text-[10px] text-muted-foreground">{h.companyName}</span>
                          </td>
                          <td className="py-2.5 text-right text-muted-foreground">{h.quantity}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{formatINR(h.buyPriceMinor)}</td>
                          <td className="py-2.5 text-right font-semibold text-foreground">{formatINR(h.quantity * h.buyPriceMinor)}</td>
                          <td className="py-2.5 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Reviewing
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground font-mono text-xs">
                  {userPortfolio?.stockCount || 0} Assets Registered • Total Capital: {formatINR(totalInvestedMinor)}
                </div>
              )}
            </div>

            {/* Summary & Support Desk */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass-panel p-6">
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-2">Committed Capital</span>
                <div className="text-2xl font-mono font-semibold text-foreground mb-4">
                  {formatINR(totalInvestedMinor)}
                </div>

                <div className="space-y-2.5 text-xs font-mono pt-3 border-t border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Strategy Basket</span>
                    <span className="text-foreground font-semibold">{userPortfolio?.planName}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Model Architecture</span>
                    <span className="text-foreground font-semibold">Factor Parity</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Registered Positions</span>
                    <span className="text-foreground font-semibold">{userPortfolio?.stockCount || activeHoldings.length} Assets</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-md glass-panel-data text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">
                  As soon as the research analyst verifies your entries in the Admin Desk, your portfolio factor breakdown and rebalancing signals will activate instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Metric Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Capital Deployed"
              value={formatINR(totalInvestedMinor)}
              icon={Wallet}
              delay={0.05}
              subtitle="Executed Principal"
              statusBadge="AUDITED"
            />
            <MetricCard
              title="Active Positions"
              value={`${activeHoldings.length} Assets`}
              icon={Layers}
              delay={0.1}
              subtitle="Holdings Monitored"
            />
            <MetricCard
              title="Strategy Mandate"
              value={userPortfolio?.planName || 'Quant Strategy'}
              icon={ShieldCheck}
              delay={0.15}
              subtitle="Institutional Model Basket"
            />
            <MetricCard
              title="Rebalance Cadence"
              value="Signal Driven"
              icon={Activity}
              delay={0.2}
              subtitle="Email & Terminal Feed"
            />
          </div>

          {/* Main Portfolio Allocation Breakdown & Strategy Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Holdings & Capital Registry */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-8 glass-panel p-6 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Active Execution Registry</h3>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Audited positions and capital allocation</p>
                </div>

                <Link
                  to="/portfolio"
                  className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                >
                  <span>Full Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {activeHoldings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                        <th className="pb-2.5">Asset Symbol</th>
                        <th className="pb-2.5 text-right">Quantity</th>
                        <th className="pb-2.5 text-right">Execution Price</th>
                        <th className="pb-2.5 text-right">Allocated Capital</th>
                        <th className="pb-2.5 text-right">Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {activeHoldings.map((stock, idx) => {
                        const stockAlloc = (stock as any).allocationPercent !== undefined 
                          ? (stock as any).allocationPercent 
                          : totalInvestedMinor > 0 
                            ? (((stock.quantity * stock.buyPriceMinor) / totalInvestedMinor) * 100).toFixed(1) 
                            : '0.0';
                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5">
                              <div className="font-semibold text-foreground">{stock.symbol}</div>
                              <span className="text-[10px] text-muted-foreground">{stock.companyName}</span>
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">{stock.quantity}</td>
                            <td className="py-2.5 text-right text-muted-foreground">{formatINR(stock.buyPriceMinor)}</td>
                            <td className="py-2.5 text-right font-semibold text-foreground">
                              {formatINR(stock.quantity * stock.buyPriceMinor)}
                            </td>
                            <td className="py-2.5 text-right">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary">
                                {stockAlloc}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground font-mono text-xs">
                  No active holdings registered yet.
                </div>
              )}
            </motion.div>

            {/* Strategy Status & Advisory Actions Card */}
            <div className="lg:col-span-4 space-y-4">
              {hasActiveAccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Active Strategy</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border border-[hsl(var(--success))/0.3]">
                      AUDITED
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground">{userPortfolio?.planName || 'Aggressive Alpha Tier'}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Multi-factor quantitative mandate with systematic risk parity and volatility limits.
                  </p>

                  <div className="mt-5 pt-4 border-t border-border space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Holdings Monitored</span>
                      <span className="font-semibold text-foreground">{activeHoldings.length} Assets</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Strategy Model</span>
                      <span className="font-semibold text-foreground">Quantitative Alpha</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Rebalance Cadence</span>
                      <span className="font-semibold text-primary">Signal Driven</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/portfolio')}
                    className="mt-5 w-full py-2 px-3 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                  >
                    <span>View Mandate Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-panel p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-primary">Advisory Entitlements</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                      INACTIVE
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-foreground">Unlock Quant Advisory</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Activate an algorithmic research tier to access factor rebalancing alerts and real-time execution signals.
                  </p>

                  <button
                    onClick={() => navigate('/plans')}
                    className="mt-5 w-full py-2 px-3 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Explore Advisory Plans</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}

              <div className="p-4 rounded-md glass-panel-data text-xs text-muted-foreground flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed font-mono">
                  Your assets remain 100% self-custodied in your broker account. Rebalance trade alerts are pushed directly to your terminal.
                </p>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
