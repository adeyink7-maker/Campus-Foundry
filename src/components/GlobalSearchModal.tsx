import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Search, 
  Clock, 
  Trash2, 
  Users, 
  Building2, 
  ShoppingBag, 
  MessageSquare, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { executeGlobalSearchInSupabase } from '../services/supabase';
import { AppUser } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'people' | 'groups' | 'pages' | 'products' | 'posts';
  onSelectUser?: (user: AppUser) => void;
  onSelectPage?: (pageId: string) => void;
  onSelectProduct?: (productId: string) => void;
  onSelectPost?: (postId: string) => void;
}

const RECENT_SEARCHES_KEY = 'campus_foundry_recent_searches_v1';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'posts',
  onSelectUser,
  onSelectPage,
  onSelectProduct,
  onSelectPost,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'groups' | 'pages' | 'products' | 'posts'>(initialTab);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  // Load recent searches on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch {}
    }
  }, []);

  // 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Execute search when debounced query or active tab changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    executeGlobalSearchInSupabase(debouncedQuery, activeTab, 1, 15)
      .then((res) => {
        if (isMounted) {
          setResults(res.items);
          setHasMore(res.hasMore);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        if (isMounted) {
          setResults([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeTab]);

  if (!isOpen) return null;

  const handleSaveRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    }
  };

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }
  };

  const handleItemClick = (item: any) => {
    if (query.trim()) {
      handleSaveRecentSearch(query);
    }

    const isPerson = item.type === 'person' || activeTab === 'people';
    if (isPerson) {
      const path = `/profile/${item.id}`;
      console.log('Navigated path:', path);
      navigate(path);
      if (onSelectUser) {
        onSelectUser({
          id: item.id,
          email: item.email || '',
          fullName: item.full_name,
          username: item.username,
          role: 'student',
          faculty: item.faculty,
          department: item.department,
          level: item.level || '300L',
          avatarUrl: item.avatar_url,
          isVerified: !!item.is_verified,
          bio: item.bio,
        });
      }
      onClose();
    } else if (item.type === 'page' && onSelectPage) {
      onSelectPage(item.id);
      onClose();
    } else if (item.type === 'product' && onSelectProduct) {
      onSelectProduct(item.id);
      onClose();
    } else if (item.type === 'post' && onSelectPost) {
      onSelectPost(item.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950 text-white animate-in fade-in duration-200">
      {/* Top Search Bar */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => startTransition(() => setQuery(e.target.value))}
            placeholder="Search people, clubs, news, products, posts..."
            className="w-full h-11 pl-10 pr-10 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="shrink-0 border-b border-neutral-800 bg-neutral-950 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'posts', label: 'Posts', icon: MessageSquare },
          { id: 'people', label: 'People', icon: Users },
          { id: 'groups', label: 'Clubs', icon: Building2 },
          { id: 'pages', label: 'News', icon: ShieldCheck },
          { id: 'products', label: 'Products', icon: ShoppingBag },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Results / Recent Searches Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!query.trim() ? (
          <div className="space-y-4 pt-2">
            {recentSearches.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Recent Searches</span>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="text-[11px] font-semibold text-amber-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 hover:border-amber-500/50 transition-colors"
                    >
                      <Clock className="h-3 w-3 text-neutral-500" />
                      <span>{term}</span>
                      <span
                        onClick={(e) => handleRemoveRecent(term, e)}
                        className="text-neutral-500 hover:text-white ml-1"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-500 space-y-2">
                <Search className="h-10 w-10 mx-auto opacity-30 text-amber-500" />
                <p className="text-xs">Type a keyword to search across Campus Foundry.</p>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <p className="text-xs text-neutral-400">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2.5">
            {results.map((item) => {
              const isPerson = activeTab === 'people' || item.type === 'person';
              const itemHref = isPerson ? `/profile/${item.id}` : '#';
              return (
                <a
                  key={item.id}
                  href={itemHref}
                  onClick={(e) => {
                    e.preventDefault();
                    handleItemClick(item);
                  }}
                  className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group text-left block no-underline"
                >
                  <div className="flex items-center gap-3 min-w-0">
                  {activeTab === 'people' ? (
                    <img
                      src={item.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={item.full_name}
                      className="h-11 w-11 rounded-full object-cover border border-amber-500/30 shrink-0"
                    />
                  ) : activeTab === 'groups' || activeTab === 'pages' ? (
                    <img
                      src={item.logo_url || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100'}
                      alt={item.name}
                      className="h-11 w-11 rounded-xl object-cover border border-neutral-800 shrink-0"
                    />
                  ) : activeTab === 'products' ? (
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={item.title}
                      className="h-11 w-11 rounded-xl object-cover border border-neutral-800 shrink-0"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                      {activeTab === 'people' ? item.full_name : activeTab === 'groups' || activeTab === 'pages' ? item.name : activeTab === 'products' ? item.title : item.content}
                    </h4>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {activeTab === 'people' ? `@${item.username || 'student'} • ${item.department || item.faculty || 'Undergraduate'}` : activeTab === 'groups' || activeTab === 'pages' ? item.description : activeTab === 'products' ? `₦${item.price?.toLocaleString()} • ${item.category || 'Product'}` : `Posted by ${item.authorName}`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-neutral-500 group-hover:text-amber-400 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </div>
              </a>
            );
          })}
          </div>
        ) : (
          <div className="text-center py-24 space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-neutral-500" />
            <p className="text-xs font-bold text-white">No results found for "{query}"</p>
            <p className="text-[11px] text-neutral-400">Try checking your spelling or searching another category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearchModal;
