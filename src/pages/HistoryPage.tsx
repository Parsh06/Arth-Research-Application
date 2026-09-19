import { motion } from 'framer-motion';
import { History } from 'lucide-react';

export default function HistoryPage() {
  const transactions: any[] = []; 
  const isLoadingTransactions = false;

  if (isLoadingTransactions) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Execution Audit Trail...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Audit Ledger
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
          Portfolio Execution & Rebalance Log
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Immutable historical record of position rotations, executed allocations, and model updates.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-data p-5"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="pb-2.5 px-3">Transaction Reference</th>
                <th className="pb-2.5 px-3">Timestamp</th>
                <th className="pb-2.5 px-3">Type</th>
                <th className="pb-2.5 px-3 text-right">Quantity</th>
                <th className="pb-2.5 px-3 text-right">Executed Price</th>
                <th className="pb-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-xs text-muted-foreground">
                    <History className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="font-semibold text-foreground">No Historical Executions</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Executed rebalances and portfolio trades will automatically record here.</p>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-foreground">
                      #{txn.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-foreground">
                      <span className={`mr-2 px-1.5 py-0.2 rounded text-[10px] uppercase ${txn.action === 'BUY' ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' : 'bg-destructive/15 text-destructive'}`}>
                        {txn.action}
                      </span>
                      {txn.symbol}
                    </td>
                    <td className="py-3 px-3 text-foreground tabular-nums text-right">{txn.qty}</td>
                    <td className="py-3 px-3 text-foreground tabular-nums font-semibold text-right">₹{txn.price?.toFixed(2)}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border border-[hsl(var(--success))/0.3]">
                        EXECUTED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
