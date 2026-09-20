// src/pages/admin/AdminContentHub.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Users, 
  Layers, 
  Send, 
  Check, 
  Search, 
  BellRing,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { researchRepository } from '../../repositories/researchRepository';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { notificationRepository } from '../../repositories/notificationRepository';
import { usePlanStore } from '../../stores/planStore';
import type { ResearchCall } from '../../schemas/research.schema';
import type { Subscription } from '../../types/models';
import { useAuthStore } from '../../stores/authStore';
import { formatINR, toMinorUnits } from '../../utils/money';
import { formatDate } from '../../utils/datetime';
import AdminStockSearch from '../../components/AdminStockSearch';
import { emailService } from '../../services/emailService';

export default function AdminContentHub() {
  const [calls, setCalls] = useState<ResearchCall[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();

  // Active Subscriptions for targeting
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [userSearchFilter, setUserSearchFilter] = useState('');

  // Form State
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [callType, setCallType] = useState<'BUY' | 'SELL' | 'HOLD' | 'ACCUMULATE'>('BUY');
  const [entryPrice, setEntryPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<'INTRADAY' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'>('MEDIUM_TERM');
  const [rationale, setRationale] = useState('');
  
  // Notification & Broadcast Targeting State
  const [audienceType, setAudienceType] = useState<'all' | 'plans' | 'users'>('all');
  const [selectedPlanNames, setSelectedPlanNames] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [emailBroadcast, setEmailBroadcast] = useState(true);
  const [inAppAlert, setInAppAlert] = useState(true);

  // Status Message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPlans();
    const unsub = researchRepository.subscribeToCalls((updatedCalls: ResearchCall[]) => {
      setCalls(updatedCalls);
    });
    return () => unsub();
  }, [fetchPlans]);

  // Load subscriptions when modal opens
  useEffect(() => {
    if (isModalOpen) {
      subscriptionRepository.getAllSubscriptions().then(subs => {
        const now = Date.now();
        // Filter strictly valid active subscriptions
        const active = subs.filter(s => {
          const isActive = s.status === 'ACTIVE' || s.status === 'active';
          const notExpired = s.expiresAt
            ? (typeof s.expiresAt === 'number'
              ? s.expiresAt > now
              : new Date(s.expiresAt).getTime() > now)
            : true;
          return isActive && notExpired;
        });
        setAllSubscriptions(active);
      }).catch(err => {
        console.warn("[AdminContentHub] Failed to fetch subscriptions:", err);
      });
    }
  }, [isModalOpen]);

  // Deduplicated unique active subscriber profiles
  const uniqueActiveSubscribers = useMemo(() => {
    const map = new Map<string, { userId: string; userName: string; userEmail: string; plans: string[] }>();
    allSubscriptions.forEach(sub => {
      if (!sub.userId) return;
      const existing = map.get(sub.userId);
      const planTitle = sub.planName || 'Advisory Plan';
      if (existing) {
        if (!existing.plans.includes(planTitle)) {
          existing.plans.push(planTitle);
        }
      } else {
        map.set(sub.userId, {
          userId: sub.userId,
          userName: sub.userName || 'Investor',
          userEmail: sub.userEmail || '',
          plans: [planTitle]
        });
      }
    });
    return Array.from(map.values());
  }, [allSubscriptions]);

  // Distinct plan names available across current catalog and subscriptions
  const availablePlanNames = useMemo(() => {
    const set = new Set<string>();
    plans.forEach(p => set.add(p.name));
    allSubscriptions.forEach(s => {
      if (s.planName) set.add(s.planName);
    });
    return Array.from(set);
  }, [plans, allSubscriptions]);

  // Compute resolved target recipients based on current audience configuration
  const targetRecipients = useMemo(() => {
    if (audienceType === 'all') {
      return uniqueActiveSubscribers;
    }
    if (audienceType === 'plans') {
      if (selectedPlanNames.length === 0) return [];
      return uniqueActiveSubscribers.filter(sub => 
        sub.plans.some(p => selectedPlanNames.includes(p))
      );
    }
    if (audienceType === 'users') {
      return uniqueActiveSubscribers.filter(sub => selectedUserIds.includes(sub.userId));
    }
    return [];
  }, [audienceType, selectedPlanNames, selectedUserIds, uniqueActiveSubscribers]);

  const togglePlanSelection = (planName: string) => {
    setSelectedPlanNames(prev => 
      prev.includes(planName) ? prev.filter(p => p !== planName) : [...prev, planName]
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) {
      setStatusMessage({ type: 'error', text: 'Please specify a valid stock ticker symbol.' });
      return;
    }

    const entryNum = parseFloat(entryPrice) || 0;
    const targetNum = parseFloat(targetPrice) || 0;
    const slNum = parseFloat(stopLoss) || 0;

    const entryMinor = entryNum > 0 ? toMinorUnits(entryNum) : 0;
    const targetMinor = targetNum > 0 ? toMinorUnits(targetNum) : 0;
    const stopLossMinor = slNum > 0 ? toMinorUnits(slNum) : 0;
    const upside = (entryMinor > 0 && targetMinor > entryMinor)
      ? parseFloat((((targetMinor - entryMinor) / entryMinor) * 100).toFixed(2)) 
      : 0;

    const finalRationale = rationale.trim() || 'Algorithmic momentum breakdown & quantitative factor allocation.';

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      // 1. Publish Signal to Firestore
      const callDocId = await researchRepository.publishCall({
        symbol: symbol.trim().toUpperCase(),
        companyName: companyName.trim() || symbol.trim().toUpperCase(),
        exchange: 'NSE',
        callType,
        entryPriceMinor: entryMinor,
        targetPriceMinor: targetMinor,
        stopLossMinor: stopLossMinor,
        timeHorizon,
        potentialUpsidePercent: upside,
        rationale: finalRationale,
        status: 'ACTIVE',
        planCategory: audienceType === 'plans' && selectedPlanNames.length === 1 ? selectedPlanNames[0] : 'all',
        targetAudienceType: audienceType,
        targetPlanNames: audienceType === 'plans' ? selectedPlanNames : [],
        targetUserIds: audienceType === 'users' ? selectedUserIds : [],
        authorEmail: user?.email || 'analyst@arth.com'
      });

      const recipients = targetRecipients;

      // 2. Dispatch In-App Alert Notifications to Targeted Recipients
      if (inAppAlert && recipients.length > 0) {
        const inAppPromises = recipients.map(sub => 
          notificationRepository.createNotification({
            userId: sub.userId,
            title: `🚨 New Alpha Signal: ${symbol.toUpperCase()} (${callType})`,
            message: `Quantitative research recommendation published for ${companyName || symbol.toUpperCase()}. ${entryNum > 0 ? `Entry: ₹${entryPrice}` : 'Entry: CMP'} | Target: ${targetNum > 0 ? `₹${targetPrice}` : 'Open Target'} | SL: ${slNum > 0 ? `₹${stopLoss}` : 'Trailing SL'}.`,
            type: 'research',
            metadata: {
              signalId: callDocId,
              symbol: symbol.toUpperCase(),
              callType,
              entryPrice: entryNum > 0 ? entryPrice : 'CMP',
              targetPrice: targetNum > 0 ? targetPrice : 'Open',
              stopLoss: slNum > 0 ? stopLoss : 'Trailing'
            }
          }).catch(err => console.warn(`[AdminContentHub] In-App alert failed for ${sub.userId}:`, err))
        );
        await Promise.allSettled(inAppPromises);
      }

      // 3. Dispatch High-Conviction Alpha Signal Email to Targeted Recipients
      if (emailBroadcast && recipients.length > 0) {
        const signalPayload = {
          ticker: symbol.toUpperCase(),
          companyName: companyName || symbol.toUpperCase(),
          action: (callType as any) || 'BUY',
          cmp: entryNum > 0 ? `₹${entryPrice}` : 'Current Market Price (CMP)',
          targetPrice: targetNum > 0 ? `₹${targetPrice}` : 'Open Horizon Target',
          stopLoss: slNum > 0 ? `₹${stopLoss}` : 'Dynamic Trailing Stop Loss',
          timeHorizon: timeHorizon.replace(/_/g, ' '),
          riskReward: entryMinor > 0 && targetMinor > 0 && stopLossMinor > 0
            ? `1 : ${(Math.abs(targetMinor - entryMinor) / Math.max(1, Math.abs(entryMinor - stopLossMinor))).toFixed(1)}`
            : 'Asymmetric Multi-Factor Setup',
          signalId: typeof callDocId === 'string' ? callDocId.slice(0, 8).toUpperCase() : `SIG-${Date.now().toString().slice(-6)}`,
          catalyst: finalRationale,
          signalUrl: `${window.location.origin}/watchlist`
        };

        const emailPromises = recipients
          .filter(sub => Boolean(sub.userEmail))
          .map(sub =>
            emailService.sendAlphaSignalEmail(sub.userEmail, {
              ...signalPayload,
              userName: sub.userName || 'Valued Investor'
            }).catch(err => console.warn(`[AdminContentHub] Signal email failed for ${sub.userEmail}:`, err))
          );

        await Promise.allSettled(emailPromises);
      }

      // Reset form and close
      setIsModalOpen(false);
      setSymbol('');
      setCompanyName('');
      setEntryPrice('');
      setTargetPrice('');
      setStopLoss('');
      setRationale('');
      setSelectedPlanNames([]);
      setSelectedUserIds([]);
      setAudienceType('all');
      alert(`Research recommendation published! Dispatched to ${recipients.length} subscriber(s) via in-app alert & email.`);
    } catch (err: any) {
      console.error('Failed to publish research call:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error publishing research call.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (callId: string, status: ResearchCall['status']) => {
    await researchRepository.updateCallStatus(callId, status);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
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
          onClick={() => {
            setIsModalOpen(true);
            setStatusMessage(null);
          }}
          className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer font-sans"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Broadcast Research Call</span>
        </button>
      </div>

      {/* Signals Grid */}
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
                  <span className="text-[11px] text-muted-foreground">{call.companyName || call.symbol}</span>
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
                  <span className="font-semibold text-foreground">
                    {call.entryPriceMinor > 0 ? formatINR(call.entryPriceMinor) : 'CMP'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Target</span>
                  <span className="font-semibold text-[hsl(var(--success))]">
                    {call.targetPriceMinor > 0 ? formatINR(call.targetPriceMinor) : 'Open'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">SL</span>
                  <span className="font-semibold text-destructive">
                    {call.stopLossMinor > 0 ? formatINR(call.stopLossMinor) : 'Trailing'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                {call.rationale || 'Algorithmic multi-factor signal recommendation.'}
              </p>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between font-mono">
              <span className="text-[10px] text-muted-foreground">{formatDate(call.publishedAt)}</span>
              
              <select
                value={call.status}
                onChange={(e) => handleStatusChange(call.id, e.target.value as any)}
                className="bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 text-[10px] font-mono rounded px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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

      {/* Publish Modal with Flexible Form & Audience Selection */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#0E1420] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden text-foreground"
            >
              {/* Modal Fixed Header */}
              <div className="px-5 py-4 border-b border-border bg-slate-50/50 dark:bg-[#121926]/50 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Broadcast Research Recommendation</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Configure signal trade parameters and select subscriber distribution channels.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handlePublish} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono flex-1">
                  
                  {statusMessage && (
                    <div className={`p-3 rounded-md text-xs font-mono flex items-center gap-2 ${
                      statusMessage.type === 'error' ? 'bg-destructive/15 text-destructive border border-destructive/20' : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{statusMessage.text}</span>
                    </div>
                  )}

                  {/* 1. Stock Selection */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Search NSE Instrument <span className="text-primary font-bold">*</span>
                    </label>
                    <AdminStockSearch
                      onSelect={(stock) => {
                        setSymbol(stock.symbol);
                        setCompanyName(stock.companyName);
                      }}
                    />
                    <div className="mt-1 flex items-center gap-2">
                      {symbol ? (
                        <span className="text-xs text-[hsl(var(--success))] font-mono font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected: <strong>{symbol}</strong> {companyName ? `(${companyName})` : ''}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 w-full mt-1">
                          <span className="text-[10px] text-muted-foreground">Or type ticker directly:</span>
                          <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            placeholder="e.g. RELIANCE"
                            className="bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-primary w-32"
                            required
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Recommendation Type & Time Horizon */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-muted-foreground mb-1">Action Type</label>
                      <select
                        value={callType}
                        onChange={(e) => setCallType(e.target.value as any)}
                        className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
                        className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value="SHORT_TERM">Short Term (1-3 Mo)</option>
                        <option value="MEDIUM_TERM">Medium Term (3-6 Mo)</option>
                        <option value="LONG_TERM">Long Term (6-12 Mo)</option>
                        <option value="INTRADAY">Intraday</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Trade Entry, Target & Stop Loss (Skippable/Optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                        Entry Price (₹) <span className="text-[10px] text-muted-foreground/60">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        placeholder="e.g. 1500 (or CMP)"
                        className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                        Target Price (₹) <span className="text-[10px] text-muted-foreground/60">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="e.g. 1750"
                        className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-muted-foreground mb-1">
                        Stop Loss (₹) <span className="text-[10px] text-muted-foreground/60">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="e.g. 1420"
                        className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* 4. Rationale & Thesis (Skippable/Optional) */}
                  <div>
                    <label className="block text-xs font-mono text-muted-foreground mb-1">
                      Quantitative Rationale & Thesis <span className="text-[10px] text-muted-foreground/60">(Optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Document factor momentum score, breakout catalysts, and risk parameters (leave blank for standard thesis)..."
                      className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md p-2.5 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* 5. Audience Targeting Selection */}
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#121926] border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-primary" /> Target Audience Distribution
                      </label>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {targetRecipients.length} Recipient{targetRecipients.length !== 1 ? 's' : ''} Selected
                      </span>
                    </div>

                    {/* Mode Selector */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAudienceType('all')}
                        className={`p-2 rounded-md text-xs font-mono text-center border transition-all cursor-pointer ${
                          audienceType === 'all'
                            ? 'border-primary bg-primary/15 text-primary font-bold shadow-xs'
                            : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        All Subscribers
                      </button>

                      <button
                        type="button"
                        onClick={() => setAudienceType('plans')}
                        className={`p-2 rounded-md text-xs font-mono text-center border transition-all cursor-pointer ${
                          audienceType === 'plans'
                            ? 'border-primary bg-primary/15 text-primary font-bold shadow-xs'
                            : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        Selective Plans
                      </button>

                      <button
                        type="button"
                        onClick={() => setAudienceType('users')}
                        className={`p-2 rounded-md text-xs font-mono text-center border transition-all cursor-pointer ${
                          audienceType === 'users'
                            ? 'border-primary bg-primary/15 text-primary font-bold shadow-xs'
                            : 'border-slate-200 dark:border-white/10 text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        Select Clients
                      </button>
                    </div>

                    {/* Mode 2: Plans Multi-Select */}
                    {audienceType === 'plans' && (
                      <div className="space-y-2 pt-2 border-t border-border">
                        <span className="text-[10px] text-muted-foreground block">
                          Select which strategy mandate subscribers will receive this recommendation:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {availablePlanNames.map(planName => {
                            const isSelected = selectedPlanNames.includes(planName);
                            return (
                              <button
                                key={planName}
                                type="button"
                                onClick={() => togglePlanSelection(planName)}
                                className={`px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-xs' 
                                    : 'bg-white dark:bg-[#0E1420] text-muted-foreground border-slate-200 dark:border-white/10 hover:text-foreground'
                                }`}
                              >
                                <Layers className="w-3 h-3" />
                                <span>{planName}</span>
                                {isSelected && <Check className="w-3 h-3" />}
                              </button>
                            );
                          })}
                        </div>
                        {selectedPlanNames.length === 0 && (
                          <p className="text-[10px] text-amber-500 font-mono">
                            * Please click at least one strategy plan above.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Mode 3: Specific Users Multi-Select */}
                    {audienceType === 'users' && (
                      <div className="space-y-2.5 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            Pick individual active subscribers from the directory:
                          </span>
                          {selectedUserIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedUserIds([])}
                              className="text-[10px] text-destructive hover:underline cursor-pointer"
                            >
                              Clear Selection ({selectedUserIds.length})
                            </button>
                          )}
                        </div>

                        {/* Search Bar for Client Selection */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="text"
                            value={userSearchFilter}
                            onChange={(e) => setUserSearchFilter(e.target.value)}
                            placeholder="Search investor by name, email, or mandate..."
                            className="w-full bg-white dark:bg-[#0E1420] border border-slate-200 dark:border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        {/* Scrollable Client Directory Picker */}
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 dark:border-white/10 rounded-md p-1.5 bg-white dark:bg-[#0E1420]">
                          {uniqueActiveSubscribers
                            .filter(s => {
                              if (!userSearchFilter.trim()) return true;
                              const q = userSearchFilter.toLowerCase();
                              return s.userName.toLowerCase().includes(q) || 
                                     s.userEmail.toLowerCase().includes(q) || 
                                     s.plans.some(p => p.toLowerCase().includes(q));
                            })
                            .map(sub => {
                              const isSelected = selectedUserIds.includes(sub.userId);
                              return (
                                <div
                                  key={sub.userId}
                                  onClick={() => toggleUserSelection(sub.userId)}
                                  className={`p-2 rounded-md flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'bg-primary/15 border border-primary/30 text-foreground' 
                                      : 'hover:bg-muted/40 border border-transparent text-muted-foreground'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold text-foreground truncate">{sub.userName}</span>
                                      <span className="text-[10px] font-mono text-primary truncate">({sub.plans.join(', ')})</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground truncate block">{sub.userEmail}</span>
                                  </div>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-slate-300 dark:border-white/20'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3" />}
                                  </div>
                                </div>
                              );
                            })}
                          {uniqueActiveSubscribers.length === 0 && (
                            <div className="py-4 text-center text-[11px] text-muted-foreground font-mono">
                              No active subscribed clients found in database.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. Channels: In-App Alerts & Email Checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10">
                      <input
                        type="checkbox"
                        id="inAppAlert"
                        checked={inAppAlert}
                        onChange={(e) => setInAppAlert(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="inAppAlert" className="text-[11px] text-foreground font-sans cursor-pointer select-none flex items-center gap-1">
                        <BellRing className="w-3 h-3 text-primary" />
                        <span>Post In-App Notification Alert</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 rounded-md bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10">
                      <input
                        type="checkbox"
                        id="emailBroadcast"
                        checked={emailBroadcast}
                        onChange={(e) => setEmailBroadcast(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="emailBroadcast" className="text-[11px] text-foreground font-sans cursor-pointer select-none flex items-center gap-1">
                        <Send className="w-3 h-3 text-primary" />
                        <span>Dispatch Alpha Signal Email</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Fixed Action Footer */}
                <div className="px-5 py-3.5 border-t border-border bg-slate-50/80 dark:bg-[#121926]/80 backdrop-blur-md flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="glass-panel hover:bg-muted/40 text-foreground px-4 py-2 rounded-md text-xs cursor-pointer font-medium font-sans"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || targetRecipients.length === 0}
                    className="bg-primary hover:opacity-90 text-primary-foreground font-semibold px-5 py-2 rounded-md text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer font-sans flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {isSubmitting 
                        ? 'Broadcasting...' 
                        : `Broadcast to ${targetRecipients.length} Investor${targetRecipients.length !== 1 ? 's' : ''}`
                      }
                    </span>
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

