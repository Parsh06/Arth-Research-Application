import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Plus, X, Award, Check, Trash2, PieChart, LayoutGrid, AlertTriangle, TrendingUp, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { planRepository } from '../../repositories/planRepository';
import type { Plan, PlanHolding } from '../../schemas/plan.schema';
import { formatINR, toMinorUnits, toRupees } from '../../utils/money';
import { useToastStore } from '../../stores/toastStore';

const RISK_COLORS: Record<string, string> = {
  Low: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
  Medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
  High: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
};

const CATEGORY_LABELS: Record<string, string> = {
  equity: 'Equity',
  fno: 'F&O',
  hybrid: 'Hybrid',
  commodity: 'Commodity',
};

export default function AdminSubscriptions() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [featuresText, setFeaturesText] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Holdings within Strategy Tier
  const [holdings, setHoldings] = useState<PlanHolding[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newWeight, setNewWeight] = useState<number>(10);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived billing breakdown
  const gst = Math.round(priceRupees * 0.18);
  const gateway = Math.round((priceRupees + gst) * 0.03);
  const clientTotal = priceRupees + gst + gateway;

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await planRepository.getAllPlans(false);
      setPlans(data);
    } catch (error: any) {
      console.error('Error fetching plans', error);
      addToast(error.message || 'Failed to load plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPriceRupees(4999);
    setValidityDays(30);
    setCategory('equity');
    setRiskLevel('Medium');
    setExpectedCagr(25);
    setMinInvestmentRupees(50000);
    setStockLimit(15);
    setFeaturesText('');
    setIsPopular(false);
    setIsActive(true);
    setHoldings([]);
    setNewSymbol('');
    setNewCompany('');
    setNewSector('');
    setNewWeight(10);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    resetForm();
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
    };
    setHoldings(prev => [...prev, item]);
    setNewSymbol('');
    setNewCompany('');
    setNewSector('');
    setNewWeight(10);
  };

  const handleRemoveHolding = (index: number) => {
    setHoldings(prev => prev.filter((_, i) => i !== index));
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
      const payload = {
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
        holdings,
      };

      if (editingPlan) {
        await planRepository.updatePlan(editingPlan.id, payload);
        addToast('Strategy tier updated successfully', 'success');
      } else {
        await planRepository.createPlan({
          ...payload,
          currency: 'INR',
          createdAt: new Date().toISOString(),
        });
        addToast('New research strategy tier deployed', 'success');
      }

      setIsModalOpen(false);
      await fetchPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      addToast(error.message || 'Failed to save plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    setIsDeleting(true);
    try {
      await planRepository.deletePlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      addToast('Strategy tier removed', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to delete plan', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Strategy Tiers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
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

      {/* Empty State */}
      {plans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-5 text-center"
        >
          <div className="w-16 h-16 rounded-2xl glass-panel flex items-center justify-center">
            <LayoutGrid className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">No Strategy Tiers Created Yet</h3>
            <p className="text-xs text-muted-foreground font-mono mt-1 max-w-sm">
              Create your first advisory plan tier. It will appear here and be visible to clients on the Plans page once marked active.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-5 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Strategy Tier</span>
          </button>
        </motion.div>
      ) : (
        /* Plan Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`glass-panel p-5 flex flex-col justify-between relative ${p.isPopular ? 'border-primary' : ''}`}
            >
              {/* Featured Badge */}
              {p.isPopular && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Featured</span>
                </div>
              )}

              {/* Inactive Badge */}
              {!p.isActive && (
                <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>Inactive</span>
                </div>
              )}

              <div className="flex-1">
                {/* Name + Category */}
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{p.name}</h3>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground border border-border px-1.5 py-0.5 rounded shrink-0">
                      {CATEGORY_LABELS[p.category] || p.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{p.description}</p>
                </div>

                {/* Price */}
                <div className="mb-4 pb-3 border-b border-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-mono tabular-nums font-semibold text-foreground">{formatINR(p.priceMinor)}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">/{p.validityDays} Days</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] font-mono text-muted-foreground">
                    <span>GST: <strong className="text-foreground">₹{Math.round(toRupees(p.priceMinor) * 0.18).toLocaleString()}</strong></span>
                    <span>Total: <strong className="text-primary">₹{Math.round(toRupees(p.priceMinor) * 1.18 * 1.03).toLocaleString()}</strong></span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-1.5 text-xs font-mono mb-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Target CAGR</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{p.expectedCagr}%</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Risk Level</span>
                    <span className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${RISK_COLORS[p.riskLevel] || ''}`}>{p.riskLevel}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Stock Limit</span>
                    <span className="font-semibold text-foreground">{p.stockLimit} Stocks</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Min Investment</span>
                    <span className="font-semibold text-foreground">{formatINR(p.minInvestmentMinor)}</span>
                  </div>
                </div>

                {/* Model Equities */}
                {p.holdings && p.holdings.length > 0 && (
                  <div className="pt-3 border-t border-border mb-3">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                      <PieChart className="w-3 h-3 text-primary" /> Model Equities ({p.holdings.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {p.holdings.slice(0, 5).map((h, i) => (
                        <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded glass-panel-data text-foreground">
                          {h.symbol} {h.targetWeightPercent > 0 ? `(${h.targetWeightPercent}%)` : ''}
                        </span>
                      ))}
                      {p.holdings.length > 5 && (
                        <span className="text-[9px] font-mono text-muted-foreground self-center">+{p.holdings.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Features */}
                {p.features.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <ul className="space-y-1">
                      {p.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-primary shrink-0" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                      {p.features.length > 3 && (
                        <li className="text-[10px] text-muted-foreground font-mono pl-4">+{p.features.length - 3} more features</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-border flex justify-between items-center">
                {deleteConfirmId === p.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-[10px] font-mono text-destructive flex-1">Delete this tier permanently?</span>
                    <button
                      onClick={() => handleDeletePlan(p.id)}
                      disabled={isDeleting}
                      className="text-[10px] font-mono bg-destructive text-destructive-foreground px-2 py-1 rounded cursor-pointer hover:opacity-90"
                    >
                      {isDeleting ? '...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                      title="Delete strategy tier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(p)}
                      className="glass-panel text-foreground hover:bg-muted/50 text-xs font-mono px-3 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3 text-primary" />
                      <span>Configure Tier</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Plan Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl glass-panel p-6 shadow-2xl relative my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border mb-5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {editingPlan ? 'Edit Research Strategy Tier' : 'Create New Strategy Tier'}
                  </h3>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    {editingPlan ? `Editing: ${editingPlan.name}` : 'Configure plan parameters and recommended allocations'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded glass-panel-data text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 text-xs">

                {/* Row 1: Name + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">Plan Title <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aggressive Alpha"
                      className="w-full glass-panel-data px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium placeholder:text-muted-foreground/60"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">Base Price (₹ INR) <span className="text-destructive">*</span></label>
                    <input
                      type="number"
                      value={priceRupees}
                      min={1}
                      onChange={(e) => setPriceRupees(Number(e.target.value))}
                      className="w-full glass-panel-data px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    {/* Live billing breakdown */}
                    <div className="mt-1.5 p-2 rounded glass-panel-data text-[10px] font-mono flex flex-wrap gap-x-3 gap-y-0.5">
                      <span className="text-muted-foreground">GST (18%): <strong className="text-foreground">₹{gst.toLocaleString()}</strong></span>
                      <span className="text-muted-foreground">Gateway (3%): <strong className="text-foreground">₹{gateway.toLocaleString()}</strong></span>
                      <span className="text-muted-foreground">Client Pays: <strong className="text-primary">₹{clientTotal.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short summary of strategy mechanics and target investor profile..."
                    className="w-full glass-panel-data p-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                {/* Row 2: Validity + CAGR + Risk + Category */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Validity (Days)</label>
                    <input
                      type="number"
                      value={validityDays}
                      min={1}
                      onChange={(e) => setValidityDays(Number(e.target.value))}
                      className="w-full glass-panel-data px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Target CAGR (%)</label>
                    <input
                      type="number"
                      value={expectedCagr}
                      min={0}
                      step={0.5}
                      onChange={(e) => setExpectedCagr(Number(e.target.value))}
                      className="w-full glass-panel-data px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Risk Profile</label>
                    <select
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value)}
                      className="w-full glass-panel-data px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full glass-panel-data px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="equity">Equity</option>
                      <option value="fno">F&O</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="commodity">Commodity</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Min Investment + Stock Limit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Min Investment (₹)</label>
                    <input
                      type="number"
                      value={minInvestmentRupees}
                      min={0}
                      onChange={(e) => setMinInvestmentRupees(Number(e.target.value))}
                      className="w-full glass-panel-data px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1.5">Max Stock Positions</label>
                    <input
                      type="number"
                      value={stockLimit}
                      min={1}
                      onChange={(e) => setStockLimit(Number(e.target.value))}
                      className="w-full glass-panel-data px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Model Equities / Holdings Manager */}
                <div className="p-4 rounded-lg glass-panel-data space-y-3 border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-primary" />
                      Model Equities & Allocation Basket ({holdings.length})
                    </span>
                    <span className={`text-[10px] font-mono font-semibold ${
                      holdings.reduce((s, h) => s + h.targetWeightPercent, 0) > 100
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}>
                      Total Weight: {holdings.reduce((s, h) => s + h.targetWeightPercent, 0)}%
                    </span>
                  </div>

                  {/* Add Stock Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Symbol (e.g. INFY)"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHolding())}
                      className="glass-panel px-2.5 py-1.5 text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="glass-panel px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Sector"
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      className="glass-panel px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Weight %"
                      value={newWeight}
                      min={0}
                      max={100}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="glass-panel px-2.5 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddHolding}
                      className="bg-primary hover:opacity-90 text-primary-foreground font-semibold px-2 py-1.5 rounded text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Stock</span>
                    </button>
                  </div>

                  {/* Holdings List */}
                  <div className="max-h-44 overflow-y-auto divide-y divide-border/40 rounded">
                    {holdings.length === 0 ? (
                      <div className="py-5 text-center text-[11px] text-muted-foreground font-mono">
                        No model equities configured. Add stock recommendations above.
                      </div>
                    ) : (
                      holdings.map((h, i) => (
                        <div key={i} className="py-2 px-2 flex items-center justify-between text-xs font-mono hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-bold text-foreground shrink-0">{h.symbol}</span>
                            <span className="text-muted-foreground text-[11px] truncate">{h.companyName}</span>
                            {h.sector && (
                              <span className="text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{h.sector}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-semibold text-foreground">{h.targetWeightPercent}%</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveHolding(i)}
                              className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    Plan Features <span className="normal-case text-muted-foreground/70">(one per line)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder={"15-20 Handpicked Stocks\nMonthly Rebalancing\nResearch Notes\nPriority Support"}
                    className="w-full glass-panel-data p-2.5 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 resize-none"
                  />
                </div>

                {/* Flags */}
                <div className="flex flex-wrap items-center gap-6 py-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-medium text-foreground">Highlight as Featured Strategy</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-medium text-foreground">Active on Public Showcase</span>
                  </label>
                </div>

                {!isActive && (
                  <div className="flex items-center gap-2 p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] font-mono text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    This plan is set to inactive — it will not appear on the public Plans page.
                  </div>
                )}

                {/* Submit Row */}
                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="glass-panel text-muted-foreground hover:text-foreground px-4 py-2 rounded text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-5 py-2 rounded text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 border border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingPlan ? 'Update Strategy Tier' : 'Save Strategy Tier'}</span>
                    )}
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
