import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Heart,
  ArrowRight,
  PenTool
} from 'lucide-react';
import type { ArticleWithAuthor } from '../types/articles';

interface FeedArticleCardProps {
  article: ArticleWithAuthor;
  onOpenAuthorProfile?: (authorId: string) => void;
  onOpenLibrary?: () => void;
  onBeforeNavigate?: () => void;
}

export const FeedArticleCard: React.FC<FeedArticleCardProps> = ({
  article,
  onOpenAuthorProfile,
  onOpenLibrary,
  onBeforeNavigate
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    onBeforeNavigate?.();
    navigate(`/article/${article.id}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBeforeNavigate?.();
    if (article.author_id) {
      if (onOpenAuthorProfile) {
        onOpenAuthorProfile(article.author_id);
      } else {
        navigate(`/profile/${article.author_id}`);
      }
    }
  };

  const handleLibraryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBeforeNavigate?.();
    if (onOpenLibrary) {
      onOpenLibrary();
    } else {
      navigate('/library');
    }
  };

  return (
    <article
      onClick={handleCardClick}
      className="rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-500/[0.08] via-neutral-900/95 to-neutral-900 p-4 sm:p-5 shadow-lg shadow-black/40 hover:border-amber-500/60 transition-all cursor-pointer space-y-3 group"
    >
      {/* Top Header Row: Article Label + Category + Read Time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>Article</span>
          </span>
          {article.category && (
            <span className="text-[11px] font-medium text-neutral-400 truncate max-w-[160px]">
              {article.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono shrink-0">
          <Clock className="w-3 h-3 text-amber-400/80" />
          <span>{article.read_minutes} min read</span>
        </div>
      </div>

      {/* Cover Image */}
      {article.cover_url && (
        <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 relative">
          <img
            src={article.cover_url}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      )}

      {/* Title & Excerpt */}
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
            {article.excerpt}
          </p>
        )}
      </div>

      {/* Writer Info & Like Count */}
      <div className="flex items-center justify-between pt-2.5 border-t border-neutral-800/80">
        <div
          onClick={handleAuthorClick}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer min-w-0"
        >
          <img
            src={article.author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={article.author?.name || 'Writer'}
            className="w-7 h-7 rounded-full object-cover border border-amber-500/40 shrink-0"
          />
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-xs font-semibold text-neutral-200 truncate max-w-[130px] sm:max-w-[180px]">
              {article.author?.name || 'Campus Writer'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[9px] font-extrabold text-amber-400 uppercase tracking-wider shrink-0">
              <PenTool className="w-2.5 h-2.5" />
              <span>Verified Writer</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono shrink-0">
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/20" />
          <span>{article.likes_count ?? 0}</span>
        </div>
      </div>

      {/* Explore the Library link */}
      <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400 italic">
          Featured campus writing
        </span>
        <button
          type="button"
          onClick={handleLibraryClick}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer group/link"
        >
          <span>Explore the Library</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </article>
  );
};
export default FeedArticleCard;
