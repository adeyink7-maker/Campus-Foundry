import { useEffect, useRef } from 'react';
import { ExpiredKeyGarbageCollector } from './ExpiredKeyGarbageCollector';
import { MediaCacheCleaner } from './MediaCacheCleaner';
import { getDatabase } from './OfflineReplyManager';

export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown' | 'extension';

// Platform-resilient AppState listener (works in both React Native & Web environments)
const getPlatformAppState = () => {
  if (typeof document !== 'undefined') {
    return document.visibilityState === 'visible' ? 'active' : 'background';
  }
  return 'active';
};

export const useAutoCleanupScheduler = () => {
  const appState = useRef<string>(getPlatformAppState());

  const runFullCleanup = async () => {
    console.log('Running automatic 24-hour story cleanup cycle...');
    const database = await getDatabase();
    const keyCollector = new ExpiredKeyGarbageCollector(database);

    // Execute key purge and media cleanup concurrently
    try {
      await Promise.all([
        keyCollector.purgeExpiredSenderKeys(),
        MediaCacheCleaner.purgeExpiredMediaFiles(),
      ]);
      console.log('Story cleanup cycle completed successfully.');
    } catch (err) {
      console.error('Error executing full cleanup cycle:', err);
    }
  };

  useEffect(() => {
    // 1. Run cleanup immediately upon component mounting (App startup)
    runFullCleanup();

    // 2. Subscribe to visibility/app state transitions (Background -> Foreground)
    const handleVisibilityChange = () => {
      const nextState = getPlatformAppState();
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        runFullCleanup();
      }
      appState.current = nextState;
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // 3. Set a recurring 1-hour background interval if app remains open
    const intervalId = setInterval(runFullCleanup, 60 * 60 * 1000);

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      clearInterval(intervalId);
    };
  }, []);

  return { runFullCleanup };
};

export default useAutoCleanupScheduler;
