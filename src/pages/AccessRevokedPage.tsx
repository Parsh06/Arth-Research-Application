import { motion } from 'framer-motion';
import { ShieldAlert, Mail, LogOut, FileText, AlertOctagon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../utils/datetime';
import TopNavBar from '../components/TopNavBar';

export default function AccessRevokedPage() {
  const { dbUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const reason = dbUser?.revocationReason || 'Your account access has been suspended pursuant to regulatory compliance review and risk supervision protocols.';
  const revokedDate = dbUser?.revokedAt ? formatDateTime(dbUser.revokedAt) : 'Recent Action';

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6 selection:bg-primary selection:text-primary-foreground">
      <TopNavBar />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg w-full glass-panel p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden z-10 border-destructive/40"
      >
        <div className="w-14 h-14 bg-destructive/10 border border-destructive/25 text-destructive rounded-xl mx-auto mb-5 flex items-center justify-center">
          <AlertOctagon className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-destructive/15 text-destructive border border-destructive/30 mb-3">
          <ShieldAlert className="w-3 h-3" />
          <span>Access Revoked / Suspended</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mb-2">
          Investor Terminal Access Suspended
        </h1>
        
        <p className="text-xs text-muted-foreground font-mono mb-6 leading-relaxed">
          An administrative decision has been recorded by compliance supervision regarding your advisory account.
        </p>

        {/* Super Admin Stated Basis / Comment Box */}
        <div className="bg-card border border-destructive/30 rounded-lg p-5 mb-6 text-left font-mono shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border text-[10px] uppercase tracking-wider text-destructive font-semibold">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>Supervisor Regulatory Basis</span>
            </span>
            <span className="text-muted-foreground font-normal">{revokedDate}</span>
          </div>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans font-medium">
            {reason}
          </p>
        </div>

        <div className="p-3.5 rounded-md glass-panel-data mb-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
          <span>Grievance & Review Desk:</span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>support@arthadvisory.com</span>
          </span>
        </div>

        <div className="flex gap-3 justify-center">
          <button 
            onClick={handleLogout}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground py-2.5 px-4 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out from Terminal</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
