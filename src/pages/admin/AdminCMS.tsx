import { motion } from 'framer-motion';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCmsStore } from '../../stores/cmsStore';
import { useToastStore } from '../../stores/toastStore';

export default function AdminCMS() {
  const { siteContent, fetchSiteContent, updateSiteContent, isLoadingSiteContent } = useCmsStore();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'landingPage' | 'welcomePage' | 'plansPage' | 'investmentEntryPage' | 'loginPage' | 'dashboardPage'>('landingPage');
  
  const [landingData, setLandingData] = useState({
    heroTitle: "",
    heroSubtitle: "",
    aboutTitle: "",
    aboutText: ""
  });
  
  const [welcomeData, setWelcomeData] = useState({
    title: "",
    subtitle: "",
    buttonText: ""
  });
  
  const [plansData, setPlansData] = useState({
    title: "",
    subtitle: ""
  });

  const [investmentEntryData, setInvestmentEntryData] = useState({
    badgeText: "Strategy Model Basket",
    title: "Configure Initial Executed Holdings",
    subtitle: "Enter the executed quantities and average purchase prices for your mandate.",
    slaText: "24–48 Hours"
  });
  
  const [loginData, setLoginData] = useState({
    title: "Access Your Wealth Engine",
    subtitle: "Only authorized Google Accounts are permitted to access the secure terminal.",
    securityText: "Enterprise Grade Security"
  });
  
  const [dashboardData, setDashboardData] = useState({
    welcomeText: "Terminal Access Granted.",
    marketStatus: "Market Open",
    chartTitle: "Performance Trajectory"
  });

  useEffect(() => {
    fetchSiteContent();
  }, [fetchSiteContent]);

  useEffect(() => {
    if (siteContent) {
      if (siteContent.landingPage) {
        setLandingData(prev => ({ ...prev, ...siteContent.landingPage }));
      }
      if (siteContent.welcomePage) {
        setWelcomeData(prev => ({ ...prev, ...siteContent.welcomePage }));
      }
      if (siteContent.plansPage) {
        setPlansData(prev => ({ ...prev, ...siteContent.plansPage }));
      }
      if (siteContent.investmentEntryPage) {
        setInvestmentEntryData(prev => ({ ...prev, ...siteContent.investmentEntryPage }));
      }
      if (siteContent.loginPage) {
        setLoginData(prev => ({ ...prev, ...siteContent.loginPage }));
      }
      if (siteContent.dashboardPage) {
        setDashboardData(prev => ({ ...prev, ...siteContent.dashboardPage }));
      }
    }
  }, [siteContent]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (activeTab === 'landingPage') await updateSiteContent('settings', 'landingPage', landingData);
      if (activeTab === 'welcomePage') await updateSiteContent('settings', 'welcomePage', welcomeData);
      if (activeTab === 'plansPage') await updateSiteContent('settings', 'plansPage', plansData);
      if (activeTab === 'investmentEntryPage') await updateSiteContent('settings', 'investmentEntryPage', investmentEntryData);
      if (activeTab === 'loginPage') await updateSiteContent('settings', 'loginPage', loginData);
      if (activeTab === 'dashboardPage') await updateSiteContent('settings', 'dashboardPage', dashboardData);
      addToast("CMS content published live across application surfaces.", "success");
    } catch (error) {
      console.error("Error saving CMS settings", error);
      addToast("Failed to save CMS settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingSiteContent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Content Architecture...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
              Content Architecture
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
            Dynamic Platform CMS
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Modify public landing copy, onboarding mandate text, and dashboard headlines in real-time.
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-60 cursor-pointer font-mono"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{loading ? 'Publishing...' : 'Publish Changes'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-md glass-panel-data max-w-fit">
        {[
          { id: 'landingPage', label: 'Landing Page' },
          { id: 'plansPage', label: 'Plans & Pricing' },
          { id: 'welcomePage', label: 'Welcome Receipt' },
          { id: 'investmentEntryPage', label: 'Portfolio Entry' },
          { id: 'loginPage', label: 'Auth Portal' },
          { id: 'dashboardPage', label: 'Dashboard' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 shadow-sm space-y-5"
      >
        {activeTab === 'landingPage' && (
          <div className="space-y-4 text-xs font-mono">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
              Hero & Philosophy Copy
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Hero Main Title</label>
              <input
                type="text"
                value={landingData.heroTitle}
                onChange={(e) => setLandingData({ ...landingData, heroTitle: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Hero Subtitle</label>
              <textarea
                rows={2}
                value={landingData.heroSubtitle}
                onChange={(e) => setLandingData({ ...landingData, heroSubtitle: e.target.value })}
                className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">Philosophy Heading</label>
                <input
                  type="text"
                  value={landingData.aboutTitle}
                  onChange={(e) => setLandingData({ ...landingData, aboutTitle: e.target.value })}
                  className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted-foreground mb-1.5">Philosophy Description</label>
                <textarea
                  rows={3}
                  value={landingData.aboutText}
                  onChange={(e) => setLandingData({ ...landingData, aboutText: e.target.value })}
                  className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plansPage' && (
          <div className="space-y-4 text-xs font-mono">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
              Pricing Showcase Copy
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Plans Header Title</label>
              <input
                type="text"
                value={plansData.title}
                onChange={(e) => setPlansData({ ...plansData, title: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Plans Subtitle</label>
              <textarea
                rows={2}
                value={plansData.subtitle}
                onChange={(e) => setPlansData({ ...plansData, subtitle: e.target.value })}
                className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'loginPage' && (
          <div className="space-y-4 text-xs font-mono">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
              Authentication Portal Copy
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Login Title</label>
              <input
                type="text"
                value={loginData.title}
                onChange={(e) => setLoginData({ ...loginData, title: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Login Subtitle</label>
              <textarea
                rows={2}
                value={loginData.subtitle}
                onChange={(e) => setLoginData({ ...loginData, subtitle: e.target.value })}
                className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Security Subtext</label>
              <input
                type="text"
                value={loginData.securityText}
                onChange={(e) => setLoginData({ ...loginData, securityText: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'welcomePage' && (
          <div className="space-y-4 text-xs font-mono">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
              Welcome & Order Cleared Receipt Copy
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Welcome Headline</label>
              <input
                type="text"
                value={welcomeData.title}
                onChange={(e) => setWelcomeData({ ...welcomeData, title: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Welcome Description</label>
              <textarea
                rows={2}
                value={welcomeData.subtitle}
                onChange={(e) => setWelcomeData({ ...welcomeData, subtitle: e.target.value })}
                className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Action Button Label</label>
              <input
                type="text"
                value={welcomeData.buttonText}
                onChange={(e) => setWelcomeData({ ...welcomeData, buttonText: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'investmentEntryPage' && (
          <div className="space-y-4 text-xs font-mono">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
              Executed Portfolio Entry Flow Copy
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Pill Badge Text</label>
              <input
                type="text"
                value={investmentEntryData.badgeText}
                onChange={(e) => setInvestmentEntryData({ ...investmentEntryData, badgeText: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Screen Title</label>
              <input
                type="text"
                value={investmentEntryData.title}
                onChange={(e) => setInvestmentEntryData({ ...investmentEntryData, title: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Screen Subtitle</label>
              <textarea
                rows={2}
                value={investmentEntryData.subtitle}
                onChange={(e) => setInvestmentEntryData({ ...investmentEntryData, subtitle: e.target.value })}
                className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Verification SLA Subtext</label>
              <input
                type="text"
                value={investmentEntryData.slaText}
                onChange={(e) => setInvestmentEntryData({ ...investmentEntryData, slaText: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === 'dashboardPage' && (
          <div className="space-y-4 text-xs font-mono">
            <h3 className="text-sm font-semibold text-foreground pb-2 border-b border-border">
              Investor Terminal & Dashboard Copy
            </h3>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Terminal Subtitle</label>
              <input
                type="text"
                value={dashboardData.welcomeText}
                onChange={(e) => setDashboardData({ ...dashboardData, welcomeText: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Market Status Pill Text</label>
              <input
                type="text"
                value={dashboardData.marketStatus}
                onChange={(e) => setDashboardData({ ...dashboardData, marketStatus: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Chart Title</label>
              <input
                type="text"
                value={dashboardData.chartTitle}
                onChange={(e) => setDashboardData({ ...dashboardData, chartTitle: e.target.value })}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
