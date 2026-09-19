// src/pages/admin/AdminContentHub.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { researchRepository } from '../../repositories/researchRepository';
import type { ResearchCall } from '../../schemas/research.schema';
import { useAuthStore } from '../../stores/authStore';
import { formatINR, toMinorUnits } from '../../utils/money';
import { formatDate } from '../../utils/datetime';
import AdminStockSearch from '../../components/AdminStockSearch';

export default function AdminContentHub() {
  const [calls, setCalls] = useState<ResearchCall[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  // New call form state
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [callType, setCallType] = useState<'BUY' | 'SELL' | 'HOLD' | 'ACCUMULATE'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<'INTRADAY' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'>('MEDIUM_TERM');
  const [planCategory] = useState('all');
  const [rationale, setRationale] = useState('');
  const [emailBroadcast, setEmailBroadcast] = useState(true);

  useEffect(() => {
    const unsub = researchRepository.subscribeToCalls((updatedCalls: ResearchCall[]) => {
      setCalls(updatedCalls);
    });
    return () => unsub();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !entryPrice || !targetPrice || !stopLoss || !rationale) {
      alert("Please fill in all required fields.");
      return;
    }

    const entryMinor = toMinorUnits(entryPrice);
    const targetMinor = toMinorUnits(targetPrice);
    const stopLossMinor = toMinorUnits(stopLoss);
    const upside = entryMinor > 0 ? parseFloat((((targetMinor - entryMinor) / entryMinor) * 100).toFixed(2)) : 0;

    setIsSubmitting(true);
    try {
      const callDocId = await researchRepository.publishCall({
        symbol: symbol.toUpperCase(),
        companyName: companyName || symbol.toUpperCase(),
        exchange: 'NSE',
        callType,
        entryPriceMinor: entryMinor,
        targetPriceMinor: targetMinor,
        stopLossMinor: stopLossMinor,
        timeHorizon,
        potentialUpsidePercent: upside,
        rationale,
        status: 'ACTIVE',
        planCategory,
        authorEmail: user?.email || 'analyst@arth.com'
      });

      // Broadcast Alpha Signal Email to ALL active subscribers
      if (emailBroadcast) {
        import('../../services/emailService').then(async ({ emailService }) => {
          import('../../repositories/subscriptionRepository').then(async ({ subscriptionRepository }) => {
            try {
              const allSubs = await subscriptionRepository.getAllSubscriptions();
              const now = Date.now();

              // Only email subscribers with active, non-expired subscriptions
              const activeSubscribers = allSubs.filter((sub: any) => {
                const isActive = sub.status === 'ACTIVE' || sub.status === 'active';
                const notExpired = sub.expiresAt
                  ? (typeof sub.expiresAt === 'number'
                    ? sub.expiresAt > now
                    : new Date(sub.expiresAt).getTime() > now)
                  : true;
                return isActive && notExpired && sub.userEmail;
              });

              const signalPayload = {
                ticker: symbol.toUpperCase(),
                companyName: companyName || symbol.toUpperCase(),
                action: (callType as any) || 'BUY',
                cmp: `₹${entryPrice}`,
                targetPrice: `₹${targetPrice}`,
                stopLoss: `₹${stopLoss}`,
                timeHorizon: timeHorizon.replace(/_/g, ' '),
                riskReward: `1 : ${(Math.abs(targetMinor - entryMinor) / Math.max(1, Math.abs(entryMinor - stopLossMinor))).toFixed(1)}`,
                signalId: typeof callDocId === 'string' ? callDocId.slice(0, 8).toUpperCase() : `SIG-${Date.now().toString().slice(-6)}`,
                catalyst: rationale,
                signalUrl: window.location.origin + '/dashboard'
              };

              const dispatches = activeSubscribers.map((sub: any) =>
                emailService.sendAlphaSignalEmail(sub.userEmail, {
                  ...signalPayload,
                  userName: sub.userName || 'Valued Investor',
                }).catch((e: Error) => console.warn(`[AdminContentHub] Signal email failed for ${sub.userEmail}:`, e))
              );

              await Promise.allSettled(dispatches);
              console.info(`[AdminContentHub] Alpha signal dispatched to ${activeSubscribers.length} active subscriber(s).`);
            } catch (broadcastErr) {
              console.warn('[AdminContentHub] Subscriber broadcast error:', broadcastErr);
            }
          });
        });
      }

      setIsModalOpen(false);
      setSymbol('');
      setCompanyName('');
      setEntryPrice('');
      setTargetPrice('');
      setStopLoss('');
      setRationale('');
      alert(`Research recommendation published and signal broadcast dispatched to active subscribers.`);
    } catch (err) {
      console.error('Failed to publish research call', err);
      alert('Error publishing research call.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (callId: string, status: ResearchCall['status']) => {
    await researchRepository.updateCallStatus(callId, status);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
              Signal Dispatch Desk
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Research & Quant Signals
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Broadcast high-conviction factor signals, price targets, stop loss triggers, and analytical theses.
          </p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Broadcast Research Call</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {calls.map((call) => (
          <motion.div 
            key={call.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold font-mono text-foreground">{call.symbol}</span>
                    <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded uppercase ${
                      call.callType === 'BUY' || call.callType === 'ACCUMULATE' 
                        ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' 
                        : 'bg-destructive/15 text-destructive'
                    }`}>
                      {call.callType}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{call.companyName}</span>
                </div>

                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                  call.status === 'ACTIVE' 
                    ? 'bg-primary/10 text-primary border-primary/30' 
                    : call.status === 'TARGET_ACHIEVED' 
                    ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border-[hsl(var(--success))/0.3]' 
                    : 'bg-muted text-muted-foreground border-border'
                }`}>
                  {call.status?.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-md glass-panel-data text-xs mb-3 font-mono">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Entry</span>
                  <span className="font-semibold text-foreground">{formatINR(call.entryPriceMinor)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Target</span>
                  <span className="font-semibold text-[hsl(var(--success))]">{formatINR(call.targetPriceMinor)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">SL</span>
                  <span className="font-semibold text-destructive">{formatINR(call.stopLossMinor)}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                {call.rationale}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between font-mono">
              <span className="text-[10px] text-muted-foreground">{formatDate(call.publishedAt)}</span>
              
              <select
                value={call.status}
                onChange={(e) => handleStatusChange(call.id, e.target.value as any)}
                className="bg-card border border-border text-[10px] font-mono rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ACTIVE">Active</option>
                <option value="TARGET_ACHIEVED">Target Met</option>
                <option value="STOPLOSS_TRIGGERED">SL Hit</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-card border border-border rounded-lg p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Broadcast Research Call</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePublish} className="mt-5 space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Search NSE Stock</label>
                  <AdminStockSearch
                    onSelect={(stock) => {
                      setSymbol(stock.symbol);
                      setCompanyName(stock.companyName);
                    }}
                  />
                  {symbol && (
                    <div className="mt-1 text-xs text-[hsl(var(--success))] font-mono font-medium">
                      Selected: {symbol} ({companyName})
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Recommendation Type</label>
                    <select
                      value={callType}
                      onChange={(e) => setCallType(e.target.value as any)}
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="BUY">BUY</option>
                      <option value="ACCUMULATE">ACCUMULATE</option>
                      <option value="HOLD">HOLD</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Time Horizon</label>
                    <select
                      value={timeHorizon}
                      onChange={(e) => setTimeHorizon(e.target.value as any)}
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="SHORT_TERM">Short Term (1-3 Mo)</option>
                      <option value="MEDIUM_TERM">Medium Term (3-6 Mo)</option>
                      <option value="LONG_TERM">Long Term (6-12 Mo)</option>
                      <option value="INTRADAY">Intraday</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Entry Price (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Target Price (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="e.g. 1750"
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">Stop Loss (₹)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="e.g. 1420"
                      className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-muted-foreground mb-1">Quantitative Rationale & Thesis</label>
                  <textarea
                    rows={3}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Document multi-factor momentum score, earnings breakout catalysts, and risk parameters..."
                    className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-primary/5 border border-primary/20">
                  <input
                    type="checkbox"
                    id="emailBroadcast"
                    checked={emailBroadcast}
                    onChange={(e) => setEmailBroadcast(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                  />
                  <label htmlFor="emailBroadcast" className="text-[11px] text-foreground font-sans cursor-pointer select-none">
                    Dispatch <strong>High-Conviction Alpha Signal</strong> email notification to subscribers
                  </label>
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="glass-panel hover:bg-muted/40 text-foreground px-4 py-2 rounded-md text-xs cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:opacity-90 text-primary-foreground font-semibold px-4 py-2 rounded-md text-xs shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? 'Publishing...' : 'Broadcast to Investors'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
