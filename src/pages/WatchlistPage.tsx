import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { instrumentRepository, DEFAULT_CANONICAL_INSTRUMENTS } from '../repositories/instrumentRepository';
import type { Instrument } from '../schemas/instrument.schema';
import { formatINR } from '../utils/money';
import { useEntitlementStore } from '../stores/entitlementStore';
import { FeatureKeys } from '../repositories/entitlementRepository';
import { Link } from 'react-router-dom';

interface WatchlistItem {
  id: string;
  instrumentId: string;
  symbol: string;
  companyName: string;
  exchange: string;
  sector: string;
  ltpMinor: number;
  changePercent: number;
  isPositive: boolean;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Instrument[]>([]);
  const { hasEntitlement } = useEntitlementStore();

  const canAddCustom = hasEntitlement(FeatureKeys.CUSTOM_WATCHLIST);

  useEffect(() => {
    // Initialize watchlist from default canonical stocks
    const initialItems: WatchlistItem[] = DEFAULT_CANONICAL_INSTRUMENTS.slice(0, 6).map((inst, i) => {
      const mockPrices = [284500, 395000, 153200, 178000, 112000, 134000];
      const mockChanges = [1.45, -0.85, 2.10, -1.15, 0.65, 3.20];
      const change = mockChanges[i % mockChanges.length];
      return {
        id: inst.id,
        instrumentId: inst.id,
        symbol: inst.symbol,
        companyName: inst.companyName,
        exchange: inst.exchange,
        sector: inst.sector,
        ltpMinor: mockPrices[i % mockPrices.length],
        changePercent: Math.abs(change),
        isPositive: change >= 0
      };
    });
    setWatchlist(initialItems);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 1) {
      const results = await instrumentRepository.searchInstruments(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleAddSymbol = (inst: Instrument) => {
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
      sector: inst.sector,
      ltpMinor: 150000,
      changePercent: 1.25,
      isPositive: true
    };

    setWatchlist([newItem, ...watchlist]);
    setIsModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemove = (id: string) => {
    setWatchlist(watchlist.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Market Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Quant Screening Watchlist
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Live monitoring of NSE factor candidates and institutional liquidity pools.</p>
        </div>
        
        {canAddCustom ? (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Instrument</span>
          </button>
        ) : (
          <Link
            to="/plans"
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Upgrade for Custom Signals</span>
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
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="pb-2.5 px-3">Symbol & Exchange</th>
                <th className="pb-2.5 px-3">Company Name</th>
                <th className="pb-2.5 px-3">Sector</th>
                <th className="pb-2.5 px-3 text-right">LTP</th>
                <th className="pb-2.5 px-3 text-right">24h Delta</th>
                <th className="pb-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {watchlist.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{item.symbol}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded glass-panel-data text-muted-foreground">
                        {item.exchange}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">{item.companyName}</td>
                  <td className="py-3 px-3">
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50 border border-border">
                      {item.sector}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                    {formatINR(item.ltpMinor)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
                      item.isPositive 
                        ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' 
                        : 'bg-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))]'
                    }`}>
                      {item.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {item.isPositive ? '+' : '-'}{item.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {watchlist.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-muted-foreground font-mono">
                    No active symbols in watchlist. Use "Add Instrument" to search NSE equities.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Symbol Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-panel p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Search NSE Instruments</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by Ticker or Company name (e.g. RELIANCE, TCS)..."
                  className="w-full glass-panel-data pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  autoFocus
                />
              </div>

              <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-border/60">
                {searchResults.map((inst) => (
                  <div
                    key={inst.id}
                    onClick={() => handleAddSymbol(inst)}
                    className="p-2.5 hover:bg-muted/40 rounded cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-semibold text-xs text-foreground">{inst.symbol}</span>
                      <span className="text-[10px] text-muted-foreground block">{inst.companyName}</span>
                    </div>
                    <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                      {inst.sector}
                    </span>
                  </div>
                ))}
                {searchQuery.trim().length > 0 && searchResults.length === 0 && (
                  <div className="py-6 text-center text-xs font-mono text-muted-foreground">
                    No matching instruments found for "{searchQuery}".
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
