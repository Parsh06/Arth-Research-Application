import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, 
  Plus, 
  X, 
  Award, 
  Trash2, 
  PieChart, 
  LayoutGrid, 
  AlertTriangle, 
  Tag, 
  Percent, 
  DollarSign, 
  Copy, 
  Layers 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { planRepository } from '../../repositories/planRepository';
import { couponRepository } from '../../repositories/couponRepository';
import type { Plan, PlanHolding } from '../../schemas/plan.schema';
import type { Coupon } from '../../schemas/coupon.schema';
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
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToastStore();

  // -------------------------------------------------------------
  // PLAN MODAL & FORM STATE
  // -------------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const [holdings, setHoldings] = useState<PlanHolding[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newWeight, setNewWeight] = useState<number>(10);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // COUPON MODAL & FORM STATE
  // -------------------------------------------------------------
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponDeleteId, setCouponDeleteId] = useState<string | null>(null);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [couponDescription, setCouponDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [appliesTo, setAppliesTo] = useState<'all_plans' | 'specific_plan'>('all_plans');
  const [targetPlanId, setTargetPlanId] = useState<string>('');
  const [targetUserType, setTargetUserType] = useState<'all_users' | 'specific_user'>('all_users');
  const [targetUserEmail, setTargetUserEmail] = useState<string>('');
  const [minOrderRupees, setMinOrderRupees] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [validFrom, setValidFrom] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [isCouponActive, setIsCouponActive] = useState(true);
  const [previewPlanId, setPreviewPlanId] = useState<string>('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [plansData, couponsData] = await Promise.all([
        planRepository.getAllPlans(false),
        couponRepository.getAllCoupons(false)
      ]);
      setPlans(plansData);
      setCoupons(couponsData);
      if (plansData.length > 0 && !targetPlanId) {
        setTargetPlanId(plansData[0].id);
        setPreviewPlanId(plansData[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching data', error);
      addToast('Failed to load plans or coupons. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await planRepository.getAllPlans(false);
      setPlans(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCoupons = async () => {
    try {
      const data = await couponRepository.getAllCoupons(false);
      setCoupons(data);
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------------------
  // PLAN HANDLERS
  // -------------------------------------------------------------
  const resetPlanForm = () => {
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

  const openCreatePlanModal = () => {
    setEditingPlan(null);
    resetPlanForm();
    setIsModalOpen(true);
  };

  const openEditPlanModal = (plan: Plan) => {
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

  const handlePlanSubmit = async (e: React.FormEvent) => {
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
      addToast('Failed to save strategy tier. Please verify parameters and retry.', 'error');
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
      addToast('Failed to delete strategy tier. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  // -------------------------------------------------------------
  // COUPON HANDLERS
  // -------------------------------------------------------------
  const resetCouponForm = () => {
    setCouponCode('');
    setCouponName('');
    setCouponDescription('');
    setDiscountType('percentage');
    setDiscountValue(20);
    setAppliesTo('all_plans');
    setTargetPlanId(plans[0]?.id || '');
    setTargetUserType('all_users');
    setTargetUserEmail('');
    setMinOrderRupees(0);
    setUsageLimit(0);
    setValidFrom(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 90);
    setValidUntil(d.toISOString().split('T')[0]);
    setIsCouponActive(true);
  };

  const openCreateCouponModal = () => {
    setEditingCoupon(null);
    resetCouponForm();
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponName(coupon.name);
    setCouponDescription(coupon.description || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setAppliesTo(coupon.appliesTo);
    setTargetPlanId(coupon.planId || plans[0]?.id || '');
    setTargetUserType(coupon.targetUserType);
    setTargetUserEmail(coupon.userEmail || '');
    setMinOrderRupees(coupon.minOrderAmountRupees || 0);
    setUsageLimit(coupon.usageLimit || 0);
    setValidFrom(coupon.validFrom ? coupon.validFrom.split('T')[0] : new Date().toISOString().split('T')[0]);
    setValidUntil(coupon.validUntil ? coupon.validUntil.split('T')[0] : '');
    setIsCouponActive(coupon.isActive !== false);
    setIsCouponModalOpen(true);
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      addToast('Coupon code is required (e.g. ALPHA20)', 'error');
      return;
    }
    if (!couponName.trim()) {
      addToast('Coupon name / title is required', 'error');
      return;
    }
    if (discountValue <= 0) {
      addToast('Discount value must be greater than 0', 'error');
      return;
    }
    if (discountType === 'percentage' && discountValue > 100) {
      addToast('Percentage discount cannot exceed 100%', 'error');
      return;
    }
    if (targetUserType === 'specific_user' && !targetUserEmail.trim()) {
      addToast('Investor email is required for user-restricted coupons', 'error');
      return;
    }

    const selectedPlan = plans.find(p => p.id === targetPlanId);

    setIsSubmitting(true);
    try {
      const payload: any = {
        code: cleanCode,
        name: couponName.trim(),
        description: couponDescription.trim(),
        discountType,
        discountValue: Number(discountValue),
        appliesTo,
        planId: appliesTo === 'specific_plan' ? targetPlanId : '',
        planName: appliesTo === 'specific_plan' ? (selectedPlan?.name || '') : '',
        targetUserType,
        userEmail: targetUserType === 'specific_user' ? targetUserEmail.trim().toLowerCase() : '',
        minOrderAmountRupees: Number(minOrderRupees) || 0,
        usageLimit: Number(usageLimit) || 0,
        validFrom: new Date(validFrom).toISOString(),
        validUntil: new Date(validUntil).toISOString(),
        isActive: isCouponActive
      };

      if (editingCoupon?.id) {
        await couponRepository.updateCoupon(editingCoupon.id, payload);
        addToast(`Coupon "${cleanCode}" updated successfully.`, 'success');
      } else {
        await couponRepository.createCoupon(payload);
        addToast(`Promotional voucher "${cleanCode}" created successfully.`, 'success');
      }

      setIsCouponModalOpen(false);
      await fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      addToast(error?.message || 'Failed to save coupon.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    setIsDeletingCoupon(true);
    try {
      await couponRepository.deleteCoupon(id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      addToast('Voucher deleted successfully.', 'success');
    } catch (error: any) {
      addToast('Failed to delete coupon voucher.', 'error');
    } finally {
      setIsDeletingCoupon(false);
      setCouponDeleteId(null);
    }
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    if (!coupon.id) return;
    try {
      const newStatus = !coupon.isActive;
      await couponRepository.updateCoupon(coupon.id, { isActive: newStatus });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: newStatus } : c));
      addToast(`Coupon "${coupon.code}" ${newStatus ? 'activated' : 'deactivated'}.`, 'success');
    } catch (error: any) {
      addToast('Failed to update coupon status.', 'error');
    }
  };

  // Calculation for live preview inside Coupon Modal
  const previewPlan = plans.find(p => p.id === (previewPlanId || plans[0]?.id)) || plans[0];
  const previewPlanBase = previewPlan ? toRupees(previewPlan.priceMinor) : 4999;
  const previewDiscount = discountType === 'percentage' 
    ? Math.round((previewPlanBase * Math.min(100, discountValue)) / 100) 
    : Math.min(previewPlanBase, discountValue);
  const previewTaxable = Math.max(0, previewPlanBase - previewDiscount);
  const previewGst = Math.round(previewTaxable * 0.18);
  const previewGateway = Math.round((previewTaxable + previewGst) * 0.03);
  const previewFinalTotal = previewTaxable + previewGst + previewGateway;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Advisory Hub...</span>
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
              Advisory Catalog & Pricing Hub
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Strategy Tiers & Promotional Vouchers
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Manage quantitative model strategies, live pricing formulas, and automated checkout coupon discounts.
          </p>
        </div>

        {/* Tab Actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeTab === 'plans' ? (
            <button
              onClick={openCreatePlanModal}
              className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Strategy Tier</span>
            </button>
          ) : (
            <button
              onClick={openCreateCouponModal}
              className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Voucher Code</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-t-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'plans'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Advisory Strategy Tiers ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 rounded-t-md text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'coupons'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Promotional Vouchers & Coupons ({coupons.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ADVISORY STRATEGY TIERS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {plans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center glass-panel"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">No Strategy Tiers Deployed</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1 max-w-sm">
                  Create your first advisory plan tier to activate public showcase and investor checkout.
                </p>
              </div>
              <button
                onClick={openCreatePlanModal}
                className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Strategy Tier</span>
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass-panel flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                    !p.isActive ? 'opacity-65 border-dashed' : 'hover:border-primary/40 shadow-sm'
                  }`}
                >
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                            {CATEGORY_LABELS[p.category] || p.category}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${RISK_COLORS[p.riskLevel] || ''}`}>
                            {p.riskLevel} Risk
                          </span>
                          {p.isPopular && (
                            <span className="text-[9px] font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5">
                              <Award className="w-2.5 h-2.5" />
                              Most Subscribed
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-base text-foreground tracking-tight">{p.name}</h3>
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${p.isActive ? 'bg-[hsl(var(--success))] shadow-xs' : 'bg-muted-foreground'}`} />
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[32px]">
                      {p.description || 'No description provided.'}
                    </p>

                    <div className="glass-panel-data p-3 rounded-lg space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Base Price:</span>
                        <span className="font-bold text-foreground">{formatINR(p.priceMinor)} / {p.validityDays}d</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-muted-foreground">+ 18% GST:</span>
                        <span className="text-muted-foreground">{formatINR(Math.round(p.priceMinor * 0.18))}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
                        <span className="text-primary font-semibold">Client Total:</span>
                        <span className="font-bold text-primary text-sm">
                          {formatINR(Math.round(p.priceMinor * 1.18 * 1.03))}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="glass-panel p-2 text-center rounded">
                        <span className="text-muted-foreground block text-[9px] uppercase">Target CAGR</span>
                        <span className="font-bold text-[hsl(var(--success))]">{p.expectedCagr}%</span>
                      </div>
                      <div className="glass-panel p-2 text-center rounded">
                        <span className="text-muted-foreground block text-[9px] uppercase">Model Equities</span>
                        <span className="font-bold text-foreground">{(p.holdings || []).length} Stocks</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between border-t border-border/40 mt-3 pt-3 gap-2">
                    <button
                      onClick={() => openEditPlanModal(p)}
                      className="flex-1 glass-panel hover:bg-muted/60 text-xs font-mono font-medium py-1.5 rounded flex items-center justify-center gap-1.5 cursor-pointer text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Parameters</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(p.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      title="Delete strategy tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PROMOTIONAL VOUCHERS & COUPONS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {coupons.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4 text-center glass-panel"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">No Promotional Vouchers Active</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1 max-w-sm">
                  Create coupon discount codes for marketing campaigns, festive promotions, or specific client concessions.
                </p>
              </div>
              <button
                onClick={openCreateCouponModal}
                className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Voucher</span>
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coupons.map((coupon, idx) => {
                const isExpired = new Date(coupon.validUntil) < new Date();
                const isMaxedOut = coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit;

                return (
                  <motion.div
                    key={coupon.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`glass-panel flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                      !coupon.isActive || isExpired || isMaxedOut
                        ? 'opacity-70 border-dashed'
                        : 'hover:border-primary/40 shadow-sm'
                    }`}
                  >
                    <div className="p-5 flex-1 space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary bg-primary/15 border border-primary/30 px-2 py-0.5 rounded flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {coupon.code}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              !coupon.isActive 
                                ? 'bg-zinc-800 text-zinc-400' 
                                : isExpired 
                                  ? 'bg-destructive/15 text-destructive' 
                                  : isMaxedOut 
                                    ? 'bg-amber-500/15 text-amber-400' 
                                    : 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]'
                            }`}>
                              {!coupon.isActive ? 'Inactive' : isExpired ? 'Expired' : isMaxedOut ? 'Limit Reached' : 'Active Voucher'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-sm text-foreground">{coupon.name}</h3>
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            addToast(`Code "${coupon.code}" copied to clipboard`, 'info');
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {coupon.description && (
                        <p className="text-xs text-muted-foreground font-mono line-clamp-2">
                          {coupon.description}
                        </p>
                      )}

                      {/* Discount Callout Box */}
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">Concession Grant:</span>
                        <span className="text-base font-bold font-mono text-primary flex items-center gap-1">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue.toLocaleString('en-IN')} OFF`}
                        </span>
                      </div>

                      {/* Scope & Restrictions */}
                      <div className="space-y-1.5 text-[11px] font-mono text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span>Strategy Scope:</span>
                          <span className="font-semibold text-foreground">
                            {coupon.appliesTo === 'all_plans' ? 'All Advisory Plans' : (coupon.planName || 'Specific Plan')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Audience:</span>
                          <span className="font-semibold text-foreground truncate max-w-[150px]">
                            {coupon.targetUserType === 'all_users' ? 'All Registered Users' : (coupon.userEmail || 'Specific User')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Redemptions:</span>
                          <span className="font-semibold text-foreground">
                            {coupon.timesUsed} {coupon.usageLimit > 0 ? `/ ${coupon.usageLimit} Max` : '(Unlimited)'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Valid Till:</span>
                          <span className={`font-semibold ${isExpired ? 'text-destructive' : 'text-foreground'}`}>
                            {new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-border/40 mt-2 pt-3 gap-2">
                      <button
                        onClick={() => handleToggleCouponActive(coupon)}
                        className={`text-[11px] font-mono px-2.5 py-1.5 rounded transition-all cursor-pointer ${
                          coupon.isActive 
                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                            : 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] hover:bg-[hsl(var(--success))/0.25]'
                        }`}
                      >
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditCouponModal(coupon)}
                          className="glass-panel hover:bg-muted/60 text-xs font-mono font-medium py-1 px-2.5 rounded flex items-center gap-1 cursor-pointer text-foreground"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setCouponDeleteId(coupon.id || null)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CREATE / EDIT STRATEGY PLAN */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-3xl my-8 rounded-xl overflow-hidden shadow-2xl border-primary/30"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {editingPlan ? 'Edit Strategy Tier Parameters' : 'Deploy New Research Strategy Tier'}
                    </h3>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Define pricing, risk metrics, features, and model portfolio weights.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handlePlanSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Strategy Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Quantitative Alpha Momentum"
                      className="w-full glass-panel px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Asset Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary bg-card"
                    >
                      <option value="equity">Equity (Cash / Momentum)</option>
                      <option value="fno">F&O Derivatives</option>
                      <option value="hybrid">Hybrid Quant Alpha</option>
                      <option value="commodity">Commodity & Multi-Asset</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                    Strategy Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description highlighting the thesis and execution style"
                    className="w-full glass-panel px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Pricing & Validity */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary block">
                    Statutory Pricing Structure
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                        Base Advisory Fee (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={priceRupees}
                        onChange={(e) => setPriceRupees(Math.max(1, Number(e.target.value)))}
                        className="w-full glass-panel px-3 py-1.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                        Validity Period (Days)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={validityDays}
                        onChange={(e) => setValidityDays(Number(e.target.value))}
                        className="w-full glass-panel px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                        Min Capital Size (₹)
                      </label>
                      <input
                        type="number"
                        value={minInvestmentRupees}
                        onChange={(e) => setMinInvestmentRupees(Number(e.target.value))}
                        className="w-full glass-panel px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-border/40">
                    <span>Base: <b className="text-foreground">{formatINR(toMinorUnits(priceRupees))}</b></span>
                    <span>+18% GST: <b className="text-foreground">{formatINR(toMinorUnits(Math.round(priceRupees * 0.18)))}</b></span>
                    <span>+3% Surcharge: <b className="text-foreground">{formatINR(toMinorUnits(Math.round(priceRupees * 1.18 * 0.03)))}</b></span>
                    <span className="text-primary font-bold">Total Client Amount: {formatINR(toMinorUnits(Math.round(priceRupees * 1.18 * 1.03)))}</span>
                  </div>
                </div>

                {/* Risk & Performance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Risk Classification
                    </label>
                    <select
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value)}
                      className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary bg-card"
                    >
                      <option value="Low">Low Risk</option>
                      <option value="Medium">Medium Risk</option>
                      <option value="High">High Risk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Target CAGR (%)
                    </label>
                    <input
                      type="number"
                      value={expectedCagr}
                      onChange={(e) => setExpectedCagr(Number(e.target.value))}
                      className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Target Equities Limit
                    </label>
                    <input
                      type="number"
                      value={stockLimit}
                      onChange={(e) => setStockLimit(Number(e.target.value))}
                      className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Holdings Section */}
                <div className="p-4 rounded-lg bg-card/60 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-primary" />
                      Model Equities & Allocation Basket ({holdings.length})
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                      Total Weight: {holdings.reduce((s, h) => s + h.targetWeightPercent, 0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <input
                      type="text"
                      placeholder="Symbol (e.g. INFY)"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                      className="glass-panel px-2.5 py-1.5 text-xs font-mono uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      className="glass-panel px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Sector"
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      className="glass-panel px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="number"
                      placeholder="Weight %"
                      value={newWeight}
                      min={0}
                      max={100}
                      onChange={(e) => setNewWeight(Number(e.target.value))}
                      className="glass-panel px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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

                  <div className="max-h-40 overflow-y-auto divide-y divide-border/40 rounded">
                    {holdings.length === 0 ? (
                      <div className="py-4 text-center text-[11px] text-muted-foreground font-mono">
                        No model equities configured. Add stock recommendations above.
                      </div>
                    ) : (
                      holdings.map((h, i) => (
                        <div key={i} className="py-2 px-2 flex items-center justify-between text-xs font-mono hover:bg-muted/20">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-foreground">{h.symbol}</span>
                            <span className="text-muted-foreground text-[11px] truncate">{h.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2.5">
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
                      ))
                    )}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    Plan Features (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder={"15-20 Handpicked Stocks\nMonthly Rebalancing\nDirect Execution"}
                    className="w-full glass-panel-data p-2.5 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-6 py-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span className="text-xs font-medium text-foreground">Enable "Most Subscribed" Badge</span>
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
                    {isSubmitting ? 'Saving...' : editingPlan ? 'Update Strategy Tier' : 'Deploy Strategy Tier'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: CREATE / EDIT PROMOTIONAL COUPON */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-2xl my-8 rounded-xl overflow-hidden shadow-2xl border-primary/30"
            >
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {editingCoupon ? `Edit Voucher Code (${editingCoupon.code})` : 'Create Promotional Voucher & Coupon'}
                    </h3>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Configure discount percentages, scope limits, and live checkout pricing rules.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCouponModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCouponSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Coupon Code <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ALPHA20"
                      className="w-full glass-panel px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Voucher Purpose / Title <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={couponName}
                      onChange={(e) => setCouponName(e.target.value)}
                      placeholder="e.g. Early Bird Festive Grant"
                      className="w-full glass-panel px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                    Description (Optional internal / client notice)
                  </label>
                  <input
                    type="text"
                    value={couponDescription}
                    onChange={(e) => setCouponDescription(e.target.value)}
                    placeholder="e.g. 20% flat concession for Q3 research subscribers"
                    className="w-full glass-panel px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                        Discount Calculation Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDiscountType('percentage')}
                          className={`flex-1 py-1.5 text-xs font-mono rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            discountType === 'percentage'
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'glass-panel text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Percentage (%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('fixed_amount')}
                          className={`flex-1 py-1.5 text-xs font-mono rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                            discountType === 'fixed_amount'
                              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                              : 'glass-panel text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Fixed INR (₹)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-muted-foreground mb-1">
                        Discount Value ({discountType === 'percentage' ? '%' : '₹'}) <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={discountType === 'percentage' ? 100 : 500000}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full glass-panel px-3 py-1.5 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Targeting Scope */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Strategy Plan Scope
                    </label>
                    <select
                      value={appliesTo}
                      onChange={(e) => setAppliesTo(e.target.value as any)}
                      className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary bg-card mb-2"
                    >
                      <option value="all_plans">Applicable to ALL Advisory Plans</option>
                      <option value="specific_plan">Specific Strategy Plan Only</option>
                    </select>
                    {appliesTo === 'specific_plan' && (
                      <select
                        value={targetPlanId}
                        onChange={(e) => {
                          setTargetPlanId(e.target.value);
                          setPreviewPlanId(e.target.value);
                        }}
                        className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary bg-card"
                      >
                        {plans.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({formatINR(p.priceMinor)})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Investor Targeting Scope
                    </label>
                    <select
                      value={targetUserType}
                      onChange={(e) => setTargetUserType(e.target.value as any)}
                      className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary bg-card mb-2"
                    >
                      <option value="all_users">All Registered Investors</option>
                      <option value="specific_user">Restricted to Single Investor Email</option>
                    </select>
                    {targetUserType === 'specific_user' && (
                      <input
                        type="email"
                        required
                        placeholder="investor@domain.com"
                        value={targetUserEmail}
                        onChange={(e) => setTargetUserEmail(e.target.value)}
                        className="w-full glass-panel px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    )}
                  </div>
                </div>

                {/* Restrictions & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Usage / Redemption Limit (0 = Unlimited)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(Number(e.target.value))}
                      className="w-full glass-panel px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Minimum Order Value (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderRupees}
                      onChange={(e) => setMinOrderRupees(Number(e.target.value))}
                      className="w-full glass-panel px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Valid From (Start Date)
                    </label>
                    <input
                      type="date"
                      required
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full glass-panel px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1">
                      Valid Until (Expiry Date)
                    </label>
                    <input
                      type="date"
                      required
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full glass-panel px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Live Final Pricing Preview */}
                {previewPlan && (
                  <div className="p-3.5 rounded-lg glass-panel-data space-y-2 border border-border">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground font-semibold">Live Final Pricing Simulation:</span>
                      <span className="text-foreground font-bold">{previewPlan.name}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono pt-1">
                      <div>
                        <span className="text-muted-foreground block text-[9px]">Base Fee</span>
                        <span className="text-foreground font-semibold">₹{previewPlanBase.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px]">Discount</span>
                        <span className="text-[hsl(var(--success))] font-bold">-₹{previewDiscount.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[9px]">Taxable + 18% GST</span>
                        <span className="text-foreground font-semibold">₹{(previewTaxable + previewGst).toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-primary block text-[9px] font-bold">Investor Total</span>
                        <span className="text-primary font-bold text-xs">₹{previewFinalTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Toggle */}
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="couponActive"
                    checked={isCouponActive}
                    onChange={(e) => setIsCouponActive(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                  />
                  <label htmlFor="couponActive" className="text-xs font-medium text-foreground cursor-pointer">
                    Voucher is Active & Ready for Immediate Checkout Redemption
                  </label>
                </div>

                {/* Submit Row */}
                <div className="pt-4 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(false)}
                    className="glass-panel text-muted-foreground hover:text-foreground px-4 py-2 rounded text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-5 py-2 rounded text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? 'Saving...' : editingCoupon ? 'Update Voucher' : 'Deploy Voucher'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* DELETE CONFIRMATIONS */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 max-w-sm w-full rounded-xl space-y-4 shadow-2xl border-destructive/30"
            >
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="font-semibold text-sm text-foreground">Confirm Strategy Deletion</h4>
              </div>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                Are you sure you want to permanently delete this strategy tier? Existing subscriptions will remain active until expiry.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="glass-panel px-3 py-1.5 rounded text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePlan(deleteConfirmId)}
                  disabled={isDeleting}
                  className="bg-destructive text-white hover:opacity-90 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Strategy'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {couponDeleteId && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 max-w-sm w-full rounded-xl space-y-4 shadow-2xl border-destructive/30"
            >
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h4 className="font-semibold text-sm text-foreground">Confirm Voucher Deletion</h4>
              </div>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                Are you sure you want to delete this coupon voucher code? It will immediately stop accepting new checkouts.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCouponDeleteId(null)}
                  className="glass-panel px-3 py-1.5 rounded text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCoupon(couponDeleteId)}
                  disabled={isDeletingCoupon}
                  className="bg-destructive text-white hover:opacity-90 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {isDeletingCoupon ? 'Deleting...' : 'Delete Voucher'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
