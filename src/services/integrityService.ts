import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { holdingsRepository } from '../repositories/holdingsRepository';

export interface IntegrityAuditReport {
  timestamp: string;
  portfoliosScanned: number;
  holdingsScanned: number;
  parityErrors: number;
  issues: string[];
}

export const integrityService = {
  /**
   * Run full data parity scan across portfolios and holdings
   */
  async runSystemAudit(): Promise<IntegrityAuditReport> {
    const issues: string[] = [];
    let holdingsScanned = 0;
    let parityErrors = 0;

    const portfoliosSnap = await getDocs(collection(db, 'portfolios'));
    const portfolios = portfoliosSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    for (const port of portfolios) {
      try {
        const holdings = await holdingsRepository.getHoldingsForPortfolio(port.id);
        holdingsScanned += holdings.length;

        if (holdings.length > 0) {
          // Sum holding investments
          const holdingsSumMinor = holdings.reduce(
            (sum: number, h: any) => sum + (h.quantity * (h.buyPriceMinor || 0)), 
            0
          );

          // Compare with portfolio totalInvestmentMinor if present
          if (port.totalInvestmentMinor && port.totalInvestmentMinor > 0) {
            const diff = Math.abs(port.totalInvestmentMinor - holdingsSumMinor);
            // Allow small buffer for unallocated cash if planned
            if (diff > 10000 && holdingsSumMinor > 0) { // difference > ₹100
              parityErrors++;
              issues.push(
                `Portfolio ${port.id.slice(0, 8)}: Stated investment (₹${(port.totalInvestmentMinor / 100).toFixed(2)}) differs from holding sum (₹${(holdingsSumMinor / 100).toFixed(2)}).`
              );
            }
          }
        }
      } catch (err: any) {
        parityErrors++;
        issues.push(`Portfolio ${port.id.slice(0, 8)}: Failed to read holdings - ${err.message}`);
      }
    }

    return {
      timestamp: new Date().toISOString(),
      portfoliosScanned: portfolios.length,
      holdingsScanned,
      parityErrors,
      issues
    };
  }
};
