import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Clock,
  BookOpen,
  Send,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserArticles, deleteArticle, fetchMetricsForArticles } from '../../services/articles';
import { emitAppToast } from '../../services/supabase';
import type { Article } from '../../types/articles';

interface MyArticlesScreenProps {
  onBack?: () => void;
  showToast?: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const MyArticlesScreen: React.FC<MyArticlesScreenProps> = ({
  onBack,
  showToast = (msg, type) => emitAppToast(msg, type || 'info')
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [articles, setArticles] = useState<Article[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, { views: number; likes: number; comments: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation modal state
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadArticles = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await fetchUserArticles(currentUser.id);
      setArticles(list);

      const publishedIds = list.filter((a) => a.status === 'published').map((a) => a.id);
      if (publishedIds.length > 0) {
        const metrics = await fetchMetricsForArticles(publishedIds);
        setMetricsMap(metrics);
      }
    } catch (err: any) {
      showToast('Unable to load your articles. Please check your connection.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [currentUser]);

  const handleConfirmDelete = async () => {
    if (!articleToDelete || !currentUser) return;
    setIsDeleting(true);
    try {
      await deleteArticle(articleToDelete.id, currentUser.id);
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      showToast('Article deleted.', 'success');
      setArticleToDelete(null);
    } catch {
      showToast('Unable to delete article right now. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredArticles = articles.filter((art) => {
    if (filter === 'published' && art.status !== 'published') return false;
    if (filter === 'draft' && art.status !== 'draft') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (art.title || '').toLowerCase().includes(q);
      const matchExcerpt = (art.excerpt || '').toLowerCase().includes(q);
      const matchCategory = (art.category || '').toLowerCase().includes(q);
      if (!matchTitle && !matchExcerpt && !matchCategory) return false;
    }
    return true;
  });

  const publishedCount = articles.filter((a) => a.status === 'published').length;
  const draftCount = articles.filter((a) => a.status === 'draft').length;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-orange-400" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight">My Articles</h1>
            <p className="text-[11px] text-neutral-400">
              {articles.length} {articles.length === 1 ? 'story' : 'stories'} written
            </p>
          </div>
        </div>

        {/* New Article Button */}
        <button
          type="button"
          onClick={() => navigate('/write')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Write</span>
        </button>
      </header>

      {/* Main Body */}
      <div className="max-w-3xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-orange-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            All ({articles.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'published'
                ? 'bg-orange-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Published ({publishedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'draft'
                ? 'bg-orange-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Drafts ({draftCount})
          </button>
        </div>

        {/* Search input if user has multiple articles */}
        {articles.length > 2 && (
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search your articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        )}

        {/* Articles List */}
        {isLoading ? (
          <div className="flex flex-col gap-3 py-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 animate-pulse flex flex-col gap-3"
              >
                <div className="h-4 bg-neutral-800 rounded w-3/4" />
                <div className="h-3 bg-neutral-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-3">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              {searchQuery ? 'No matching articles' : 'No articles yet'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mb-5 leading-relaxed">
              {searchQuery
                ? 'Try a different search term or clear the filter.'
                : 'Share your ideas, tutorials, student perspectives, or campus news.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/write')}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Start Writing</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredArticles.map((article) => {
              const isPublished = article.status === 'published';
              const displayDate = article.published_at || article.updated_at || article.created_at;
              const formattedDate = new Date(displayDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={article.id}
                  className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-all flex flex-col sm:flex-row gap-4 justify-between"
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    {/* Status & Category badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {article.category || 'General'}
                      </span>
                      <span className="text-neutral-600 text-xs">•</span>
                      <span className="text-[11px] text-neutral-500">{formattedDate}</span>
                    </div>

                    {/* Title */}
                    <h2
                      onClick={() => navigate(`/write/${article.id}`)}
                      className="text-base font-bold text-white hover:text-orange-400 transition-colors cursor-pointer leading-snug line-clamp-2"
                    >
                      {article.title || 'Untitled Draft'}
                    </h2>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Read minutes & Tags */}
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1 text-orange-400/90 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{article.read_minutes || 1} min read</span>
                      </span>

                      {article.tags && article.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {article.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded text-[10px]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Real Metrics for Published Articles */}
                    {isPublished && metricsMap[article.id] && (
                      <div className="flex items-center gap-3.5 text-[11px] text-neutral-400 font-mono mt-1.5 pt-1.5 border-t border-neutral-800/60">
                        <span className="flex items-center gap-1 text-sky-400">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{metricsMap[article.id].views} {metricsMap[article.id].views === 1 ? 'view' : 'views'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-rose-400">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{metricsMap[article.id].likes} {metricsMap[article.id].likes === 1 ? 'like' : 'likes'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{metricsMap[article.id].comments} {metricsMap[article.id].comments === 1 ? 'comment' : 'comments'}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail & Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/60">
                    {article.cover_url && (
                      <img
                        src={article.cover_url}
                        alt=""
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-neutral-800"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/write/${article.id}`)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                        title="Edit article"
                      >
                        <Edit3 className="w-4 h-4 text-orange-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setArticleToDelete(article)}
                        className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-white mb-1">Delete Article?</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Are you sure you want to delete <span className="text-white font-semibold">"{articleToDelete.title || 'Untitled Draft'}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
