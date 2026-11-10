import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PenTool,
  Clock,
  Heart,
  Users,
  Search,
  Filter,
  UserPlus,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  RotateCw,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchPublishedArticles } from '../services/articles';
import { fetchApprovedWriters } from '../services/writers';
import type { ArticleWithAuthor } from '../types/articles';
import type { ApprovedWriterProfile } from '../types/writers';

interface LibraryViewProps {
  onBack?: () => void;
  onOpenWriterApplication?: () => void;
}

const CATEGORIES = [
  'All',
  'Academics & GNS',
  'Tech & Gadgets',
  'Student Hustle & Trades',
  'Campus Life',
  'Career & Growth',
  'Opinions & Essays'
];

export const LibraryView: React.FC<LibraryViewProps> = ({ onBack, onOpenWriterApplication }) => {
  const navigate = useNavigate();
  const { currentUser, toggleFollowUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'articles' | 'writers'>('articles');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Articles state
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  // Writers state
  const [writers, setWriters] = useState<ApprovedWriterProfile[]>([]);
  const [isLoadingWriters, setIsLoadingWriters] = useState(true);
  const [writersError, setWritersError] = useState<string | null>(null);

  const loadArticles = async () => {
    setIsLoadingArticles(true);
    setArticlesError(null);
    try {
      const data = await fetchPublishedArticles(currentUser?.id);
      setArticles(data);
    } catch (err: any) {
      setArticlesError(err?.message || 'Unable to load articles right now.');
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const loadWriters = async () => {
    setIsLoadingWriters(true);
    setWritersError(null);
    try {
      const data = await fetchApprovedWriters();
      setWriters(data);
    } catch (err: any) {
      setWritersError(err?.message || 'Unable to load writers right now.');
    } finally {
      setIsLoadingWriters(false);
    }
  };

  useEffect(() => {
    loadArticles();
    loadWriters();
  }, [currentUser?.id]);

  const filteredArticles = articles.filter((art) => {
    const matchesCat =
      selectedCategory === 'All' ||
      (art.category && art.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesQuery =
      !searchQuery.trim() ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.excerpt && art.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.author?.name && art.author.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const filteredWriters = writers.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      (w.username && w.username.toLowerCase().includes(q)) ||
      (w.bio && w.bio.toLowerCase().includes(q)) ||
      (w.department && w.department.toLowerCase().includes(q))
    );
  });

  const handleWriteClick = () => {
    navigate('/write');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 border border-neutral-800 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="p-1.5 -ml-1 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  title="Back to Hubs"
                >
                  <ArrowLeft className="w-4 h-4 text-amber-400" />
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Campus Library</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Collegiate Library & Writers
            </h1>
            <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
              Read essays, project write-ups, campus journalism, and follow approved student writers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWriteClick}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <PenTool className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Write Article</span>
            </button>
          </div>
        </div>
      </div>

      {/* Library View Switcher: Articles vs Writers Directory */}
      <div className="flex items-center gap-2 p-1 bg-neutral-900/90 rounded-2xl border border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab('articles')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'articles'
              ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Latest Articles ({articles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('writers')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'writers'
              ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Writers Directory ({writers.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === 'articles'
              ? 'Search articles, topics or author names...'
              : 'Search verified writers by name, field or bio...'
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-colors"
        />
      </div>

      {/* SECTION 1: ARTICLES */}
      {activeTab === 'articles' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-sm'
                    : 'bg-neutral-900/80 text-neutral-300 border-neutral-800 hover:text-white hover:bg-neutral-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Articles Content */}
          {isLoadingArticles && articles.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3 animate-pulse">
                  <div className="h-40 w-full rounded-xl bg-neutral-800" />
                  <div className="h-4 w-3/4 rounded bg-neutral-800" />
                  <div className="h-3 w-full rounded bg-neutral-800" />
                </div>
              ))}
            </div>
          ) : articlesError && articles.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Unable to load library articles</h3>
              <p className="text-xs text-neutral-400">{articlesError}</p>
              <button
                type="button"
                onClick={loadArticles}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 cursor-pointer"
              >
                Tap to Retry
              </button>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 px-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
              <BookOpen className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No articles found</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                {selectedCategory !== 'All'
                  ? `There are no articles in "${selectedCategory}" yet.`
                  : 'Be the first approved scholar to publish an article!'}
              </p>
              <button
                type="button"
                onClick={handleWriteClick}
                className="px-4 py-2 bg-amber-500 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer hover:bg-amber-400"
              >
                Write an Article
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/article/${article.id}`)}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 transition-all cursor-pointer shadow-md space-y-3 group"
                >
                  {article.cover_url && (
                    <div className="w-full h-44 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 relative">
                      <img
                        src={article.cover_url}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-white/10 uppercase tracking-wider">
                        {article.category || 'General'}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {!article.cover_url && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                          {article.category || 'General'}
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {article.read_minutes} min read
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80">
                    <div
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (article.author_id) {
                          navigate(`/profile/${article.author_id}`);
                        }
                      }}
                    >
                      <img
                        src={
                          article.author?.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                        }
                        alt={article.author?.name || 'Author'}
                        className="w-7 h-7 rounded-full object-cover border border-neutral-700"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-neutral-200 truncate max-w-[140px]">
                            {article.author?.name || 'Student Writer'}
                          </span>
                          {/* Writer Badge */}
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-bold tracking-tight">
                            Writer
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {article.published_at
                            ? new Date(article.published_at).toLocaleDateString()
                            : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                      <Heart className="w-4 h-4 text-rose-400 fill-rose-500/20" />
                      <span>{article.likes_count ?? 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: WRITERS DIRECTORY */}
      {activeTab === 'writers' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Verified Student Writers</h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Scholars with approved publishing privileges on CampusFoundry
              </p>
            </div>
            <button
              type="button"
              onClick={handleWriteClick}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
            >
              Apply to Write
            </button>
          </div>

          {isLoadingWriters && writers.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-neutral-800 rounded w-1/3" />
                    <div className="h-2.5 bg-neutral-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : writersError && writers.length === 0 ? (
            <div className="p-8 text-center bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Unable to load writers directory</h3>
              <p className="text-xs text-neutral-400">{writersError}</p>
              <button
                type="button"
                onClick={loadWriters}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 cursor-pointer"
              >
                Tap to Retry
              </button>
            </div>
          ) : filteredWriters.length === 0 ? (
            <div className="text-center py-12 px-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 space-y-3">
              <Users className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">No writers found</h3>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                No approved writers match your query. Apply to become the next verified contributor!
              </p>
              <button
                type="button"
                onClick={handleWriteClick}
                className="px-4 py-2 bg-amber-500 text-neutral-950 font-bold rounded-xl text-xs cursor-pointer hover:bg-amber-400"
              >
                Become a Writer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredWriters.map((writer) => {
                const isFollowing = Boolean(
                  currentUser?.followingUserIds?.includes(writer.userId)
                );
                const isSelf = currentUser?.id === writer.userId;

                return (
                  <div
                    key={writer.userId}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all shadow-md space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Writer Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div
                          onClick={() => navigate(`/profile/${writer.userId}`)}
                          className="flex items-center gap-3 cursor-pointer group min-w-0"
                        >
                          <div className="relative">
                            <img
                              src={writer.avatarUrl}
                              alt={writer.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/60 group-hover:border-amber-400 transition-colors shrink-0"
                            />
                            {writer.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-sky-400 bg-neutral-950 rounded-full absolute -bottom-0.5 -right-0.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                                {writer.name}
                              </h4>
                              {/* Writer Badge */}
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-extrabold tracking-wider uppercase">
                                Verified Writer
                              </span>
                            </div>
                            {writer.username && (
                              <p className="text-[11px] font-mono text-neutral-400 truncate">
                                {writer.username}
                              </p>
                            )}
                            <p className="text-[10px] text-neutral-400 truncate">
                              {writer.department || 'Campus Scholar'}
                            </p>
                          </div>
                        </div>

                        {/* Follow Button */}
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => toggleFollowUser(writer.userId)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                              isFollowing
                                ? 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
                                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold shadow-sm'
                            }`}
                          >
                            {isFollowing ? (
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

                      {/* Bio */}
                      {writer.bio && (
                        <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                          {writer.bio}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata */}
                    <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                      <span className="font-semibold text-amber-400/90 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span>
                          {writer.articlesCount} {writer.articlesCount === 1 ? 'article' : 'articles'}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/profile/${writer.userId}`)}
                        className="text-neutral-400 hover:text-white font-medium"
                      >
                        View Profile →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
