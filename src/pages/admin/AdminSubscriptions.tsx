import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Plus, X, Award, Check, Trash2, PieChart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { planRepository } from '../../repositories/planRepository';
import type { Plan, PlanHolding } from '../../schemas/plan.schema';
import { formatINR, toMinorUnits, toRupees } from '../../utils/money';
import { useToastStore } from '../../stores/toastStore';

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceRupees, setPriceRupees] = useState<number>(4999);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [category, setCategory] = useState('equity');
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [expectedCagr, setExpectedCagr] = useState<number>(25);
  const [minInvestmentRupees, setMinInvestmentRupees] = useState<number>(50000);
  const [stockLimit, setStockLimit] = useState<number>(15);
  const [featuresText, setFeaturesText] = useState('15-20 Handpicked Stocks\nMonthly Rebalancing\nResearch Notes');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Equities/Holdings within Strategy Tier
  const [holdings, setHoldings] = useState<PlanHolding[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newWeight, setNewWeight] = useState<number>(10);
  const [newPriceRupees, setNewPriceRupees] = useState<number>(1500);
  const [newNotes, setNewNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await planRepository.getAllPlans(false);
      setPlans(data);
    } catch (error: any) {
      console.error("Error fetching plans", error);
      addToast(error.message || "Failed to load plans", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setPriceRupees(4999);
    setValidityDays(30);
    setCategory('equity');
    setRiskLevel('Medium');
    setExpectedCagr(25);
    setMinInvestmentRupees(50000);
    setStockLimit(15);
    setFeaturesText('15-20 Handpicked Stocks\nMonthly Rebalancing\nResearch Notes');
    setIsPopular(false);
    setIsActive(true);
    setHoldings([
      { symbol: 'RELIANCE', companyName: 'Reliance Industries Ltd', sector: 'Energy', targetWeightPercent: 15, recommendedPriceMinor: 295000, notes: 'Core defensive anchor' },
      { symbol: 'TCS', companyName: 'Tata Consultancy Services', sector: 'IT', targetWeightPercent: 12, recommendedPriceMinor: 385000, notes: 'Cash-flow compounding' }
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setName(plan.name);
    setDescription(plan.description);
    setPriceRupees(toRupees(plan.priceMinor));
    setValidityDays(plan.validityDays);
    setCategory(plan.category);
    setRiskLevel(plan.riskLevel);
    setExpectedCagr(plan.expectedCagr);
    setMinInvestmentRupees(toRupees(plan.minInvestmentMinor));
    setStockLimit(plan.stockLimit);
    setFeaturesText(plan.features.join('\n'));
    setIsPopular(plan.isPopular || false);
    setIsActive(plan.isActive !== false);
    setHoldings(plan.holdings || []);
    setIsModalOpen(true);
  };

  const handleAddHolding = () => {
    if (!newSymbol.trim() || !newCompany.trim()) {
      addToast('Symbol and Company Name are required', 'error');
      return;
    }

    const item: PlanHolding = {
      symbol: newSymbol.trim().toUpperCase(),
      companyName: newCompany.trim(),
      sector: newSector.trim() || 'Equities',
      targetWeightPercent: Number(newWeight) || 0,
      recommendedPriceMinor: toMinorUnits(newPriceRupees),
      notes: newNotes.trim()
    };

    setHoldings([...holdings, item]);
    setNewSymbol('');
    setNewCompany('');
    setNewSector('');
    setNewWeight(10);
    setNewPriceRupees(1000);
    setNewNotes('');
  };

  const handleRemoveHolding = (index: number) => {
    setHoldings(holdings.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Plan name is required', 'error');
      return;
    }

    const featuresArray = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        await planRepository.updatePlan(editingPlan.id, {
          name: name.trim(),
          description: description.trim(),
          priceMinor: toMinorUnits(priceRupees),
          validityDays: Number(validityDays),
          category: category as any,
          riskLevel: riskLevel as any,
          expectedCagr: Number(expectedCagr),
          minInvestmentMinor: toMinorUnits(minInvestmentRupees),
          stockLimit: Number(stockLimit),
          features: featuresArray,
          isPopular,
          isActive,
          holdings
        });
        addToast('Plan and model equities updated successfully', 'success');
      } else {
        await planRepository.createPlan({
          name: name.trim(),
          description: description.trim(),
          priceMinor: toMinorUnits(priceRupees),
          currency: 'INR',
          validityDays: Number(validityDays),
          category: category as any,
          riskLevel: riskLevel as any,
          expectedCagr: Number(expectedCagr),
          minInvestmentMinor: toMinorUnits(minInvestmentRupees),
          stockLimit: Number(stockLimit),
          features: featuresArray,
          isPopular,
          isActive,
          holdings,
          createdAt: new Date().toISOString()
        });
        addToast('New research strategy tier deployed', 'success');
      }

      setIsModalOpen(false);
      await fetchPlans();
    } catch (error: any) {
      console.error("Error saving plan:", error);
      addToast(error.message || "Failed to save plan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Strategy Tiers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Plan & Model Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Research Strategy Tiers
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Configure pricing, risk parameters, target CAGR, and manage recommended stock allocations.
          </p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Strategy Tier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel p-5 flex flex-col justify-between relative ${
              p.isPopular ? 'border-primary' : ''
            }`}
          >
            {p.isPopular && (
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>Featured</span>
              </div>
            )}

            <div>
              <div className="mb-3">
                <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 min-h-[32px] leading-relaxed">{p.description}</p>
              </div>

              <div className="mb-4 pb-3 border-b border-border flex items-baseline gap-1">
                <span className="text-2xl font-mono tabular-nums font-semibold text-foreground">{formatINR(p.priceMinor)}</span>
                <span className="text-[10px] font-mono text-muted-foreground">/{p.validityDays} Days</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-muted-foreground">
                  <span>Target CAGR:</span>
                  <span className="font-semibold text-[hsl(var(--success))]">+{p.expectedCagr}%</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Risk Level:</span>
                  <span className="font-semibold text-foreground capitalize">{p.riskLevel}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Recommended Equities:</span>
                  <span className="font-semibold text-primary">{p.holdings?.length || 0} Stocks</span>
                </div>
              </div>

              {p.holdings && p.holdings.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                    <PieChart className="w-3 h-3 text-primary" /> Model Equities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {p.holdings.slice(0, 4).map((h, i) => (
                      <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded glass-panel-data text-foreground">
                        {h.symbol} ({h.targetWeightPercent}%)
                      </span>
                    ))}
                    {p.holdings.length > 4 && (
                      <span className="text-[9px] font-mono text-muted-foreground">+{p.holdings.length - 4} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-border">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Features ({p.features.length})</span>
                <ul className="space-y-1">
                  {p.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-[11px] text-foreground flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => openEditModal(p)}
                className="glass-panel text-foreground hover:bg-muted/50 text-xs font-mono px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-primary" />
                <span>Configure Tier</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Plan Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                  {editingPlan ? 'Edit Research Strategy Tier' : 'Create New Strategy Tier'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">Plan Title</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aggressive Alpha"
                      className="w-full glass-panel-data px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">Base Price (₹ INR)</label>
                    <input
                      type="number"
                      value={priceRupees}
                      onChange={(e) => setPriceRupees(Number(e.target.value))}
                      className="w-full glass-panel-data px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <div className="mt-1 text-[10px] font-mono text-muted-foreground flex flex-wrap gap-x-2">
                      <span>GST (18%): <strong className="text-foreground">₹{Math.round(priceRupees * 0.18).toLocaleString()}</strong></span>
                      <span>• Gateway (3%): <strong className="text-foreground">₹{Math.round((priceRupees * 1.18) * 0.03).toLocaleString()}</strong></span>
                      <span>• Client Total: <strong className="text-primary">₹{Math.round((priceRupees * 1.18) * 1.03).toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary of strategy mechanics..."
                    className="w-full glass-panel-data p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Validity (Days)</label>
                    <input
                      type="number"
                      value={validityDays}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className="w-full glass-panel-data px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Target CAGR (%)</label>
                    <input
                      type="number"
                      value={expectedCagr}
                      onChange={(e) => setExpectedCagr(Number(e.target.value))}
                      className="w-full glass-panel-data px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">Risk Profile</label>
                    <select
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value)}
                      className="w-full glass-panel-data px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Model Equities / Stock Recommendations Manager */}
                <div className="p-3.5 rounded glass-panel-data space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-primary" /> Model Equities & Allocation Basket ({holdings.length})
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Total Weight: {holdings.reduce((sum, h) => sum + h.targetWeightPercent, 0)}%
                    </span>
                  </div>

                  {/* Add stock inputs */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Symbol (e.g. INF_Y)"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                      className="glass-panel px-2 py-1 text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="glass-panel px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Sector"
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      className="glass-panel px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                      type="number"
                      placeholder="Weight %"
                      value={newWeight}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="glass-panel px-2 py-1 text-xs font-mono text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="button"
                      onClick={handleAddHolding}
                      className="bg-primary hover:opacity-90 text-primary-foreground font-semibold px-2 py-1 rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Stock</span>
                    </button>
                  </div>

                  {/* Holdings list */}
                  <div className="max-h-40 overflow-y-auto divide-y divide-border/60">
                    {holdings.map((h, i) => (
                      <div key={i} className="py-1.5 px-2 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">{h.symbol}</span>
                          <span className="text-muted-foreground text-[11px]">{h.companyName}</span>
                          <span className="text-[10px] text-primary bg-primary/10 px-1 rounded">{h.sector}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">{h.targetWeightPercent}%</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHolding(i)}
                            className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {holdings.length === 0 && (
                      <div className="py-3 text-center text-xs text-muted-foreground font-mono">
                        No model equities configured yet. Add stock recommendations above.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">Features (One per line)</label>
                  <textarea
                    rows={3}
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    className="w-full glass-panel-data p-2.5 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Highlight as Featured Strategy</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Active on Public Showcase</span>
                  </label>
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="glass-panel text-muted-foreground hover:text-foreground px-3 py-1.5 rounded text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-1.5 rounded text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    {isSubmitting ? 'Saving Tier...' : 'Save Strategy Tier'}
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
