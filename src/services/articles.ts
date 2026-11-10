import { supabase, isSupabaseConfigured, uploadMedia } from './supabase';
import { getFriendlyError } from '../utils/friendlyErrors';
import type {
  Article,
  ArticleWithAuthor,
  ArticleAuthor,
  ArticleComment
} from '../types/articles';

const STORAGE_CACHE_PREFIX = 'cf_articles_user_';

function getLocalArticles(userId: string): Article[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_CACHE_PREFIX}${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalArticles(userId: string, articles: Article[]): void {
  try {
    localStorage.setItem(`${STORAGE_CACHE_PREFIX}${userId}`, JSON.stringify(articles));
  } catch {}
}

export async function uploadArticleImage(userId: string, file: File): Promise<string> {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${Date.now()}-${safeName}`;
    return await uploadMedia('article-images', path, file);
  } catch (err: any) {
    const friendly = getFriendlyError(err, 'upload') || 'Unable to upload image right now. Please try again.';
    throw new Error(friendly);
  }
}

// Helper to fetch multiple profiles by IDs
export async function fetchAuthorsByIds(userIds: string[]): Promise<Record<string, ArticleAuthor>> {
  const result: Record<string, ArticleAuthor> = {};
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0 || !isSupabaseConfigured) return result;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, department, university, is_verified')
      .in('id', uniqueIds);

    if (!error && data) {
      for (const row of data) {
        result[row.id] = {
          id: row.id,
          name: row.full_name || row.username || 'Student Writer',
          avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
          username: row.username ? (row.username.startsWith('@') ? row.username : `@${row.username}`) : undefined,
          department: row.department,
          university: row.university,
          isVerified: Boolean(row.is_verified)
        };
      }
    }
  } catch (err) {
    console.warn('[Articles fetchAuthorsByIds Notice]:', err);
  }

  return result;
}

export async function fetchPublishedArticles(currentUserId?: string): Promise<ArticleWithAuthor[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (articlesError) {
      console.warn('[Articles fetchPublishedArticles Notice]:', articlesError.message);
      return [];
    }

    if (!articlesData || articlesData.length === 0) return [];

    const articleIds = articlesData.map((a) => a.id);
    const authorIds = articlesData.map((a) => a.author_id);

    // Fetch authors, likes counts, views counts, comments counts in parallel
    const [authorsMap, likesCountMap, userLikesSet, userBookmarksSet] = await Promise.all([
      fetchAuthorsByIds(authorIds),
      fetchLikesCountForArticles(articleIds),
      currentUserId ? fetchUserLikedArticleIds(articleIds, currentUserId) : Promise.resolve(new Set<string>()),
      currentUserId ? fetchUserBookmarkedArticleIds(articleIds, currentUserId) : Promise.resolve(new Set<string>())
    ]);

    return articlesData.map((row) => ({
      id: row.id,
      author_id: row.author_id,
      title: row.title || 'Untitled Article',
      cover_url: row.cover_url || null,
      content: row.content || {},
      excerpt: row.excerpt || '',
      category: row.category || 'General',
      tags: Array.isArray(row.tags) ? row.tags : [],
      status: 'published',
      read_minutes: Number(row.read_minutes) || 1,
      published_at: row.published_at || row.created_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: authorsMap[row.author_id] || {
        id: row.author_id,
        name: 'Student Writer',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
      },
      likes_count: likesCountMap[row.id] || 0,
      views_count: 0,
      comments_count: 0,
      is_liked: userLikesSet.has(row.id),
      is_bookmarked: userBookmarksSet.has(row.id)
    }));
  } catch (err: any) {
    console.warn('[Articles fetchPublishedArticles Exception]:', err?.message || err);
    return [];
  }
}

export async function fetchArticleById(id: string, userId?: string): Promise<Article | null> {
  if (userId) {
    const local = getLocalArticles(userId).find((a) => a.id === id);
    if (local && !isSupabaseConfigured) return local;
  }

  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('[Articles fetchArticleById Notice]:', error.message);
      if (userId) {
        return getLocalArticles(userId).find((a) => a.id === id) || null;
      }
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      author_id: data.author_id,
      title: data.title || '',
      cover_url: data.cover_url || null,
      content: data.content || {},
      excerpt: data.excerpt || '',
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status === 'published' ? 'published' : 'draft',
      read_minutes: Number(data.read_minutes) || 1,
      published_at: data.published_at || null,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (err: any) {
    console.warn('[Articles fetchArticleById Exception]:', err?.message || err);
    if (userId) {
      return getLocalArticles(userId).find((a) => a.id === id) || null;
    }
    return null;
  }
}

// Fetch article with full details, author, counts, and user interaction states
export async function fetchArticleDetail(
  articleId: string,
  currentUserId?: string
): Promise<{
  article: ArticleWithAuthor;
  author: ArticleAuthor;
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
} | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .maybeSingle();

    if (error || !data) {
      console.warn('[Articles fetchArticleDetail Notice]:', error?.message);
      return null;
    }

    const [authorsMap, likesCount, viewsCount, commentsCount, isLiked, isBookmarked] = await Promise.all([
      fetchAuthorsByIds([data.author_id]),
      countTableRows('article_likes', 'article_id', articleId),
      countTableRows('article_views', 'article_id', articleId),
      countTableRows('article_comments', 'article_id', articleId),
      currentUserId ? checkUserInteraction('article_likes', articleId, currentUserId) : Promise.resolve(false),
      currentUserId ? checkUserInteraction('article_bookmarks', articleId, currentUserId) : Promise.resolve(false)
    ]);

    const author: ArticleAuthor = authorsMap[data.author_id] || {
      id: data.author_id,
      name: 'Student Writer',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    };

    const articleWithAuthor: ArticleWithAuthor = {
      id: data.id,
      author_id: data.author_id,
      title: data.title || 'Untitled Article',
      cover_url: data.cover_url || null,
      content: data.content || {},
      excerpt: data.excerpt || '',
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status === 'published' ? 'published' : 'draft',
      read_minutes: Number(data.read_minutes) || 1,
      published_at: data.published_at || data.created_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      author,
      likes_count: likesCount,
      views_count: viewsCount,
      comments_count: commentsCount,
      is_liked: isLiked,
      is_bookmarked: isBookmarked
    };

    return {
      article: articleWithAuthor,
      author,
      isLiked,
      isBookmarked,
      likesCount,
      viewsCount,
      commentsCount
    };
  } catch (err: any) {
    console.warn('[Articles fetchArticleDetail Exception]:', err?.message || err);
    return null;
  }
}

// 3. Views: record one row in article_views (article_id, user_id) if signed in and not author.
export async function recordArticleView(articleId: string, userId: string, authorId: string): Promise<void> {
  if (!isSupabaseConfigured || !userId || !articleId) return;
  // Do not record views from the author
  if (userId === authorId) return;

  try {
    const { error } = await supabase
      .from('article_views')
      .insert({
        article_id: articleId,
        user_id: userId
      });

    // If duplicate (23505/409), PostgreSQL cleanly ignores it via unique constraint
    if (error && error.code !== '23505' && error.code !== '409') {
      console.warn('[Articles recordArticleView Notice]:', error.message);
    }
  } catch (err) {
    // Ignore duplicate or network errors silently without throwing
  }
}

// 2. Like button toggle with count (one like per user)
export async function toggleArticleLike(articleId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  if (!isSupabaseConfigured || !userId || !articleId) {
    return { liked: false, count: 0 };
  }

  try {
    const isCurrentlyLiked = await checkUserInteraction('article_likes', articleId, userId);

    if (isCurrentlyLiked) {
      await supabase
        .from('article_likes')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', userId);
    } else {
      await supabase
        .from('article_likes')
        .insert({
          article_id: articleId,
          user_id: userId
        });
    }

    const nextCount = await countTableRows('article_likes', 'article_id', articleId);
    return { liked: !isCurrentlyLiked, count: nextCount };
  } catch (err: any) {
    console.warn('[Articles toggleArticleLike Exception]:', err?.message || err);
    const count = await countTableRows('article_likes', 'article_id', articleId);
    return { liked: false, count };
  }
}

// 2. Bookmark button toggle
export async function toggleArticleBookmark(articleId: string, userId: string): Promise<{ bookmarked: boolean }> {
  if (!isSupabaseConfigured || !userId || !articleId) {
    return { bookmarked: false };
  }

  try {
    const isCurrentlyBookmarked = await checkUserInteraction('article_bookmarks', articleId, userId);

    if (isCurrentlyBookmarked) {
      await supabase
        .from('article_bookmarks')
        .delete()
        .eq('article_id', articleId)
        .eq('user_id', userId);
      return { bookmarked: false };
    } else {
      await supabase
        .from('article_bookmarks')
        .insert({
          article_id: articleId,
          user_id: userId
        });
      return { bookmarked: true };
    }
  } catch (err: any) {
    console.warn('[Articles toggleArticleBookmark Exception]:', err?.message || err);
    return { bookmarked: false };
  }
}

// Comments
export async function fetchArticleComments(articleId: string): Promise<ArticleComment[]> {
  if (!isSupabaseConfigured || !articleId) return [];

  try {
    const { data, error } = await supabase
      .from('article_comments')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Articles fetchArticleComments Notice]:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    const userIds = data.map((c) => c.user_id);
    const authorsMap = await fetchAuthorsByIds(userIds);

    return data.map((row) => ({
      id: row.id,
      article_id: row.article_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      author_name: authorsMap[row.user_id]?.name || 'Student',
      author_avatar: authorsMap[row.user_id]?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      author_username: authorsMap[row.user_id]?.username
    }));
  } catch (err: any) {
    console.warn('[Articles fetchArticleComments Exception]:', err?.message || err);
    return [];
  }
}

export async function addArticleComment(articleId: string, userId: string, content: string): Promise<ArticleComment> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Comment cannot be empty.');

  if (!isSupabaseConfigured) {
    return {
      id: `comm_${Date.now()}`,
      article_id: articleId,
      user_id: userId,
      content: trimmed,
      created_at: new Date().toISOString()
    };
  }

  try {
    const { data, error } = await supabase
      .from('article_comments')
      .insert({
        article_id: articleId,
        user_id: userId,
        content: trimmed
      })
      .select('*')
      .single();

    if (error) {
      console.warn('[Articles addArticleComment Notice]:', error.message);
      throw new Error('Unable to post comment right now.');
    }

    const authorMap = await fetchAuthorsByIds([userId]);
    return {
      id: data.id,
      article_id: data.article_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      author_name: authorMap[userId]?.name || 'Student',
      author_avatar: authorMap[userId]?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      author_username: authorMap[userId]?.username
    };
  } catch (err: any) {
    const friendly = getFriendlyError(err, 'post') || 'Unable to post comment right now.';
    throw new Error(friendly);
  }
}

export async function deleteArticleComment(commentId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from('article_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.warn('[Articles deleteArticleComment Notice]:', error.message);
      throw new Error('Unable to delete comment right now.');
    }
    return true;
  } catch (err: any) {
    console.warn('[Articles deleteArticleComment Exception]:', err);
    return false;
  }
}

// 4. Profiles: "Articles" tab showing that person's published articles
export async function fetchUserPublishedArticles(authorId: string): Promise<ArticleWithAuthor[]> {
  if (!isSupabaseConfigured || !authorId) return [];

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', authorId)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error || !data) {
      console.warn('[Articles fetchUserPublishedArticles Notice]:', error?.message);
      return [];
    }

    const articleIds = data.map((a) => a.id);
    const [authorMap, likesCountMap] = await Promise.all([
      fetchAuthorsByIds([authorId]),
      fetchLikesCountForArticles(articleIds)
    ]);

    return data.map((row) => ({
      id: row.id,
      author_id: row.author_id,
      title: row.title || 'Untitled Article',
      cover_url: row.cover_url || null,
      content: row.content || {},
      excerpt: row.excerpt || '',
      category: row.category || 'General',
      tags: Array.isArray(row.tags) ? row.tags : [],
      status: 'published',
      read_minutes: Number(row.read_minutes) || 1,
      published_at: row.published_at || row.created_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: authorMap[authorId],
      likes_count: likesCountMap[row.id] || 0,
      views_count: 0,
      comments_count: 0
    }));
  } catch (err: any) {
    console.warn('[Articles fetchUserPublishedArticles Exception]:', err?.message || err);
    return [];
  }
}

// 4. Profiles: On user's own profile, "Saved articles" list from article_bookmarks
export async function fetchUserSavedArticles(userId: string): Promise<ArticleWithAuthor[]> {
  if (!isSupabaseConfigured || !userId) return [];

  try {
    const { data: bookmarkRows, error: bookmarkError } = await supabase
      .from('article_bookmarks')
      .select('article_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookmarkError || !bookmarkRows || bookmarkRows.length === 0) {
      return [];
    }

    const articleIds = bookmarkRows.map((b) => b.article_id);
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .in('id', articleIds);

    if (articlesError || !articlesData) return [];

    const authorIds = articlesData.map((a) => a.author_id);
    const [authorsMap, likesCountMap] = await Promise.all([
      fetchAuthorsByIds(authorIds),
      fetchLikesCountForArticles(articleIds)
    ]);

    return articlesData.map((row) => ({
      id: row.id,
      author_id: row.author_id,
      title: row.title || 'Untitled Article',
      cover_url: row.cover_url || null,
      content: row.content || {},
      excerpt: row.excerpt || '',
      category: row.category || 'General',
      tags: Array.isArray(row.tags) ? row.tags : [],
      status: row.status,
      read_minutes: Number(row.read_minutes) || 1,
      published_at: row.published_at || row.created_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: authorsMap[row.author_id],
      likes_count: likesCountMap[row.id] || 0,
      views_count: 0,
      comments_count: 0,
      is_bookmarked: true
    }));
  } catch (err: any) {
    console.warn('[Articles fetchUserSavedArticles Exception]:', err?.message || err);
    return [];
  }
}

// 5. "My articles" screen metrics: real counts of views, likes, comments
export async function fetchMetricsForArticles(
  articleIds: string[]
): Promise<Record<string, { views: number; likes: number; comments: number }>> {
  const result: Record<string, { views: number; likes: number; comments: number }> = {};
  if (!isSupabaseConfigured || articleIds.length === 0) return result;

  for (const id of articleIds) {
    result[id] = { views: 0, likes: 0, comments: 0 };
  }

  try {
    const [viewsRes, likesRes, commentsRes] = await Promise.all([
      supabase.from('article_views').select('article_id').in('article_id', articleIds),
      supabase.from('article_likes').select('article_id').in('article_id', articleIds),
      supabase.from('article_comments').select('article_id').in('article_id', articleIds)
    ]);

    if (viewsRes.data) {
      for (const row of viewsRes.data) {
        if (result[row.article_id]) result[row.article_id].views += 1;
      }
    }

    if (likesRes.data) {
      for (const row of likesRes.data) {
        if (result[row.article_id]) result[row.article_id].likes += 1;
      }
    }

    if (commentsRes.data) {
      for (const row of commentsRes.data) {
        if (result[row.article_id]) result[row.article_id].comments += 1;
      }
    }
  } catch (err) {
    console.warn('[Articles fetchMetricsForArticles Notice]:', err);
  }

  return result;
}

// Helper query utilities
async function countTableRows(tableName: string, matchColumn: string, matchValue: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq(matchColumn, matchValue);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

async function checkUserInteraction(tableName: string, articleId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('article_id', articleId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}

async function fetchLikesCountForArticles(articleIds: string[]): Promise<Record<string, number>> {
  const map: Record<string, number> = {};
  if (articleIds.length === 0) return map;

  try {
    const { data, error } = await supabase
      .from('article_likes')
      .select('article_id')
      .in('article_id', articleIds);

    if (!error && data) {
      for (const row of data) {
        map[row.article_id] = (map[row.article_id] || 0) + 1;
      }
    }
  } catch {
    // fallback
  }

  return map;
}

async function fetchUserLikedArticleIds(articleIds: string[], userId: string): Promise<Set<string>> {
  const set = new Set<string>();
  if (articleIds.length === 0 || !userId) return set;

  try {
    const { data, error } = await supabase
      .from('article_likes')
      .select('article_id')
      .eq('user_id', userId)
      .in('article_id', articleIds);

    if (!error && data) {
      for (const row of data) {
        set.add(row.article_id);
      }
    }
  } catch {
    // fallback
  }

  return set;
}

async function fetchUserBookmarkedArticleIds(articleIds: string[], userId: string): Promise<Set<string>> {
  const set = new Set<string>();
  if (articleIds.length === 0 || !userId) return set;

  try {
    const { data, error } = await supabase
      .from('article_bookmarks')
      .select('article_id')
      .eq('user_id', userId)
      .in('article_id', articleIds);

    if (!error && data) {
      for (const row of data) {
        set.add(row.article_id);
      }
    }
  } catch {
    // fallback
  }

  return set;
}

export async function fetchUserArticles(userId: string): Promise<Article[]> {
  const cached = getLocalArticles(userId);
  if (!isSupabaseConfigured || !userId) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('[Articles fetchUserArticles Notice]:', error.message);
      return cached;
    }

    const list: Article[] = (data || []).map((row) => ({
      id: row.id,
      author_id: row.author_id,
      title: row.title || '',
      cover_url: row.cover_url || null,
      content: row.content || {},
      excerpt: row.excerpt || '',
      category: row.category || 'General',
      tags: Array.isArray(row.tags) ? row.tags : [],
      status: row.status === 'published' ? 'published' : 'draft',
      read_minutes: Number(row.read_minutes) || 1,
      published_at: row.published_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    saveLocalArticles(userId, list);
    return list;
  } catch (err: any) {
    console.warn('[Articles fetchUserArticles Exception]:', err?.message || err);
    return cached;
  }
}

export async function createArticle(payload: {
  author_id: string;
  title: string;
  cover_url?: string | null;
  content: any;
  excerpt?: string;
  category?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  read_minutes?: number;
  published_at?: string | null;
}): Promise<Article> {
  const now = new Date().toISOString();
  const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `art_${Date.now()}`;

  const rowData = {
    id: tempId,
    author_id: payload.author_id,
    title: payload.title || '',
    cover_url: payload.cover_url || null,
    content: payload.content || {},
    excerpt: payload.excerpt || '',
    category: payload.category || 'General',
    tags: payload.tags || [],
    status: payload.status || 'draft',
    read_minutes: payload.read_minutes || 1,
    published_at: payload.published_at || null,
    created_at: now,
    updated_at: now
  };

  if (!isSupabaseConfigured) {
    const existing = getLocalArticles(payload.author_id);
    const updated = [rowData, ...existing.filter((a) => a.id !== rowData.id)];
    saveLocalArticles(payload.author_id, updated);
    return rowData;
  }

  try {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        author_id: payload.author_id,
        title: payload.title || '',
        cover_url: payload.cover_url || null,
        content: payload.content || {},
        excerpt: payload.excerpt || '',
        category: payload.category || 'General',
        tags: payload.tags || [],
        status: payload.status || 'draft',
        read_minutes: payload.read_minutes || 1,
        published_at: payload.published_at || null
      })
      .select('*')
      .single();

    if (error) {
      console.warn('[Articles createArticle Notice]:', error.message);
      const existing = getLocalArticles(payload.author_id);
      saveLocalArticles(payload.author_id, [rowData, ...existing.filter((a) => a.id !== rowData.id)]);
      return rowData;
    }

    const savedArticle: Article = {
      id: data.id,
      author_id: data.author_id,
      title: data.title || '',
      cover_url: data.cover_url || null,
      content: data.content || {},
      excerpt: data.excerpt || '',
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status === 'published' ? 'published' : 'draft',
      read_minutes: Number(data.read_minutes) || 1,
      published_at: data.published_at || null,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    const existing = getLocalArticles(payload.author_id);
    saveLocalArticles(payload.author_id, [savedArticle, ...existing.filter((a) => a.id !== savedArticle.id)]);
    return savedArticle;
  } catch (err: any) {
    console.warn('[Articles createArticle Exception]:', err?.message || err);
    const existing = getLocalArticles(payload.author_id);
    saveLocalArticles(payload.author_id, [rowData, ...existing.filter((a) => a.id !== rowData.id)]);
    return rowData;
  }
}

export async function updateArticle(
  id: string,
  authorId: string,
  updates: Partial<Article>
): Promise<Article> {
  const now = new Date().toISOString();
  const dbPayload: any = {
    updated_at: now
  };

  if (updates.title !== undefined) dbPayload.title = updates.title;
  if (updates.cover_url !== undefined) dbPayload.cover_url = updates.cover_url;
  if (updates.content !== undefined) dbPayload.content = updates.content;
  if (updates.excerpt !== undefined) dbPayload.excerpt = updates.excerpt;
  if (updates.category !== undefined) dbPayload.category = updates.category;
  if (updates.tags !== undefined) dbPayload.tags = updates.tags;
  if (updates.status !== undefined) dbPayload.status = updates.status;
  if (updates.read_minutes !== undefined) dbPayload.read_minutes = updates.read_minutes;
  if (updates.published_at !== undefined) dbPayload.published_at = updates.published_at;

  const localList = getLocalArticles(authorId);
  const existingLocal = localList.find((a) => a.id === id);
  const merged: Article = {
    ...(existingLocal || {
      id,
      author_id: authorId,
      title: '',
      cover_url: null,
      content: {},
      excerpt: '',
      category: 'General',
      tags: [],
      status: 'draft',
      read_minutes: 1,
      published_at: null,
      created_at: now,
      updated_at: now
    }),
    ...updates,
    updated_at: now
  };

  if (!isSupabaseConfigured) {
    const nextList = [merged, ...localList.filter((a) => a.id !== id)];
    saveLocalArticles(authorId, nextList);
    return merged;
  }

  try {
    const { data, error } = await supabase
      .from('articles')
      .update(dbPayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.warn('[Articles updateArticle Notice]:', error.message);
      const nextList = [merged, ...localList.filter((a) => a.id !== id)];
      saveLocalArticles(authorId, nextList);
      return merged;
    }

    const savedArticle: Article = {
      id: data.id,
      author_id: data.author_id,
      title: data.title || '',
      cover_url: data.cover_url || null,
      content: data.content || {},
      excerpt: data.excerpt || '',
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status === 'published' ? 'published' : 'draft',
      read_minutes: Number(data.read_minutes) || 1,
      published_at: data.published_at || null,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    const nextList = [savedArticle, ...localList.filter((a) => a.id !== id)];
    saveLocalArticles(authorId, nextList);
    return savedArticle;
  } catch (err: any) {
    console.warn('[Articles updateArticle Exception]:', err?.message || err);
    const nextList = [merged, ...localList.filter((a) => a.id !== id)];
    saveLocalArticles(authorId, nextList);
    return merged;
  }
}

export async function deleteArticle(id: string, authorId: string): Promise<boolean> {
  const localList = getLocalArticles(authorId);
  const nextList = localList.filter((a) => a.id !== id);
  saveLocalArticles(authorId, nextList);

  if (!isSupabaseConfigured) {
    return true;
  }

  try {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      console.warn('[Articles deleteArticle Notice]:', error.message);
    }
    return true;
  } catch (err: any) {
    console.warn('[Articles deleteArticle Exception]:', err?.message || err);
    return true;
  }
}
