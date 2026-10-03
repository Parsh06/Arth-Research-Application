import { motion } from 'framer-motion';
import { Save, AlertCircle, Calculator, CheckCircle2, Plus, Trash2, Search, Edit2, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePlanStore } from '../stores/planStore';
import { useCmsStore } from '../stores/cmsStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useStockStore } from '../stores/stockStore';
import TopNavBar from '../components/TopNavBar';
import { portfolioRepository } from '../repositories/portfolioRepository';
import type { PortfolioHolding } from '../schemas/portfolio.schema';
import { toMinorUnits, formatINR, toRupees } from '../utils/money';
import StockSearchInput, { type BseStockSelection } from '../components/StockSearchInput';

interface StockEntry {
  id: string;
  symbol: string;
  companyName: string;
  scripCode?: string;
  isin?: string;
  quantity: string;
  buyPrice: string;
}

export default function InvestmentEntryPage() {
  const { user, dbUser } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();
  const { siteContent, fetchSiteContent } = useCmsStore();
  const { submitPortfolio } = usePortfolioStore();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const statePlan = location.state?.plan;
  const urlPlanId = searchParams.get('planId') || statePlan?.id;

  const [stocks, setStocks] = useState<StockEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(urlPlanId);
  const [isLoading, setIsLoading] = useState(true);
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSiteContent();
  }, [fetchPlans, fetchSiteContent]);

  // Load existing portfolio or initialize from plan with full multi-source fallback
  const portfolioIdParam = searchParams.get('portfolioId');

  useEffect(() => {
    const initializePage = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const userPorts = await portfolioRepository.getUserPortfolios(user.uid);
        
        // 1. If a specific portfolio is targeted for revision
        if (portfolioIdParam) {
          const targetPort = userPorts.find(p => p.id === portfolioIdParam);
          if (targetPort) {
            setActivePlanId(targetPort.planId);
            const portHoldings = await portfolioRepository.getHoldings(targetPort.id);
            if (portHoldings && portHoldings.length > 0) {
              setStocks(portHoldings.map((h: PortfolioHolding, i: number) => ({
                id: h.id || Date.now().toString() + i,
                symbol: h.symbol,
                companyName: h.companyName || h.symbol,
                scripCode: h.scripCode || undefined,
                isin: h.isin || undefined,
                quantity: h.quantity.toString(),
                buyPrice: toRupees(h.buyPriceMinor).toString()
              })));
              setIsLoading(false);
              return;
            }
          }
        }

        // 2. Resolve target plan ID with multi-source fallback:
        // Query param -> User profile activePlanId -> Active subscription doc -> User portfolio -> Default plan
        let targetPlanId = urlPlanId || (dbUser as any)?.activePlanId;

        if (!targetPlanId) {
          try {
            const { subscriptionRepository } = await import('../repositories/subscriptionRepository');
            const userSubs = await subscriptionRepository.getUserSubscriptions(user.uid);
            const activeSub = userSubs.find(s => s.status === 'active' && (!s.expiresAt || (typeof s.expiresAt === 'number' ? s.expiresAt : new Date(s.expiresAt).getTime()) > Date.now()));
            if (activeSub?.planId) {
              targetPlanId = activeSub.planId;
            }
          } catch (subErr) {
            console.warn('[InvestmentEntryPage] Error fetching user subscriptions:', subErr);
          }
        }

        if (!targetPlanId && userPorts.length > 0) {
          targetPlanId = userPorts[0].planId;
        }

        if (!targetPlanId && plans.length > 0) {
          targetPlanId = plans[0].id;
        }

        setActivePlanId(targetPlanId);

        // 3. Check for saved local draft (prevents data loss if user refreshed or connection dropped)
        const draftKey = `arth_draft_holdings_${user.uid}_${targetPlanId || 'generic'}`;
        try {
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setStocks(parsed);
              setDraftRestored(true);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Ignore localstorage parse issues
        }

        // 4. Pre-fill rows from recommended strategy basket if available
        if (targetPlanId) {
          const plan: any = plans.find(p => p.id === targetPlanId);
          if (plan && plan.holdings && plan.holdings.length > 0) {
            setStocks(plan.holdings.map((h: any, i: number) => ({
              id: Date.now().toString() + i,
              symbol: h.symbol,
              companyName: h.companyName || h.symbol,
              scripCode: h.scripCode || undefined,
              isin: h.isin || undefined,
              quantity: '',
              buyPrice: ''
            })));
          } else if (plan && plan.recommendedStocks && plan.recommendedStocks.length > 0) {
            setStocks(plan.recommendedStocks.map((symbol: string, i: number) => ({
              id: Date.now().toString() + i,
              symbol,
              companyName: symbol,
              quantity: '',
              buyPrice: ''
            })));
          } else {
            setStocks([
              { id: '1', symbol: '', companyName: '', quantity: '', buyPrice: '' }
            ]);
          }
        } else {
          setStocks([
            { id: '1', symbol: '', companyName: '', quantity: '', buyPrice: '' }
          ]);
        }
      } catch (err) {
        console.error("Failed to initialize setup", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (plans.length > 0 && user) {
      initializePage();
    }
  }, [user, dbUser, urlPlanId, portfolioIdParam, plans, navigate]);

  const activePlan = useMemo(() => plans.find(p => p.id === activePlanId), [plans, activePlanId]);

  // Autosave draft holdings to localStorage on any stock changes
  useEffect(() => {
    if (!user || isLoading) return;
    const draftKey = `arth_draft_holdings_${user.uid}_${activePlanId || 'generic'}`;
    try {
      if (stocks.length > 0) {
        localStorage.setItem(draftKey, JSON.stringify(stocks));
      }
    } catch {
      // Ignore localStorage quotas
    }
  }, [stocks, user, activePlanId, isLoading]);

  const { prices: livePrices, fetchPrices: fetchLivePrices } = useStockStore();

  // Fetch live prices whenever stocks scrip codes change
  useEffect(() => {
    const scripCodes = stocks.map(s => s.scripCode).filter(Boolean) as string[];
    const symbols = stocks.map(s => s.symbol).filter(Boolean);
    if (scripCodes.length > 0 || symbols.length > 0) {
      fetchLivePrices(scripCodes, symbols);
    }
  }, [stocks, fetchLivePrices]);

  const updateStock = (id: string, field: keyof StockEntry, value: string) => {
    setStocks(stocks.map(s => s.id === id ? { ...s, [field]: value } : s));
    setError(null);
  };

  const addStock = () => {
    setStocks([
      ...stocks,
      {
        id: `custom_${Date.now()}`,
        symbol: '',
        companyName: '',
        quantity: '',
        buyPrice: ''
      }
    ]);
  };

  const removeStock = (id: string) => {
    setStocks(stocks.filter(s => s.id !== id));
  };

  const calculateTotalInvestmentMinor = () => {
    return stocks.reduce((total, stock) => {
      const qty = parseInt(stock.quantity, 10) || 0;
      const priceMinor = toMinorUnits(stock.buyPrice);
      return total + (qty * priceMinor);
    }, 0);
  };

  const validate = () => {
    if (stocks.length === 0) return "No stocks found for this strategy allocation.";
    
    for (const s of stocks) {
      if (!s.symbol.trim()) {
        return "Please specify a valid stock ticker symbol.";
      }
      const qty = parseInt(s.quantity, 10);
      if (!s.quantity || isNaN(qty) || qty <= 0) {
        return `Please enter a valid whole number quantity for ${s.symbol}`;
      }
      const price = parseFloat(s.buyPrice);
      if (!s.buyPrice || isNaN(price) || price <= 0) {
        return `Please enter a valid average purchase price for ${s.symbol}`;
      }
    }
    return null;
  };

  const handleSelectBseStock = (bseStock: BseStockSelection) => {
    // Check if security is already added
    const alreadyExists = stocks.some(s => 
      (s.scripCode && s.scripCode === bseStock.scripCode) || 
      (s.symbol && s.symbol.toUpperCase() === bseStock.symbol.toUpperCase())
    );

    if (alreadyExists) {
      setError(`${bseStock.symbol} (${bseStock.companyName}) is already in your portfolio. You can adjust its quantity directly.`);
      return;
    }

    setStocks(prev => {
      // If the only row is empty, replace it
      if (prev.length === 1 && !prev[0].symbol && !prev[0].quantity) {
        return [{
          id: `bse_${Date.now()}`,
          symbol: bseStock.symbol,
          companyName: bseStock.companyName,
          scripCode: bseStock.scripCode,
          isin: bseStock.isin,
          quantity: '',
          buyPrice: ''
        }];
      }
      return [
        ...prev,
        {
          id: `bse_${Date.now()}`,
          symbol: bseStock.symbol,
          companyName: bseStock.companyName,
          scripCode: bseStock.scripCode,
          isin: bseStock.isin,
          quantity: '',
          buyPrice: ''
        }
      ];
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert("Please login first");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      const formattedHoldings = stocks.map(s => ({
        symbol: s.symbol.trim().toUpperCase(),
        companyName: s.companyName || s.symbol.trim().toUpperCase(),
        scripCode: s.scripCode || undefined,
        isin: s.isin || undefined,
        exchange: 'BSE',
        quantity: parseInt(s.quantity, 10),
        buyPriceMinor: toMinorUnits(s.buyPrice)
      }));

      const userPorts = await portfolioRepository.getUserPortfolios(user.uid).catch(() => []);
      const existingForPlan = userPorts.find(p => p.planId === (activePlan?.id || activePlanId));
      const targetPortfolioId = portfolioIdParam || (existingForPlan ? existingForPlan.id : null);

      if (targetPortfolioId) {
        await portfolioRepository.resubmitPortfolioHoldings(targetPortfolioId, formattedHoldings);
      } else {
        await submitPortfolio({
          userId: user.uid,
          planId: activePlan?.id || 'default-plan',
          planName: activePlan?.name || 'Investment Plan',
          holdings: formattedHoldings
        });
      }

      // Clear autosaved draft upon successful submission
      try {
        const draftKey = `arth_draft_holdings_${user.uid}_${activePlanId || 'generic'}`;
        localStorage.removeItem(draftKey);
      } catch {}

      // Dispatch Holdings Submitted Confirmation Email with actual submitted holdings
      if (user.email) {
        try {
          const { emailService } = await import('../services/emailService');
          const { formatINR } = await import('../utils/money');
          const formattedTotal = formatINR(calculateTotalInvestmentMinor());
          await emailService.sendHoldingsSubmittedEmail(user.email, {
            userName: user.displayName || 'Valued Investor',
            mandateName: activePlan?.name || 'Institutional Advisory Mandate',
            submissionDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
            totalHoldingsCount: formattedHoldings.length,
            totalPortfolioValue: formattedTotal,
            totalInvestmentFormatted: formattedTotal,
            holdingsList: formattedHoldings.map(h => ({
              ticker: h.symbol,
              quantity: h.quantity,
              avgPriceFormatted: formatINR(h.buyPriceMinor),
              totalValueFormatted: formatINR(h.quantity * h.buyPriceMinor)
            })),
            portalUrl: window.location.origin + '/portfolio-pending'
          });
        } catch (e) {
          console.warn('[InvestmentEntryPage] Holdings email error:', e);
        }
      }
      
      navigate('/portfolio-pending');
    } catch (error) {
      console.error("Error submitting portfolio:", error);
      setError("Failed to submit portfolio. Please verify parameters and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Initializing Strategy Engine...</span>
      </div>
    );
  }

  const totalInvMinor = calculateTotalInvestmentMinor();

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground selection:bg-primary selection:text-primary-foreground transition-colors duration-200 pb-20">
      <TopNavBar backTo="/plans" label="Exit Setup" />
      
      <div className="max-w-6xl mx-auto pt-24 px-6 lg:px-8">
        
        {/* Progress Stepper */}
        <div className="mb-8 max-w-2xl mx-auto flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[hsl(var(--success))]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Order Cleared</span>
          </div>
          <div className="h-[1px] w-12 bg-[hsl(var(--success))/0.3]" />
          <div className="flex items-center gap-2 text-primary font-semibold">
            <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">2</div>
            <span>Portfolio Entry</span>
          </div>
          <div className="h-[1px] w-12 bg-border" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px]">3</div>
            <span>Analyst Verification</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Entry Table Card */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 shadow-sm"
            >
              <div className="mb-5 pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {siteContent?.investmentEntryPage?.badgeText && !siteContent.investmentEntryPage.badgeText.startsWith('Default ') ? siteContent.investmentEntryPage.badgeText : "Strategy Model Basket"}
                  </span>
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground mt-2">
                    {siteContent?.investmentEntryPage?.title && !siteContent.investmentEntryPage.title.startsWith('Default ') && !siteContent.investmentEntryPage.title.includes('investmentEntryPage') ? siteContent.investmentEntryPage.title : "Configure Initial Executed Holdings"}
                  </h1>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {siteContent?.investmentEntryPage?.subtitle && !siteContent.investmentEntryPage.subtitle.startsWith('Default ') && !siteContent.investmentEntryPage.subtitle.includes('investmentEntryPage') ? siteContent.investmentEntryPage.subtitle : `Enter the executed quantities and average purchase prices for your ${activePlan?.name || 'mandate'}.`}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={addStock}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-primary/30 text-primary hover:bg-primary/10 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ticker</span>
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {draftRestored && (
                <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono mb-4 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>Session Restored: We recovered your unsaved stock entries from your previous session.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraftRestored(false);
                      const draftKey = `arth_draft_holdings_${user?.uid}_${activePlanId || 'generic'}`;
                      try { localStorage.removeItem(draftKey); } catch {}
                    }}
                    className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground underline cursor-pointer shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Quick Search & Add from BSE */}
              <div className="mb-5 p-3.5 rounded-lg bg-card/60 border border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    Search & Add BSE Securities
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Live BSE India API
                  </span>
                </div>
                <StockSearchInput
                  placeholder="Type Indian company name or ticker (e.g. Tata Motors, NAVA, RELIANCE, 513023)..."
                  onSelect={handleSelectBseStock}
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2.5 px-2">Ticker / Security</th>
                      <th className="pb-2.5 px-2">Quantity</th>
                      <th className="pb-2.5 px-2">Avg Price (₹)</th>
                      <th className="pb-2.5 px-2 text-right">Investment Value</th>
                      <th className="pb-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono">
                    {stocks.map((stock) => {
                      const qty = parseInt(stock.quantity, 10) || 0;
                      const priceMinor = toMinorUnits(stock.buyPrice);
                      const invMinor = qty * priceMinor;
                      const liveQuote = stock.scripCode ? livePrices[stock.scripCode] : (stock.symbol ? livePrices[stock.symbol] : undefined);

                      return (
                        <tr key={stock.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 font-semibold text-foreground text-xs min-w-[240px]">
                            {!stock.symbol ? (
                              <StockSearchInput
                                usePortal={true}
                                autoFocus={true}
                                placeholder="Search company name or ticker..."
                                onSelect={(bseStock) => {
                                  setStocks(stocks.map(s => s.id === stock.id ? {
                                    ...s,
                                    symbol: bseStock.symbol,
                                    companyName: bseStock.companyName,
                                    scripCode: bseStock.scripCode,
                                    isin: bseStock.isin
                                  } : s));
                                }}
                              />
                            ) : (
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-foreground text-xs font-mono uppercase">
                                    {stock.symbol}
                                  </span>
                                  {stock.scripCode && (
                                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                                      BSE: {stock.scripCode}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => updateStock(stock.id, 'symbol', '')}
                                    className="p-1 text-muted-foreground/60 hover:text-primary transition-colors cursor-pointer"
                                    title="Search different BSE security"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[210px] mt-0.5">
                                  {stock.companyName}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min="1"
                              value={stock.quantity}
                              onChange={(e) => updateStock(stock.id, 'quantity', e.target.value)}
                              placeholder="0"
                              className="w-20 glass-panel-data p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={stock.buyPrice}
                              onChange={(e) => updateStock(stock.id, 'buyPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-24 glass-panel-data p-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {liveQuote && liveQuote.ltp > 0 && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                                <TrendingUp className="w-2.5 h-2.5 text-primary shrink-0" />
                                <span>LTP: <strong className="text-foreground">{formatINR(liveQuote.ltpPaise)}</strong></span>
                                {!stock.buyPrice && (
                                  <button
                                    type="button"
                                    onClick={() => updateStock(stock.id, 'buyPrice', liveQuote.ltp.toString())}
                                    className="text-[9px] text-primary hover:underline ml-0.5 cursor-pointer"
                                    title="Auto-fill buy price with current BSE LTP"
                                  >
                                    (Fill)
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-semibold tabular-nums text-foreground">
                            {formatINR(invMinor)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {stocks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeStock(stock.id)}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                title="Remove position"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex justify-end">
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs py-2.5 px-5 rounded-md shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting to Queue...' : 'Submit Portfolio for Verification'}</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <Calculator className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
                  Portfolio Aggregate
                </h3>
              </div>
              
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="block text-muted-foreground text-[10px] uppercase mb-0.5">Strategy Model</span>
                  <span className="font-semibold text-foreground">{activePlan?.name || '-'}</span>
                </div>
                
                <div>
                  <span className="block text-muted-foreground text-[10px] uppercase mb-0.5">Total Positions</span>
                  <span className="font-semibold text-foreground">{stocks.length} Holdings</span>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <span className="block text-muted-foreground text-[10px] uppercase mb-1">Total Deployed Capital</span>
                  <span className="text-xl font-semibold text-primary tabular-nums">{formatINR(totalInvMinor)}</span>
                </div>

                <div className="pt-3 border-t border-border">
                  <span className="block text-muted-foreground text-[10px] uppercase mb-1">Verification SLA</span>
                  <div className="p-2.5 rounded glass-panel-data text-[11px] text-muted-foreground">
                    Analyst clearance SLA: <span className="font-semibold text-foreground">{siteContent?.investmentEntryPage?.slaText || "24–48 Hours"}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
