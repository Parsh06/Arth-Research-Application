import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

interface UseIdleTimerOptions {
  timeoutMs?: number; // Inactivity timeout in ms (default: 15 minutes)
  onIdle?: () => void;
  enabled?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function useIdleTimer({
  timeoutMs = DEFAULT_TIMEOUT_MS,
  onIdle,
  enabled = true
}: UseIdleTimerOptions = {}) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleIdle = useCallback(async () => {
    if (onIdle) {
      onIdle();
    } else {
      console.warn('[SECURITY] Session expired due to inactivity. Signing out.');
      await logout();
      window.location.href = '/login?reason=idle_timeout';
    }
  }, [logout, onIdle]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (enabled && user) {
      timerRef.current = setTimeout(handleIdle, timeoutMs);
    }
  }, [enabled, user, timeoutMs, handleIdle]);

  useEffect(() => {
    if (!enabled || !user) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Throttle listener to avoid high CPU overhead
    let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
    const throttledReset = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
          resetTimer();
        }, 1000);
      }
    };

    // Initialize timer
    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      events.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
    };
  }, [enabled, user, resetTimer]);

  return {
    resetTimer,
    getLastActivity: () => lastActivityRef.current
  };
}
