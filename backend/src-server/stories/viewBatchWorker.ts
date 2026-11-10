import { db } from './config';
import { storyRedisService } from './redisService';

/**
 * 30-Second Asynchronous View Batching & Deduplication Worker
 * 
 * Pipeline:
 * 1. Scans buffered keys: story:views:{story_id} from Redis Sets
 * 2. Drains unique viewer IDs using SPOP in batches of 500
 * 3. Prepares bulk SQL query: INSERT INTO story_views (story_id, viewer_id, viewed_at) VALUES ... ON CONFLICT (story_id, viewer_id) DO NOTHING
 * 4. Increments stories.views_count atomically
 */

export class StoryViewBatchWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  start(intervalMs: number = 30000): void {
    if (this.intervalId) return;

    console.log(`[StoryViewBatchWorker] Started view aggregation worker (frequency: ${intervalMs / 1000}s).`);
    this.intervalId = setInterval(() => {
      this.flushPendingViewsToDatabase().catch((err) => {
        console.error('[StoryViewBatchWorker] Error flushing views:', err);
      });
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[StoryViewBatchWorker] Worker stopped.');
    }
  }

  async flushPendingViewsToDatabase(): Promise<{ processedStories: number; totalViewsInserted: number }> {
    if (this.isProcessing) {
      console.log('[StoryViewBatchWorker] Previous flush tick still active, skipping.');
      return { processedStories: 0, totalViewsInserted: 0 };
    }

    this.isProcessing = true;
    let totalViewsInserted = 0;
    let processedStories = 0;

    try {
      const pendingKeys = await storyRedisService.getPendingViewKeys();
      if (!pendingKeys || pendingKeys.length === 0) {
        return { processedStories: 0, totalViewsInserted: 0 };
      }

      for (const viewKey of pendingKeys) {
        // Expected format: story:views:{story_id}
        const storyId = viewKey.replace('story:views:', '');
        const viewers = await storyRedisService.drainViewSet(viewKey, 500);

        if (!viewers || viewers.length === 0) continue;

        processedStories++;
        totalViewsInserted += viewers.length;

        // Perform batch bulk upsert in PostgreSQL with transaction isolation
        try {
          const client = await db.connect();
          try {
            await client.query('BEGIN');

            // Bulk multi-row values generation
            const valueClauses: string[] = [];
            const queryParams: any[] = [storyId];

            viewers.forEach((viewerId, index) => {
              queryParams.push(viewerId);
              valueClauses.push(`($1, $${index + 2}, NOW())`);
            });

            const insertSql = `
              INSERT INTO story_views (story_id, viewer_id, viewed_at)
              VALUES ${valueClauses.join(', ')}
              ON CONFLICT (story_id, viewer_id) DO NOTHING;
            `;

            await client.query(insertSql, queryParams);

            // Atomically update stories table view counter
            await client.query(
              `UPDATE stories SET views_count = views_count + $1 WHERE story_id = $2`,
              [viewers.length, storyId]
            );

            await client.query('COMMIT');
            console.log(`[StoryViewBatchWorker] Flushed ${viewers.length} views for story ${storyId} into PostgreSQL.`);
          } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
          } finally {
            client.release();
          }
        } catch (connErr: any) {
          console.warn(`[StoryViewBatchWorker] DB flush notice (Offline mode or connection error): ${connErr.message}`);
        }
      }

      return { processedStories, totalViewsInserted };
    } finally {
      this.isProcessing = false;
    }
  }
}

export const storyViewBatchWorker = new StoryViewBatchWorker();
