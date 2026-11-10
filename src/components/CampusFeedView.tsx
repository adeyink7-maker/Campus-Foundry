import { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  Search, 
  Filter, 
  Flame, 
  Clock, 
  ShoppingBag, 
  Send, 
  Image, 
  BookOpen, 
  Vote,
  Compass
} from 'lucide-react';
import { CampusPost, CampusSnap, StudentBusiness, StudentLevel, AppModule } from '../types';
import { CampusSnapsBar } from './CampusSnapsBar';
import { PostCard } from './PostCard';
import { FeedArticleCard } from './FeedArticleCard';
import { fetchPublishedArticles } from '../services/articles';
import type { ArticleWithAuthor } from '../types/articles';
import { useAuth } from '../context/AuthContext';

interface CampusFeedViewProps {
  posts: CampusPost[];
  snaps: CampusSnap[];
  businesses: StudentBusiness[];
  selectedLevel: StudentLevel | 'All';
  onLikeToggle: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onSelectSnap: (snap: CampusSnap) => void;
  onOpenCreateSnap: () => void;
  onOpenCreatePost: () => void;
  onSelectBusiness: (business: StudentBusiness) => void;
  onNavigateModule: (mod: AppModule) => void;
  onOpenAuthorProfile?: (authorId: string, authorDetails?: any) => void;
  onDeletePost?: (postId: string) => void;
  onRequireAuth?: (action?: () => void) => void;
  isLoadingPosts?: boolean;
  postsError?: string | null;
  onRetryPosts?: () => void;
  isLoadingSnaps?: boolean;
  snapsError?: string | null;
  onRetrySnaps?: () => void;
}

const FEED_CATEGORIES = [
  'All Buzz',
  'Academics & GNS',
  'Student Hustle & Trades',
  'SUG & Elections',
  'Events & Sports',
  'Campus Life & Hostels',
] as const;

