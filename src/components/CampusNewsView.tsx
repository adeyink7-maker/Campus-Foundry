import React, { useState, useEffect } from 'react';
import {
  Newspaper,
  Search,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Building2,
  Clock,
  Zap
} from 'lucide-react';
import { HubPage } from '../types';
import { fetchPagesFromSupabase } from '../services/supabase';
import { RequestPageModal } from './RequestPageModal';
import { PageProfileModal } from './PageProfileModal';

interface CampusNewsViewProps {
  onShowToast?: (msg: string) => void;
  onRequireAuth?: () => void;
}

export const CampusNewsView: React.FC<CampusNewsViewProps> = ({
  onShowToast,
  onRequireAuth,
}) => {
  const [pages, setPages] = useState<HubPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<HubPage | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadNewsPages = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchPagesFromSupabase('news');
      setPages(data);
    } catch (err: any) {
      console.error('[CampusNewsView] Error loading news pages:', err);
      setErrorMsg(err?.message || 'Failed to load news outlets. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewsPages();
  }, []);

  const filteredPages = pages.filter((page) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = page.name.toLowerCase().includes(q);
      const matchDesc = page.description.toLowerCase().includes(q);
      return matchName || matchDesc;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. News Top Hero Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/50 via-neutral-900 to-neutral-950 p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Newspaper className="h-3 w-3" />
              <span>Campus News Hub</span>
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Verified Journalism & Bulletins
            </span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Campus News Outlets & Press Desk
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
            Follow verified campus news outlets, Senate bulletins, exam updates, and investigative reports directly from authorized student desks.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request a News Page</span>
        </button>
      </div>

      {/* 2. Search Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news outlets by name or scope..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. News Outlet Cards Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-xs text-neutral-500">Loading campus news outlets from database...</div>
      ) : errorMsg ? (
        <div className="p-8 text-center border border-red-500/30 rounded-2xl bg-red-950/10 text-xs text-red-300 space-y-3">
          <p className="font-semibold">{errorMsg}</p>
          <button
            onClick={loadNewsPages}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="p-12 text-center border border-neutral-800 rounded-2xl bg-neutral-900/40 text-xs text-neutral-400 space-y-3">
          <Building2 className="w-10 h-10 text-neutral-600 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              {searchQuery.trim() ? 'No news outlet pages match your search.' : 'No news outlets yet.'}
            </p>
            <p className="text-neutral-400 max-w-sm mx-auto">
              {searchQuery.trim()
                ? 'Try searching with a different keyword or view all press desks.'
                : 'Request a news outlet page for your faculty press, campus publication or student media organization.'}
            </p>
          </div>
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-950/40 mt-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Request a Page</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPages.map((outlet) => (
            <div
              key={outlet.id}
              onClick={() => setSelectedPage(outlet)}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 backdrop-blur-md flex flex-col justify-between hover:border-emerald-500/50 transition-all space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={outlet.logoUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100&auto=format&fit=crop&q=80'}
                    alt={outlet.name}
                    className="w-12 h-12 rounded-xl object-cover border border-neutral-800 group-hover:scale-105 transition-transform shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-white leading-snug truncate">{outlet.name}</h3>
                      {outlet.isVerified && (
                        <span title="Verified Outlet">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                      {outlet.followersCount || 0} Followers • Verified Journalism
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                  {outlet.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-neutral-400">Campus News Desk</span>
                <span className="font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
                  <span>Read Bulletins</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Request Modal */}
      {isRequestModalOpen && (
        <RequestPageModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          defaultType="news"
          onShowToast={onShowToast}
          onPageCreated={() => loadNewsPages()}
        />
      )}

      {/* Page Profile Modal */}
      {selectedPage && (
        <PageProfileModal
          isOpen={!!selectedPage}
          onClose={() => setSelectedPage(null)}
          page={selectedPage}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
