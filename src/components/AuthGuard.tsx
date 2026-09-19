import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { SubscriptionStatus } from '../types/models';

interface AuthGuardProps {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
}

export default function AuthGuard({ 
  requireAuth = false, 
  requireAdmin = false, 
  requireSubscription = false 
}: AuthGuardProps) {
  const { user, dbUser, isAdmin, isInitializing, subscriptionStatus } = useAuthStore();
  const location = useLocation();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-xs font-mono tracking-wider text-muted-foreground uppercase">
          Initializing Session...
        </div>
      </div>
    );
  }

  // 1. Check if user account is suspended or revoked by Super Admin
  const isRevoked = dbUser?.status === 'revoked' || dbUser?.status === 'suspended';
  if (user && !isAdmin && isRevoked) {
    if (location.pathname !== '/access-revoked') {
      return <Navigate to="/access-revoked" replace />;
    }
  }

  // 2. Require Auth Check
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 3. Require Admin Check
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Require Subscription Check (Approved & Not Expired)
  if (requireSubscription) {
    if (subscriptionStatus === SubscriptionStatus.NONE) {
      return <Navigate to="/plans" state={{ from: location.pathname, reason: 'subscription_required' }} replace />;
    }
    if (subscriptionStatus === SubscriptionStatus.PENDING) {
      return <Navigate to="/portfolio-pending" replace />;
    }
    if (subscriptionStatus === SubscriptionStatus.REJECTED) {
      return <Navigate to="/portfolio-rejected" replace />;
    }
    if (subscriptionStatus === SubscriptionStatus.EXPIRED) {
      return <Navigate to="/plans" state={{ from: location.pathname, reason: 'subscription_expired' }} replace />;
    }
  }

  // 5. Guest Only / Redirect Logged-In Users from Login/Landing
  if (!requireAuth && user && !requireAdmin) {
    if (location.pathname === '/login') {
      const from = location.state?.from || (isAdmin ? '/admin/dashboard' : '/dashboard');
      return <Navigate to={from} replace />;
    }
  }

  return <Outlet />;
}
