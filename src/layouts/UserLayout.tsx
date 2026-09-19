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
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import ThemeToggle from '../components/ThemeToggle';
import TopNavBar from '../components/TopNavBar';

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

  // Access Control
  if (!isAdmin && !userPortfolio && location.pathname !== '/setup-portfolio') {
    return (
      <div className="min-h-screen bg-mesh bg-background text-foreground flex flex-col justify-center items-center p-6 relative selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
        <TopNavBar backTo="/" label="Home" />

        <motion.div 
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="max-w-lg w-full glass-panel p-8 sm:p-10 shadow-2xl relative z-10 text-center overflow-hidden border border-border mt-12"
        >
          {/* Ambient Glow Accent */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

          {/* Institutional Badge / Crest */}
          <div className="relative mx-auto mb-6 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center shadow-inner relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition-opacity" />
              <img src="/logo1.png" alt="Arth Jain" className="w-8 h-8 object-contain relative z-10" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border border-primary/30 flex items-center justify-center text-primary shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono tracking-wider uppercase mb-3">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Advisory Membership Required</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-foreground mb-3 leading-tight">
            Institutional Access Restricted
          </h1>
          
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 max-w-md mx-auto">
            Your session is authenticated, but your account does not currently have an active quantitative research advisory allocation.
          </p>

          {/* Unlocked Capabilities Summary */}
          <div className="glass-panel-data p-4 mb-6 text-left space-y-2.5 border border-border/80">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Subscription Entitlements:
            </div>
            {[
              "Proprietary Factor & Momentum Research Signals",
              "Automated Demat Rebalance Telemetry & Alerts",
              "SEBI-Compliant Quantitative Audit Ledger",
              "Direct Priority Desk Support & Allocation Audits"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-foreground/90">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          {/* Primary Action CTA */}
          <div className="space-y-3">
            <Link 
              to="/plans" 
              className="w-full bg-primary hover:opacity-90 text-primary-foreground py-3.5 px-6 rounded-md font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 tracking-wide uppercase group cursor-pointer"
            >
              <span>Explore Advisory Plans</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <div className="pt-3 flex items-center justify-between border-t border-border text-xs">
              <Link 
                to="/setup-portfolio"
                className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>Initial Holdings Setup</span>
                <span>&rarr;</span>
              </Link>
              
              <button 
                onClick={logout} 
                className="text-[11px] font-mono text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Terminal</span>
              </button>
            </div>
          </div>

          {/* Footer Security Badge */}
          <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center gap-2 text-[10px] font-mono text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-[hsl(var(--success))] shrink-0" />
            <span>SEBI Registered RA Research Integrity Standard</span>
          </div>
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
