import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useAuthStore } from '../stores/authStore';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Calendar, ArrowRight, AlertCircle, RefreshCw, Wallet, Layers, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';
import StrategySelector from '../components/StrategySelector';
import { formatINR } from '../utils/money';
import { formatDate, getDaysRemaining } from '../utils/datetime';
import { getTerminalTitle, getDefaultAdminRoute } from '../utils/rbac';

const COLORS = ['hsl(38 50% 60%)', 'hsl(216 55% 62%)', 'hsl(152 55% 46%)', 'hsl(280 40% 60%)', 'hsl(190 50% 50%)', 'hsl(222 10% 65%)', 'hsl(340 50% 55%)', 'hsl(160 40% 50%)'];

import NoActiveStrategyGate from '../components/NoActiveStrategyGate';
import { useAdvisoryAccess } from '../hooks/useAdvisoryAccess';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { userPortfolio, userPortfolios, valuation, isLoading: isPortLoading } = usePortfolioStore();
  const { hasAccess, isLoading: isAccessLoading } = useAdvisoryAccess();

  const isLoading = isPortLoading || isAccessLoading;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Portfolio Engine...</span>
      </div>
    );
  }

  const holdings = valuation?.holdings || [];
  const totalInvestedMinor = valuation?.totalInvestedMinor || userPortfolio?.totalInvestmentMinor || 0;

  const hasValidSubmittedHoldings = Boolean(
    userPortfolio && 
    ((userPortfolio.stockCount && userPortfolio.stockCount > 0) || holdings.length > 0) &&
    ((userPortfolio.totalInvestmentMinor && userPortfolio.totalInvestmentMinor > 0) || totalInvestedMinor > 0)
  );

  const isSetupRequired = Boolean(hasAccess && (!userPortfolio || !hasValidSubmittedHoldings));
  const isExpired = userPortfolio?.expiresAt ? Date.now() > userPortfolio.expiresAt : false;
  const isRejected = Boolean(userPortfolio?.status === 'rejected');
  const isPending = Boolean(userPortfolio?.status === 'pending' && hasValidSubmittedHoldings);

  if (!hasAccess && !userPortfolio && (!userPortfolios || userPortfolios.length === 0)) {
    return <NoActiveStrategyGate />;
  }

  // If user has an active mandate but hasn't submitted their stock holdings yet
  if (isSetupRequired) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-8">
        <div className="glass-panel p-8 sm:p-10 text-center shadow-xl relative overflow-hidden">
          <div className="w-14 h-14 bg-primary/10 border border-primary/25 text-primary rounded-md mx-auto flex items-center justify-center mb-5 shadow-sm">
            <Layers className="w-7 h-7 stroke-[2.2]" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[hsl(var(--success))/0.1] text-[hsl(var(--success))] text-[10px] font-mono uppercase tracking-wider mb-3 border border-[hsl(var(--success))/0.2]">
            <CheckCircle2 className="w-3 h-3" />
            <span>Advisory Mandate Active</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground mb-2">
            Action Required: Configure Your Strategy Portfolio
          </h2>
          <p className="text-xs text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed font-mono">
            Your quantitative research mandate is verified and active. You must submit your executed portfolio holdings to unlock real-time factor radar analytics, risk-parity weight monitoring, and live rebalancing signals.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <button
              onClick={() => navigate(userPortfolio ? `/setup-portfolio?planId=${userPortfolio.planId}&portfolioId=${userPortfolio.id}` : '/setup-portfolio')}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3 px-5 rounded-md font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Initialize Portfolio Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }


  // If the active selection is pending or rejected, render state with the StrategySelector still visible
  if (isRejected || isPending || isExpired) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        {/* Strategy selector always visible at top */}
        <StrategySelector showBanners={false} />

        <div className="p-6 max-w-2xl mx-auto pt-8">
          <div className="glass-panel p-8 sm:p-10 text-center shadow-xl">
            {isExpired ? (
              <>
                <div className="w-12 h-12 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">Subscription Expired</h3>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  Your quantitative strategy subscription for <span className="text-foreground font-semibold">{userPortfolio?.planName}</span> has expired. Renew your tier to re-enable live rebalancing signals and position monitoring.
                </p>
                <Link 
                  to="/plans" 
                  className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-md text-xs font-semibold shadow-sm transition-all"
                >
                  <span>Renew Research Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : isRejected ? (
              <>
                <div className="w-12 h-12 rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1.5">Mandate Revision Requested</h3>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Our quantitative analyst team requested revisions for your submitted holdings in <span className="text-foreground font-semibold">{userPortfolio?.planName}</span>.
                </p>

                {userPortfolio?.rejectionReason && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-6 text-left font-mono text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-destructive block mb-1">
                      Analyst Remarks
                    </span>
                    <p className="text-foreground">{userPortfolio.rejectionReason}</p>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/setup-portfolio?planId=${userPortfolio?.planId || ''}&portfolioId=${userPortfolio?.id}`)}
                  className="inline-flex items-center gap-2 bg-destructive hover:opacity-90 text-white px-5 py-2.5 rounded-md text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Update & Resubmit Holdings</span>
                </button>
              </>
            ) : (
              <div className="space-y-6 text-left">
                <div className="text-center pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Clearance in Progress: {userPortfolio?.planName}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed font-mono">
                    Your executed entries are currently undergoing factor integrity audit and weight-parity verification by our research team.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-md glass-panel-data text-xs font-mono font-medium text-amber-500 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Clearance SLA: 24–48 Hours</span>
                  </div>
                </div>

                {/* Submitted Holdings Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                      Registered Execution Entries
                    </span>
                    <button
                      onClick={() => navigate(`/setup-portfolio?planId=${userPortfolio?.planId || ''}&portfolioId=${userPortfolio?.id}`)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Revise Entries</span>
                    </button>
                  </div>

                  {valuation?.holdings && valuation.holdings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="text-[10px] uppercase text-muted-foreground border-b border-border">
                            <th className="pb-2">Ticker</th>
                            <th className="pb-2 text-right">Quantity</th>
                            <th className="pb-2 text-right">Execution Price</th>
                            <th className="pb-2 text-right">Capital Allocated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {valuation.holdings.map((h, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2.5">
                                <div className="font-semibold text-foreground">{h.symbol}</div>
                                <span className="text-[10px] text-muted-foreground block">{h.companyName}</span>
                              </td>
                              <td className="py-2.5 text-right text-muted-foreground">{h.quantity}</td>
                              <td className="py-2.5 text-right text-muted-foreground">{formatINR(h.buyPriceMinor)}</td>
                              <td className="py-2.5 text-right font-semibold text-foreground">{formatINR(h.quantity * h.buyPriceMinor)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-md glass-panel-data text-center font-mono text-xs text-muted-foreground">
                      {userPortfolio?.stockCount || 0} Assets Registered • Total: {formatINR(userPortfolio?.totalInvestmentMinor || 0)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-md glass-panel-data text-xs font-mono text-muted-foreground border border-border flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0 animate-ping" />
                  <p className="text-[11px] leading-relaxed">
                    Strategy weight allocation charts and dynamic rebalancing signals will unlock automatically once our desk clears your mandate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = userPortfolio?.expiresAt ? getDaysRemaining(userPortfolio.expiresAt) : 0;


  const allocationData = holdings.map((stock, i) => ({
    name: stock.symbol,
    value: stock.allocationPercent,
    allocatedMinor: stock.quantity * stock.buyPriceMinor,
    color: COLORS[i % COLORS.length]
  }));

  const { dbUser } = useAuthStore();
  const role = dbUser?.role || 'user';
  const terminalTitle = getTerminalTitle(role);
  const defaultAdminRoute = getDefaultAdminRoute(role);

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Active Mandate
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Audited & Cleared
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            {userPortfolio?.planName || 'Portfolio Mandate'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {terminalTitle && (
            <Link
              to={defaultAdminRoute}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md glass-panel text-xs font-mono font-semibold text-primary border border-primary/25 hover:bg-primary/10 transition-all shadow-xs"
              title={`Switch to ${terminalTitle}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{terminalTitle}</span>
            </Link>
          )}

          {userPortfolio?.expiresAt && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md glass-panel text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Mandate Validity: </span>
                <span className="font-semibold text-foreground">
                  {formatDate(userPortfolio.expiresAt)} ({daysRemaining}d remaining)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Plan Strategy Selector */}
      <StrategySelector showBanners={false} />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Total Capital Deployed</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1">
            {formatINR(totalInvestedMinor)}
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Executed Principal</span>
        </motion.div>
        
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Allocated Holdings</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1">
            {holdings.length} Assets
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Active Strategy Positions</span>
        </motion.div>
        
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Strategy Mandate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold tracking-tight text-foreground mt-1 truncate">
            {userPortfolio?.planName || 'Quant Alpha'}
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Institutional Model Basket</span>
        </motion.div>

        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Rebalance Cadence</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-semibold tracking-tight text-primary mt-1">
            Signal Driven
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Real-time alerts via Email & Terminal</span>
        </motion.div>
      </div>

      {/* Allocation Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Allocation Donut Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between"
        >
          <div className="mb-4 pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Factor Weight Distribution</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Asset allocation percentages by capital deployed</p>
          </div>
          
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '6px', 
                    border: '1px solid hsl(var(--glass-border))', 
                    backgroundColor: 'hsl(var(--card))', 
                    color: 'hsl(var(--card-foreground))', 
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: any, name: any) => [
                    `${value}% (${formatINR(allocationData.find(a => a.name === name)?.allocatedMinor || 0)})`, 
                    'Target Weight'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
            {allocationData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-muted/20">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-foreground truncate">{item.name}</span>
                </div>
                <span className="text-muted-foreground font-semibold shrink-0">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mandate Strategy Details Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="lg:col-span-7 glass-panel p-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Strategy Composition & Governance</h3>
                <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Quantitative equities advisory mandate parameters</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active Audit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-3.5 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Advisory Strategy</span>
                <span className="text-sm font-semibold text-foreground block">{userPortfolio?.planName || 'Institutional Quant'}</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">Factor parity & systematic risk weighting</span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Total Assets Monitored</span>
                <span className="text-sm font-semibold text-foreground block">{holdings.length} Positions</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">Rebalance triggers evaluated continuously</span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Execution Custody</span>
                <span className="text-sm font-semibold text-foreground block">Self-Custodied</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">Held directly in your verified broker account</span>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/20 border border-border">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">Advisory Entity</span>
                <span className="text-sm font-semibold text-foreground block">Arth Research</span>
                <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">Quantitative Research Advisory</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-xs font-mono text-muted-foreground flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              When our quantitative models trigger a rebalancing opportunity or position adjustment, you will receive an instantaneous alpha alert with exact target weights and rationale.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Holdings Table */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-panel-data p-5"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Active Position Ledger</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Audited holdings, execution prices, and allocated capital</p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {holdings.length} Active Positions
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="pb-2.5 px-3">Asset Symbol</th>
                <th className="pb-2.5 px-3 text-right">Quantity</th>
                <th className="pb-2.5 px-3 text-right">Avg Execution Price</th>
                <th className="pb-2.5 px-3 text-right">Allocated Capital</th>
                <th className="pb-2.5 px-3 text-right">Portfolio Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {holdings.map((stock, idx) => (
                <tr key={(stock.symbol || '') + idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-foreground text-sm">{stock.symbol}</div>
                    <span className="text-[10px] text-muted-foreground block">{stock.companyName}</span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-foreground">{stock.quantity}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">{formatINR(stock.buyPriceMinor)}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                    {formatINR(stock.quantity * stock.buyPriceMinor)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      {stock.allocationPercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
