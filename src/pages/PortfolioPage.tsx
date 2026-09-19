import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { usePortfolioStore } from '../stores/portfolioStore';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, Calendar, ArrowRight, ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw } from 'lucide-react';
import StrategySelector from '../components/StrategySelector';
import { formatINR, toRupees } from '../utils/money';
import { formatDate, getDaysRemaining } from '../utils/datetime';

const COLORS = ['hsl(38 50% 60%)', 'hsl(216 55% 62%)', 'hsl(152 55% 46%)', 'hsl(280 40% 60%)', 'hsl(190 50% 50%)', 'hsl(222 10% 65%)'];

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { userPortfolio, userPortfolios, valuation, isLoading } = usePortfolioStore();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Portfolio Engine...</span>
      </div>
    );
  }

  if (!userPortfolio && (!userPortfolios || userPortfolios.length === 0)) {
    return (
      <div className="space-y-6 max-w-xl mx-auto py-8">
        <div className="glass-panel p-8 sm:p-10 text-center shadow-xl">
          <div className="w-12 h-12 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1.5">No Active Advisory Strategy</h3>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            You haven't subscribed to an algorithmic quant advisory plan yet. Browse available strategies to begin.
          </p>
          <Link 
            to="/plans" 
            className="inline-flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-md text-xs font-semibold shadow-sm transition-all"
          >
            <span>Explore Research Plans</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = userPortfolio?.expiresAt ? Date.now() > userPortfolio.expiresAt : false;
  const isRejected = userPortfolio?.status === 'rejected';
  const isPending = userPortfolio?.status === 'pending';

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
                            <th className="pb-2 text-right">Avg Price</th>
                            <th className="pb-2 text-right">Total Capital</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {valuation.holdings.map((h, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                              <td className="py-2 font-semibold text-foreground">{h.symbol}</td>
                              <td className="py-2 text-right text-muted-foreground">{h.quantity}</td>
                              <td className="py-2 text-right text-muted-foreground">{formatINR(h.buyPriceMinor)}</td>
                              <td className="py-2 text-right font-semibold text-foreground">{formatINR(h.quantity * h.buyPriceMinor)}</td>
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
                    Live telemetry, dynamic rebalancing triggers, and sector weight charts will unlock automatically once our desk clears your mandate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const holdings = valuation?.holdings || [];
  const totalInvestedMinor = valuation?.totalInvestedMinor || userPortfolio?.totalInvestmentMinor || 0;
  const currentTotalValueMinor = valuation?.totalCurrentValueMinor || 0;
  const totalPnlMinor = valuation?.pnlMinor || 0;
  const pnlPercent = valuation?.pnlPercent || 0;
  const isProfitable = valuation ? valuation.isPositive : true;
  const daysRemaining = userPortfolio?.expiresAt ? getDaysRemaining(userPortfolio.expiresAt) : 0;

  const allocationData = holdings.map((stock, i) => ({
    name: stock.symbol,
    value: stock.allocationPercent,
    color: COLORS[i % COLORS.length]
  }));

  // Historical trajectory
  const historicalData = Array.from({ length: 7 }).map((_, i) => ({
    day: `D-${7 - i}`,
    value: toRupees(totalInvestedMinor) + (toRupees(totalPnlMinor) * (i / 6))
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Active Mandate
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            {userPortfolio?.planName || 'Portfolio Mandate'}
          </h1>
        </div>

        {userPortfolio?.expiresAt && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md glass-panel text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <div>
              <span className="text-muted-foreground">Expires: </span>
              <span className="font-semibold text-foreground">
                {formatDate(userPortfolio.expiresAt)} ({daysRemaining}d left)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Plan Strategy Selector */}
      <StrategySelector showBanners={false} />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Total Capital Cost</span>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1.5">{formatINR(totalInvestedMinor)}</p>
        </motion.div>
        
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-panel p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Mark-to-Market Valuation</span>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1.5">{formatINR(currentTotalValueMinor)}</p>
        </motion.div>
        
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Net Return on Capital</span>
          <div className="flex items-center gap-3 mt-1.5">
            <p className={`text-2xl font-mono tabular-nums font-semibold tracking-tight ${isProfitable ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'}`}>
              {isProfitable ? '+' : ''}{formatINR(totalPnlMinor)}
            </p>
            <span className={`inline-flex items-center text-xs font-mono tabular-nums font-semibold px-1.5 py-0.5 rounded ${
              isProfitable 
                ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' 
                : 'bg-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))]'
            }`}>
              {isProfitable ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(pnlPercent).toFixed(2)}%
            </span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Trajectory */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-8 glass-panel p-6"
        >
          <div className="mb-5 pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Trailing NAV Performance</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Mark-to-market performance curve</p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/60" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.6 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.6 }} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '4px', 
                    border: '1px solid hsl(var(--glass-border))', 
                    backgroundColor: 'hsl(var(--card))', 
                    color: 'hsl(var(--card-foreground))', 
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'NAV']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={isProfitable ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} 
                  strokeWidth={2} 
                  dot={{ strokeWidth: 1.5, r: 3, fill: 'hsl(var(--background))' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Allocation Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 glass-panel p-6 flex flex-col justify-between"
        >
          <div className="mb-4 pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Factor Weight Distribution</h3>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Asset allocation weights</p>
          </div>
          
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ 
                    borderRadius: '4px', 
                    border: '1px solid hsl(var(--glass-border))', 
                    backgroundColor: 'hsl(var(--card))', 
                    color: 'hsl(var(--card-foreground))', 
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: any) => [`${value}%`, 'Target Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
            {allocationData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: item.color }} />
                <span>{item.name}: {item.value}%</span>
              </div>
            ))}
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
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Real-time valuation and individual position P&L</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="pb-2.5 px-3">Asset Symbol</th>
                <th className="pb-2.5 px-3 text-right">Quantity</th>
                <th className="pb-2.5 px-3 text-right">Avg Price</th>
                <th className="pb-2.5 px-3 text-right">CMP</th>
                <th className="pb-2.5 px-3 text-right">Position Value</th>
                <th className="pb-2.5 px-3 text-right">Weight</th>
                <th className="pb-2.5 px-3 text-right">Unrealized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {holdings.map((stock, idx) => (
                <tr key={(stock.symbol || '') + idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-foreground">{stock.symbol}</div>
                    <span className="text-[10px] text-muted-foreground block">{stock.companyName}</span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-foreground">{stock.quantity}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">{formatINR(stock.buyPriceMinor)}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                    {formatINR(stock.currentPriceMinor)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                    {formatINR(stock.currentValueMinor)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-muted-foreground">
                    {stock.allocationPercent}%
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold">
                    <div className="flex items-center justify-end gap-2">
                      <span className={stock.isPositive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]'}>
                        {stock.isPositive ? '+' : ''}{formatINR(stock.pnlMinor)}
                      </span>
                      <span className={`text-[10px] px-1 py-0.5 rounded ${
                        stock.isPositive 
                          ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' 
                          : 'bg-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))]'
                      }`}>
                        {stock.isPositive ? '+' : ''}{stock.pnlPercent.toFixed(1)}%
                      </span>
                    </div>
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
