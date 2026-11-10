import { redis, db } from './config';

/**
 * Asynchronous background worker that periodically flushes view receipts
 * from Redis Sets to PostgreSQL to eliminate lock contention and write amplification.
 */
export async function flushStoryViewsWorker() {
  try {
    if (redis.status !== 'ready') {
      return;
    }

    // Scan all keys matching story:views:*
    const keys = await redis.keys('story:views:*');

    for (const key of keys) {
      const storyId = key.split(':')[2];
      if (!storyId) continue;
      
      // Pop up to 100 viewer IDs recorded in this Redis Set
      const viewerIds = await redis.spop(key, 100);

      if (viewerIds && viewerIds.length > 0) {
        // Construct parameterized SQL bulk insert with ON CONFLICT DO NOTHING
        const valuesClause = viewerIds
          .map((_, index) => `($1, $${index + 2})`)
          .join(', ');

        const query = `
          INSERT INTO story_views (story_id, viewer_id)
          VALUES ${valuesClause}
          ON CONFLICT (story_id, viewer_id) DO NOTHING;
        `;

        await db.query(query, [storyId, ...viewerIds]);
      }
    }
  } catch (error) {
    console.error('Error in story views flush worker:', error);
  }
}

// Run worker interval every 30 seconds
setInterval(flushStoryViewsWorker, 30000);
