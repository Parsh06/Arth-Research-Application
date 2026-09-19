import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import AppBootstrap from './components/AppBootstrap';
import ErrorBoundary from './components/ErrorBoundary';
import ScreenCaptureDefense from './components/ScreenCaptureDefense';
import ToastContainer from './components/ToastContainer';

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const UserLayout = lazy(() => import('./layouts/UserLayout'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const InvestmentEntryPage = lazy(() => import('./pages/InvestmentEntryPage'));
const PortfolioPendingPage = lazy(() => import('./pages/PortfolioPendingPage'));
const PortfolioRejectedPage = lazy(() => import('./pages/PortfolioRejectedPage'));
const AccessRevokedPage = lazy(() => import('./pages/AccessRevokedPage'));
const ApprovalPendingPage = lazy(() => import('./pages/ApprovalPendingPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const AdminReviewPortfolio = lazy(() => import('./pages/admin/AdminReviewPortfolio'));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminApprovals = lazy(() => import('./pages/admin/AdminApprovals'));
const AdminCMS = lazy(() => import('./pages/admin/AdminCMS'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminUserPortfolio = lazy(() => import('./pages/admin/AdminUserPortfolio'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminContentHub = lazy(() => import('./pages/admin/AdminContentHub'));
const AdminEmailHub = lazy(() => import('./pages/admin/AdminEmailHub').then(m => ({ default: m.AdminEmailHub })));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] flex flex-col items-center justify-center gap-3 transition-colors duration-200">
    <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">Loading Module...</span>
  </div>
);

function App() {
  return (
    <Router>
      <AppBootstrap>
        <ErrorBoundary>
          <ScreenCaptureDefense />
          <ToastContainer />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes with Guest check */}
              <Route element={<AuthGuard />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/plans" element={<PlansPage />} />
              </Route>
              
              <Route path="/checkout/:planId" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<WelcomePage />} />
              
              <Route element={<AuthGuard requireAuth={true} />}>
                <Route path="/setup-portfolio" element={<InvestmentEntryPage />} />
                <Route path="/portfolio/entry" element={<InvestmentEntryPage />} />
                <Route path="/portfolio-pending" element={<PortfolioPendingPage />} />
                <Route path="/portfolio-rejected" element={<PortfolioRejectedPage />} />
                <Route path="/access-revoked" element={<AccessRevokedPage />} />
              </Route>

              {/* Protected User Routes (Requires Active Subscription) */}
              <Route element={<AuthGuard requireAuth />}>
                <Route path="/pending-approval" element={<ApprovalPendingPage />} />
              </Route>

              {/* User Dashboard Routes */}
              <Route element={<UserLayout />}>
                {/* Requires Subscription */}
                <Route element={<AuthGuard requireAuth requireSubscription />}>
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/reports" element={<Navigate to="/history" replace />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
                
                {/* Requires Login only */}
                <Route element={<AuthGuard requireAuth />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/signals" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/watchlist" element={<WatchlistPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<Navigate to="/profile" replace />} />
                </Route>
              </Route>

              {/* Admin Dashboard Routes */}
              <Route element={<AdminLayout />}>
                <Route element={<AuthGuard requireAuth requireAdmin />}>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/review-portfolio/:id" element={<AdminReviewPortfolio />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/users/:userId/portfolio" element={<AdminUserPortfolio />} />
                  <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
                  <Route path="/admin/approvals" element={<AdminApprovals />} />
                  <Route path="/admin/cms" element={<AdminCMS />} />
                  <Route path="/admin/content" element={<AdminContentHub />} />
                  <Route path="/admin/content-hub" element={<Navigate to="/admin/content" replace />} />
                  <Route path="/admin/emails" element={<AdminEmailHub />} />
                  <Route path="/admin/support" element={<AdminSupport />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>

              {/* Catch-all 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </AppBootstrap>
    </Router>
  );
}

export default App;
