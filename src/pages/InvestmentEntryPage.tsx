import { motion } from 'framer-motion';
import { Save, AlertCircle, Calculator, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePlanStore } from '../stores/planStore';
import { useCmsStore } from '../stores/cmsStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import TopNavBar from '../components/TopNavBar';
import { portfolioRepository } from '../repositories/portfolioRepository';
import type { PortfolioHolding } from '../schemas/portfolio.schema';
import { toMinorUnits, formatINR, toRupees } from '../utils/money';

interface StockEntry {
  id: string;
  symbol: string;
  companyName: string;
  quantity: string;
  buyPrice: string;
}

export default function InvestmentEntryPage() {
  const { user } = useAuthStore();
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

  useEffect(() => {
    fetchPlans();
    fetchSiteContent();
  }, [fetchPlans, fetchSiteContent]);

  // Load existing portfolio or initialize from plan
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
                quantity: h.quantity.toString(),
                buyPrice: toRupees(h.buyPriceMinor).toString()
              })));
              setIsLoading(false);
              return;
            }
          }
        }

        // 2. If a specific planId is targeted
        const targetPlanId = urlPlanId || (userPorts.length > 0 ? userPorts[0].planId : null);
        if (targetPlanId) {
          setActivePlanId(targetPlanId);
          const plan: any = plans.find(p => p.id === targetPlanId);
          if (plan && plan.holdings && plan.holdings.length > 0) {
            setStocks(plan.holdings.map((h: any, i: number) => ({
              id: Date.now().toString() + i,
              symbol: h.symbol,
              companyName: h.companyName || h.symbol,
              quantity: '10',
              buyPrice: h.recommendedPriceMinor ? toRupees(h.recommendedPriceMinor).toString() : '1000'
            })));
          } else if (plan && plan.recommendedStocks && plan.recommendedStocks.length > 0) {
            setStocks(plan.recommendedStocks.map((symbol: string, i: number) => ({
              id: Date.now().toString() + i,
              symbol,
              companyName: symbol,
              quantity: '10',
              buyPrice: '1000'
            })));
          } else {
            setStocks([
              { id: '1', symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd', quantity: '10', buyPrice: '1650' },
              { id: '2', symbol: 'RELIANCE', companyName: 'Reliance Industries', quantity: '10', buyPrice: '2950' }
            ]);
          }
        } else {
          setStocks([
            { id: '1', symbol: 'HDFCBANK', companyName: 'HDFC Bank Ltd', quantity: '10', buyPrice: '1650' },
            { id: '2', symbol: 'RELIANCE', companyName: 'Reliance Industries', quantity: '10', buyPrice: '2950' }
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
  }, [user, urlPlanId, portfolioIdParam, plans, navigate]);

  const activePlan = useMemo(() => plans.find(p => p.id === activePlanId), [plans, activePlanId]);

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
        quantity: '10',
        buyPrice: '1000'
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
        exchange: 'NSE',
        quantity: parseInt(s.quantity, 10),
        buyPriceMinor: toMinorUnits(s.buyPrice)
      }));

      if (portfolioIdParam) {
        await portfolioRepository.resubmitPortfolioHoldings(portfolioIdParam, formattedHoldings);
      } else {
        await submitPortfolio({
          userId: user.uid,
          planId: activePlan?.id || 'default-plan',
          planName: activePlan?.name || 'Investment Plan',
          holdings: formattedHoldings
        });
      }

      // Dispatch Holdings Submitted Confirmation Email with actual submitted holdings
      if (user.email) {
        import('../services/emailService').then(({ emailService }) => {
          import('../utils/money').then(({ formatINR }) => {
            const formattedTotal = formatINR(calculateTotalInvestmentMinor());
            emailService.sendHoldingsSubmittedEmail(user.email!, {
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
            }).catch(e => console.warn('[InvestmentEntryPage] Holdings email error:', e));
          });
        });
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

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2.5 px-2">Ticker</th>
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

                      return (
                        <tr key={stock.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 font-semibold text-foreground text-xs">
                            <input
                              type="text"
                              value={stock.symbol}
                              onChange={(e) => updateStock(stock.id, 'symbol', e.target.value.toUpperCase())}
                              placeholder="SYMBOL"
                              className="w-28 glass-panel-data px-2 py-1 text-xs uppercase font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <input
                              type="text"
                              value={stock.companyName}
                              onChange={(e) => updateStock(stock.id, 'companyName', e.target.value)}
                              placeholder="Company name"
                              className="w-full text-[10px] text-muted-foreground mt-1 bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/60"
                            />
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
