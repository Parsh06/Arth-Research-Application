// src/hooks/useAdvisoryAccess.ts
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import { SubscriptionStatus } from '../types/models';

export function useAdvisoryAccess() {
  const { user, isAdmin, isInitializing, subscriptionStatus } = useAuthStore();
  const { userPortfolio, userPortfolios, isLoading: isPortfolioLoading } = usePortfolioStore();
  const isSubscriber = useEntitlementStore((state) => state.isSubscriber);
  const isEntitlementsLoading = useEntitlementStore((state) => state.isLoading);

  const isLoading = isInitializing || isPortfolioLoading || (user ? isEntitlementsLoading : false);

  // Super Admins, Admins, Research Admins, Support Admins always have access
  if (isAdmin) {
    return {
      hasAccess: true,
      isLoading: false,
      isSubscriber: true,
      userPortfolio,
      userPortfolios
    };
  }

  // Check if standard client has an active strategy/entitlement or registered portfolio
  const hasEntitlement = isSubscriber();
  const hasRegisteredPortfolio = Boolean(userPortfolios && userPortfolios.length > 0);
  const isSubActive = subscriptionStatus === SubscriptionStatus.ACTIVE || subscriptionStatus === SubscriptionStatus.PENDING;

  const hasAccess = Boolean(user && (hasEntitlement || hasRegisteredPortfolio || isSubActive));

  return {
    hasAccess,
    isLoading,
    isSubscriber: hasAccess,
    userPortfolio,
    userPortfolios
  };
}
