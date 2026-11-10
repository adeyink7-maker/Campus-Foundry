import BackgroundFetch from 'react-native-background-fetch';
import { ExpiredKeyGarbageCollector } from './ExpiredKeyGarbageCollector';
import { MediaCacheCleaner } from './MediaCacheCleaner';
import { getDatabase } from './OfflineReplyManager';

export class BackgroundFetchService {
  /**
   * Initializes Background Fetch schedule and listeners
   */
  static async initBackgroundFetch(): Promise<void> {
    const onEvent = async (taskId: string) => {
      console.log(`[BackgroundFetch] Task received in foreground/background state: ${taskId}`);

      try {
        const database = await getDatabase();
        const keyCollector = new ExpiredKeyGarbageCollector(database);
        await Promise.all([
          keyCollector.purgeExpiredSenderKeys(),
          MediaCacheCleaner.purgeExpiredMediaFiles(),
        ]);
      } catch (error) {
        console.error('[BackgroundFetch] Execution error:', error);
      } finally {
        // MUST call finish() so the OS knows the task is complete
        BackgroundFetch.finish(taskId);
      }
    };

    const onTimeout = async (taskId: string) => {
      console.warn(`[BackgroundFetch] Task TIMEOUT: ${taskId}`);
      BackgroundFetch.finish(taskId);
    };

    // Configure BackgroundFetch
    if (BackgroundFetch && typeof BackgroundFetch.configure === 'function') {
      const status = await BackgroundFetch.configure(
        {
          minimumFetchInterval: 15, // Minimum interval in minutes (iOS enforces min ~15m)
          stopOnTerminate: false,    // Continue running when app is closed
          startOnBoot: true,         // Auto-start on Android device reboot
          enableHeadless: true,      // Enable JS execution when app is terminated
          requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE, // Run even offline to purge local storage
        },
        onEvent,
        onTimeout
      );

      console.log(`[BackgroundFetch] Configured successfully with status: ${status}`);
    } else {
      console.log('[BackgroundFetch] Native module not loaded in current runtime environment.');
    }
  }
}

export default BackgroundFetchService;
