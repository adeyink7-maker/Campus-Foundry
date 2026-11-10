import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Clock,
  UserPlus,
  UserCheck,
  Send,
  Trash2,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchArticleDetail,
  recordArticleView,
  toggleArticleLike,
  toggleArticleBookmark,
  fetchArticleComments,
  addArticleComment,
  deleteArticleComment
} from '../../services/articles';
import { emitAppToast } from '../../services/supabase';
import type { ArticleWithAuthor, ArticleAuthor, ArticleComment } from '../../types/articles';

interface ArticleDetailScreenProps {
  onBack?: () => void;
  showToast?: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const ArticleDetailScreen: React.FC<ArticleDetailScreenProps> = ({
  onBack,
  showToast = (msg, type) => emitAppToast(msg, type || 'info')
}) => {
  const navigate = useNavigate();
  const { id: routeArticleId } = useParams<{ id: string }>();
  const { currentUser, toggleFollowUser } = useAuth();

  const [article, setArticle] = useState<ArticleWithAuthor | null>(null);
  const [author, setAuthor] = useState<ArticleAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLikeUpdating, setIsLikeUpdating] = useState(false);
  const [isBookmarkUpdating, setIsBookmarkUpdating] = useState(false);

  // Setup read-only Tiptap editor
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false
      })
    ],
    content: ''
  });

  const hasRecordedViewRef = useRef(false);

  // Load article details and comments
  useEffect(() => {
    let isMounted = true;
    if (!routeArticleId) return;

    setIsLoading(true);
    fetchArticleDetail(routeArticleId, currentUser?.id)
      .then((detail) => {
        if (!isMounted) return;
        if (detail) {
          setArticle(detail.article);
          setAuthor(detail.author);
          setIsLiked(detail.isLiked);
          setLikesCount(detail.likesCount);
          setIsBookmarked(detail.isBookmarked);

          if (editor && detail.article.content) {
            editor.commands.setContent(detail.article.content);
          }

          // 3. Views: when a signed-in user opens an article they did not write, record one row in article_views
          if (currentUser && currentUser.id !== detail.article.author_id && !hasRecordedViewRef.current) {
            hasRecordedViewRef.current = true;
            recordArticleView(detail.article.id, currentUser.id, detail.article.author_id);
          }
        }
      })
      .catch((err) => {
        console.warn('[ArticleDetail] load error:', err);
        showToast('Unable to load article.', 'error');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // Load comments
    fetchArticleComments(routeArticleId).then((comms) => {
      if (isMounted) setComments(comms);
    });

    return () => {
      isMounted = false;
    };
  }, [routeArticleId, currentUser?.id, editor]);

  // Set editor content once editor is ready
  useEffect(() => {
    if (editor && article?.content && editor.isEmpty) {
      editor.commands.setContent(article.content);
    }
  }, [editor, article]);

  // Like toggle
  const handleToggleLike = async () => {
    if (!currentUser) {
      showToast('Please sign in to like articles.', 'info');
      return;
    }
    if (!article || isLikeUpdating) return;

    setIsLikeUpdating(true);
    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likesCount;
    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const res = await toggleArticleLike(article.id, currentUser.id);
      setIsLiked(res.liked);
      setLikesCount(res.count);
    } catch {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      showToast('Unable to update like. Please try again.', 'error');
    } finally {
      setIsLikeUpdating(false);
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = async () => {
    if (!currentUser) {
      showToast('Please sign in to save articles.', 'info');
      return;
    }
    if (!article || isBookmarkUpdating) return;

    setIsBookmarkUpdating(true);
    const previousState = isBookmarked;
    setIsBookmarked(!previousState);

    try {
      const res = await toggleArticleBookmark(article.id, currentUser.id);
      setIsBookmarked(res.bookmarked);
      showToast(res.bookmarked ? 'Article saved to your bookmarks!' : 'Article removed from bookmarks.', 'info');
    } catch {
      setIsBookmarked(previousState);
      showToast('Unable to update bookmark.', 'error');
    } finally {
      setIsBookmarkUpdating(false);
    }
  };

  // Follow / Following toggle for author
  const isFollowingAuthor = Boolean(author?.id && currentUser?.followingUserIds?.includes(author.id));
  const isSelf = Boolean(currentUser && author && currentUser.id === author.id);

  const handleToggleFollow = () => {
    if (!currentUser) {
      showToast('Please sign in to follow writers.', 'info');
      return;
    }
    if (!author?.id) return;
    toggleFollowUser(author.id);
    showToast(isFollowingAuthor ? `Unfollowed ${author.name}` : `Following ${author.name}`, 'info');
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to comment.', 'info');
      return;
    }
    const trimmed = newComment.trim();
    if (!trimmed || !article || isPostingComment) return;

    setIsPostingComment(true);
    try {
      const created = await addArticleComment(article.id, currentUser.id, trimmed);
      setComments((prev) => [...prev, created]);
      setNewComment('');
      showToast('Comment posted.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Unable to post comment.', 'error');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    try {
      const ok = await deleteArticleComment(commentId, currentUser.id);
      if (ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        showToast('Comment deleted.', 'info');
      }
    } catch {
      showToast('Unable to delete comment.', 'error');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Article link copied to clipboard!', 'success');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 bg-neutral-950 text-white">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-xs text-neutral-400">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-white mb-1">Article Not Found</h2>
        <p className="text-xs text-neutral-400 max-w-xs mb-4">
          This article may have been unpublished or removed.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-bold hover:text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formattedDate = new Date(article.published_at || article.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans relative pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="p-1.5 -ml-1 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 text-orange-400" />
        </button>

        <div className="flex items-center gap-2">
          {/* Like Header Quick Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              isLiked
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-bold'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title="Like article"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span className="text-xs">{likesCount}</span>
          </button>

          {/* Bookmark Header Button */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-orange-400 text-orange-400' : ''}`} />
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Share article"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <article className="max-w-2xl w-full mx-auto px-4 pt-4 sm:pt-6 flex flex-col gap-5">
        {/* Category & Read Time */}
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-orange-400 font-bold text-[11px]">
            {article.category || 'General'}
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>{article.read_minutes || 1} min read</span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
          {article.title}
        </h1>

        {/* Author row with Follow button and Profile link */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80">
          <div
            onClick={() => author?.id && navigate(`/profile/${author.id}`)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={author?.name || 'Author'}
              className="w-11 h-11 rounded-full object-cover border-2 border-neutral-800 group-hover:border-orange-500 transition-colors"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  {author?.name || 'Student Writer'}
                </span>
                {author?.isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-sky-400 fill-sky-400/20" />
                )}
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-extrabold tracking-tight flex items-center gap-1">
                  <span>Verified Writer</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                {author?.username && <span>{author.username}</span>}
                <span>•</span>
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Follow / Following Button */}
          {!isSelf && author?.id && (
            <button
              type="button"
              onClick={handleToggleFollow}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isFollowingAuthor
                  ? 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                  : 'bg-orange-500 hover:bg-orange-400 text-neutral-950 font-extrabold'
              }`}
            >
              {isFollowingAuthor ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Cover Image */}
        {article.cover_url && (
          <div className="w-full rounded-2xl overflow-hidden border border-neutral-800 max-h-[380px] bg-neutral-900">
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body Rendered from Tiptap JSON */}
        <div className="pt-2 pb-6 text-neutral-100 text-base leading-relaxed tracking-normal font-sans border-b border-neutral-800/80">
          <EditorContent editor={editor} />
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap py-2">
            {article.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Mid-article Like & Bookmark Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isLiked
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isBookmarked
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-orange-400 text-orange-400' : ''}`} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <MessageSquare className="w-4 h-4 text-orange-400" />
            <span>{comments.length} comments</span>
          </div>
        </div>

        {/* Comments Section */}
        <section className="pt-4 flex flex-col gap-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Comments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
              {comments.length}
            </span>
          </h3>

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="flex items-start gap-2.5">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
              alt="Me"
              className="w-8 h-8 rounded-full object-cover border border-neutral-800 mt-1 shrink-0"
            />
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? 'Write a comment...' : 'Sign in to join the discussion...'}
                disabled={!currentUser || isPostingComment}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-orange-500 transition-colors resize-none disabled:opacity-50"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isPostingComment || !currentUser}
                  className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-neutral-950 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  {isPostingComment ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="flex flex-col gap-3 mt-2">
            {comments.length === 0 ? (
              <p className="text-xs text-neutral-500 italic py-4 text-center">
                No comments yet. Start the conversation!
              </p>
            ) : (
              comments.map((comment) => {
                const isOwnComment = Boolean(currentUser && currentUser.id === comment.user_id);
                const commentDate = new Date(comment.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div
                    key={comment.id}
                    className="p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800/70 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <img
                        src={comment.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                        alt={comment.author_name || 'User'}
                        className="w-7 h-7 rounded-full object-cover border border-neutral-800 mt-0.5 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {comment.author_name || 'Student'}
                          </span>
                          <span className="text-[10px] text-neutral-500">{commentDate}</span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>

                    {/* Author of comment can delete their own */}
                    {isOwnComment && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </article>
    </div>
  );
};
