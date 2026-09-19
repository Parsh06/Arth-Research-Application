import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Headphones, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { usePortfolioStore } from '../../stores/portfolioStore';
import { usePlanStore } from '../../stores/planStore';
import { formatINR } from '../../utils/money';
import { supportRepository } from '../../repositories/supportRepository';
import type { SupportTicket } from '../../schemas/support.schema';
import { formatDateTime } from '../../utils/datetime';
import { useNavigate } from 'react-router-dom';

const MetricCard = ({ title, value, change, icon: Icon, delay, isPositive = true }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="glass-panel p-5 flex flex-col justify-between"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{title}</span>
      <div className="w-8 h-8 rounded-md bg-muted/60 text-foreground flex items-center justify-center border border-border">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
    <div>
      <div className="text-2xl font-mono tabular-nums font-semibold tracking-tight text-foreground mb-1.5">
        {value}
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center text-[10px] font-mono font-medium px-1.5 py-0.5 rounded ${
          isPositive 
            ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' 
            : 'bg-primary/15 text-primary'
        }`}>
          {change}
        </span>
      </div>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { allUsers, fetchAllUsers, isLoadingUsers } = useUserStore();
  const { allPortfolios, fetchAllPortfolios, isLoading: isLoadingAllPortfolios } = usePortfolioStore();
  const { fetchPlans, isLoadingPlans } = usePlanStore();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  useEffect(() => {
    fetchAllUsers();
    fetchAllPortfolios();
    fetchPlans();
    
    // Fetch Audit Logs
    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const { auditRepository } = await import('../../repositories/auditRepository');
        const logs = await auditRepository.getRecentLogs(10);
        setAuditLogs(logs);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    fetchLogs();

    // Fetch Support Tickets
    const unsubscribeTickets = supportRepository.subscribeToAllTickets((data) => {
      setTickets(data);
    });

    return () => unsubscribeTickets();
  }, [fetchAllUsers, fetchAllPortfolios, fetchPlans]);

  // Minor units AUM calculation
  const totalAumMinor = useMemo(() => {
    return allPortfolios
      .filter(p => (p.status as string) === 'active' || (p.status as string) === 'approved')
      .reduce((sum, p) => sum + (p.totalInvestmentMinor || 0), 0);
  }, [allPortfolios]);

  const pendingPortfolios = useMemo(() => {
    return allPortfolios.filter(p => p.status === 'pending');
  }, [allPortfolios]);

  const openTickets = useMemo(() => {
    return tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  }, [tickets]);

  if (isLoadingUsers || isLoadingAllPortfolios || isLoadingPlans) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Initializing Sovereign Admin Terminal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              Institutional Governance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Supervisory Control Terminal
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Real-time advisory oversight, KYC compliance, queue verification, and audit logs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Registered Investors" 
          value={allUsers.length.toLocaleString()} 
          change="Synchronized" 
          icon={Users} 
          delay={0.05}
        />
        <MetricCard 
          title="Supervised AUM" 
          value={formatINR(totalAumMinor)} 
          change="Exact Math" 
          icon={Activity} 
          delay={0.1}
        />
        <MetricCard 
          title="Verification Queue" 
          value={pendingPortfolios.length.toString()} 
          change={pendingPortfolios.length > 0 ? "Review Required" : "Cleared"} 
          icon={Clock} 
          delay={0.15}
          isPositive={pendingPortfolios.length === 0}
        />
        <MetricCard 
          title="Open Desk Tickets" 
          value={openTickets.length.toString()} 
          change={openTickets.length > 0 ? "Active SLA" : "All Answered"} 
          icon={Headphones} 
          delay={0.2}
          isPositive={openTickets.length === 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Portfolio Submissions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel-data p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Pending Portfolio Clearance Queue ({pendingPortfolios.length})
              </h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Investor submitted allocations requiring verification</p>
            </div>
          </div>
          
          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-96 pr-1">
            {pendingPortfolios.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground font-mono">
                <CheckCircle2 className="w-6 h-6 mx-auto text-[hsl(var(--success))] mb-2" />
                <span>All submitted investor portfolios have been approved.</span>
              </div>
            ) : (
              pendingPortfolios.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => navigate(`/admin/review-portfolio/${p.id}`)}
                  className="p-3.5 rounded-md glass-panel hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        #{p.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.2 rounded uppercase border border-primary/20">
                        {p.planName}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-foreground">
                      Capital: {formatINR(p.totalInvestmentMinor)}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      Submitted: {formatDateTime(p.submittedAt || p.updatedAt || p.createdAt)}
                    </div>
                  </div>
                  <button className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 cursor-pointer">
                    <span>Review</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* System Audit Trail */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel-data p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Immutable Regulatory Audit Trail
              </h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Cryptographic log of administrative actions</p>
            </div>
            {auditLogs.length > 0 && (
              <button
                onClick={async () => {
                  if (window.confirm("Purge all administrative audit log records?")) {
                    try {
                      const { auditRepository } = await import('../../repositories/auditRepository');
                      await auditRepository.clearAllLogs();
                      setAuditLogs([]);
                    } catch (e) {
                      console.error("Failed to clear logs", e);
                    }
                  }
                }}
                className="text-[11px] font-mono text-destructive hover:underline px-2 py-1 rounded bg-destructive/10 transition-colors"
                title="Purge all audit logs"
              >
                Clear Logs
              </button>
            )}
          </div>
          
          <div className="space-y-2 flex-1 overflow-y-auto max-h-96 pr-1">
            {isLoadingLogs ? (
              <div className="py-10 text-center text-xs text-muted-foreground font-mono animate-pulse">
                Streaming compliance audit log...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground font-mono">
                No recent administrative events recorded.
              </div>
            ) : (
              auditLogs.map((log, i) => (
                <div key={i} className="p-3 rounded-md glass-panel text-xs font-mono">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground bg-muted px-1.5 py-0.2 rounded">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] mt-1">
                    <span className="font-semibold text-foreground">{log.adminEmail}</span> modified <span className="uppercase text-primary">{log.targetType}</span> (ID: <span className="text-muted-foreground">{log.targetId?.slice(0, 10)}</span>)
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
