// src/services/valuationService.ts
import type { PortfolioHolding, PortfolioSnapshot } from '../schemas/portfolio.schema';
import { calculatePnL, toRupees } from '../utils/money';

export interface PriceMetric {
  ltpMinor: number;
  changeMinor?: number;
  percentChange?: number;
}

export interface ValuedHolding extends PortfolioHolding {
  currentPriceMinor: number;
  currentValueMinor: number;
  pnlMinor: number;
  pnlPercent: number;
  allocationPercent: number;
  isPositive: boolean;
  dayChangeMinor?: number;
  dayChangePercent?: number;
  dayPnLMinor?: number;
}

export interface PortfolioValuation {
  totalInvestedMinor: number;
  totalCurrentValueMinor: number;
  pnlMinor: number;
  pnlRupees: number;
  pnlPercent: number;
  isPositive: boolean;
  totalDayPnLMinor: number;
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
    priceMap?: Record<string, number | PriceMetric> // scripCode or symbol -> ltpMinor or PriceMetric
  ): PortfolioValuation {
    let totalInvestedMinor = 0;
    let totalCurrentValueMinor = 0;
    let totalDayPnLMinor = 0;

    // 1. Initial pass: calculate holding values and total current market value
    const preliminaryHoldings = holdings.map((h) => {
      const investedAmountMinor = h.quantity * h.buyPriceMinor;
      totalInvestedMinor += investedAmountMinor;

      // Extract price & day metrics
      const rawPrice =
        (h.scripCode && priceMap?.[h.scripCode]) ||
        (h.symbol && priceMap?.[h.symbol]) ||
        (h.symbol && priceMap?.[h.symbol.toUpperCase()]) ||
        priceMap?.[h.instrumentId];

      let currentPriceMinor = h.buyPriceMinor;
      let dayChangeMinor = 0;
      let dayChangePercent = 0;

      if (typeof rawPrice === 'number') {
        currentPriceMinor = rawPrice > 0 ? rawPrice : h.buyPriceMinor;
      } else if (rawPrice && typeof rawPrice === 'object') {
        currentPriceMinor = rawPrice.ltpMinor > 0 ? rawPrice.ltpMinor : h.buyPriceMinor;
        dayChangeMinor = rawPrice.changeMinor || 0;
        dayChangePercent = rawPrice.percentChange || 0;
      } else if (h.currentPriceMinor && h.currentPriceMinor > 0) {
        currentPriceMinor = h.currentPriceMinor;
      }

      const currentValueMinor = h.quantity * currentPriceMinor;
      totalCurrentValueMinor += currentValueMinor;

      const holdingDayPnLMinor = h.quantity * dayChangeMinor;
      totalDayPnLMinor += holdingDayPnLMinor;

      const pnl = calculatePnL(investedAmountMinor, currentValueMinor);

      return {
        ...h,
        investedAmountMinor,
        currentPriceMinor,
        currentValueMinor,
        pnlMinor: pnl.pnlMinor,
        pnlPercent: pnl.pnlPercent,
        isPositive: pnl.isPositive,
        dayChangeMinor,
        dayChangePercent,
        dayPnLMinor: holdingDayPnLMinor,
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
      totalDayPnLMinor,
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
