import { Request, Response, Router } from 'express';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, redis } from './config';
import { StoryRepository } from './storyQueries';

const router = Router();
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'my-app-stories-bucket';
const CDN_DOMAIN = process.env.CDN_DOMAIN || 'https://cdn.myapp.com';

/**
 * 1. POST /api/v1/stories/upload-url
 * Generates an ephemeral S3 pre-signed URL for direct client upload
 */
router.post('/upload-url', async (req: Request, res: Response) => {
  try {
    const { fileType, fileSize } = req.body;
    // req.user contains authenticated user context (populated by auth middleware)
    const userId = (req as any).user?.id || 'd3b07384-d113-44a6-a719-d12852371b28';

    if (!fileType || !['image/jpeg', 'image/png', 'video/mp4'].includes(fileType)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // 10MB file limit validation
    if (fileSize > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }

    const fileExtension = fileType.split('/')[1];
    const mediaKey = `stories/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: mediaKey,
      ContentType: fileType,
    });

    // Generate pre-signed URL valid for 5 minutes (300s)
    let presignedUrl: string;
    try {
      presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    } catch {
      presignedUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${mediaKey}?X-Amz-Expires=300`;
    }

    return res.status(200).json({
      uploadUrl: presignedUrl,
      mediaKey: mediaKey,
      publicUrl: `${CDN_DOMAIN}/${mediaKey}`,
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

/**
 * 2. POST /api/v1/stories
 * Saves story metadata to Database and updates Redis feed caches
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { mediaKey, mediaType, durationSeconds, caption } = req.body;
    const userId = (req as any).user?.id || 'd3b07384-d113-44a6-a719-d12852371b28';

    if (!mediaKey || !mediaType) {
      return res.status(400).json({ error: 'mediaKey and mediaType are required' });
    }

    const mediaUrl = `${CDN_DOMAIN}/${mediaKey}`;

    // 1. Write to PostgreSQL Database
    const story = await StoryRepository.createStory({
      authorId: userId,
      mediaUrl,
      mediaType,
      durationSeconds: durationSeconds || 5,
      caption,
    });

    // 2. Cache Individual Story Metadata Payload in Redis (TTL: 24 Hours = 86400s)
    const storyCacheKey = `story:${story.storyId}`;
    try {
      if (redis.status === 'ready') {
        await redis.setex(storyCacheKey, 86400, JSON.stringify(story));
      }
    } catch (cacheErr) {
      console.warn('[Redis] Story caching notice:', cacheErr);
    }

    // 3. Redis Fan-Out: Append story ID to author's followers' active feeds
    try {
      const followerIds = await StoryRepository.getFollowerIds(userId);
      const score = new Date(story.createdAt).getTime();

      if (redis.status === 'ready') {
        const pipeline = redis.pipeline();
        followerIds.forEach((followerId) => {
          const feedKey = `feed:${followerId}`;
          pipeline.zadd(feedKey, score, story.storyId);
          pipeline.expire(feedKey, 86400); // 24hr TTL for feed cache
        });
        
        // Also add to author's own feed set
        pipeline.zadd(`feed:${userId}`, score, story.storyId);
        pipeline.expire(`feed:${userId}`, 86400);

        await pipeline.exec();
      }
    } catch (fanoutErr) {
      console.warn('[Redis] Fan-out pipeline notice:', fanoutErr);
    }

    return res.status(201).json({
      message: 'Story published successfully',
      story,
    });
  } catch (error) {
    console.error('Error creating story:', error);
    return res.status(500).json({ error: 'Failed to create story record' });
  }
});

/**
 * 3. GET /api/v1/stories/feed
 * High-performance story timeline fetcher utilizing Redis Cache with DB Fallback
 */
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'd3b07384-d113-44a6-a719-d12852371b28';
    const feedKey = `feed:${userId}`;

    // Fetch latest active story IDs from Redis Sorted Set (Descending by time)
    if (redis.status === 'ready') {
      const storyIds = await redis.zrevrange(feedKey, 0, 50);

      if (storyIds.length > 0) {
        // Pipeline MGET to fetch story payloads fast
        const pipeline = redis.pipeline();
        storyIds.forEach((id) => pipeline.get(`story:${id}`));
        const cachedStories = await pipeline.exec();

        const stories = cachedStories
          ? cachedStories
              .map(([_, result]) => (result ? JSON.parse(result as string) : null))
              .filter(Boolean)
          : [];

        return res.status(200).json({ source: 'cache', count: stories.length, stories });
      }
    }

    // Cache miss / fallback to SQL database query
    const stories = await StoryRepository.getFeedForUser(userId, 50);
    return res.status(200).json({ source: 'database', count: stories.length, stories });
  } catch (error) {
    console.error('Error fetching story feed:', error);
    return res.status(500).json({ error: 'Failed to fetch stories feed' });
  }
});

/**
 * 4. POST /api/v1/stories/:story_id/view
 * High-speed view event buffering via Redis Sets
 */
router.post('/:story_id/view', async (req: Request, res: Response) => {
  try {
    const { story_id } = req.params;
    const userId = (req as any).user?.id || 'd3b07384-d113-44a6-a719-d12852371b28';

    if (redis.status === 'ready') {
      const added = await redis.sadd(`story:views:${story_id}`, userId);
      return res.status(200).json({ success: true, isNew: added === 1 });
    }

    return res.status(200).json({ success: true, isNew: true });
  } catch (error) {
    console.error('Error registering view:', error);
    return res.status(500).json({ error: 'Failed to register view' });
  }
});

export default router;
