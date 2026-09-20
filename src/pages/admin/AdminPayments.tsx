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
  Phone
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { orderRepository } from '../../repositories/orderRepository';
import type { Order } from '../../schemas/subscription.schema';
import { formatINR } from '../../utils/money';
import { downloadInvoicePdf } from '../../utils/invoicePdfGenerator';

export default function AdminPayments() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'failed' | 'created' | 'refunded'>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    
    const grossRevenueMinor = completedOrders.reduce((sum, o) => sum + (o.totalMinor || 0), 0);
    const totalGstMinor = completedOrders.reduce((sum, o) => sum + (o.taxMinor || 0), 0);
    const totalGatewayFeesMinor = completedOrders.reduce((sum, o) => sum + (o.gatewayFeeMinor || 0), 0);
    const averageOrderValueMinor = completedOrders.length > 0 ? Math.round(grossRevenueMinor / completedOrders.length) : 0;
    
    const totalAttempts = orders.length;
    const successRate = totalAttempts > 0 ? Math.round((completedOrders.length / totalAttempts) * 100) : 0;

    return {
      grossRevenueMinor,
      totalGstMinor,
      totalGatewayFeesMinor,
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
            Payments, Revenue & Gateway Telemetry
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

      {/* Financial Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Gross Revenue Settled</span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1">
            {formatINR(stats.grossRevenueMinor)}
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1 flex items-center gap-1">
            <span className="text-emerald-500 font-semibold">{stats.totalCompleted}</span> completed mandates
          </div>
        </motion.div>

        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Gateway Success Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-emerald-500 mt-1">
            {stats.successRate}%
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            {stats.totalCompleted} of {stats.totalAttempts} total attempts
          </div>
        </motion.div>

        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Failed Attempts</span>
            <AlertCircle className="w-4 h-4 text-[hsl(var(--destructive))]" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-[hsl(var(--destructive))] mt-1">
            {stats.totalFailed}
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            Logged with error telemetry
          </div>
        </motion.div>

        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="glass-panel p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Average Order Value</span>
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mt-1">
            {formatINR(stats.averageOrderValueMinor)}
          </p>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            Per active strategy mandate
          </div>
        </motion.div>
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
            <span className="text-xs font-mono tracking-wider text-muted-foreground">Streaming Ledger Telemetry...</span>
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
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 rounded bg-card border border-border hover:border-primary/50 text-foreground hover:text-primary text-[11px] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <span>Audit</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Transaction Audit Diagnostic</h3>
                    <p className="text-[11px] font-mono text-muted-foreground">Order ID: {selectedOrder.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              {selectedOrder.status === 'failed' ? (
                <div className="p-4 rounded-lg bg-[hsl(var(--destructive))/0.1] border border-[hsl(var(--destructive))/0.3] space-y-1">
                  <div className="flex items-center gap-2 text-[hsl(var(--destructive))] text-xs font-semibold font-mono">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Payment Processing Failed</span>
                  </div>
                  <p className="text-xs text-red-300 font-mono pl-6 leading-relaxed">
                    <strong className="text-red-200">Failure Diagnostic:</strong> {selectedOrder.failureReason || 'Declined by banking gateway or authorization timeout.'}
                  </p>
                  {selectedOrder.errorCode && (
                    <p className="text-[10px] text-muted-foreground font-mono pl-6">
                      Gateway Error Code: {selectedOrder.errorCode}
                    </p>
                  )}
                </div>
              ) : selectedOrder.status === 'completed' ? (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-500 text-xs font-mono">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Settlement Captured & Strategy Entitlements Provisioned</span>
                </div>
              ) : null}

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Investor Name</span>
                  <span className="font-semibold text-foreground">{selectedOrder.userName || 'Investor'}</span>
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Investor Email</span>
                  <span className="font-semibold text-foreground">{selectedOrder.userEmail || 'N/A'}</span>
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Investor Phone (Contact)</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-primary" />
                    {selectedOrder.userPhone || 'Not Provided'}
                  </span>
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Strategy Mandate</span>
                  <span className="font-semibold text-primary">{selectedOrder.planName || 'Quant Strategy'}</span>
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Validity Duration</span>
                  <span className="font-semibold text-foreground">{selectedOrder.validityDays ? `${selectedOrder.validityDays} Days` : '30 Days'}</span>
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Payment Mode & Instrument</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold uppercase">
                      {selectedOrder.paymentMode || 'UPI'}
                    </span>
                    <span className="text-foreground text-[11px] truncate">
                      {selectedOrder.paymentMethod || selectedOrder.vpa || 'Direct Payment'}
                    </span>
                  </div>
                  {selectedOrder.vpa && (
                    <span className="text-[10px] text-muted-foreground block">VPA: {selectedOrder.vpa}</span>
                  )}
                  {selectedOrder.cardLast4 && (
                    <span className="text-[10px] text-muted-foreground block">Card: •••• {selectedOrder.cardLast4} ({selectedOrder.cardNetwork || 'Card'})</span>
                  )}
                  {selectedOrder.bank && (
                    <span className="text-[10px] text-muted-foreground block">Bank: {selectedOrder.bank}</span>
                  )}
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Tax Invoice Number</span>
                  <span className="font-semibold text-foreground truncate block">{selectedOrder.invoiceNumber || 'Pending Issuance'}</span>
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Gateway Payment ID</span>
                  <span className="font-semibold text-foreground truncate block">{selectedOrder.gatewayPaymentId || 'N/A'}</span>
                </div>

                <div className="glass-panel-data p-3 rounded-lg space-y-1">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Gateway Order ID</span>
                  <span className="font-semibold text-foreground truncate block">{selectedOrder.gatewayOrderId || 'N/A'}</span>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="glass-panel-data p-4 rounded-lg space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-border font-semibold text-foreground">
                  <span>Ledger Item</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Base Plan Fee</span>
                  <span>{formatINR(selectedOrder.priceMinor || 0)}</span>
                </div>
                {selectedOrder.discountMinor ? (
                  <div className="flex justify-between text-emerald-500">
                    <span>Voucher Discount</span>
                    <span>- {formatINR(selectedOrder.discountMinor)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (18% Statutory Rate)</span>
                  <span>{formatINR(selectedOrder.taxMinor || 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment Gateway Surcharge (3%)</span>
                  <span>{formatINR(selectedOrder.gatewayFeeMinor || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-bold text-sm text-foreground">
                  <span>Net Total Amount</span>
                  <span>{formatINR(selectedOrder.totalMinor || 0)}</span>
                </div>
              </div>

              {/* Gateway Cryptographic Signature */}
              {selectedOrder.gatewaySignature && (
                <div className="glass-panel-data p-3 rounded-lg space-y-1 text-xs font-mono">
                  <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Cryptographic HMAC Signature</span>
                  <p className="text-[10px] text-muted-foreground break-all bg-card p-2 rounded border border-border">
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
                    className="px-3.5 py-2 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-mono font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Tax Invoice (PDF)</span>
                  </button>
                ) : <div />}

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-md bg-card border border-border text-foreground hover:bg-muted/40 text-xs font-mono cursor-pointer transition-colors"
                >
                  Close Audit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
