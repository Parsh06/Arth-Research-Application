import { Clock, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { PortfolioStatus } from '../types/models';
import TopNavBar from '../components/TopNavBar';

export default function PortfolioPendingPage() {
  const { logout } = useAuthStore();
  const { userPortfolio, isLoading } = usePortfolioStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (userPortfolio && userPortfolio.status === PortfolioStatus.ACTIVE) {
      navigate('/dashboard');
    }
  }, [userPortfolio, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Checking Verification Queue...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6 selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      <TopNavBar />
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full glass-panel p-8 shadow-2xl text-center relative overflow-hidden z-10"
      >
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-md mx-auto flex items-center justify-center mb-4">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>

        <h1 className="text-xl font-display font-semibold tracking-tight text-foreground mb-1.5">
          Portfolio Under Verification
        </h1>
        
        <p className="text-xs text-muted-foreground font-mono mb-6 max-w-sm mx-auto">
          Our quantitative analysts are verifying position weights and factor metrics before activating your live terminal feed.
        </p>

        <div className="glass-panel-data p-4 text-left mb-6 font-mono text-xs space-y-2.5">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-muted-foreground">Clearance Status</span>
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Under Review
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-muted-foreground">Strategy Tier</span>
            <span className="font-semibold text-foreground">{userPortfolio?.planName || 'Aggressive Alpha'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-muted-foreground">Submission</span>
            <span className="font-semibold text-foreground">Registered</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Verification SLA</span>
            <span className="font-semibold text-[hsl(var(--success))]">Within 24–48 Hours</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 glass-panel text-foreground hover:bg-muted/50 py-2.5 px-4 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 py-2.5 px-4 rounded-md font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
