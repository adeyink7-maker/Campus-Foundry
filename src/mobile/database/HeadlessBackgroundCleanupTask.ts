import BackgroundFetch from 'react-native-background-fetch';
import { ExpiredKeyGarbageCollector } from './ExpiredKeyGarbageCollector';
import { MediaCacheCleaner } from './MediaCacheCleaner';
import { getDatabase } from './OfflineReplyManager';

/**
 * Headless task registered to execute when the app is terminated/closed
 */
export const HeadlessBackgroundCleanupTask = async (event: { taskId: string; timeout: boolean }) => {
  const taskId = event.taskId;
  const isTimeout = event.timeout;

  if (isTimeout) {
    console.warn(`[BackgroundFetch] Task ${taskId} timed out by OS.`);
    BackgroundFetch.finish(taskId);
    return;
  }

  console.log(`[BackgroundFetch] Headless cleanup task started: ${taskId}`);

  try {
    const database = await getDatabase();
    const keyCollector = new ExpiredKeyGarbageCollector(database);

    // Run key zero-out/purge and media cache cleaning in parallel
    await Promise.all([
      keyCollector.purgeExpiredSenderKeys(),
      MediaCacheCleaner.purgeExpiredMediaFiles(),
    ]);

    console.log('[BackgroundFetch] Headless cleanup successfully finished.');
  } catch (error) {
    console.error('[BackgroundFetch] Headless cleanup error:', error);
  } finally {
    // REQUIRED: Signal task completion to iOS/Android OS
    BackgroundFetch.finish(taskId);
  }
};

export default HeadlessBackgroundCleanupTask;
