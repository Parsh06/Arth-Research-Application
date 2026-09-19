import { XCircle, RefreshCcw, Mail, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import TopNavBar from '../components/TopNavBar';

export default function PortfolioRejectedPage() {
  const { user, logout } = useAuthStore();
  const { userPortfolio, initPortfolioListener, isLoading } = usePortfolioStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !userPortfolio) {
      initPortfolioListener(user.uid);
    }
  }, [user, userPortfolio, initPortfolioListener]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleResubmit = () => {
    navigate('/setup-portfolio');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Checking Clearance Status...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6 selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      <TopNavBar />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full glass-panel p-8 shadow-2xl text-center relative overflow-hidden z-10"
      >
        <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 text-destructive rounded-md mx-auto mb-4 flex items-center justify-center">
          <XCircle className="w-6 h-6" />
        </div>

        <h1 className="text-xl font-display font-semibold tracking-tight text-foreground mb-1.5">
          Submission Requires Revision
        </h1>
        
        <p className="text-xs text-muted-foreground font-mono mb-6 max-w-sm mx-auto">
          Our research analyst team has identified items in your position allocations that require adjustment.
        </p>

        {userPortfolio?.rejectionReason && (
          <div className="bg-destructive/5 border border-destructive/20 rounded p-4 mb-6 text-left font-mono">
            <span className="block text-destructive text-[10px] uppercase tracking-wider mb-1">
              Analyst Rejection Notes
            </span>
            <p className="text-xs text-foreground leading-relaxed">
              {userPortfolio.rejectionReason}
            </p>
          </div>
        )}

        <div className="p-3 rounded glass-panel-data mb-6 flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
          <Mail className="w-3.5 h-3.5 text-primary" />
          <span>Desk: <span className="font-semibold text-foreground">tatvarthcapital@gmail.com</span></span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button 
            onClick={handleResubmit}
            className="flex-1 bg-primary hover:opacity-90 text-primary-foreground py-2.5 px-4 rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-mono"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Re-configure</span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex-1 glass-panel text-foreground hover:bg-muted/50 py-2.5 px-4 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
