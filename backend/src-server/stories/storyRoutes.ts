import { storyRedisService } from './redisService';
import { storyS3Service } from './s3Service';
import { StoryRepository } from './storyRepository';
import { StoryEntity, AuthorStoryStack, PresignedUploadRequest } from './types';

/**
 * Production Controller & Handlers for 24-Hour Stories Platform
 * Standardized across Express / Fastify / Node HTTP
 */

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  avatarUrl?: string;
  department?: string;
}

// In-Memory Database store mock simulating PostgreSQL table state
export const databaseStoriesTable: Map<string, StoryEntity> = new Map();
export const databaseStoryViewsTable: Map<string, Set<string>> = new Map();
export const databaseStoryReactionsTable: Map<string, Map<string, string>> = new Map();

/**
 * 1. POST /api/v1/stories/upload-url
 * Generates an S3 pre-signed upload URL for direct streaming
 */
export async function handleGenerateUploadUrl(
  currentUser: AuthenticatedUser,
  body: PresignedUploadRequest
) {
  if (!body.file_name || !body.file_type || !body.file_size) {
    throw new Error('file_name, file_type, and file_size are required parameters.');
  }

  const result = await storyS3Service.generatePresignedUploadUrl(currentUser.id, body);
  return {
    success: true,
    data: result,
  };
}

/**
 * 2. POST /api/v1/stories
 * Saves story metadata via StoryRepository into PostgreSQL,
 * caches payload in Redis (86,400s TTL), and fans out to active followers
 */
export async function handleCreateStory(
  currentUser: AuthenticatedUser,
  body: {
    media_url: string;
    media_type: 'image' | 'video';
    duration_seconds?: number;
    caption?: string;
    follower_ids?: string[];
  }
) {
  if (!body.media_url || !body.media_type) {
    throw new Error('media_url and media_type are required.');
  }

  // 1. Commit to PostgreSQL via StoryRepository
  const duration = body.duration_seconds || (body.media_type === 'video' ? 15 : 5);
  const record = await StoryRepository.createStory({
    authorId: currentUser.id,
    mediaUrl: body.media_url,
    mediaType: body.media_type,
    durationSeconds: duration,
    caption: body.caption,
  });

  const newStory: StoryEntity = {
    story_id: record.storyId,
    author_id: record.authorId,
    media_url: record.mediaUrl,
    media_type: record.mediaType,
    duration_seconds: record.durationSeconds,
    caption: record.caption || null,
    created_at: record.createdAt.toISOString(),
    expires_at: record.expiresAt.toISOString(),
    is_deleted: false,
    views_count: 0,
    likes_count: 0,
    metadata: {
      author_name: currentUser.fullName,
      author_avatar: currentUser.avatarUrl,
      author_dept: currentUser.department,
    },
  };

  databaseStoriesTable.set(record.storyId, newStory);

  // 2. Cache serialized JSON payload into Redis with 24-Hour TTL
  await storyRedisService.cacheStoryPayload(newStory);

  // 3. Query active followers via StoryRepository and fan-out to Redis Sorted Sets
  const followers = body.follower_ids?.length 
    ? [...body.follower_ids] 
    : await StoryRepository.getFollowerIds(currentUser.id);

  if (!followers.includes(currentUser.id)) {
    followers.push(currentUser.id); // Add self so author views their own active status
  }

  await storyRedisService.fanoutToFollowers(followers, record.storyId, record.createdAt.getTime());

  return {
    success: true,
    data: newStory,
  };
}

/**
 * 3. GET /api/v1/stories/feed?limit=20
 * Fetches active, unexpired stories grouped by author for requesting user's contacts
 * (Hits Redis Sorted Sets first with SQL Fallback via StoryRepository)
 */
