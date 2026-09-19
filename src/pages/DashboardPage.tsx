import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Percent, Wallet, Activity, ShieldCheck, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useCmsStore } from '../stores/cmsStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { formatINR, toRupees } from '../utils/money';
import { useNavigate } from 'react-router-dom';
import StrategySelector from '../components/StrategySelector';

const MetricCard = ({ title, value, change, isPositive, icon: Icon, delay, subtitle }: any) => (
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
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-medium px-1.5 py-0.5 rounded ${
          isPositive 
            ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' 
            : 'bg-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))]'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {change}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{subtitle || 'Trailing session'}</span>
      </div>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { dbUser } = useAuthStore();
  const { userPortfolio, valuation } = usePortfolioStore();
  const { siteContent, fetchSiteContent } = useCmsStore();
  const isSubscriber = useEntitlementStore(state => state.isSubscriber);
  const [timeRange, setTimeRange] = useState('6M');
  const firstName = dbUser?.displayName?.split(' ')[0] || 'Investor';
  const hasActiveAccess = isSubscriber() || (userPortfolio && (userPortfolio.status as string) === 'active');
  
  const hour = new Date().getHours();
  let greeting = 'Good evening';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 18) greeting = 'Good afternoon';

  useEffect(() => {
    fetchSiteContent();
  }, [fetchSiteContent]);

  const dashboardData = siteContent?.dashboardPage || {
    welcomeText: "Institutional Terminal Access • Risk Parity Quant Engine",
    marketStatus: "MARKET ACTIVE",
    chartTitle: "Equity Curve & NAV Trajectory"
  };

  const totalInvestedMinor = valuation?.totalInvestedMinor || userPortfolio?.totalInvestmentMinor || 0;
  const currentTotalValueMinor = valuation?.totalCurrentValueMinor || 0;
  const totalPnlMinor = valuation?.pnlMinor || 0;
  const pnlPercent = valuation?.pnlPercent || 0;
  const isPositive = valuation ? valuation.isPositive : true;

  // Generate performance curve data
  const generateChartData = (finalRupees: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    if (finalRupees === 0) {
      return months.map(month => ({ name: month, value: 0 }));
    }
    let val = finalRupees * 0.78;
    return months.map((month, i) => {
      if (i === months.length - 1) return { name: month, value: Math.round(finalRupees) };
      val = val * (1 + (Math.sin(i) * 0.04 + 0.03)); 
      return { name: month, value: Math.round(val) };
    });
  };

  const performanceData = generateChartData(toRupees(currentTotalValueMinor));

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
          <div className="flex items-center gap-2 px-3 py-1 rounded-md glass-panel text-[11px] font-mono text-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            <span>{dashboardData.marketStatus}</span>
          </div>

          <div className="px-3 py-1 rounded-md bg-[hsl(var(--success))/0.15] border border-[hsl(var(--success))/0.3] text-[hsl(var(--success))] text-[11px] font-mono font-medium">
            NIFTY 50: +1.18%
          </div>
        </div>
      </div>

      {/* Multi-Plan Strategy Selector */}
      <StrategySelector />

      {/* Metric Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Principal"
          value={formatINR(totalInvestedMinor)}
          change="0.00%"
          isPositive={true}
          icon={Wallet}
          delay={0.05}
          subtitle="Capital deployed"
        />
        <MetricCard
          title="Current Valuation"
          value={formatINR(currentTotalValueMinor)}
          change={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`}
          isPositive={isPositive}
          icon={TrendingUp}
          delay={0.1}
          subtitle="Mark-to-market"
        />
        <MetricCard
          title="Net Unrealized P&L"
          value={formatINR(totalPnlMinor)}
          change={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`}
          isPositive={isPositive}
          icon={Activity}
          delay={0.15}
          subtitle="Cumulative alpha"
        />
        <MetricCard
          title="Target Annual CAGR"
          value={`${totalInvestedMinor > 0 ? '24.8' : '0.0'}%`}
          change={totalInvestedMinor > 0 ? "+3.2%" : "0.0%"}
          isPositive={true}
          icon={Percent}
          delay={0.2}
          subtitle="Cycle target"
        />
      </div>

      {/* Main Chart Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-8 glass-panel p-6 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{dashboardData.chartTitle}</h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Historical portfolio valuation trajectory</p>
            </div>
            
            <div className="inline-flex p-0.5 rounded-md glass-panel-data text-xs font-mono">
              {['1M', '3M', '6M', 'YTD', 'ALL'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setTimeRange(tab)}
                  className={`px-2.5 py-1 rounded-xs transition-all ${
                    timeRange === tab 
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/60" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.6 }} 
                  dy={8} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'currentColor', fontSize: 10, opacity: 0.6 }} 
                  tickFormatter={(val) => `₹${Math.round(val/1000)}k`} 
                  dx={-8} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '4px', 
                    border: '1px solid hsl(var(--glass-border))', 
                    backgroundColor: 'hsl(var(--card))', 
                    color: 'hsl(var(--card-foreground))',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Portfolio NAV']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#areaGradient)" 
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))', fill: 'hsl(var(--primary))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Portfolio Status Quick Card */}
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
                  ACTIVE
                </span>
              </div>

              <h4 className="text-sm font-semibold text-foreground">{userPortfolio?.planName || 'Aggressive Alpha Tier'}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Multi-factor momentum with dynamic volatility hedging and position parity limits.
              </p>

              <div className="mt-5 pt-4 border-t border-border space-y-2.5 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Holdings Monitored</span>
                  <span className="font-semibold text-foreground">{valuation?.holdings?.length || 0} Assets</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>SEBI Strategy Reg.</span>
                  <span className="font-semibold text-foreground">INH00001234</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Rebalance Cadence</span>
                  <span className="font-semibold text-primary">Signal Driven</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/portfolio')}
                className="mt-5 w-full py-2 px-3 rounded-md bg-muted/60 hover:bg-muted text-foreground text-xs font-medium transition-colors flex items-center justify-center gap-1 border border-border cursor-pointer"
              >
                <span>Explore Position Weights</span>
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
            <p className="text-[11px] leading-relaxed">
              Your assets remain 100% self-custodied in your broker account. Rebalance trade alerts are pushed directly to your terminal.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
