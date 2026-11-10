import React, { useState, useEffect, useCallback } from 'react';

// Global network error event emitter and listener for real failed Supabase fetches
let globalOfflineListener: ((isOffline: boolean) => void) | null = null;

export function reportNetworkFailure() {
  if (globalOfflineListener) {
    globalOfflineListener(true);
  }
}

export function reportNetworkSuccess() {
  if (globalOfflineListener) {
    globalOfflineListener(false);
  }
}

export function useOfflineStatus() {
  const [isReallyOffline, setIsReallyOffline] = useState(false);

  useEffect(() => {
    globalOfflineListener = (offline: boolean) => {
      setIsReallyOffline(offline);
    };
    return () => {
      globalOfflineListener = null;
    };
  }, []);

  return isReallyOffline;
}

export const OfflineIndicator: React.FC = () => {
  const isOffline = useOfflineStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('https://httpbin.org/get', { method: 'GET', cache: 'no-store' }).catch(() => null);
      if (res && res.ok) {
        reportNetworkSuccess();
      } else {
        // Ping supabase endpoint or check online
        if (navigator.onLine) {
          reportNetworkSuccess();
        }
      }
    } catch {
      // Keep offline state
    } finally {
      setIsRetrying(false);
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-16 left-4 z-50 flex items-center gap-3 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl border border-amber-500/30 backdrop-blur-md">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>Connection issue detected. Using cached data.</span>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        className="rounded-lg bg-black/30 hover:bg-black/50 px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-50"
      >
        {isRetrying ? 'Retrying...' : 'Retry'}
      </button>
    </div>
  );
};

export default OfflineIndicator;
