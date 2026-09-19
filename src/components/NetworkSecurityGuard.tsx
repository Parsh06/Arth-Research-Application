import { useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export default function NetworkSecurityGuard() {
  const isOnline = useNetworkStatus();

  useEffect(() => {
    // Only enable if the environment variable is set to 'true'
    if (import.meta.env.VITE_NETWORK_SECURITY_GUARD !== 'true') {
      return;
    }

    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
    };

    const disableShortcuts = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      
      // Prevent Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }
      
      // Prevent Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
      }
      
      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }
    };

    // Attempt to stall debugger if they somehow open devtools
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
    window.addEventListener('keydown', disableShortcuts);
    
    // Periodically check for DevTools
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      window.removeEventListener('contextmenu', disableRightClick);
      window.removeEventListener('keydown', disableShortcuts);
      clearInterval(devToolsInterval);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-neo-danger border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <WifiOff className="w-8 h-8 text-white stroke-[3]" />
          <div>
            <h4 className="text-white font-black uppercase text-lg">You're Offline</h4>
            <p className="text-white font-bold text-sm">Some features are unavailable until your connection is restored.</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
