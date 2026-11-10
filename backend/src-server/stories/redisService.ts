import { redis } from './config';
import { StoryEntity } from './types';

/**
 * Multi-Layer Redis Caching Architecture for 24-Hour Stories
 * Integrated with ioredis client:
 * 1. Active User Feeds (Sorted Sets): feed:{user_id}
 * 2. Story Payload Cache (Hashes/JSON): story:{story_id} (TTL 86400s)
 * 3. Fast View Deduplication Buffer (Sets): story:views:{story_id}
 */

export class StoryRedisService {
  private fallbackStore = new Map<string, { val: any; expiresAt?: number }>();
  private fallbackSets = new Map<string, Set<string>>();
  private fallbackSortedSets = new Map<string, Map<string, number>>();

  /**
   * 1. Cache Story JSON Payload with 24-Hour TTL (86,400 seconds)
   * Key: story:{story_id}
   */
  async cacheStoryPayload(story: StoryEntity): Promise<void> {
    const key = `story:${story.story_id}`;
    const serialized = JSON.stringify(story);
    const ttlSeconds = 86400; // 24 Hours

    try {
      if (redis.status === 'ready') {
        await redis.set(key, serialized, 'EX', ttlSeconds);
        return;
      }
    } catch (err) {
      console.warn('[Redis] Cache payload fallback to memory:', err);
    }

    this.fallbackStore.set(key, {
      val: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Get cached story payload
   */
  async getStoryPayload(storyId: string): Promise<StoryEntity | null> {
    const key = `story:${storyId}`;

    try {
      if (redis.status === 'ready') {
        const val = await redis.get(key);
        if (val) return JSON.parse(val);
      }
    } catch {
      // Fallback
    }

    const record = this.fallbackStore.get(key);
    if (!record) return null;

    if (record.expiresAt && Date.now() > record.expiresAt) {
      this.fallbackStore.delete(key);
      return null;
    }

    try {
      return JSON.parse(record.val);
    } catch {
      return null;
    }
  }

  /**
   * 2. Fan-out Story ID to Followers' Active Feeds (Sorted Sets)
   * Score = unix_timestamp in milliseconds
   */
  async fanoutToFollowers(followerUserIds: string[], storyId: string, timestamp: number): Promise<void> {
    const ttlSeconds = 86400;
    const cutoff24h = Date.now() - ttlSeconds * 1000;

    try {
      if (redis.status === 'ready') {
        const pipeline = redis.pipeline();
        for (const followerId of followerUserIds) {
          const feedKey = `feed:${followerId}`;
          pipeline.zadd(feedKey, timestamp, storyId);
          pipeline.zremrangebyscore(feedKey, 0, cutoff24h);
          pipeline.expire(feedKey, ttlSeconds);
        }
        await pipeline.exec();
        return;
      }
    } catch (err) {
      console.warn('[Redis] Fanout pipeline fallback to memory:', err);
    }

    // In-memory fallback
    for (const followerId of followerUserIds) {
      const feedKey = `feed:${followerId}`;
      let sortedSet = this.fallbackSortedSets.get(feedKey);
      if (!sortedSet) {
        sortedSet = new Map<string, number>();
        this.fallbackSortedSets.set(feedKey, sortedSet);
      }
      sortedSet.set(storyId, timestamp);
      for (const [sId, score] of sortedSet.entries()) {
        if (score < cutoff24h) sortedSet.delete(sId);
      }
    }
  }

  /**
   * Retrieve active feed story IDs for a user (Sorted Set ZREVRANGE)
   */
  async getUserFeedStoryIds(userId: string, limit: number = 50): Promise<string[]> {
    const feedKey = `feed:${userId}`;

    try {
      if (redis.status === 'ready') {
        return await redis.zrevrange(feedKey, 0, limit - 1);
      }
    } catch {
      // Fallback
    }

    const sortedSet = this.fallbackSortedSets.get(feedKey);
    if (!sortedSet) return [];

    const cutoff = Date.now() - 86400 * 1000;
    return Array.from(sortedSet.entries())
      .filter(([_, score]) => score >= cutoff)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([sId]) => sId);
  }

  /**
   * 3. View Batching & Deduplication via Sets (SADD)
   * Returns true if viewer is new, false if already viewed
   */
  async registerViewEvent(storyId: string, viewerId: string): Promise<boolean> {
    const viewSetKey = `story:views:${storyId}`;

    try {
      if (redis.status === 'ready') {
        const added = await redis.sadd(viewSetKey, viewerId);
        return added === 1;
      }
    } catch {
      // Fallback
    }

    let set = this.fallbackSets.get(viewSetKey);
    if (!set) {
      set = new Set<string>();
      this.fallbackSets.set(viewSetKey, set);
    }

    if (set.has(viewerId)) return false;
    set.add(viewerId);
    return true;
  }

  /**
   * Get all active view buffer keys pending DB batch sync
   */
  async getPendingViewKeys(): Promise<string[]> {
    try {
      if (redis.status === 'ready') {
        return await redis.keys('story:views:*');
      }
    } catch {
      // Fallback
    }
    return Array.from(this.fallbackSets.keys());
  }

  /**
   * Drain and return viewers for a story key during batch worker flush
   */
  async drainViewSet(viewKey: string, batchSize: number = 500): Promise<string[]> {
    try {
      if (redis.status === 'ready') {
        return await redis.spop(viewKey, batchSize);
      }
    } catch {
      // Fallback
    }

    const set = this.fallbackSets.get(viewKey);
    if (!set || set.size === 0) return [];
    const viewers = Array.from(set).slice(0, batchSize);
    for (const v of viewers) set.delete(v);
    if (set.size === 0) this.fallbackSets.delete(viewKey);
    return viewers;
  }
}

export const storyRedisService = new StoryRedisService();
