// src/utils/datetime.ts

/**
 * Standardized date and time utilities for server timestamps, expiration calculations,
 * and user-friendly formatting.
 */

/**
 * Calculates milliseconds timestamp for a validity duration in days from a starting point.
 */
export function calculateExpiryTimestamp(validityDays: number, startTimestampMs: number = Date.now()): number {
  return startTimestampMs + validityDays * 24 * 60 * 60 * 1000;
}

/**
 * Formats an epoch timestamp or ISO string into a localized Indian date string (e.g. 11 Sep 2026).
 */
export function formatDate(timestamp: number | string | undefined | null): string {
  if (!timestamp) return 'N/A';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

/**
 * Formats an epoch timestamp or ISO string into a localized date-time string.
 */
export function formatDateTime(timestamp: number | string | undefined | null): string {
  if (!timestamp) return 'N/A';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return 'N/A';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Returns remaining days until expiration, or 0 if expired.
 */
export function getDaysRemaining(expiresAt: number | undefined | null): number {
  if (!expiresAt) return 0;
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
