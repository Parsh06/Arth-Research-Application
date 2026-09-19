import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Shield } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuthStore } from '../stores/authStore';
import { getTerminalTitle, getDefaultAdminRoute } from '../utils/rbac';

export default function TopNavBar({ backTo = '/', label = 'Home' }: { backTo?: string, label?: string }) {
  const { dbUser } = useAuthStore();
  const role = dbUser?.role || 'user';
  const terminalTitle = getTerminalTitle(role);
  const defaultAdminRoute = getDefaultAdminRoute(role);

  return (
    <div className="absolute top-0 left-0 w-full p-4 sm:p-6 z-50 pointer-events-none flex items-center justify-between">
      <Link 
        to={backTo}
        className="pointer-events-auto inline-flex items-center gap-2.5 glass-panel px-3.5 py-2 text-xs font-medium text-foreground hover:border-[hsl(var(--primary)/0.4)] hover:text-[hsl(var(--primary))] transition-all cursor-pointer rounded-lg shadow-sm"
      >
        <div className="w-5 h-5 rounded flex items-center justify-center overflow-hidden bg-primary/15 border border-primary/25 shrink-0">
          <img src="/logo1.png" alt="Arth Research" className="w-3.5 h-3.5 object-contain" />
        </div>
        {label === 'Home' ? <Home className="w-3.5 h-3.5 text-muted-foreground" /> : <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />}
        <span className="font-semibold">{label}</span>
      </Link>

      <div className="pointer-events-auto flex items-center gap-2.5">
        {terminalTitle && (
          <Link
            to={defaultAdminRoute}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs"
            title={terminalTitle}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{terminalTitle}</span>
          </Link>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}
