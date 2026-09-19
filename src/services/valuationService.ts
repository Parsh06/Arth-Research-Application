// src/services/valuationService.ts
import type { PortfolioHolding, PortfolioSnapshot } from '../schemas/portfolio.schema';
import { calculatePnL, toRupees } from '../utils/money';

export interface ValuedHolding extends PortfolioHolding {
  currentPriceMinor: number;
  currentValueMinor: number;
  pnlMinor: number;
  pnlPercent: number;
  allocationPercent: number;
  isPositive: boolean;
}

export interface PortfolioValuation {
  totalInvestedMinor: number;
  totalCurrentValueMinor: number;
  pnlMinor: number;
  pnlRupees: number;
  pnlPercent: number;
  isPositive: boolean;
  holdings: ValuedHolding[];
  stockCount: number;
}

export const valuationService = {
  /**
   * Evaluates all holdings in a portfolio against latest prices.
   * All internal calculations are performed using integer minor units (paise).
   */
  evaluatePortfolio(
    holdings: PortfolioHolding[],
    priceMap?: Record<string, number> // instrumentId or symbol -> ltpMinor
  ): PortfolioValuation {
    let totalInvestedMinor = 0;
    let totalCurrentValueMinor = 0;

    // 1. Initial pass: calculate holding values and total current market value
    const preliminaryHoldings = holdings.map((h) => {
      const investedAmountMinor = h.quantity * h.buyPriceMinor;
      totalInvestedMinor += investedAmountMinor;

      // Determine latest price (default to buyPrice if market feed not provided)
      const currentPriceMinor =
        priceMap?.[h.instrumentId] ||
        priceMap?.[h.symbol] ||
        h.currentPriceMinor ||
        h.buyPriceMinor;

      const currentValueMinor = h.quantity * currentPriceMinor;
      totalCurrentValueMinor += currentValueMinor;

      const pnl = calculatePnL(investedAmountMinor, currentValueMinor);

      return {
        ...h,
        investedAmountMinor,
        currentPriceMinor,
        currentValueMinor,
        pnlMinor: pnl.pnlMinor,
        pnlPercent: pnl.pnlPercent,
        isPositive: pnl.isPositive,
        allocationPercent: 0 // Will compute in second pass
      };
    });

    // 2. Second pass: compute allocation weight percentages based on total portfolio value
    const valuedHoldings: ValuedHolding[] = preliminaryHoldings.map((h) => {
      const allocationPercent =
        totalCurrentValueMinor > 0
          ? parseFloat(((h.currentValueMinor / totalCurrentValueMinor) * 100).toFixed(2))
          : 0;

      return {
        ...h,
        allocationPercent,
        allocationBps: Math.round(allocationPercent * 100)
      };
    });

    const netPnL = calculatePnL(totalInvestedMinor, totalCurrentValueMinor);

    return {
      totalInvestedMinor,
      totalCurrentValueMinor,
      pnlMinor: netPnL.pnlMinor,
      pnlRupees: toRupees(netPnL.pnlMinor),
      pnlPercent: netPnL.pnlPercent,
      isPositive: netPnL.isPositive,
      holdings: valuedHoldings,
      stockCount: valuedHoldings.length
    };
  },

  /**
   * Generates an immutable, dated snapshot record for history and charts.
   */
  generateSnapshot(portfolioId: string, valuation: PortfolioValuation): PortfolioSnapshot {
    return {
      portfolioId,
      date: new Date().toISOString().split('T')[0],
      investedAmountMinor: valuation.totalInvestedMinor,
      marketValueMinor: valuation.totalCurrentValueMinor,
      pnlMinor: valuation.pnlMinor,
      pnlPercentBps: Math.round(valuation.pnlPercent * 100),
      calculationVersion: 1,
      createdAt: new Date().toISOString()
    };
  }
};
