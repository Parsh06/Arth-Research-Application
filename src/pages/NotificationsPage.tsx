// src/pages/NotificationsPage.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  ArrowRight, 
  Bell, 
  CheckCheck, 
  Search,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationRepository, type AppNotification } from '../repositories/notificationRepository';
import { useAuthStore } from '../stores/authStore';
import { formatDateTime } from '../utils/datetime';
import NoActiveStrategyGate from '../components/NoActiveStrategyGate';
import { useAdvisoryAccess } from '../hooks/useAdvisoryAccess';

type FilterCategory = 'all' | 'unread' | 'order' | 'rebalance' | 'research' | 'system';

export default function NotificationsPage() {
  const { hasAccess, isLoading: isAccessLoading } = useAdvisoryAccess();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const unsub = notificationRepository.subscribeToUserNotifications(user.uid, (notifs) => {
      setNotifications(notifs);
    });
    return () => unsub();
  }, [user]);

  const handleAcknowledgeAll = async () => {
    try {
      setIsMarkingAll(true);
      const unread = notifications.filter(n => !n.isRead);
      for (const n of unread) {
        await notificationRepository.markAsRead(n.id);
      }
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleCardClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      await notificationRepository.markAsRead(notif.id);
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }
    if (notif.metadata?.actionUrl) {
      navigate(notif.metadata.actionUrl);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(note => {
      // Category filter
      if (selectedFilter === 'unread' && note.isRead) return false;
      if (selectedFilter === 'order' && !(note.type === 'order' || note.type === 'portfolio')) return false;
      if (selectedFilter === 'rebalance' && note.type !== 'rebalance') return false;
      if (selectedFilter === 'research' && note.type !== 'research') return false;
      if (selectedFilter === 'system' && note.type !== 'system') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesMsg = note.message.toLowerCase().includes(q);
        return matchesTitle || matchesMsg;
      }
      return true;
    });
  }, [notifications, selectedFilter, searchQuery]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getCategoryConfig = (type: AppNotification['type']) => {
    switch (type) {
      case 'order':
      case 'portfolio':
        return {
          icon: CheckCircle2,
          badgeText: 'Execution Order',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        };
      case 'rebalance':
        return {
          icon: TrendingUp,
          badgeText: 'Portfolio Rebalance',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
        };
      case 'research':
        return {
          icon: Zap,
          badgeText: 'Alpha Signal',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25',
        };
      case 'system':
      default:
        return {
          icon: ShieldCheck,
          badgeText: 'Regulatory & System',
          badgeClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
          iconBg: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/25',
        };
    }
  };

  if (!isAccessLoading && !hasAccess) {
    return <NoActiveStrategyGate />;
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" />
              Real-Time Signal Feed
            </span>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
            System Alerts & Strategy Signals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Real-time trade recommendations, rebalance allocations, execution clearances, and regulatory notices.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleAcknowledgeAll}
            disabled={isMarkingAll}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-card hover:bg-muted text-foreground border border-border shadow-sm transition-all duration-200 flex items-center gap-2 self-start md:self-auto shrink-0 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>{isMarkingAll ? 'Marking...' : 'Mark All Read'}</span>
          </button>
        )}
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Signals', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'order', label: 'Orders', count: notifications.filter(n => n.type === 'order' || n.type === 'portfolio').length },
            { id: 'rebalance', label: 'Rebalances', count: notifications.filter(n => n.type === 'rebalance').length },
            { id: 'research', label: 'Alpha Signals', count: notifications.filter(n => n.type === 'research').length },
            { id: 'system', label: 'Compliance', count: notifications.filter(n => n.type === 'system').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id as FilterCategory)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedFilter === tab.id 
                    ? 'bg-primary-foreground/20 text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search signals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 pl-8.5 pr-3 text-xs rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Signals Feed List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="card-luxury rounded-2xl p-12 text-center border border-border/80">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No Signals Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {searchQuery.trim() 
                ? 'No alerts match your search query. Try clearing the filter.' 
                : 'Your advisory notifications feed is up to date. Strategy rebalances and execution alerts will populate here in real-time.'}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredNotifications.map((note, idx) => {
              const cat = getCategoryConfig(note.type);
              const IconComponent = cat.icon;

              return (
                <motion.div 
                  key={note.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, delay: idx * 0.02 }}
                  onClick={() => handleCardClick(note)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 sm:gap-4 ${
                    note.isRead 
                      ? 'bg-card/70 hover:bg-card border-border/60 hover:border-border text-foreground/80' 
                      : 'bg-card border-primary/40 shadow-[0_2px_12px_rgba(46,90,166,0.08)] ring-1 ring-primary/20 text-foreground'
                  }`}
                >
                  {/* Category Icon */}
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${cat.iconBg}`}>
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  
                  {/* Signal Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border font-semibold ${cat.badgeClass}`}>
                          {cat.badgeText}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-foreground truncate">
                          {note.title}
                        </h3>
                        {!note.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground shrink-0">
                        <Clock className="w-3 h-3 text-muted-foreground/70" />
                        <span>{formatDateTime(note.createdAt)}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {note.message}
                    </p>
                    
                    {note.metadata?.actionUrl && (
                      <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                        <span>Inspect Allocation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

