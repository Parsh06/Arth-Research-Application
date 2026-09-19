import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { usePortfolioStore } from '../stores/portfolioStore';
import { useCmsStore } from '../stores/cmsStore';
import { useThemeStore } from '../stores/themeStore';
import { useEntitlementStore } from '../stores/entitlementStore';
import Preloader from './Preloader';

export default function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { initAuthListener, isInitializing, user } = useAuthStore();
  const { initPortfolioListener, unsubscribePortfolio } = usePortfolioStore();
  const { initEntitlementListener, unsubscribe: unsubscribeEntitlements } = useEntitlementStore();
  const { fetchSiteContent } = useCmsStore();
  const { initTheme } = useThemeStore();
  
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    // 0. Initialize theme (dark/light)
    initTheme();
    // 1. Initialize Auth
    initAuthListener();
  }, [initAuthListener, initTheme]);

  useEffect(() => {
    const bootstrapDependencies = async () => {
      if (isInitializing) return;

      try {
        await fetchSiteContent();
        if (user) {
          initPortfolioListener(user.uid);
          initEntitlementListener(user.uid);
        } else {
          unsubscribePortfolio();
          unsubscribeEntitlements();
        }
      } catch (error) {
        console.error("Bootstrap error:", error);
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrapDependencies();
  }, [isInitializing, user, fetchSiteContent, initPortfolioListener, unsubscribePortfolio, initEntitlementListener, unsubscribeEntitlements]);

  const isReady = !isInitializing && !isBootstrapping;

  return (
    <>
      <Preloader isReady={isReady} />
      {children}
    </>
  );
}
