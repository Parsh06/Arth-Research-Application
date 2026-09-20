import { motion, AnimatePresence } from 'framer-motion';
import { 
  Receipt, 
  Search, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  Copy, 
  Check, 
  ExternalLink, 
  X,
  Phone,
  RotateCcw,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { orderRepository } from '../../repositories/orderRepository';
import { portfolioRepository } from '../../repositories/portfolioRepository';
import type { Order } from '../../schemas/subscription.schema';
import { formatINR } from '../../utils/money';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';
import { paymentService } from '../../services/paymentService';
import { useToastStore } from '../../stores/toastStore';

// ─── AuditCell ─────────────────────────────────────────────────────────────────
// Reusable cell for the audit modal — renders a labelled field with copy support
interface AuditCellProps {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
  breakAll?: boolean;
  copyable?: boolean;
  monospace?: boolean;
  wide?: boolean;
}

function AuditCell({ label, value, bold, accent, breakAll, copyable, monospace, wide }: AuditCellProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [value]);

  return (
    <div className={`bg-slate-100 dark:bg-[#121926] border border-slate-200 dark:border-white/10 p-3 rounded-xl space-y-0.5 shadow-2xs ${wide ? 'sm:col-span-2' : ''}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">{label}</span>
        {copyable && value && value !== 'N/A' && (
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-primary transition-colors cursor-pointer"
            title="Copy"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
      <span className={`block text-[11px] ${bold ? 'font-bold' : 'font-semibold'} ${accent ? 'text-primary' : 'text-slate-900 dark:text-slate-100'} ${breakAll ? 'break-all' : 'truncate'} ${monospace ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export default function AdminPayments() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'failed' | 'created' | 'refunded'>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Refund state
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState<'duplicate' | 'fraudulent' | 'order_change' | 'customer_request' | 'other'>('customer_request');
  const [isRefunding, setIsRefunding] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = orderRepository.subscribeToAllOrders((allOrders) => {
      setOrders(allOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /**
   * Initiates a refund via Razorpay backend, then marks the order as refunded in Firestore.
   */
  const handleRefund = async (order: Order) => {
    if (!order.gatewayPaymentId) {
      addToast('No gateway payment ID found — cannot initiate refund.', 'error');
      return;
    }
    setIsRefunding(true);
    try {
      const result = await paymentService.initiateRefund({
        paymentId: order.gatewayPaymentId,
        reason: refundReason
      });

      if (result.success && result.refundId) {
        // Mark refunded in Firestore atomically
        await orderRepository.markOrderRefunded(
          order.id,
          order.gatewayPaymentId,
          {
            refundId: result.refundId,
            refundAmountMinor: result.amountMinor ?? order.totalMinor ?? 0,
            refundStatus: (result.status === 'processed' ? 'processed' : 'pending') as 'pending' | 'processed' | 'failed'
          }
        );
        addToast(`Refund initiated successfully. Refund ID: ${result.refundId}`, 'success');
        setRefundOrder(null);
        setSelectedOrder(null);
      } else {
        addToast(result.error || 'Refund initiation failed. Please verify transaction status and retry.', 'error');
      }
    } catch (err: any) {
      console.error('[AdminPayments] handleRefund error:', err);
      addToast('An unexpected error occurred during refund processing. Please retry.', 'error');
    } finally {
      setIsRefunding(false);
    }
  };

  // Sync with Razorpay & Provision state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPaymentId, setSyncPaymentId] = useState('');

  /**
   * Fetches real-time payment instrument details from Razorpay API
   * and provisions the order, subscription, entitlements, and portfolio.
   * Supports either a payment ID (pay_xxx) or an order ID (order_xxx).
   */
  const handleSyncWithRazorpay = async (order: Order, overridePaymentId?: string) => {
    const payId = (overridePaymentId || syncPaymentId || order.gatewayPaymentId || order.gatewayOrderId || '').trim();
    if (!payId) {
      addToast('Please enter a valid Razorpay Payment ID (pay_...) or Order ID (order_...)', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Call backend endpoint to fetch live verified payment details
      const rzpDetails = await paymentService.fetchPaymentDetails(payId);
      if (!rzpDetails.success) {
        addToast(rzpDetails.error || 'Failed to fetch payment details from Razorpay', 'error');
        setIsSyncing(false);
        return;
      }

      const verifiedPaymentId = rzpDetails.paymentId || (payId.startsWith('pay_') ? payId : `pay_verified_${order.id}`);
      const verifiedOrderId = rzpDetails.orderId || (payId.startsWith('order_') ? payId : order.gatewayOrderId || '');

      // 2. Complete payment & provision in Firestore
      await orderRepository.completePaymentAndProvision(order, {
        gatewayPaymentId: verifiedPaymentId,
        gatewayOrderId: verifiedOrderId,
        validityDays: order.validityDays || 30,
        planName: order.planName || 'Institutional Advisory Mandate',
        userEmail: order.userEmail || rzpDetails.customerEmail || '',
        userName: order.userName || 'Investor',
        userPhone: order.userPhone || rzpDetails.customerContact || undefined,
        paymentMode: rzpDetails.paymentMode,
        paymentMethod: rzpDetails.paymentMethod,
        vpa: rzpDetails.paymentMode === 'UPI' ? (rzpDetails.vpa || '') : '',
        cardNetwork: rzpDetails.cardNetwork || '',
        cardLast4: rzpDetails.cardLast4 || '',
        cardName: rzpDetails.cardName || '',
        cardIssuer: rzpDetails.cardIssuer || '',
        cardType: rzpDetails.cardType || '',
        cardSubType: rzpDetails.cardSubType || '',
        cardInternational: rzpDetails.cardInternational || false,
        bank: rzpDetails.bank || '',
        wallet: rzpDetails.wallet || '',
        emiDuration: rzpDetails.emiDuration ?? undefined,
        international: rzpDetails.international || false,
        razorpayFeeMinor: rzpDetails.razorpayFeeMinor,
        razorpayTaxMinor: rzpDetails.razorpayTaxMinor,
        acquirerAuthCode: rzpDetails.acquirerData?.authCode,
        acquirerBankTxnId: rzpDetails.acquirerData?.bankTransactionId,
        acquirerRrn: rzpDetails.acquirerData?.rrn,
        acquirerUpiTxnId: rzpDetails.acquirerData?.upiTransactionId
      });

      // 3. Update User profile with active subscription status
      try {
        const { userRepository } = await import('../../repositories/userRepository');
        await userRepository.updateUser(order.userId, {
          subscriptionStatus: 'active',
          activePlanId: order.planId,
          activePlanName: order.planName || 'Institutional Advisory Mandate',
          subscriptionExpiresAt: Date.now() + (order.validityDays || 30) * 86400000
        } as any);
      } catch (uErr) {
        console.warn('[AdminPayments] User profile update warning:', uErr);
      }

      // 4. Ensure initial portfolio exists so user sees the plan in their portfolio immediately
      try {
        const userPorts = await portfolioRepository.getUserPortfolios(order.userId).catch(() => []);
        const existing = userPorts.find(p => p.planId === order.planId);
        if (!existing) {
          await portfolioRepository.createPortfolioWithVersionAndHoldings({
            userId: order.userId,
            planId: order.planId || 'plan_default',
            planName: order.planName || 'Institutional Advisory Mandate',
            holdings: []
          });
        }
      } catch (pErr) {
        console.warn('[AdminPayments] Portfolio creation warning:', pErr);
      }

      addToast(
        `Order verified & captured! Payment instrument: ${rzpDetails.paymentMethod}. Mandate provisioned for ${order.userName || 'Investor'}.`,
        'success'
      );

      // Update selected order in state if modal is open
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({
          ...selectedOrder,
          status: 'completed',
          gatewayPaymentId: verifiedPaymentId,
          gatewayOrderId: verifiedOrderId,
          paymentMode: rzpDetails.paymentMode,
          paymentMethod: rzpDetails.paymentMethod,
          cardNetwork: rzpDetails.cardNetwork,
          cardLast4: rzpDetails.cardLast4,
          cardIssuer: rzpDetails.cardIssuer,
          cardType: rzpDetails.cardType,
          vpa: rzpDetails.paymentMode === 'UPI' ? (rzpDetails.vpa || '') : '',
          bank: rzpDetails.bank,
          wallet: rzpDetails.wallet,
          razorpayFeeMinor: rzpDetails.razorpayFeeMinor,
          razorpayTaxMinor: rzpDetails.razorpayTaxMinor,
          acquirerAuthCode: rzpDetails.acquirerData?.authCode,
          acquirerRrn: rzpDetails.acquirerData?.rrn,
          acquirerBankTxnId: rzpDetails.acquirerData?.bankTransactionId,
          acquirerUpiTxnId: rzpDetails.acquirerData?.upiTransactionId,
          paidAt: new Date().toISOString()
        } as any);
      }
    } catch (syncErr: any) {
      console.error('[AdminPayments] Sync error:', syncErr);
      addToast(syncErr.message || 'Synchronization failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Extract distinct plan names for filter
  const planNames = useMemo(() => {
    const names = new Set<string>();
    orders.forEach(o => {
      if (o.planName) names.add(o.planName);
    });
    return Array.from(names);
  }, [orders]);

  // Telemetry Calculations
  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const failedOrders = orders.filter(o => o.status === 'failed');
    
    // 1) Base Plan Revenue (Gross Plan Fee / Pre-Tax Subscription Fees)
    const baseRevenueMinor = completedOrders.reduce((sum, o) => sum + (o.priceMinor || 0), 0);
    // 2) Revenue for GST (18% Statutory Tax)
    const totalGstMinor = completedOrders.reduce((sum, o) => sum + (o.taxMinor || 0), 0);
    // 3) Revenue for 3% Gateway Surcharges & Handling
    const totalSurchargeMinor = completedOrders.reduce((sum, o) => sum + (o.gatewayFeeMinor || 0), 0);
    // 4) Final Net Settled Revenue
    const finalGrossRevenueMinor = completedOrders.reduce((sum, o) => sum + (o.totalMinor || 0), 0);

    const averageOrderValueMinor = completedOrders.length > 0 ? Math.round(finalGrossRevenueMinor / completedOrders.length) : 0;
    const totalAttempts = orders.length;
    const successRate = totalAttempts > 0 ? Math.round((completedOrders.length / totalAttempts) * 100) : 0;

    return {
      baseRevenueMinor,
      totalGstMinor,
      totalSurchargeMinor,
      finalGrossRevenueMinor,
      averageOrderValueMinor,
      totalCompleted: completedOrders.length,
      totalFailed: failedOrders.length,
      totalAttempts,
      successRate
    };
  }, [orders]);

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Plan Filter
      if (selectedPlan !== 'ALL' && order.planName !== selectedPlan) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.id?.toLowerCase().includes(query);
        const matchesEmail = order.userEmail?.toLowerCase().includes(query);
        const matchesName = order.userName?.toLowerCase().includes(query);
        const matchesPhone = order.userPhone?.toLowerCase().includes(query);
        const matchesPlan = order.planName?.toLowerCase().includes(query);
        const matchesGatewayId = order.gatewayPaymentId?.toLowerCase().includes(query);
        const matchesInvoice = order.invoiceNumber?.toLowerCase().includes(query);
        const matchesFailure = order.failureReason?.toLowerCase().includes(query);

        if (!matchesId && !matchesEmail && !matchesName && !matchesPhone && !matchesPlan && !matchesGatewayId && !matchesInvoice && !matchesFailure) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'amount_desc') {
        return (b.totalMinor || 0) - (a.totalMinor || 0);
      }
      if (sortBy === 'amount_asc') {
        return (a.totalMinor || 0) - (b.totalMinor || 0);
      }
      return 0;
    });
  }, [orders, statusFilter, selectedPlan, searchQuery, sortBy]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (orders.length === 0) return;

    const headers = [
      'Order ID',
      'Created Date (ISO)',
      'Investor Name',
      'Investor Email',
      'Investor Phone',
      'Plan Name',
      'Payment Mode',
      'Payment Instrument',
      'Validity (Days)',
      'Status',
      'Base Price (INR)',
      'GST 18% (INR)',
      'Gateway Surcharge (INR)',
      'Total Amount (INR)',
      'Gateway Payment ID',
      'Gateway Order ID',
      'Invoice Number',
      'Failure Reason'
    ];

    const rows = filteredOrders.map(o => [
      `"${o.id}"`,
      `"${o.createdAt}"`,
      `"${o.userName || 'Investor'}"`,
      `"${o.userEmail || ''}"`,
      `"${o.userPhone || ''}"`,
      `"${o.planName || ''}"`,
      `"${o.paymentMode || 'UPI'}"`,
      `"${o.paymentMethod || o.vpa || o.paymentMode || 'UPI'}"`,
      o.validityDays || 30,
      `"${o.status}"`,
      ((o.priceMinor || 0) / 100).toFixed(2),
      ((o.taxMinor || 0) / 100).toFixed(2),
      ((o.gatewayFeeMinor || 0) / 100).toFixed(2),
      ((o.totalMinor || 0) / 100).toFixed(2),
      `"${o.gatewayPaymentId || ''}"`,
      `"${o.gatewayOrderId || ''}"`,
      `"${o.invoiceNumber || ''}"`,
      `"${(o.failureReason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arth_research_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
              Super Admin Clearance
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Ledger Stream
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Payments, Revenue & Gateway Ledger
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Audit all subscription transactions, gateway settlement IDs, tax breakdowns, and diagnostic failure records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            disabled={orders.length === 0}
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Primary 4-Part Revenue Metric Ledger Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Base Plan Revenue */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">1. Total Base Revenue</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1">
            {formatINR(stats.baseRevenueMinor)}
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>Net Plan Mandate Fees</span>
            <span className="text-emerald-500 font-semibold">{stats.totalCompleted} Settled</span>
          </div>
        </motion.div>

        {/* 2. Statutory GST (18%) */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">2. Statutory GST (18%)</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Tax</span>
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-amber-500 dark:text-amber-400 mt-1">
            {formatINR(stats.totalGstMinor)}
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>Statutory Tax Collected</span>
            <span className="text-muted-foreground font-mono">18.0% Rate</span>
          </div>
        </motion.div>

        {/* 3. Gateway Surcharges (3%) */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">3. Surcharges (3%)</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Gateway</span>
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-blue-500 dark:text-blue-400 mt-1">
            {formatINR(stats.totalSurchargeMinor)}
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>Payment Gateway Handling</span>
            <span className="text-muted-foreground font-mono">3.0% Surge</span>
          </div>
        </motion.div>

        {/* 4. Final Settled Revenue */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-panel p-5 border-l-4 border-l-primary bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-bold">4. Final Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-bold tracking-tight text-foreground mt-1">
            {formatINR(stats.finalGrossRevenueMinor)}
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>Net Total Invoiced & Settled</span>
            <span className="text-emerald-500 font-bold">{stats.successRate}% Success</span>
          </div>
        </motion.div>
      </div>

      {/* Secondary Operational Diagnostics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel-data p-3 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">Gateway Success Rate:</span>
          <span className="font-bold text-emerald-500">{stats.successRate}% ({stats.totalCompleted}/{stats.totalAttempts})</span>
        </div>
        <div className="glass-panel-data p-3 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">Failed Attempts:</span>
          <span className={`font-bold ${stats.totalFailed > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{stats.totalFailed}</span>
        </div>
        <div className="glass-panel-data p-3 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">Avg Order Value:</span>
          <span className="font-bold text-foreground">{formatINR(stats.averageOrderValueMinor)}</span>
        </div>
        <div className="glass-panel-data p-3 flex items-center justify-between text-xs font-mono">
          <span className="text-muted-foreground">Settled Mandates:</span>
          <span className="font-bold text-primary">{stats.totalCompleted} Completed</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 space-y-4">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex flex-wrap gap-1.5 p-1 rounded-md glass-panel-data">
            {[
              { id: 'ALL', label: 'All Transactions', count: orders.length },
              { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
              { id: 'failed', label: 'Failed', count: orders.filter(o => o.status === 'failed').length },
              { id: 'created', label: 'Created / In Progress', count: orders.filter(o => o.status === 'created' || o.status === 'processing').length },
              { id: 'refunded', label: 'Refunded', count: orders.filter(o => o.status === 'refunded').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === tab.id 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredOrders.length}</span> records
          </div>
        </div>

        {/* Search & Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          
          {/* Search Bar */}
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Investor, Email, Order ID, Payment Ref (pay_...), Invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-md pl-9 pr-3.5 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Plan Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="ALL">All Advisory Plans</option>
              {planNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-card border border-border rounded-md px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer"
            >
              <option value="date_desc">Sort: Newest First</option>
              <option value="date_asc">Sort: Oldest First</option>
              <option value="amount_desc">Sort: Highest Amount</option>
              <option value="amount_asc">Sort: Lowest Amount</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Transactions Table */}
      <div className="glass-panel overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono tracking-wider text-muted-foreground">Streaming Transaction Ledger...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Receipt className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-sm font-semibold text-foreground">No Transactions Found</h3>
            <p className="text-xs text-muted-foreground font-mono max-w-sm mx-auto">
              No orders match your current status, plan, or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-card/60 text-muted-foreground text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction / Date</th>
                  <th className="py-3 px-4">Investor Details</th>
                  <th className="py-3 px-4">Advisory Strategy</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4 text-right">Settled Amount</th>
                  <th className="py-3 px-4 text-center">Status & Diagnostics</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((order) => {
                  const isSuccess = order.status === 'completed';
                  const isFailed = order.status === 'failed';
                  const isCreated = order.status === 'created' || order.status === 'processing';
                  const isRefunded = order.status === 'refunded';

                  return (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors group">
                      
                      {/* 1. Transaction Ref / Date */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground text-xs">{order.id.slice(0, 10)}...</span>
                          <button
                            onClick={() => handleCopy(order.id, `order_${order.id}`)}
                            title="Copy Order ID"
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                          >
                            {copiedField === `order_${order.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        </div>

                        {order.gatewayPaymentId ? (
                          <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                            <span className="truncate max-w-[120px]">{order.gatewayPaymentId}</span>
                            <button
                              onClick={() => handleCopy(order.gatewayPaymentId!, `pay_${order.id}`)}
                              title="Copy Payment ID"
                              className="hover:text-foreground cursor-pointer"
                            >
                              {copiedField === `pay_${order.id}` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                        ) : null}

                        <div className="text-[10px] text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* 2. Investor Details */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-foreground truncate max-w-[160px]">
                          {order.userName || 'Investor'}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[180px] mt-0.5">
                          {order.userEmail || order.userId}
                        </div>
                        {order.userPhone ? (
                          <div className="text-[10px] text-primary truncate max-w-[180px] mt-0.5 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            <span>{order.userPhone}</span>
                          </div>
                        ) : null}
                        <span className="text-[9.5px] text-muted-foreground/70 uppercase block mt-0.5">UID: {order.userId.slice(0, 8)}</span>
                      </td>

                      {/* 3. Advisory Strategy */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-primary truncate max-w-[160px]">
                          {order.planName || 'Quant Strategy'}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {order.validityDays ? `${order.validityDays} Days Mandate` : 'Active Mandate'}
                        </div>
                        {order.couponCode && (
                          <span className="inline-block mt-1 text-[9.5px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                            Coupon: {order.couponCode}
                          </span>
                        )}
                      </td>

                      {/* 4. Payment Mode / Instrument */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            (order.paymentMode || order.paymentMethod || '').toUpperCase().includes('CARD')
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : (order.paymentMode || order.paymentMethod || '').toUpperCase().includes('NET')
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}>
                            <CreditCard className="w-2.5 h-2.5" />
                            <span>{order.paymentMode || 'UPI'}</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[140px]" title={order.paymentMethod || order.vpa || ''}>
                          {order.vpa ? `VPA: ${order.vpa}` : (order.paymentMethod || 'Direct Settle')}
                        </div>
                      </td>

                      {/* 5. Financial Breakdown */}
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="text-sm font-semibold text-foreground tabular-nums">
                          {formatINR(order.totalMinor || 0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                          Base: {formatINR(order.priceMinor || 0)}
                        </div>
                        <div className="text-[9.5px] text-muted-foreground/70 tabular-nums">
                          GST 18%: {formatINR(order.taxMinor || 0)}
                        </div>
                      </td>

                      {/* 6. Status & Diagnostics */}
                      <td className="py-3.5 px-4 text-center align-top">
                        {isSuccess && (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </span>
                            {order.invoiceNumber && (
                              <span className="text-[9.5px] text-muted-foreground mt-1">
                                {order.invoiceNumber}
                              </span>
                            )}
                          </div>
                        )}

                        {isFailed && (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[hsl(var(--destructive))/0.15] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive))/0.3] text-[10px] font-semibold uppercase">
                              <AlertCircle className="w-3 h-3" />
                              <span>Failed</span>
                            </span>
                            {order.failureReason && (
                              <p 
                                className="text-[10px] text-red-400 mt-1 max-w-[180px] truncate cursor-pointer hover:underline"
                                title={order.failureReason}
                                onClick={() => setSelectedOrder(order)}
                              >
                                {order.failureReason}
                              </p>
                            )}
                          </div>
                        )}

                        {isCreated && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-semibold uppercase">
                            <Clock className="w-3 h-3 animate-pulse" />
                            <span>In Progress</span>
                          </span>
                        )}

                        {isRefunded && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-semibold uppercase">
                            <span>Refunded</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Action */}
                      <td className="py-3.5 px-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSuccess && (
                            <button
                              onClick={() => {
                                const targetId = (order.gatewayPaymentId || order.gatewayOrderId || '').trim();
                                setSelectedOrder(order);
                                setSyncPaymentId(targetId);
                                if (targetId) {
                                  handleSyncWithRazorpay(order, targetId);
                                }
                              }}
                              title="Sync with Razorpay Gateway & Provision Mandate"
                              className="px-2 py-1 rounded bg-primary/10 border border-primary/25 hover:bg-primary/20 text-primary text-[11px] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1 font-mono font-semibold"
                            >
                              <RefreshCw className={`w-3 h-3 ${isSyncing && selectedOrder?.id === order.id ? 'animate-spin' : ''}`} />
                              <span>Sync</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setSyncPaymentId(order.gatewayPaymentId || '');
                            }}
                            className="px-2.5 py-1 rounded bg-card border border-border hover:border-primary/50 text-foreground hover:text-primary text-[11px] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                          >
                            <span>Audit</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Telemetry Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0E1420] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center border border-primary/30">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Transaction Audit Diagnostic</h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Order ID: {selectedOrder.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-7 h-7 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              {selectedOrder.status === 'failed' ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Payment Processing Failed</span>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300 font-mono pl-6 leading-relaxed">
                    <strong className="text-red-800 dark:text-red-200">Failure Diagnostic:</strong> {selectedOrder.failureReason || 'Declined by banking gateway or authorization timeout.'}
                  </p>
                  {selectedOrder.errorCode && (
                    <p className="text-[10px] text-red-600/80 dark:text-red-400/80 font-mono pl-6">
                      Gateway Error Code: {selectedOrder.errorCode}
                    </p>
                  )}
                </div>
              ) : selectedOrder.status === 'completed' ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Settlement Captured & Strategy Entitlements Provisioned</span>
                </div>
              ) : null}

              {/* ── GATEWAY RECONCILIATION & LIVE SYNCHRONIZATION ── */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary text-xs font-bold font-mono">
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Razorpay Gateway Reconciliation & Mandate Provisioning</span>
                  </div>
                  {selectedOrder.status === 'completed' ? (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Settled & Synced
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Needs Verification
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground font-mono leading-relaxed">
                  Query live transaction status and instrument details (Card brand, last 4 digits, bank issuer, acquirer auth code, platform fees) directly from Razorpay. Synchronizing will automatically update order status to Completed and provision the investor's research mandate and portfolio.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={syncPaymentId}
                    onChange={(e) => setSyncPaymentId(e.target.value)}
                    placeholder="Enter Payment ID or Order ID (e.g. pay_TeEesyKYh4Ie7L or order_TeEe3SjTXno2TK)"
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => handleSyncWithRazorpay(selectedOrder, syncPaymentId)}
                    disabled={isSyncing || (!syncPaymentId.trim() && !selectedOrder.gatewayPaymentId && !selectedOrder.gatewayOrderId)}
                    className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer font-mono whitespace-nowrap shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Verifying Gateway...' : 'Sync Live & Provision'}</span>
                  </button>
                </div>
              </div>

              {/* ── SECTION 1: Investor Details ─────────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary/30 border border-primary/40 inline-block" />
                  Investor Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  <AuditCell label="Investor Name" value={selectedOrder.userName || 'Investor'} bold />
                  <AuditCell label="Investor Email" value={selectedOrder.userEmail || 'N/A'} breakAll />
                  <AuditCell label="Contact / Phone" value={selectedOrder.userPhone || 'Not Provided'} />
                  <AuditCell label="Strategy Mandate" value={selectedOrder.planName || 'Quant Strategy'} accent />
                  <AuditCell label="Validity" value={selectedOrder.validityDays ? `${selectedOrder.validityDays} Days` : '30 Days'} />
                  <AuditCell label="Tax Invoice" value={selectedOrder.invoiceNumber || 'Pending Issuance'} />
                </div>
              </div>

              {/* ── SECTION 2: Gateway IDs ────────────────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500/40 inline-block" />
                  Gateway Reference IDs
                </h4>
                <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
                  <AuditCell label="Razorpay Payment ID" value={selectedOrder.gatewayPaymentId || 'N/A'} copyable monospace />
                  <AuditCell label="Razorpay Order ID" value={selectedOrder.gatewayOrderId || 'N/A'} copyable monospace />
                </div>
              </div>

              {/* ── SECTION 3: Payment Instrument ────────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500/40 inline-block" />
                  Payment Instrument
                </h4>
                <div className="bg-slate-100 dark:bg-[#121926] border border-slate-200 dark:border-white/10 p-4 rounded-xl space-y-3 shadow-2xs">
                  {/* Mode badge + method label */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider ${
                      (selectedOrder.paymentMode || '').includes('CARD')
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : (selectedOrder.paymentMode || '').includes('NET')
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : (selectedOrder.paymentMode || '').includes('WALLET')
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : (selectedOrder.paymentMode || '').includes('EMI')
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    }`}>
                      {selectedOrder.paymentMode || 'UPI'}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {selectedOrder.paymentMethod || selectedOrder.vpa || 'Direct Payment'}
                    </span>
                    {(selectedOrder as any).international && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-500/15 text-orange-400 border border-orange-500/25">
                        International
                      </span>
                    )}
                  </div>

                  {/* UPI specific */}
                  {selectedOrder.vpa && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <AuditCell label="UPI VPA / Handle" value={selectedOrder.vpa} copyable />
                      {(selectedOrder as any).acquirerUpiTxnId && (
                        <AuditCell label="UPI Transaction ID" value={(selectedOrder as any).acquirerUpiTxnId} copyable monospace />
                      )}
                    </div>
                  )}

                  {/* Card specific */}
                  {selectedOrder.cardLast4 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <AuditCell label="Card Network" value={selectedOrder.cardNetwork || 'N/A'} />
                      <AuditCell label="Last 4 Digits" value={`•••• ${selectedOrder.cardLast4}`} />
                      {(selectedOrder as any).cardType && (
                        <AuditCell label="Card Type" value={(selectedOrder as any).cardType} />
                      )}
                      {(selectedOrder as any).cardIssuer && (
                        <AuditCell label="Issuing Bank" value={(selectedOrder as any).cardIssuer} />
                      )}
                      {(selectedOrder as any).cardName && (
                        <AuditCell label="Card Holder" value={(selectedOrder as any).cardName} />
                      )}
                      {(selectedOrder as any).cardSubType && (
                        <AuditCell label="Card Sub-Type" value={(selectedOrder as any).cardSubType} />
                      )}
                    </div>
                  )}

                  {/* Netbanking specific */}
                  {selectedOrder.bank && !selectedOrder.cardLast4 && (
                    <AuditCell label="Bank" value={selectedOrder.bank} />
                  )}

                  {/* Wallet specific */}
                  {selectedOrder.wallet && (
                    <AuditCell label="Wallet Provider" value={selectedOrder.wallet} />
                  )}

                  {/* EMI specific */}
                  {(selectedOrder as any).emiDuration && (
                    <AuditCell label="EMI Duration" value={`${(selectedOrder as any).emiDuration} months`} />
                  )}
                </div>
              </div>

              {/* ── SECTION 4: Financial Breakdown ───────────────────────────── */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/40 inline-block" />
                  Financial Ledger Breakdown
                </h4>
                <div className="bg-slate-100 dark:bg-[#121926] border border-slate-200 dark:border-white/10 p-4 rounded-xl space-y-2 text-xs font-mono shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                    <span>Ledger Item</span>
                    <span>Amount (INR)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Base Plan Fee</span>
                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{formatINR(selectedOrder.priceMinor || 0)}</span>
                  </div>
                  {(selectedOrder.discountMinor ?? 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Voucher Discount{selectedOrder.couponCode ? ` (${selectedOrder.couponCode})` : ''}</span>
                      <span>− {formatINR(selectedOrder.discountMinor || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>GST (18% Statutory)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{formatINR(selectedOrder.taxMinor || 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Payment Gateway Surcharge (3%)</span>
                    <span className="text-slate-900 dark:text-slate-200 font-semibold">{formatINR(selectedOrder.gatewayFeeMinor || 0)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/10 font-bold text-sm text-slate-900 dark:text-white">
                    <span>Net Total Invoiced</span>
                    <span className="text-primary font-extrabold">{formatINR(selectedOrder.totalMinor || 0)}</span>
                  </div>

                  {/* Razorpay's own processing fee — separate from our 3% */}
                  {((selectedOrder as any).razorpayFeeMinor > 0 || (selectedOrder as any).razorpayTaxMinor > 0) && (
                    <div className="pt-2 mt-1 border-t border-slate-200/60 dark:border-white/5 space-y-1.5 text-[10px] text-slate-500 dark:text-slate-500">
                      <div className="flex justify-between">
                        <span>Razorpay Platform Fee (incl. GST)</span>
                        <span>{formatINR((selectedOrder as any).razorpayFeeMinor || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST on Platform Fee</span>
                        <span>{formatINR((selectedOrder as any).razorpayTaxMinor || 0)}</span>
                      </div>
                      <p className="text-[9.5px] text-slate-400/70">* Razorpay fees are settled separately by Razorpay. Net settlement = Total − Platform Fee.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── SECTION 5: Acquirer / Bank Telemetry ─────────────────────── */}
              {((selectedOrder as any).acquirerAuthCode || (selectedOrder as any).acquirerRrn || (selectedOrder as any).acquirerBankTxnId || (selectedOrder as any).acquirerUpiTxnId) && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/40 inline-block" />
                    Acquirer & Bank Reference Data
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {(selectedOrder as any).acquirerAuthCode && (
                      <AuditCell label="Auth Code" value={(selectedOrder as any).acquirerAuthCode} copyable monospace />
                    )}
                    {(selectedOrder as any).acquirerRrn && (
                      <AuditCell label="Retrieval Reference No. (RRN)" value={(selectedOrder as any).acquirerRrn} copyable monospace />
                    )}
                    {(selectedOrder as any).acquirerBankTxnId && (
                      <AuditCell label="Bank Transaction ID" value={(selectedOrder as any).acquirerBankTxnId} copyable monospace />
                    )}
                    {(selectedOrder as any).acquirerUpiTxnId && !selectedOrder.vpa && (
                      <AuditCell label="UPI Transaction ID" value={(selectedOrder as any).acquirerUpiTxnId} copyable monospace />
                    )}
                  </div>
                </div>
              )}

              {/* ── SECTION 6: Error Diagnostics (failed only) ───────────────── */}
              {selectedOrder.status === 'failed' && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-red-500/80 tracking-wider flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/40 inline-block" />
                    Failure Diagnostics
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {selectedOrder.failureReason && <AuditCell label="Failure Reason" value={selectedOrder.failureReason} />}
                    {selectedOrder.errorCode && <AuditCell label="Error Code" value={selectedOrder.errorCode} />}
                    {(selectedOrder as any).errorDescription && <AuditCell label="Error Description" value={(selectedOrder as any).errorDescription} wide />}
                    {(selectedOrder as any).errorSource && <AuditCell label="Error Source" value={(selectedOrder as any).errorSource} />}
                    {(selectedOrder as any).errorStep && <AuditCell label="Error Step" value={(selectedOrder as any).errorStep} />}
                    {(selectedOrder as any).errorReason && <AuditCell label="Error Reason" value={(selectedOrder as any).errorReason} />}
                  </div>
                </div>
              )}

              {/* ── SECTION 7: Refund Info (if refunded) ─────────────────────── */}
              {selectedOrder.status === 'refunded' && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-purple-500/80 tracking-wider flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500/30 border border-purple-500/40 inline-block" />
                    Refund Record
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {selectedOrder.refundId && <AuditCell label="Refund ID" value={selectedOrder.refundId} copyable monospace />}
                    {selectedOrder.refundAmountMinor !== undefined && <AuditCell label="Refunded Amount" value={formatINR(selectedOrder.refundAmountMinor || 0)} />}
                    {selectedOrder.refundStatus && <AuditCell label="Refund Status" value={selectedOrder.refundStatus} />}
                    {selectedOrder.refundedAt && <AuditCell label="Refunded At" value={new Date(selectedOrder.refundedAt).toLocaleString('en-IN')} />}
                  </div>
                </div>
              )}

              {/* ── SECTION 8: HMAC Signature ─────────────────────────────────── */}
              {selectedOrder.gatewaySignature && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Cryptographic HMAC Signature</h4>
                  <p className="text-[10px] text-slate-700 dark:text-slate-300 break-all bg-slate-100 dark:bg-[#0A0E16] p-2.5 rounded-lg border border-slate-200 dark:border-white/10 font-mono">
                    {selectedOrder.gatewaySignature}
                  </p>
                </div>
              )}


              <div className="pt-2 flex justify-between items-center gap-2">
                {selectedOrder.status === 'completed' ? (
                  <button
                    onClick={() => {
                      const invoiceData = {
                        invoiceNumber: selectedOrder.invoiceNumber || `INV-ARTH-${new Date().getFullYear()}-${selectedOrder.id.slice(0, 6).toUpperCase()}`,
                        paymentDate: new Date(selectedOrder.paidAt || selectedOrder.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                        paymentId: selectedOrder.gatewayPaymentId || 'pay_manual',
                        orderId: selectedOrder.id,
                        userName: selectedOrder.userName || 'Valued Investor',
                        userEmail: selectedOrder.userEmail || '',
                        planName: selectedOrder.planName || 'Advisory Plan',
                        validityDays: selectedOrder.validityDays || 30,
                        basePriceMinor: selectedOrder.priceMinor || 0,
                        discountMinor: selectedOrder.discountMinor || 0,
                        taxMinor: selectedOrder.taxMinor || 0,
                        gatewayFeeMinor: selectedOrder.gatewayFeeMinor || 0,
                        totalMinor: selectedOrder.totalMinor || 0,
                        paymentMode: selectedOrder.paymentMode || 'UPI',
                        paymentMethod: selectedOrder.paymentMethod || selectedOrder.vpa || 'UPI'
                      };
                      downloadInvoicePdf(invoiceData);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-primary/15 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Tax Invoice (PDF)</span>
                  </button>
                ) : <div />}

                {/* Issue Refund button — only for completed orders with a gateway payment ID */}
                {selectedOrder.status === 'completed' && selectedOrder.gatewayPaymentId && (
                  <button
                    onClick={() => {
                      setRefundOrder(selectedOrder);
                    }}
                    className="px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Issue Refund</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-[#182234] dark:hover:bg-[#202C42] border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold cursor-pointer transition-colors"
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════
          REFUND CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {refundOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0E1420] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center border border-red-500/30">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Initiate Refund</h3>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
                  </div>
                </div>
                <button
                  onClick={() => setRefundOrder(null)}
                  disabled={isRefunding}
                  className="w-7 h-7 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Refund Summary */}
              <div className="p-4 rounded-xl bg-red-500/8 border border-red-500/25 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Investor</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{refundOrder.userName || 'Investor'}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Plan</span>
                  <span className="font-semibold text-primary">{refundOrder.planName}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Gateway Payment ID</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[10px] truncate max-w-[180px]">{refundOrder.gatewayPaymentId}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-500/20 font-bold text-sm">
                  <span className="text-slate-700 dark:text-slate-300">Full Refund Amount</span>
                  <span className="text-red-500 font-extrabold">{formatINR(refundOrder.totalMinor || 0)}</span>
                </div>
              </div>

              {/* Reason Selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">Refund Reason</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value as any)}
                  disabled={isRefunding}
                  className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer disabled:opacity-60"
                >
                  <option value="customer_request">Customer Request</option>
                  <option value="duplicate">Duplicate Payment</option>
                  <option value="fraudulent">Fraudulent Transaction</option>
                  <option value="order_change">Order / Plan Change</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Warning notice */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-700 dark:text-amber-400 leading-relaxed">
                ⚠ A full refund of <strong>{formatINR(refundOrder.totalMinor || 0)}</strong> will be initiated via Razorpay. Settlement typically takes 5–7 business days. This cannot be reversed.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setRefundOrder(null)}
                  disabled={isRefunding}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-[#182234] dark:hover:bg-[#202C42] border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold cursor-pointer transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRefund(refundOrder)}
                  disabled={isRefunding}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold cursor-pointer transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
                >
                  {isRefunding ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Processing Refund...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirm Refund</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
