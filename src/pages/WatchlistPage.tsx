// src/pages/WatchlistPage.tsx
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Search, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Activity, 
  Calendar 
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { researchRepository } from '../repositories/researchRepository';
import type { ResearchCall } from '../schemas/research.schema';
import { formatINR } from '../utils/money';
import { formatDate } from '../utils/datetime';
import NoActiveStrategyGate from '../components/NoActiveStrategyGate';
import { useAdvisoryAccess } from '../hooks/useAdvisoryAccess';

type SignalStatusFilter = 'ALL' | 'ACTIVE' | 'TARGET_ACHIEVED' | 'STOPLOSS_TRIGGERED' | 'CLOSED';

export default function WatchlistPage() {
  const { hasAccess, isLoading: isAccessLoading } = useAdvisoryAccess();
  const [researchCalls, setResearchCalls] = useState<ResearchCall[]>([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SignalStatusFilter>('ALL');
  const [signalSearchQuery, setSignalSearchQuery] = useState('');

  // Subscribe to live research calls stream
  useEffect(() => {
    setIsLoadingSignals(true);
    const unsub = researchRepository.subscribeToCalls((calls: ResearchCall[]) => {
      setResearchCalls(calls);
      setIsLoadingSignals(false);
    });
    return () => unsub();
  }, []);

  // Filter research calls
  const filteredSignals = useMemo(() => {
    return researchCalls.filter(call => {
      if (statusFilter !== 'ALL' && call.status !== statusFilter) {
        return false;
      }
      if (signalSearchQuery.trim()) {
        const q = signalSearchQuery.toLowerCase();
        const matchesSymbol = call.symbol.toLowerCase().includes(q);
        const matchesCompany = call.companyName.toLowerCase().includes(q);
        const matchesRationale = call.rationale.toLowerCase().includes(q);
        return matchesSymbol || matchesCompany || matchesRationale;
      }
      return true;
    });
  }, [researchCalls, statusFilter, signalSearchQuery]);

  if (!isAccessLoading && !hasAccess) {
    return <NoActiveStrategyGate />;
  }

  const activeSignalsCount = researchCalls.filter(c => c.status === 'ACTIVE').length;
  const targetMetCount = researchCalls.filter(c => c.status === 'TARGET_ACHIEVED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-bold">
              Quantitative Advisory
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Signal Feed
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1.5">
            Research Signals & Quantitative Recommendations
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            High-conviction algorithmic alpha recommendations, target weights, risk boundaries, and rebalancing alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span className="bg-card border border-border px-3 py-1.5 rounded-md shadow-2xs">
            Published Signals: <strong className="text-foreground">{researchCalls.length}</strong>
          </span>
        </div>
      </div>

      {/* Top KPI Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Active Signals</span>
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-bold tracking-tight text-foreground mt-1">
            {activeSignalsCount}
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Live Mandates Under Monitoring</span>
        </motion.div>

        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Target Achieved</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
            {targetMetCount}
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Alpha Targets Successfully Hit</span>
        </motion.div>

        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Total Recommendations</span>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-bold tracking-tight text-foreground mt-1">
            {researchCalls.length}
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Institutional Dispatches</span>
        </motion.div>

        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">Advisory Protocol</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold tracking-tight text-foreground mt-1 truncate">
            Quantitative Advisory Desk
          </p>
          <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Multi-Factor Alpha Engine</span>
        </motion.div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'ALL', label: 'All Signals' },
            { id: 'ACTIVE', label: 'Active Calls' },
            { id: 'TARGET_ACHIEVED', label: 'Target Met' },
            { id: 'STOPLOSS_TRIGGERED', label: 'SL Triggered' },
            { id: 'CLOSED', label: 'Closed' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as SignalStatusFilter)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                  : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={signalSearchQuery}
            onChange={(e) => setSignalSearchQuery(e.target.value)}
            placeholder="Search ticker, thesis, company..."
            className="w-full bg-card border border-border pl-9 pr-3 py-1.5 rounded-md text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Signals Grid / Stream */}
      {isLoadingSignals ? (
        <div className="p-16 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-xs font-mono text-muted-foreground">Streaming Institutional Signals...</span>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Research Signals Found</h3>
          <p className="text-xs text-muted-foreground font-mono max-w-md mx-auto leading-relaxed">
            {signalSearchQuery.trim()
              ? `No research recommendations matched "${signalSearchQuery}".`
              : 'New algorithmic trade calls, target weights, entry levels, and stop-loss parameters will appear here instantly when published by the quantitative advisory desk.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSignals.map((call, idx) => {
            const upside = call.entryPriceMinor > 0 
              ? (((call.targetPriceMinor - call.entryPriceMinor) / call.entryPriceMinor) * 100).toFixed(1)
              : '0.0';
            const isBuy = call.callType === 'BUY' || call.callType === 'ACCUMULATE';
            const isTargetMet = call.status === 'TARGET_ACHIEVED';
            const isSLHit = call.status === 'STOPLOSS_TRIGGERED';

            return (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className="glass-panel p-5 flex flex-col justify-between border hover:border-primary/40 transition-all duration-200 shadow-2xs"
              >
                <div>
                  {/* Card Header: Ticker, Type, Status */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-mono text-foreground">{call.symbol}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          isBuy 
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                            : 'bg-destructive/15 text-destructive border border-destructive/30'
                        }`}>
                          {call.callType}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block truncate max-w-[180px] mt-0.5">
                        {call.companyName}
                      </span>
                    </div>

                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border font-semibold ${
                      call.status === 'ACTIVE'
                        ? 'bg-primary/10 text-primary border-primary/30 flex items-center gap-1'
                        : isTargetMet
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : isSLHit
                        ? 'bg-destructive/15 text-destructive border-destructive/30'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {call.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      {call.status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Financial Levels Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg glass-panel-data text-xs mb-3 font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Entry</span>
                      <span className="font-bold text-foreground">{formatINR(call.entryPriceMinor)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Target</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        {formatINR(call.targetPriceMinor)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Stop Loss</span>
                      <span className="font-bold text-destructive">{formatINR(call.stopLossMinor)}</span>
                    </div>
                  </div>

                  {/* Upside Badge & Time Horizon */}
                  <div className="flex items-center justify-between text-xs font-mono mb-3 px-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>+{upside}% Target Alpha</span>
                    </span>

                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border font-medium">
                      {call.timeHorizon?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Rationale Thesis */}
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 bg-muted/40 p-2.5 rounded border border-border">
                    {call.rationale}
                  </p>
                </div>

                {/* Footer Date & Mandate Stamp */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted-foreground/70" />
                    <span>{formatDate(call.publishedAt)}</span>
                  </div>
                  <span className="text-primary font-bold">Quantitative Mandate</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
