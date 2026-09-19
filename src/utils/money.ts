// src/utils/money.ts

/**
 * Money utilities enforcing integer minor units (paise for INR).
 * 1 INR = 100 paise.
 * Eliminates floating point rounding errors in financial transactions and holdings calculations.
 */

/**
 * Converts standard currency units (e.g. Rupees) to integer minor units (paise).
 * Example: 1250.50 -> 125050
 */
export function toMinorUnits(amount: number | string): number {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts integer minor units (paise) back to standard currency units (Rupees).
 * Example: 125050 -> 1250.5
 */
export function toRupees(minorUnits: number | undefined | null): number {
  if (minorUnits === undefined || minorUnits === null || isNaN(minorUnits)) return 0;
  return minorUnits / 100;
}

/**
 * Formats integer minor units into Indian Rupee currency string with proper numbering system (lakhs/crores).
 * Example: 125050 -> "₹1,250.50"
 */
export function formatINR(minorUnits: number | undefined | null, showSymbol = true): string {
  const rupees = toRupees(minorUnits);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(rupees);

  return showSymbol ? `₹${formatted}` : formatted;
}

/**
 * Formats an amount in compact Indian notation (e.g., ₹1.25 L, ₹3.50 Cr)
 */
export function formatCompactINR(minorUnits: number | undefined | null): string {
  const rupees = toRupees(minorUnits);
  if (Math.abs(rupees) >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(rupees) >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }
  return formatINR(minorUnits);
}

/**
 * Calculates profit and loss metrics strictly using minor units.
 */
export function calculatePnL(investedMinor: number, currentMinor: number) {
  const pnlMinor = currentMinor - investedMinor;
  const pnlPercent = investedMinor > 0 ? (pnlMinor / investedMinor) * 100 : 0;
  const isPositive = pnlMinor >= 0;

  return {
    pnlMinor,
    pnlRupees: toRupees(pnlMinor),
    pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    isPositive,
    formattedPnL: (isPositive ? '+' : '') + formatINR(pnlMinor),
    formattedPercent: (isPositive ? '+' : '') + pnlPercent.toFixed(2) + '%'
  };
}
