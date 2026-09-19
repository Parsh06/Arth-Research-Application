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
  Search,
  TrendingUp,
  Headphones,
  Shield,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import ThemeToggle from '../components/ThemeToggle';
import { getTerminalTitle, getDefaultAdminRoute } from '../utils/rbac';

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
  const { user, dbUser, isInitializing: isAuthLoading, logout } = useAuthStore();
  const { isLoading: isLoadingPortfolio } = usePortfolioStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isAuthLoading || isLoadingPortfolio) {
    return (
      <div className="min-h-screen bg-mesh bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">Loading Terminal...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = dbUser?.role || 'user';
  const terminalTitle = getTerminalTitle(role);
  const defaultAdminRoute = getDefaultAdminRoute(role);

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-mesh text-foreground flex transition-colors duration-300 font-sans">
      
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col hidden lg:flex shrink-0 z-30">
        {/* Brand Header */}
        <div className="h-18 flex items-center px-6 border-b border-[hsl(var(--border))]">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.25)] flex items-center justify-center p-1 overflow-hidden shadow-xs shrink-0">
              <img src="/logo1.png" alt="Arth Research Logo" className="w-full h-full object-contain" />
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
            const isActive = isItemActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                style={isActive ? {
                  backgroundColor: 'hsl(var(--primary) / 0.12)',
                  color: 'hsl(var(--primary))',
                  border: '1px solid hsl(var(--primary) / 0.28)',
                } : {
                  color: 'hsl(var(--muted-foreground))',
                  border: '1px solid transparent',
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 hover:bg-[hsl(var(--accent))] hover:text-foreground ${
                  isActive ? 'font-semibold shadow-xs' : ''
                }`}
              >
                <item.icon 
                  className="h-4 w-4 shrink-0" 
                  style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Dynamic Terminal Option in Sidebar */}
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] space-y-3">
          {terminalTitle && (
            <Link
              to={defaultAdminRoute}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>{terminalTitle}</span>
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
              className="fixed inset-0 bg-black/60"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] flex flex-col h-full z-10 shadow-2xl overflow-hidden"
              style={{ backgroundColor: 'hsl(var(--card))', borderRight: '1px solid hsl(var(--border))' }}
            >
              {/* Drawer Header */}
              <div
                className="h-16 flex items-center justify-between px-5 border-b shrink-0"
                style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center p-1.5 overflow-hidden shrink-0"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.25)' }}
                  >
                    <img src="/logo1.png" alt="Arth Research Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="font-display font-semibold text-sm block leading-tight" style={{ color: 'hsl(var(--foreground))' }}>Arth Research</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'hsl(var(--primary))' }}>Private Ledger</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" style={{ backgroundColor: 'hsl(var(--card))' }}>
                {sidebarNavigation.map((item) => {
                  const isActive = isItemActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      style={isActive ? {
                        backgroundColor: 'hsl(var(--primary) / 0.12)',
                        color: 'hsl(var(--primary))',
                        border: '1px solid hsl(var(--primary) / 0.3)',
                      } : {
                        color: 'hsl(var(--foreground))',
                        border: '1px solid transparent',
                      }}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium tracking-wide transition-all hover:bg-accent/60"
                    >
                      <item.icon
                        className="h-4 w-4 shrink-0"
                        style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: 'hsl(var(--primary))' }} />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom Actions */}
              <div
                className="p-4 border-t space-y-2 shrink-0"
                style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--muted) / 0.6)' }}
              >
                {/* User identity */}
                <div className="flex items-center gap-2.5 px-1 py-2">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.3)', color: 'hsl(var(--primary))' }}
                  >
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (dbUser?.displayName?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>{dbUser?.displayName || 'Investor'}</p>
                    <p className="text-[11px] font-mono truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>{user?.email}</p>
                  </div>
                </div>

                {terminalTitle && (
                  <Link
                    to={defaultAdminRoute}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-xs font-mono font-semibold transition-all"
                    style={{
                      backgroundColor: 'hsl(var(--primary) / 0.12)',
                      color: 'hsl(var(--primary))',
                      border: '1px solid hsl(var(--primary) / 0.25)'
                    }}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>{terminalTitle}</span>
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer"
                  style={{ color: 'hsl(var(--destructive))' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
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
          
          {/* Right Action Icons: Dynamic Terminal Pill, Theme Toggle, Notifications, Avatar */}
          <div className="flex items-center gap-3">
            {terminalTitle && (
              <Link
                to={defaultAdminRoute}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs"
                title={`Open ${terminalTitle}`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{terminalTitle}</span>
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
