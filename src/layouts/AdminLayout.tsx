import { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  FileText, 
  Menu, 
  X,
  TrendingUp,
  Headphones,
  Shield,
  PieChart,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from '../components/ThemeToggle';

const adminNavigation = [
  { name: 'Terminal Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'User Directory', href: '/admin/users', icon: Users },
  { name: 'Portfolio Approvals', href: '/admin/approvals', icon: ShieldCheck },
  { name: 'Advisory Plans', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Research Signals', href: '/admin/content', icon: TrendingUp },
  { name: 'Email Hub', href: '/admin/emails', icon: Mail },
  { name: 'Support Desk', href: '/admin/support', icon: Headphones },
  { name: 'CMS & Governance', href: '/admin/cms', icon: FileText },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, isAdmin, isInitializing, logout, dbUser } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Loading Governance Terminal...</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-mesh bg-background text-foreground flex transition-colors duration-300">
      
      {/* Desktop Admin Sidebar */}
      <aside className="w-68 bg-card/60 backdrop-blur-xl border-r border-border flex flex-col hidden lg:flex shrink-0 z-30">
        <div className="h-16 flex items-center px-6 border-b border-border justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-xs tracking-tight text-foreground block leading-tight">Admin Terminal</span>
              <span className="text-[10px] font-mono text-primary tracking-widest uppercase">Governance</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {adminNavigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium tracking-wide transition-all duration-150 ${
                  isActive 
                    ? 'bg-primary/15 text-primary border border-primary/30 font-semibold shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-card/40 space-y-3">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all"
          >
            <PieChart className="h-3.5 w-3.5" />
            <span>Switch to Client Portal</span>
          </Link>

          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-xs font-mono font-bold">
              {dbUser?.role?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-foreground truncate">{dbUser?.displayName || 'Administrator'}</p>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{dbUser?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Crisp Dark Backdrop without GPU blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/75"
            />

            {/* Slide-out Sidebar Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-72 max-w-[85vw] bg-card border-r border-border flex flex-col h-full z-10 shadow-2xl overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="h-16 flex items-center justify-between px-5 border-b border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-semibold text-xs tracking-tight text-foreground block leading-tight">Admin Terminal</span>
                    <span className="text-[10px] font-mono text-primary uppercase tracking-wider">Governance</span>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {adminNavigation.map((item) => {
                  const isActive = location.pathname === item.href || (item.href !== '/admin/dashboard' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
                        isActive 
                          ? 'bg-primary/15 text-primary border border-primary/30 font-semibold shadow-xs' 
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Bottom Actions & User Badge */}
              <div className="p-4 border-t border-border bg-muted/20 space-y-3">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs"
                >
                  <PieChart className="h-3.5 w-3.5" />
                  <span>Switch to Client Portal</span>
                </Link>

                <div className="flex items-center gap-2.5 px-1 py-1">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    {dbUser?.role?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-foreground truncate">{dbUser?.displayName || 'Administrator'}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{dbUser?.email}</p>
                  </div>
                </div>

                <button 
                  onClick={logout} 
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-border text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-sm font-display font-semibold text-foreground capitalize tracking-wide">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Admin Dashboard'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 transition-all shadow-xs"
              title="Preview Client Investor Dashboard"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Client Portal</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl border border-primary/30 bg-primary/10 text-primary text-[11px] font-mono uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{dbUser?.role || 'Super Admin'}</span>
            </div>

            <ThemeToggle />

            <div className="w-8 h-8 rounded-xl bg-muted border border-border text-foreground font-mono font-bold text-xs flex items-center justify-center">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
