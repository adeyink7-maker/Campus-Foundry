import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Users,
  Newspaper,
  ArrowRight,
  ShieldCheck,
  Search,
  Building2,
  PlusCircle,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { CAMPUS_HUBS } from '../data/mockData';
import { HubPage } from '../types';
import { fetchPagesFromSupabase } from '../services/supabase';
import { PageProfileModal } from './PageProfileModal';
import { RequestPageModal } from './RequestPageModal';

interface CampusHubsViewProps {
  onSelectHubZone: (zone: string) => void;
  onOpenCreateBusiness: () => void;
  onShowToast?: (msg: string) => void;
  onNavigateModule?: (module: 'clubs' | 'news' | 'library') => void;
}

export const CampusHubsView: React.FC<CampusHubsViewProps> = ({
  onSelectHubZone,
  onOpenCreateBusiness,
  onShowToast,
  onNavigateModule,
}) => {
  const navigate = useNavigate();
  const [clubPages, setClubPages] = useState<HubPage[]>([]);
  const [newsPages, setNewsPages] = useState<HubPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<HubPage | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const loadHubPages = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [clubs, news] = await Promise.all([
        fetchPagesFromSupabase('club'),
        fetchPagesFromSupabase('news'),
      ]);
      setClubPages(clubs);
      setNewsPages(news);
    } catch (err: any) {
      console.error('[CampusHubsView] Error loading hub pages:', err);
      setErrorMsg(err?.message || 'Failed to load campus pages from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHubPages();
  }, []);

  const filteredClubs = clubPages.filter(
    (p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = newsPages.filter(
    (p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <MapPin className="h-3.5 w-3.5" />
            <span>Collegiate Hubs & Campus Pages</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Hubs, Clubs & News Desks
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Explore commercial dorm hubs, verified student clubs, and news outlets across campus.
          </p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-950/40 flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Request a Page</span>
        </button>
      </div>

      {/* Global Pages Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clubs, news outlets & pages..."
          className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none shadow-inner"
        />
      </div>

      {/* Campus Library & Articles Section Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-neutral-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
              <span>Campus Library & Student Essays</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Student Writings & Verified Authors</h2>
            <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
              Explore long-form articles, career advice, and research published by verified student writers across campus.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onNavigateModule) {
              onNavigateModule('library');
            } else {
              navigate('/library');
            }
          }}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer self-start md:self-auto transition-all active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          <span>Open Campus Library</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Clubs Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Featured Clubs & Student Societies</h2>
          </div>
          {onNavigateModule && (
            <button
              onClick={() => onNavigateModule('clubs')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All Clubs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-neutral-500">Loading student clubs from database...</div>
        ) : errorMsg ? (
          <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 text-xs text-red-300 text-center space-y-2">
            <p>{errorMsg}</p>
            <button
              onClick={loadHubPages}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Retry
            </button>
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="p-8 text-center border border-neutral-800 rounded-2xl bg-neutral-900/30 text-xs text-neutral-400 space-y-2.5">
            <Users className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-white font-bold">{searchQuery ? 'No clubs match your query.' : 'No clubs registered yet.'}</p>
            <p className="text-neutral-500 max-w-sm mx-auto text-[11px]">
              Student clubs, faculty associations, and cultural societies can register a page.
            </p>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-purple-950/40"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Request a Club Page</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClubs.slice(0, 3).map((club) => (
              <div
                key={club.id}
                onClick={() => setSelectedPage(club)}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 hover:border-purple-500/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={club.logoUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'}
                    alt={club.name}
                    className="w-10 h-10 rounded-xl object-cover border border-neutral-800 shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold text-white truncate">{club.name}</h3>
                      {club.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-purple-400 font-mono block">
                      {club.membersCount || 0} Members
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2">{club.description}</p>
                <div className="pt-2 border-t border-neutral-800 text-xs font-semibold text-purple-400 flex items-center justify-between">
                  <span>View Club Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. News Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Campus News Outlets</h2>
          </div>
          {onNavigateModule && (
            <button
              onClick={() => onNavigateModule('news')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View All News Outlets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-neutral-500">Loading news outlets from database...</div>
        ) : errorMsg ? (
          <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 text-xs text-red-300 text-center space-y-2">
            <p>{errorMsg}</p>
            <button
              onClick={loadHubPages}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Retry
            </button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="p-8 text-center border border-neutral-800 rounded-2xl bg-neutral-900/30 text-xs text-neutral-400 space-y-2.5">
            <Newspaper className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-white font-bold">{searchQuery ? 'No news outlets match your query.' : 'No news outlets registered yet.'}</p>
            <p className="text-neutral-500 max-w-sm mx-auto text-[11px]">
              Authorized press desks and student journalists can request a news page.
            </p>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-emerald-950/40"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Request a News Page</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.slice(0, 3).map((outlet) => (
              <div
                key={outlet.id}
                onClick={() => setSelectedPage(outlet)}
                className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={outlet.logoUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100&auto=format&fit=crop&q=80'}
                    alt={outlet.name}
                    className="w-10 h-10 rounded-xl object-cover border border-neutral-800 shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-bold text-white truncate">{outlet.name}</h3>
                      {outlet.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      {outlet.followersCount || 0} Followers
                    </span>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 line-clamp-2">{outlet.description}</p>
                <div className="pt-2 border-t border-neutral-800 text-xs font-semibold text-emerald-400 flex items-center justify-between">
                  <span>Read Bulletins</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Hostel Commercial Zones Grid */}
      <section className="space-y-4">
        <div className="border-b border-neutral-800/80 pb-2">
          <h2 className="text-lg font-bold text-white">Hostel Hubs & Commercial Zones</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CAMPUS_HUBS.map((hub) => (
            <div
              key={hub.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6 transition-all duration-200 hover:border-emerald-500/50 hover:bg-neutral-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                    {hub.type}
                  </span>
                  <span className="text-xs font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800">
                    {hub.zone}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  {hub.name}
                </h2>

                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed mb-4">
                  {hub.description}
                </p>

                <div className="mb-4">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 block mb-1.5">
                    Popular Student Specialties:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hub.topCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-neutral-950 border border-neutral-800 px-2.5 py-1 text-xs text-neutral-300"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-950/70 p-2.5 rounded-xl border border-neutral-800/80">
                  <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Primary Meeting Spot: <strong>{hub.popularSpot}</strong></span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  onClick={() => onSelectHubZone(hub.zone)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <span>Browse Stores in {hub.zone}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={onOpenCreateBusiness}
                  className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors"
                >
                  List Trade Here
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Page Profile Modal */}
      {selectedPage && (
        <PageProfileModal
          isOpen={!!selectedPage}
          onClose={() => setSelectedPage(null)}
          page={selectedPage}
          onShowToast={onShowToast}
        />
      )}

      {/* Request Page Modal */}
      {isRequestModalOpen && (
        <RequestPageModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
