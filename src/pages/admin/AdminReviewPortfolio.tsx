// src/pages/admin/AdminReviewPortfolio.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { usePlanStore } from '../../stores/planStore';
import { auditRepository } from '../../repositories/auditRepository';
import { portfolioRepository } from '../../repositories/portfolioRepository';
import type { Portfolio, PortfolioHolding } from '../../schemas/portfolio.schema';
import { formatINR } from '../../utils/money';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

export default function AdminReviewPortfolio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { plans, fetchPlans } = usePlanStore();
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [plan, setPlan] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!id) return;
      try {
        const port = await portfolioRepository.getPortfolio(id);
        if (port) {
          setPortfolio(port);
          portfolioRepository.subscribeToHoldings(port.id, (h) => {
            setHoldings(h);
          });
        } else {
          alert('Portfolio not found');
          navigate('/admin/dashboard');
        }
      } catch (err) {
        console.error("Error fetching portfolio", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPortfolio();
  }, [id, navigate]);

  useEffect(() => {
    if (portfolio && plans.length > 0) {
      const foundPlan = plans.find(p => p.id === portfolio.planId);
      setPlan(foundPlan || null);
    }
  }, [portfolio, plans]);

  const handleApprove = async () => {
    if (!id || !user || !portfolio) return;
    if (!window.confirm("Are you sure you want to APPROVE and ACTIVATE this portfolio?")) return;
    
    setIsProcessing(true);
    try {
      const validityDays = plan?.validityDays || 30;
      await portfolioRepository.approvePortfolio(id, validityDays, user.uid);
      
      await auditRepository.logAction({
        adminId: user.uid,
        adminEmail: user.email || 'Admin',
        action: 'APPROVE_PORTFOLIO',
        targetId: id,
        targetType: 'portfolio',
        details: { message: `Approved portfolio ${id} for user ${portfolio.userId}`, validityDays }
      });

      if (portfolio.userId) {
        const userDoc = await getDoc(doc(db, 'users', portfolio.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          import('../../services/emailService').then(({ emailService }) => {
            emailService.sendPortfolioClearanceEmail(userData.email, {
              userName: userData.displayName || 'Valued Investor',
              mandateName: plan?.name || 'Institutional Advisory Mandate',
              analystName: user.displayName || 'Parsh Jain',
              clearanceDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              clearedStocksCount: holdings.length,
              portfolioNav: 'Active Allocation Live',
              analystRemarks: 'Holdings have been audited against statutory risk ceilings, beta parameters, and concentration limits.',
              portalUrl: window.location.origin + '/portfolio'
            }).catch(e => console.warn('[AdminReview] Clearance email error:', e));
          });
        }
      }
      
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to approve portfolio');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id || !user || !portfolio) return;
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      await portfolioRepository.rejectPortfolio(id, rejectReason.trim(), user.uid);

      await auditRepository.logAction({
        adminId: user.uid,
        adminEmail: user.email || 'Admin',
        action: 'REJECT_PORTFOLIO',
        targetId: id,
        targetType: 'portfolio',
        details: { message: `Rejected portfolio ${id} for user ${portfolio.userId}`, reason: rejectReason.trim() }
      });

      if (portfolio.userId) {
        const userDoc = await getDoc(doc(db, 'users', portfolio.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          import('../../services/emailService').then(({ emailService }) => {
            emailService.sendHoldingsRevisionEmail(userData.email, {
              userName: userData.displayName || 'Valued Investor',
              mandateName: plan?.name || 'Institutional Advisory Mandate',
              analystName: user.displayName || 'Parsh Jain',
              reviewDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              reasonSummary: rejectReason.trim(),
              actionItems: [
                'Review and modify allocation weights to comply with strategy mandate',
                'Ensure accurate buy prices and whole-unit share quantities',
                'Re-submit synchronized portfolio holdings for analyst re-audit'
              ],
              portalUrl: window.location.origin + `/portfolio/entry?portfolioId=${id}&planId=${portfolio.planId}`
            }).catch(e => console.warn('[AdminReview] Revision email error:', e));
          });
        }
      }

      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to reject portfolio');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !portfolio) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Portfolio Ledger...</span>
      </div>
    );
  }

  const userName = (portfolio as any).userName || 'Investor';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <button
            onClick={() => navigate('/admin/approvals')}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Approvals Queue</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
            Inspect Investor Portfolio Holdings
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Audit executed stock entries against model strategy rules before issuing active clearance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Holdings Ledger (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  Executed Entries
                </span>
                <h3 className="text-base font-semibold text-foreground mt-1.5">Executed Position Entries ({holdings.length})</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">Reported quantities and buy prices</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap border-collapse">
                <thead>
                  <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2.5 px-3">Ticker</th>
                    <th className="pb-2.5 px-3 text-right">Quantity</th>
                    <th className="pb-2.5 px-3 text-right">Execution Price</th>
                    <th className="pb-2.5 px-3 text-right">Position Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-xs">
                  {holdings.map((h, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-foreground">{h.symbol}</div>
                        <span className="text-[10px] text-muted-foreground">{h.companyName}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums text-foreground">{h.quantity}</td>
                      <td className="py-3.5 px-3 text-right tabular-nums text-foreground">{formatINR(h.buyPriceMinor)}</td>
                      <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-primary">{formatINR(h.buyPriceMinor * h.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Decision Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 shadow-sm space-y-4"
          >
            <h3 className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold pb-3 border-b border-border">
              Clearance Decision Desk
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>Investor User</span>
                <span className="font-semibold text-foreground">{userName}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Model Plan</span>
                <span className="font-semibold text-foreground">{portfolio.planName}</span>
              </div>
              <div className="flex justify-between text-muted-foreground items-baseline">
                <span>Reported Capital</span>
                <span className="font-semibold text-sm tabular-nums text-[hsl(var(--success))]">{formatINR(portfolio.totalInvestmentMinor || 0)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground items-center">
                <span>Current Status</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {portfolio.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-2.5">
              {portfolio.status === 'active' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-[hsl(var(--success))/0.1] border border-[hsl(var(--success))/0.25] text-[hsl(var(--success))] text-xs font-mono flex items-start gap-2">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Portfolio Active & Approved</span>
                      <span className="text-[10px] text-muted-foreground">Investor is entitled to live signals and factor radar analytics.</span>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!id || !user) return;
                      setIsProcessing(true);
                      try {
                        await portfolioRepository.extendPortfolio(id, 30);
                        alert("Portfolio validity extended by 30 days.");
                        navigate('/admin/approvals');
                      } catch (e) {
                        console.error(e);
                        alert("Failed to extend validity");
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <span>Extend Validity (+30 Days)</span>
                  </button>

                  <button
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    disabled={isProcessing}
                    className="w-full border border-border hover:border-destructive/40 text-muted-foreground hover:text-destructive text-xs py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{showRejectInput ? 'Cancel' : 'Revoke Clearance / Request Revision'}</span>
                  </button>

                  {showRejectInput && (
                    <div className="space-y-2 pt-1">
                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for revoking clearance..."
                        className="w-full glass-panel-data p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-destructive leading-relaxed"
                      />
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || !rejectReason.trim()}
                        className="w-full bg-destructive hover:opacity-90 text-destructive-foreground font-semibold text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                      >
                        <span>Confirm Revocation</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : portfolio.status === 'rejected' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                    <span className="font-semibold block mb-0.5">Status: Portfolio Rejected</span>
                    <span className="text-[10px] text-muted-foreground">Investor was notified to revise their executed entries.</span>
                  </div>

                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="w-full bg-[hsl(var(--success))] hover:opacity-90 text-white font-semibold text-xs py-2.5 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Re-evaluate & Approve Portfolio</span>
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="w-full bg-[hsl(var(--success))] hover:opacity-90 text-white font-semibold text-xs py-2.5 rounded-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Issuing Clearance...' : 'Approve & Activate Portfolio'}</span>
                  </button>

                  {!showRejectInput ? (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={isProcessing}
                      className="w-full border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Request Revisions / Reject</span>
                    </button>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Provide specific notes detailing the discrepancy for the investor..."
                        className="w-full glass-panel-data p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-destructive leading-relaxed"
                      />
                      <button
                        onClick={handleReject}
                        disabled={isProcessing || !rejectReason.trim()}
                        className="w-full bg-destructive hover:opacity-90 text-destructive-foreground font-semibold text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                      >
                        <span>Confirm Rejection Notification</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
