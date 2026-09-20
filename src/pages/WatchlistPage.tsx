// src/pages/WatchlistPage.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  Layers, 
  Activity, 
  Calendar 
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { researchRepository } from '../repositories/researchRepository';
import type { ResearchCall } from '../schemas/research.schema';
import { instrumentRepository, DEFAULT_CANONICAL_INSTRUMENTS } from '../repositories/instrumentRepository';
import type { Instrument } from '../schemas/instrument.schema';
import { formatINR } from '../utils/money';
import { formatDate } from '../utils/datetime';
import { useEntitlementStore } from '../stores/entitlementStore';
import { FeatureKeys } from '../repositories/entitlementRepository';
import { Link } from 'react-router-dom';
import NoActiveStrategyGate from '../components/NoActiveStrategyGate';
import { useAdvisoryAccess } from '../hooks/useAdvisoryAccess';

interface WatchlistItem {
  id: string;
  instrumentId: string;
  symbol: string;
  companyName: string;
  exchange: string;
  sector: string;
}

type TabType = 'signals' | 'watchlist';
type SignalStatusFilter = 'ALL' | 'ACTIVE' | 'TARGET_ACHIEVED' | 'STOPLOSS_TRIGGERED' | 'CLOSED';

export default function WatchlistPage() {
  const { hasAccess, isLoading: isAccessLoading } = useAdvisoryAccess();
  const [activeTab, setActiveTab] = useState<TabType>('signals');
  const [researchCalls, setResearchCalls] = useState<ResearchCall[]>([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SignalStatusFilter>('ALL');
  const [signalSearchQuery, setSignalSearchQuery] = useState('');

  // Custom Watchlist State
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [watchlistSearchQuery, setWatchlistSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Instrument[]>([]);
  const { hasEntitlement } = useEntitlementStore();

  const canAddCustom = hasEntitlement(FeatureKeys.CUSTOM_WATCHLIST);

  // Subscribe to live research calls stream
  useEffect(() => {
    setIsLoadingSignals(true);
    const unsub = researchRepository.subscribeToCalls((calls: ResearchCall[]) => {
      setResearchCalls(calls);
      setIsLoadingSignals(false);
    });
    return () => unsub();
  }, []);

  // Initialize canonical watchlist instruments
  useEffect(() => {
    const initialItems: WatchlistItem[] = DEFAULT_CANONICAL_INSTRUMENTS.slice(0, 6).map((inst) => ({
      id: inst.id,
      instrumentId: inst.id,
      symbol: inst.symbol,
      companyName: inst.companyName,
      exchange: inst.exchange,
      sector: inst.sector
    }));
    setWatchlist(initialItems);
  }, []);

  const handleWatchlistSearch = async (query: string) => {
    setWatchlistSearchQuery(query);
    if (query.trim().length >= 1) {
      const results = await instrumentRepository.searchInstruments(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddWatchlistSymbol = (inst: Instrument) => {
    if (watchlist.some(w => w.symbol === inst.symbol)) {
      alert(`${inst.symbol} is already in your active watchlist.`);
      return;
    }

    const newItem: WatchlistItem = {
      id: inst.id,
      instrumentId: inst.id,
      symbol: inst.symbol,
      companyName: inst.companyName,
      exchange: inst.exchange,
      sector: inst.sector
    };

    setWatchlist([newItem, ...watchlist]);
    setIsWatchlistModalOpen(false);
    setWatchlistSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveWatchlistItem = (id: string) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
  };

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
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Quantitative Advisory
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Signal Telemetry
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Research Signals & Market Intelligence
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            High-conviction algorithmic alpha calls, target weights, risk boundaries, and custom stock tracking.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-card border border-border self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'signals'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Research Signals</span>
            {activeSignalsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'signals' 
                  ? 'bg-primary-foreground/20 text-primary-foreground' 
                  : 'bg-primary/10 text-primary'
              }`}>
                {activeSignalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'watchlist'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Watchlist</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'watchlist' 
                ? 'bg-primary-foreground/20 text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {watchlist.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: RESEARCH SIGNALS FEED */}
      {activeTab === 'signals' && (
        <div className="space-y-6">
          
          {/* Top KPI Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Active Signals</span>
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1">
                {activeSignalsCount}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Live Monitoring</span>
            </motion.div>

            <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-panel p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Target Achieved</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-emerald-500 mt-1">
                {targetMetCount}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Alpha Targets Hit</span>
            </motion.div>

            <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Total Dispatched</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1">
                {researchCalls.length}
              </p>
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Published Recommendations</span>
            </motion.div>

            <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-panel p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Research Desk</span>
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-semibold tracking-tight text-foreground mt-1 truncate">
                Quantitative Equities Desk
              </p>
              <span className="text-[10px] font-mono text-muted-foreground mt-1 block">Factor Alpha Engine</span>
            </motion.div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {[
                { id: 'ALL', label: 'All Calls' },
                { id: 'ACTIVE', label: 'Active Signals' },
                { id: 'TARGET_ACHIEVED', label: 'Target Met' },
                { id: 'STOPLOSS_TRIGGERED', label: 'SL Hit' },
                { id: 'CLOSED', label: 'Closed' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as SignalStatusFilter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={signalSearchQuery}
                onChange={(e) => setSignalSearchQuery(e.target.value)}
                placeholder="Search symbol, thesis, company..."
                className="w-full bg-card border border-border pl-9 pr-3 py-1.5 rounded-md text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Signals Grid / Stream */}
          {isLoadingSignals ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="text-xs font-mono text-muted-foreground">Streaming Institutional Signals...</span>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="glass-panel p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No Research Signals Found</h3>
              <p className="text-xs text-muted-foreground font-mono max-w-md mx-auto leading-relaxed">
                {signalSearchQuery.trim()
                  ? `No research recommendations matched "${signalSearchQuery}".`
                  : 'New algorithmic trade calls, target weights, and stop-loss levels will appear here instantly when published by our quantitative research desk.'}
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
                    className="glass-panel p-5 flex flex-col justify-between border hover:border-primary/40 transition-all duration-200"
                  >
                    <div>
                      {/* Card Header: Ticker, Type, Status */}
                      <div className="flex items-start justify-between mb-3 pb-3 border-b border-border">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold font-mono text-foreground">{call.symbol}</span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              isBuy 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                                : 'bg-destructive/15 text-destructive border border-destructive/30'
                            }`}>
                              {call.callType}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">
                            {call.companyName}
                          </span>
                        </div>

                        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                          call.status === 'ACTIVE'
                            ? 'bg-primary/10 text-primary border-primary/30 flex items-center gap-1 font-semibold'
                            : isTargetMet
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold'
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
                          <span className="text-[10px] text-muted-foreground uppercase block">Entry</span>
                          <span className="font-semibold text-foreground">{formatINR(call.entryPriceMinor)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">Target</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            {formatINR(call.targetPriceMinor)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase block">Stop Loss</span>
                          <span className="font-semibold text-destructive">{formatINR(call.stopLossMinor)}</span>
                        </div>
                      </div>

                      {/* Upside Badge & Time Horizon */}
                      <div className="flex items-center justify-between text-xs font-mono mb-3 px-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>+{upside}% Potential Alpha</span>
                        </span>

                        <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border">
                          {call.timeHorizon?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Rationale Thesis */}
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 bg-muted/20 p-2.5 rounded border border-border/60">
                        {call.rationale}
                      </p>
                    </div>

                    {/* Footer Date & Author */}
                    <div className="pt-3 border-t border-border flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground/70" />
                        <span>{formatDate(call.publishedAt)}</span>
                      </div>
                      <span className="text-primary font-medium">Verified RA Mandate</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM STOCK WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Custom Equities Watchlist</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">Monitor custom NSE factor candidates and institutional tickers.</p>
            </div>

            {canAddCustom ? (
              <button 
                onClick={() => setIsWatchlistModalOpen(true)}
                className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Instrument</span>
              </button>
            ) : (
              <Link
                to="/plans"
                className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto font-mono"
              >
                <span>Upgrade for Unlimited Custom Tickers</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel-data p-5"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left whitespace-nowrap font-mono">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2.5 px-3">Symbol & Exchange</th>
                    <th className="pb-2.5 px-3">Company Name</th>
                    <th className="pb-2.5 px-3">Sector</th>
                    <th className="pb-2.5 px-3 text-center">Status</th>
                    <th className="pb-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {watchlist.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{item.symbol}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded glass-panel-data text-muted-foreground">
                            {item.exchange}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{item.companyName}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-muted/50 border border-border">
                          {item.sector}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Tracked
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button 
                          onClick={() => handleRemoveWatchlistItem(item.id)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {watchlist.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground">
                        No active symbols in watchlist. Use "Add Instrument" to search NSE equities.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Symbol Modal */}
      <AnimatePresence>
        {isWatchlistModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-panel p-6 shadow-2xl relative font-mono"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Search NSE Instruments</h3>
                <button 
                  onClick={() => setIsWatchlistModalOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={watchlistSearchQuery}
                  onChange={(e) => handleWatchlistSearch(e.target.value)}
                  placeholder="Search by Ticker or Company name (e.g. RELIANCE, TCS)..."
                  className="w-full glass-panel-data pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>

              <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-border/60">
                {searchResults.map((inst) => (
                  <div
                    key={inst.id}
                    onClick={() => handleAddWatchlistSymbol(inst)}
                    className="p-2.5 hover:bg-muted/40 rounded cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-xs text-foreground">{inst.symbol}</span>
                      <span className="text-[10px] text-muted-foreground block">{inst.companyName}</span>
                    </div>
                    <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                      {inst.sector}
                    </span>
                  </div>
                ))}
                {watchlistSearchQuery.trim().length > 0 && searchResults.length === 0 && (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No matching instruments found for "{watchlistSearchQuery}".
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
