import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  History, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert, 
  Search, 
  TrendingUp,
  Headphones,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import ThemeToggle from '../components/ThemeToggle';

const sidebarNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Portfolio', href: '/portfolio', icon: PieChart },
  { name: 'Research Signals', href: '/watchlist', icon: TrendingUp },
  { name: 'History & Audits', href: '/history', icon: History },
  { name: 'Alerts', href: '/notifications', icon: Bell },
  { name: 'Support Desk', href: '/support', icon: Headphones },
  { name: 'Profile & KYC', href: '/profile', icon: User },
];

export default function UserLayout() {
  const location = useLocation();
  const { user, dbUser, isAdmin, isInitializing: isAuthLoading, logout } = useAuthStore();
  const { userPortfolio, isLoading: isLoadingPortfolio } = usePortfolioStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isAuthLoading || isLoadingPortfolio) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Loading Terminal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Access Control
  if (!isAdmin && !userPortfolio && location.pathname !== '/setup-portfolio') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-slate-100"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Advisory Access Required</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Please subscribe to an active research advisory plan to unlock institutional portfolio optimization and proprietary signals.
          </p>
          <Link 
            to="/plans" 
            className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
          >
            Explore Advisory Plans
          </Link>
          <button 
            onClick={logout} 
            className="mt-4 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sign Out of Terminal
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh text-foreground flex transition-colors duration-300 font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col hidden lg:flex shrink-0 z-30">
        {/* Brand Header */}
        <div className="h-18 flex items-center px-6 border-b border-[hsl(var(--border))]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-sm shadow-sm">
              AR
            </div>
            <div>
              <span className="font-display font-semibold text-base tracking-tight text-foreground block leading-tight">Arth Research</span>
              <span className="text-[10px] font-mono text-[hsl(var(--primary))] uppercase tracking-wider">Private Ledger</span>
            </div>
          </Link>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {sidebarNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)] font-semibold shadow-xs' 
                    : 'text-muted-foreground hover:bg-[hsl(var(--accent))] hover:text-foreground'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[hsl(var(--primary))]' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout in Sidebar */}
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] space-y-3">
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Terminal</span>
            </Link>
          )}

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)] flex items-center justify-center text-xs font-bold shrink-0">
                {user?.displayName?.[0] || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium truncate text-foreground">{user?.displayName || 'Investor'}</p>
                <p className="text-[10px] font-mono text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-md text-xs font-medium text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] border border-transparent hover:border-[hsl(var(--destructive)/0.2)] transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/75"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] bg-card border-r border-border flex flex-col h-full z-10 shadow-2xl overflow-hidden"
            >
              <div className="h-18 flex items-center justify-between px-6 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold text-sm">
                    AR
                  </div>
                  <span className="font-display font-semibold text-sm">Arth Research</span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-[hsl(var(--accent))]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {sidebarNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive 
                          ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)] font-semibold' 
                          : 'text-muted-foreground hover:bg-[hsl(var(--accent))] hover:text-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] space-y-2">
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-xs font-mono font-semibold bg-primary/10 text-primary border border-primary/25"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Admin Terminal</span>
                  </Link>
                )}

                <button 
                  onClick={logout} 
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-xs font-medium text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)] border border-transparent hover:border-[hsl(var(--destructive)/0.2)]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Glassmorphic Header */}
        <header className="h-18 flex items-center justify-between px-4 sm:px-8 border-b border-[hsl(var(--border))] glass-nav sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[hsl(var(--border))] text-muted-foreground hover:bg-[hsl(var(--accent))] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold tracking-tight text-foreground capitalize">
                {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
              </h1>
            </div>
          </div>
          
          {/* Global Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search equities, research reports, alerts..."
                className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] pl-9 pr-4 py-1.5 rounded-md text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--primary))] transition-all font-mono"
              />
            </div>
          </div>
          
          {/* Right Action Icons: Admin Terminal Pill, Theme Toggle, Notifications, Avatar */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs"
                title="Return to Admin Governance Terminal"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Terminal</span>
              </Link>
            )}

            <ThemeToggle />
            
            <Link 
              to="/notifications" 
              className="p-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-muted-foreground hover:text-[hsl(var(--primary))] transition-all relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] ring-2 ring-[hsl(var(--card))]"></span>
            </Link>

            <Link 
              to="/profile"
              className="w-8 h-8 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] flex items-center justify-center font-bold text-xs shadow-xs hover:border-[hsl(var(--primary)/0.5)] transition-all overflow-hidden"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <>{dbUser?.displayName?.[0] || 'U'}</>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
