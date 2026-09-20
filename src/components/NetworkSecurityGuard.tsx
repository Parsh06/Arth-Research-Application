import { useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export default function NetworkSecurityGuard() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    // Only enable if the environment variable is explicitly set to 'true'
    if (import.meta.env.VITE_NETWORK_SECURITY_GUARD !== 'true') {
      return;
    }

    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const disableShortcuts = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === 'F12' || e.code === 'F12') {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Prevent Ctrl+Shift+I / Cmd+Opt+I (DevTools)
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.code === 'KeyI')) ||
        (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.code === 'KeyI'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Prevent Ctrl+Shift+J / Cmd+Opt+J (Console)
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.code === 'KeyJ')) ||
        (e.metaKey && e.altKey && (e.key === 'J' || e.key === 'j' || e.code === 'KeyJ'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Prevent Ctrl+Shift+C / Cmd+Opt+C (Element Inspector)
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.code === 'KeyC')) ||
        (e.metaKey && e.altKey && (e.key === 'C' || e.key === 'c' || e.code === 'KeyC'))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Prevent Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.code === 'KeyU')) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Prevent Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS') && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Stalls debugger execution if devtools window is forcibly opened
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      if (widthThreshold || heightThreshold) {
        // eslint-disable-next-line no-debugger
        debugger;
      }
    };

    // Attach event listeners
    window.addEventListener('contextmenu', disableRightClick);
    window.addEventListener('keydown', disableShortcuts, true);
    
    // Periodically check for DevTools
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      window.removeEventListener('contextmenu', disableRightClick);
      window.removeEventListener('keydown', disableShortcuts, true);
      clearInterval(devToolsInterval);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-destructive border-2 border-border p-4 rounded-xl shadow-2xl flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <WifiOff className="w-6 h-6 text-white" />
          <div>
            <h4 className="text-white font-bold text-sm">Connection Interrupted</h4>
            <p className="text-white/80 text-xs">Live advisory updates paused until internet is restored.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

