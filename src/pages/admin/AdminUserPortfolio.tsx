// src/pages/admin/AdminUserPortfolio.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, Bell } from 'lucide-react';
import { usePortfolioStore } from '../../stores/portfolioStore';
import type { PortfolioHolding } from '../../types/models';
import AdminStockSearch from '../../components/AdminStockSearch';
import { toMinorUnits, toRupees } from '../../utils/money';

export default function AdminUserPortfolio() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userPortfolio, initPortfolioListener, unsubscribePortfolio, isLoading, updatePortfolio, holdings } = usePortfolioStore();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for editing
  const [stocks, setStocks] = useState<Partial<PortfolioHolding>[]>([]);
  const [investedAmountRupees, setInvestedAmountRupees] = useState(0);

  useEffect(() => {
    if (userId) {
      initPortfolioListener(userId);
    }
    return () => unsubscribePortfolio();
  }, [userId, initPortfolioListener, unsubscribePortfolio]);

  useEffect(() => {
    if (userPortfolio) {
      const minor = userPortfolio.totalInvestmentMinor || 0;
      setInvestedAmountRupees(toRupees(minor) || minor);
    }
    if (holdings) {
      setStocks(holdings);
    }
  }, [userPortfolio, holdings]);

  const handleAddStock = () => {
    setStocks([...stocks, { symbol: '', companyName: '', quantity: 1, buyPrice: 100, currentPrice: 100 }]);
  };

  const handleRemoveStock = (index: number) => {
    const newStocks = [...stocks];
    newStocks.splice(index, 1);
    setStocks(newStocks);
  };

  const handleStockChange = (index: number, field: keyof PortfolioHolding, value: any) => {
    const newStocks = [...stocks];
    newStocks[index] = { ...newStocks[index], [field]: value };
    setStocks(newStocks);
  };

  const handleSave = async () => {
    if (!userPortfolio?.id) return;
    setIsSaving(true);
    try {
      const totalInvestmentMinor = toMinorUnits(investedAmountRupees);
      await updatePortfolio(userPortfolio.id, {
        totalInvestment: investedAmountRupees,
        ...({ totalInvestmentMinor } as any)
      });
      alert('Portfolio updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to update portfolio');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Portfolio Data...</span>
      </div>
    );
  }

  if (!userPortfolio) {
    return (
      <div className="p-8 space-y-3 font-mono">
        <button onClick={() => navigate('/admin/users')} className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Users Directory
        </button>
        <div className="text-sm font-semibold text-foreground">No portfolio record found for this investor ID.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <button onClick={() => navigate('/admin/users')} className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors mb-2 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Users Directory
          </button>
          <h1 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-foreground">
            Supervise Portfolio: {userId}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              if (confirm('Trigger rebalance email alert to investor?')) {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('../../config/firebase');
                const { sendRebalanceNotificationEmail } = await import('../../utils/emailService');
                const userDoc = await getDoc(doc(db, 'users', userPortfolio.userId));
                if (userDoc.exists()) {
                  await sendRebalanceNotificationEmail(userDoc.data().email, userDoc.data().displayName);
                  alert('Rebalance notification dispatched.');
                }
              }
            }}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-mono font-semibold px-3.5 py-2 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Trigger Alert</span>
          </button>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Portfolio Changes'}</span>
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 shadow-sm space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Total Invested Principal (₹)</label>
            <input 
              type="number"
              value={investedAmountRupees}
              onChange={(e) => setInvestedAmountRupees(Number(e.target.value))}
              className="w-full glass-panel-data px-3.5 py-2 text-base font-mono tabular-nums font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
            />
          </div>
        </div>

        <div className="pt-5 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">Active Position Basket</h3>
            <button 
              onClick={handleAddStock}
              className="glass-panel text-foreground text-xs font-mono px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer hover:bg-muted"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock</span>
            </button>
          </div>

          <div className="space-y-3 font-mono">
            {stocks.map((stock, idx) => (
              <div key={idx} className="p-3.5 rounded-md glass-panel-data grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Symbol</label>
                  <AdminStockSearch 
                    value={stock.symbol || ''} 
                    onChange={(val) => handleStockChange(idx, 'symbol', val)} 
                    onSelect={({ symbol, companyName }) => {
                      handleStockChange(idx, 'symbol', symbol);
                      handleStockChange(idx, 'companyName', companyName);
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Quantity</label>
                  <input 
                    type="number" 
                    value={stock.quantity || 0} 
                    onChange={e => handleStockChange(idx, 'quantity' as keyof PortfolioHolding, Number(e.target.value))} 
                    className="w-full glass-panel p-2 text-xs text-foreground font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Avg Price (₹)</label>
                  <input 
                    type="number" 
                    value={stock.buyPrice || 0} 
                    onChange={e => handleStockChange(idx, 'buyPrice' as keyof PortfolioHolding, Number(e.target.value))} 
                    className="w-full glass-panel p-2 text-xs text-foreground font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">CMP (₹)</label>
                  <input 
                    type="number" 
                    value={stock.currentPrice || 0} 
                    onChange={e => handleStockChange(idx, 'currentPrice' as keyof PortfolioHolding, Number(e.target.value))} 
                    className="w-full glass-panel p-2 text-xs text-foreground font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button 
                    onClick={() => handleRemoveStock(idx)} 
                    className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