export const CampusFeedView = ({
  posts,
  snaps,
  businesses,
  selectedLevel,
  onLikeToggle,
  onAddComment,
  onSelectSnap,
  onOpenCreateSnap,
  onOpenCreatePost,
  onSelectBusiness,
  onNavigateModule,
  onOpenAuthorProfile,
  onDeletePost,
  onRequireAuth,
  isLoadingPosts = false,
  postsError = null,
  onRetryPosts,
  isLoadingSnaps = false,
  snapsError = null,
  onRetrySnaps,
}: CampusFeedViewProps) => {
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('All Buzz');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'latest' | 'popular'>('latest');

  // Filter posts by category, academic level, and search query
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (activeCategory !== 'All Buzz' && post.category !== activeCategory) {
        return false;
      }
      if (selectedLevel !== 'All' && post.authorLevel !== selectedLevel) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesAuthor = post.authorName.toLowerCase().includes(q);
        const matchesLoc = post.locationTag?.toLowerCase().includes(q);
        const matchesDept = post.authorDept?.toLowerCase().includes(q);
        if (!matchesContent && !matchesAuthor && !matchesLoc && !matchesDept) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'popular') {
        return b.likesCount - a.likesCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, activeCategory, selectedLevel, searchQuery, sortOrder]);

  const [publishedArticles, setPublishedArticles] = useState<ArticleWithAuthor[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchPublishedArticles(currentUser?.id)
      .then((data) => {
        if (isMounted) setPublishedArticles(data);
      })
      .catch((err) => {
        console.warn('[CampusFeedView fetchPublishedArticles]:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Feed items combining normal posts and interspersed article cards (1 every ~8 posts)
  const feedItems = useMemo(() => {
    if (!publishedArticles || publishedArticles.length === 0) {
      return filteredPosts.map((post) => ({ type: 'post' as const, post }));
    }

    const items: Array<
      | { type: 'post'; post: CampusPost }
      | { type: 'article'; article: ArticleWithAuthor; key: string }
    > = [];

    const usedArticleIds = new Set<string>();
    let articleIndex = 0;

    filteredPosts.forEach((post, index) => {
      items.push({ type: 'post', post });

      if ((index + 1) % 8 === 0) {
        while (
          articleIndex < publishedArticles.length &&
          usedArticleIds.has(publishedArticles[articleIndex].id)
        ) {
          articleIndex++;
        }

        if (articleIndex < publishedArticles.length) {
          const article = publishedArticles[articleIndex];
          usedArticleIds.add(article.id);
          items.push({
            type: 'article',
            article,
            key: `feed-article-${article.id}-${index}`,
          });
          articleIndex++;
        }
      }
    });

    return items;
  }, [filteredPosts, publishedArticles]);

  return (
    <div className="flex flex-col gap-3">
      
      {/* 1. 24-Hour Campus Snaps Bar */}
      <CampusSnapsBar
        snaps={snaps}
        onSelectSnap={onSelectSnap}
        onOpenCreateSnap={onOpenCreateSnap}
        isLoading={isLoadingSnaps}
        error={snapsError}
        onRetry={onRetrySnaps}
      />

      {/* 2. Quick Create Post Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shrink-0 ${
            currentUser?.role === 'trader' ? 'bg-amber-600' : 'bg-emerald-600'
          }`}>
            {currentUser?.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
          </div>

          <button
            type="button"
            onClick={onOpenCreatePost}
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left text-xs text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 transition-all cursor-pointer flex items-center justify-between"
          >
            <span>What's happening at UNILORIN today, {currentUser?.fullName?.split(' ')[0] || 'Student'}?</span>
            <div className="flex items-center gap-2 text-emerald-400">
              <Image className="h-4 w-4" />
              <Send className="h-4 w-4" />
            </div>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400 px-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenCreatePost}
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              <span>GNS/Academic Note</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateModule('marketplace')}
              className="flex items-center gap-1.5 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
              <span>Hostel Trade Promo</span>
            </button>
          </div>

          <span className="text-[11px] text-neutral-500 font-mono">
            {selectedLevel === 'All' ? 'All Classes' : `${selectedLevel} Filter Active`}
          </span>
        </div>
      </div>

      {/* 3. Filter Category Pills & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills - min 44px touch targets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FEED_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`min-h-[44px] rounded-xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-orange-500 text-neutral-950 border-orange-400 font-bold shadow-md shadow-orange-950/40'
                    : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort & Search Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 sm:w-48 min-h-[44px] flex items-center">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feed..."
              className="w-full min-h-[44px] rounded-xl border border-neutral-800 bg-neutral-950 pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-400 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-900 p-1 min-h-[44px]">
            <button
              type="button"
              onClick={() => setSortOrder('latest')}
              className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg p-2 transition-colors ${
                sortOrder === 'latest' ? 'bg-neutral-800 text-orange-400 font-bold' : 'text-neutral-300 hover:text-white'
              }`}
              title="Latest Posts"
            >
              <Clock className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('popular')}
              className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg p-2 transition-colors ${
                sortOrder === 'popular' ? 'bg-neutral-800 text-orange-400 font-bold' : 'text-neutral-300 hover:text-white'
              }`}
              title="Most Popular"
            >
              <Flame className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Posts Feed List */}
      <div className="space-y-4">
        {isLoadingPosts && posts.length === 0 ? (
          /* Loading Skeletons */
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 rounded bg-neutral-800" />
                  <div className="h-2 w-16 rounded bg-neutral-800" />
                </div>
              </div>
              <div className="h-20 w-full rounded-xl bg-neutral-800" />
              <div className="h-3 w-1/2 rounded bg-neutral-800" />
            </div>
          ))
        ) : postsError && posts.length === 0 ? (
          /* Error State */
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-10 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-1">
              <PlusCircle className="w-6 h-6 rotate-45" />
            </div>
            <h3 className="text-sm font-bold text-white">Unable to load feed</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              {postsError || 'Check your connection or student portal session and try again.'}
            </p>
            <button
              type="button"
              onClick={onRetryPosts}
              className="min-h-[44px] px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs border border-neutral-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tap to Retry</span>
            </button>
          </div>
        ) : filteredPosts.length > 0 ? (
          feedItems.map((item) => {
            if (item.type === 'article') {
              return (
                <FeedArticleCard
                  key={item.key}
                  article={item.article}
                  onOpenAuthorProfile={(authorId) => onOpenAuthorProfile?.(authorId)}
                />
              );
            }

            const post = item.post;
            return (
              <PostCard
                key={post.id}
                post={post}
                onLikeToggle={onLikeToggle}
                onAddComment={onAddComment}
                onSelectBusiness={onSelectBusiness}
                onDeletePost={onDeletePost}
                allBusinesses={businesses}
                onOpenAuthorProfile={(authorId) =>
                  onOpenAuthorProfile?.(authorId, {
                    fullName: post.authorName,
                    username: post.authorUsername || `@${post.authorName.toLowerCase().replace(/\s+/g, '_')}`,
                    avatarUrl: post.authorAvatar,
                    level: post.authorLevel,
                    department: post.authorDept,
                    faculty: post.authorFaculty,
                  })
                }
                onRequireAuth={onRequireAuth}
                activeSnap={snaps.find((s) => s.authorId === post.authorId)}
                onSelectSnap={onSelectSnap}
              />
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 p-10 text-center space-y-3">
            <Compass className="h-8 w-8 text-neutral-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Nothing here yet</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Be the first to share an academic inquiry, hostel update, or trade promo for this category!
            </p>
            <button
              type="button"
              onClick={onOpenCreatePost}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              Create Post Now
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