export async function handleGetStoryFeed(
  currentUser: AuthenticatedUser,
  limit: number = 20
): Promise<{ success: boolean; data: AuthorStoryStack[] }> {
  // 1. Check Redis Sorted Set feed:{user_id}
  let storyIds = await storyRedisService.getUserFeedStoryIds(currentUser.id, limit * 5);

  const storiesList: StoryEntity[] = [];
  const now = Date.now();

  if (storyIds.length > 0) {
    for (const sId of storyIds) {
      let payload = await storyRedisService.getStoryPayload(sId);
      if (!payload) {
        payload = databaseStoriesTable.get(sId) || null;
      }

      if (payload && !payload.is_deleted && new Date(payload.expires_at).getTime() > now) {
        storiesList.push(payload);
      }
    }
  }

  // 2. SQL Fallback via StoryRepository if Redis cache was empty or cold
  if (storiesList.length === 0) {
    const fallbackRows = await StoryRepository.getFeedForUser(currentUser.id, limit);
    for (const row of fallbackRows) {
      storiesList.push({
        story_id: row.storyId,
        author_id: row.authorId,
        media_url: row.mediaUrl,
        media_type: row.mediaType,
        duration_seconds: row.durationSeconds,
        caption: row.caption,
        created_at: new Date(row.createdAt).toISOString(),
        expires_at: new Date(row.expiresAt).toISOString(),
        is_deleted: false,
        views_count: 0,
        likes_count: 0,
        metadata: {
          author_name: row.username || 'UNILORIN Student',
        },
      });
    }

    // In-memory fallback if empty database
    if (storiesList.length === 0) {
      for (const s of databaseStoriesTable.values()) {
        if (!s.is_deleted && new Date(s.expires_at).getTime() > now) {
          storiesList.push(s);
        }
      }
    }
  }

  // 3. Group stories by Author Stack
  const authorMap = new Map<string, StoryEntity[]>();
  for (const s of storiesList) {
    const list = authorMap.get(s.author_id) || [];
    list.push(s);
    authorMap.set(s.author_id, list);
  }

  const stacks: AuthorStoryStack[] = [];
  for (const [authorId, authorStories] of authorMap.entries()) {
    authorStories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const latestStory = authorStories[authorStories.length - 1];

    // Check if user has unseen stories
    let hasUnseen = false;
    for (const s of authorStories) {
      const viewers = databaseStoryViewsTable.get(s.story_id);
      if (!viewers || !viewers.has(currentUser.id)) {
        hasUnseen = true;
        break;
      }
    }

    stacks.push({
      author_id: authorId,
      author_name: latestStory.metadata?.author_name || 'UNILORIN Student',
      author_avatar: latestStory.metadata?.author_avatar,
      has_unseen: hasUnseen,
      latest_created_at: latestStory.created_at,
      stories: authorStories,
    });
  }

  // Unseen stories first, then sort by latest update
  stacks.sort((a, b) => {
    if (a.has_unseen && !b.has_unseen) return -1;
    if (!a.has_unseen && b.has_unseen) return 1;
    return new Date(b.latest_created_at).getTime() - new Date(a.latest_created_at).getTime();
  });

  return {
    success: true,
    data: stacks.slice(0, limit),
  };
}

/**
 * 4. POST /api/v1/stories/:story_id/view
 * Registers a view event (hits Redis Set buffer for high-throughput deduplication)
 */
export async function handleRegisterStoryView(
  currentUser: AuthenticatedUser,
  storyId: string
) {
  const isNew = await storyRedisService.registerViewEvent(storyId, currentUser.id);

  if (isNew) {
    let viewersSet = databaseStoryViewsTable.get(storyId);
    if (!viewersSet) {
      viewersSet = new Set();
      databaseStoryViewsTable.set(storyId, viewersSet);
    }
    viewersSet.add(currentUser.id);

    const story = databaseStoriesTable.get(storyId);
    if (story) {
      story.views_count += 1;
    }
  }

  return {
    success: true,
    is_new_view: isNew,
  };
}

/**
 * 5. POST /api/v1/stories/:story_id/react
 * Registers like or reaction
 */
export async function handleReactToStory(
  currentUser: AuthenticatedUser,
  storyId: string,
  reactionType: string = 'like'
) {
  let storyReactions = databaseStoryReactionsTable.get(storyId);
  if (!storyReactions) {
    storyReactions = new Map();
    databaseStoryReactionsTable.set(storyId, storyReactions);
  }

  const isExisting = storyReactions.has(currentUser.id);
  storyReactions.set(currentUser.id, reactionType);

  const story = databaseStoriesTable.get(storyId);
  if (story && !isExisting) {
    story.likes_count += 1;
  }

  return {
    success: true,
    reaction_type: reactionType,
    likes_count: story?.likes_count || 1,
  };
}

/**
 * 6. GET /api/v1/stories/:story_id/viewers?page=1&limit=50
 * Fetches viewer list (Restricted to Story Author only)
 */
export async function handleGetStoryViewers(
  currentUser: AuthenticatedUser,
  storyId: string,
  page: number = 1,
  limit: number = 50
) {
  const story = databaseStoriesTable.get(storyId);
  if (!story) {
    throw new Error('Story not found.');
  }

  if (story.author_id !== currentUser.id) {
    throw new Error('Unauthorized: Only the story author can inspect viewer receipts.');
  }

  const viewersSet = databaseStoryViewsTable.get(storyId) || new Set();
  const reactionsMap = databaseStoryReactionsTable.get(storyId) || new Map();

  const viewersArray = Array.from(viewersSet);
  const startIndex = (page - 1) * limit;
  const paginatedViewers = viewersArray.slice(startIndex, startIndex + limit).map((viewerId) => ({
    viewer_id: viewerId,
    viewer_name: viewerId === currentUser.id ? currentUser.fullName : `Student ${viewerId.slice(-4)}`,
    reaction: reactionsMap.get(viewerId) || null,
  }));

  return {
    success: true,
    total_views: viewersArray.length,
    page,
    limit,
    viewers: paginatedViewers,
  };
}
