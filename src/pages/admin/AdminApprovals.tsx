import { motion } from 'framer-motion';
import { Search, CheckCircle2, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPortfolioStatusEmail } from '../../utils/emailService';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { portfolioRepository } from '../../repositories/portfolioRepository';
import { auditRepository } from '../../repositories/auditRepository';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../utils/datetime';
import { formatINR } from '../../utils/money';

export default function AdminApprovals() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'portfolios')); 
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setApprovals(apps);
    } catch (error) {
      console.error("Error fetching approvals", error);
    } finally {
      setLoading(false);
    }
  };

  const extendPortfolio = async (id: string) => {
    try {
      const newExpiry = await portfolioRepository.extendPortfolio(id, 30);
      
      setApprovals(approvals.map(app => app.id === id ? { ...app, expiresAt: newExpiry, status: 'active' } : app));
      
      if (user) {
        await auditRepository.logAction({
          adminId: user.uid,
          adminEmail: user.email || 'admin@arth.com',
          action: 'EXTEND_PORTFOLIO_30_DAYS',
          entityId: id,
          entityType: 'portfolio',
          details: { newExpiry }
        });
      }
      
      alert("Successfully extended portfolio validity by 30 days.");
    } catch (error) {
      console.error("Error extending portfolio", error);
      alert("Failed to extend portfolio validity");
    }
  };

  const handleApprove = async (portfolio: any) => {
    try {
      let validityDays = 30;
      try {
        const planDoc = await getDoc(doc(db, 'plans', portfolio.planId));
        if (planDoc.exists()) {
          validityDays = planDoc.data().validityDays || 30;
        }
      } catch (e) {
        console.error("Failed to fetch plan", e);
      }

      await portfolioRepository.approvePortfolio(portfolio.id, validityDays, user?.uid || 'admin');

      setApprovals(approvals.map(app => app.id === portfolio.id ? { ...app, status: 'active' } : app));

      if (user) {
        await auditRepository.logAction({
          adminId: user.uid,
          adminEmail: user.email || 'admin@arth.com',
          action: 'APPROVE_PORTFOLIO',
          entityId: portfolio.id,
          entityType: 'portfolio',
          details: { validityDays }
        });
      }

      if (portfolio.userId) {
        const userDoc = await getDoc(doc(db, 'users', portfolio.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          await sendPortfolioStatusEmail(userData.email, userData.displayName || portfolio.userName, 'active');
        }
      }

      alert("Portfolio successfully approved and activated.");
    } catch (error) {
      console.error("Error approving portfolio", error);
      alert("Failed to approve portfolio");
    }
  };

  const filteredApprovals = approvals.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      (item.userName || '').toLowerCase().includes(term) ||
      (item.planName || '').toLowerCase().includes(term) ||
      (item.id || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Portfolio Clearance Queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Analyst Desk
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
          Portfolio Clearance & Lifecycle Supervision
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Review investor position submissions, clear onboarding approvals, and manage subscription extensions.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-data p-5 space-y-4"
      >
        <div className="relative max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Investor, Plan, or Status..."
            className="w-full glass-panel pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="pb-2.5 px-3">Portfolio Reference</th>
                <th className="pb-2.5 px-3">Strategy Plan</th>
                <th className="pb-2.5 px-3 text-right">Capital Value</th>
                <th className="pb-2.5 px-3">Clearance Status</th>
                <th className="pb-2.5 px-3">Valid Until</th>
                <th className="pb-2.5 px-3 text-right">Review & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {filteredApprovals.map((app) => (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-foreground">#{app.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-[10px] text-muted-foreground">{app.userName || 'Investor'}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs font-semibold text-foreground">{app.planName}</span>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-semibold text-foreground">
                    {formatINR(app.totalInvestmentMinor || 0)}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                      app.status === 'active' || app.status === 'approved' ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' :
                      app.status === 'rejected' ? 'bg-destructive/15 text-destructive' :
                      'bg-primary/15 text-primary'
                    }`}>
                      {app.status || 'pending'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-muted-foreground">
                    {app.expiresAt ? formatDate(app.expiresAt) : 'Not Activated'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/review-portfolio/${app.id}`)}
                        className="glass-panel text-foreground text-xs font-mono px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer hover:bg-muted"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      {app.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(app)}
                          className="bg-[hsl(var(--success))] hover:opacity-90 text-white text-xs font-mono font-semibold px-2.5 py-1 rounded shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                      )}

                      <button
                        onClick={() => extendPortfolio(app.id)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary text-xs font-mono px-2 py-1 rounded transition-colors cursor-pointer border border-primary/20"
                        title="Extend 30 Days"
                      >
                        +30d
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
