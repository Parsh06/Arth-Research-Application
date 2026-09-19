import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Shield } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuthStore } from '../stores/authStore';

export default function TopNavBar({ backTo = '/', label = 'Home' }: { backTo?: string, label?: string }) {
  const { isAdmin } = useAuthStore();

  return (
    <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-50 pointer-events-none flex items-center justify-between">
      <Link 
        to={backTo}
        className="pointer-events-auto inline-flex items-center gap-2 glass-panel px-4 py-2 text-xs font-medium text-foreground hover:border-[hsl(var(--primary)/0.4)] hover:text-[hsl(var(--primary))] transition-all cursor-pointer"
      >
        {label === 'Home' ? <Home className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
        <span>{label}</span>
      </Link>

      <div className="pointer-events-auto flex items-center gap-2.5">
        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs"
            title="Admin Terminal"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Terminal</span>
          </Link>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
