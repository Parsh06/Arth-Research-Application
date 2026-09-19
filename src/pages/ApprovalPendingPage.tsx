import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import TopNavBar from '../components/TopNavBar';

export default function ApprovalPendingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6 selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
      <TopNavBar backTo="/dashboard" label="Dashboard" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md mx-auto w-full pt-16 z-10"
      >
        <div className="glass-panel p-8 shadow-2xl text-center relative overflow-hidden">
          
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-md mx-auto flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>

          <h1 className="text-xl font-display font-semibold tracking-tight text-foreground mb-1.5">
            Verification In Progress
          </h1>
          <p className="text-xs text-muted-foreground font-mono mb-6 max-w-xs mx-auto">
            Our research and compliance desk is currently validating your portfolio parameters.
          </p>

          {/* Stepper */}
          <div className="space-y-2.5 text-left mb-6 font-mono">
            <div className="flex items-center gap-3 p-3 rounded glass-panel-data">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] shrink-0" />
              <div>
                <div className="text-xs font-semibold text-foreground">Subscription Payment</div>
                <div className="text-[10px] text-muted-foreground">Order successfully verified</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded glass-panel-data">
              <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] shrink-0" />
              <div>
                <div className="text-xs font-semibold text-foreground">Portfolio Data Ingestion</div>
                <div className="text-[10px] text-muted-foreground">Executed holdings recorded</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded glass-panel-data border-primary/30 bg-primary/10">
              <Clock className="w-4 h-4 text-primary shrink-0 animate-spin" />
              <div>
                <div className="text-xs font-semibold text-primary">Analyst Clearance Queue</div>
                <div className="text-[10px] text-muted-foreground">Estimated SLA: 24 Hours</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-primary hover:opacity-90 text-primary-foreground py-2.5 px-4 rounded-md font-semibold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer font-mono"
          >
            <span>Proceed to Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
