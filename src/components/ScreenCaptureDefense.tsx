import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock, EyeOff, WifiOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// Pages that must strictly be protected from screenshots & screen capture
// Note: Investment Entry (/setup-portfolio) and Client Portfolio (/portfolio) are explicitly permitted for user screenshots
const PROTECTED_ROUTE_PREFIXES = [
  '/checkout',
  '/admin'
];

export default function ScreenCaptureDefense() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isOnline = useNetworkStatus();
  const veilRef = useRef<HTMLDivElement>(null);
  const veilReasonRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if screenshot defense is globally enabled in environment
  const isDefenseEnabled = 
    import.meta.env.VITE_SCREENSHOT_ALLOWED === 'ON' || 
    import.meta.env.VITE_SCREENSHOT_ALLOWED === 'true' ||
    import.meta.env.VITE_SCREENSHOT_ALLOWED === undefined;

  // Check if current route requires strict screenshot & screen capture defense
  const isCurrentPageProtected = isDefenseEnabled && PROTECTED_ROUTE_PREFIXES.some(prefix => 
    location.pathname.startsWith(prefix)
  );

  useEffect(() => {
    // If user is on a public marketing page (Landing, Plans, Login, Terms, etc.), allow screenshots freely
    if (!isCurrentPageProtected) return;

    const veilEl = veilRef.current;
    const reasonEl = veilReasonRef.current;

    const showVeilSync = (reason: string, autoHideMs?: number) => {
      if (!veilEl) return;
      if (reasonEl) reasonEl.textContent = reason;
      veilEl.style.display = 'flex';
      veilEl.style.opacity = '1';
      veilEl.style.pointerEvents = 'auto';

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      if (autoHideMs) {
        hideTimeoutRef.current = setTimeout(() => {
          hideVeilSync();
        }, autoHideMs);
      }
    };

    const hideVeilSync = () => {
      if (!veilEl) return;
      veilEl.style.opacity = '0';
      setTimeout(() => {
        if (veilEl && veilEl.style.opacity === '0') {
          veilEl.style.display = 'none';
          veilEl.style.pointerEvents = 'none';
        }
      }, 150);
    };

    const poisonClipboard = () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(
            `[ARTH RESEARCH SECURITY ALERT] Unauthorized screen capture intercepted.\nUser: ${user?.email || 'Authenticated User'} (UID: ${user?.uid || 'Unknown'})\nTimestamp: ${new Date().toISOString()}\nProprietary institutional advisory data is protected by regulatory compliance.`
          ).catch(() => {});
        }
      } catch {
        // Ignore clipboard permission errors
      }
    };

    const isFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    // 1. Instant Obfuscation on Window Blur / Focus Loss (Desktop capture tools, Snipping Tool, Alt-Tab)
    const handleBlur = () => {
      // Only trigger on desktop to avoid mobile touch/drawer/keyboard blur disruptions
      if (isFinePointer) {
        showVeilSync('Screen Capture & Window Focus Defense Active');
      }
    };

    const handleFocus = () => {
      setTimeout(() => {
        hideVeilSync();
      }, 250);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        showVeilSync('Application Background State Protected');
      } else {
        setTimeout(() => {
          hideVeilSync();
        }, 200);
      }
    };

    // 2. Mouse Leave Viewport Defense (Desktop only)
    const handleMouseLeave = (e: MouseEvent) => {
      if (isFinePointer && !e.relatedTarget && e.clientY <= 5) {
        showVeilSync('Window Boundary Exit Detected', 1500);
      }
    };

    // 3. Synchronous Keyboard Capture Interception (PrtScn, Win+Shift+S, Cmd+Shift+3/4/5, Alt+PrtScn, Ctrl+P, DevTools)
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen / Alt+PrintScreen / Win+PrintScreen
      if (
        e.key === 'PrintScreen' || 
        e.code === 'PrintScreen' || 
        e.keyCode === 44 ||
        (e.altKey && e.keyCode === 44)
      ) {
        e.preventDefault();
        e.stopPropagation();
        poisonClipboard();
        showVeilSync('PrintScreen Intercepted • Clipboard Purged', 2500);
        return false;
      }

      // Windows Snipping Tool (Win+Shift+S) / Mac Screenshot (Cmd+Shift+3/4/5/S)
      if (
        (e.metaKey || e.ctrlKey || e.altKey) && 
        (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4' || e.key === '5' || e.code === 'KeyS') && 
        e.shiftKey
      ) {
        e.preventDefault();
        e.stopPropagation();
        poisonClipboard();
        showVeilSync('Screen Grab Utility Intercepted', 2500);
        return false;
      }

      // OS Modifier key presses (Win Key / Command Key / Meta)
      if (e.key === 'Meta' || e.key === 'OS' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
        showVeilSync('System Key Intercepted', 1200);
      }

      // Print Prevention: Ctrl+P / Meta+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync('Statutory Document Printing Prohibited', 2500);
        return false;
      }

      // Save Page: Ctrl+S / Meta+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // View Source: Ctrl+U
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.code === 'KeyU')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Developer Tools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        e.code === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
        (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'j' || e.key === 'c'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        showVeilSync('Developer Inspection Tools Prohibited', 2500);
        return false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44) {
        poisonClipboard();
        showVeilSync('PrintScreen Intercepted • Clipboard Purged', 2500);
      }
    };

    // 4. Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 5. Disable Dragging of text and images
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 6. Before Print Event Hook
    const handleBeforePrint = () => {
      showVeilSync('Document Printing Prohibited');
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('beforeprint', handleBeforePrint);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('beforeprint', handleBeforePrint);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [user, isCurrentPageProtected]);

  const timestampString = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <>
      {/* 1. Direct Zero-Latency Synchronous Blackout Defense Veil */}
      {isCurrentPageProtected && (
        <div 
          id="screen-defense-veil"
          ref={veilRef}
          className="fixed inset-0 bg-[#05070B] text-white flex-col items-center justify-center p-6 text-center select-none cursor-not-allowed transition-opacity duration-150"
          style={{ 
            display: 'none', 
            opacity: 0, 
            zIndex: 2147483647,
            pointerEvents: 'none'
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400 animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <EyeOff className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-widest bg-white/5 text-zinc-300 border border-white/10 mb-4">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Proprietary Quant Security Veil</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Screen Capture & Recording Prohibited
          </h2>

          <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-lg leading-relaxed mb-6">
            Institutional quantitative strategies, research signals, and portfolio telemetry are protected under SEBI proprietary regulations. Screen capture, external grabbers, and recording are strictly prevented.
          </p>

          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400 max-w-md w-full space-y-2 text-left shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500 uppercase text-[9px] tracking-wider">Defense State</span>
              <span ref={veilReasonRef} className="text-amber-400 font-semibold text-right">
                Screen Capture Defense Active
              </span>
            </div>
            {user && (
              <div className="text-zinc-400 text-[10px] space-y-1 pt-1">
                <div><span className="text-zinc-500">Audited User:</span> {user.email}</div>
                <div><span className="text-zinc-500">Terminal UID:</span> {user.uid}</div>
                <div><span className="text-zinc-500">Security Stamp:</span> {timestampString} • SEBI RA AUDIT ACTIVE</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Security Forensic Watermark (Continuous Tiled Watermark for Photo & Camera Deterrence) */}
      {isCurrentPageProtected && user && (
        <div 
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none select-none overflow-hidden opacity-[0.045] dark:opacity-[0.06] flex flex-wrap items-center justify-center gap-x-20 gap-y-16 p-6 text-foreground font-mono text-[10px] font-extrabold uppercase rotate-[-22deg]"
          style={{ zIndex: 9999 }}
        >
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="whitespace-nowrap tracking-widest text-zinc-500">
              ARTH RESEARCH • {user.email} • {user.uid.slice(0, 8)} • {timestampString}
            </div>
          ))}
        </div>
      )}

      {/* 3. Offline Status Banner */}
      {!isOnline && (
        <div 
          className="fixed bottom-4 left-4 right-4 z-50 glass-panel border-destructive/40 bg-card p-4 shadow-xl flex items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-destructive/15 text-destructive flex items-center justify-center">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground font-mono">Network Connection Interrupted</h4>
              <p className="text-[11px] text-muted-foreground font-mono">Real-time advisory telemetry paused until link restored.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

