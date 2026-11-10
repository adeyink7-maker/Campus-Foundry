import { useState, FormEvent } from 'react';
import { 
  ShoppingBag, 
  Store, 
  Search, 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  TrendingUp 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ExpandFromOriginModal } from './ExpandFromOriginModal';

interface HeroSectionProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  selectedCampus: string;
  onSelectCampus: (campus: string) => void;
  onOpenAuth: (mode?: 'signin' | 'signup', role?: UserRole) => void;
  onOpenCreateBusiness: () => void;
  onSelectFeatured: (id: string) => void;
}

export const HeroSection = ({
  onSearch,
  searchQuery,
  selectedCampus,
  onSelectCampus,
  onOpenAuth,
  onOpenCreateBusiness,
  onSelectFeatured,
}: HeroSectionProps) => {
  const { currentUser } = useAuth();
  const [activePersona, setActivePersona] = useState<'buyer' | 'trader'>('buyer');
  const [inputVal, setInputVal] = useState(searchQuery);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(inputVal);
  };

  const campusZones = [
    { id: 'All', label: 'All Campus' },
    { id: 'Permanent Site', label: 'Permanent Site (PS Hostels)' },
    { id: 'Tanke Off-Campus', label: 'Tanke Off-Campus' },
    { id: 'Mini Campus', label: 'Mini Campus' },
  ];

  return (
    <section className="relative overflow-hidden border-b border-neutral-800 bg-neutral-950 pt-8 pb-12 sm:pt-12 sm:pb-16">
      {/* Subtle ambient gradient backdrops */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[600px] -translate-x-1/2 rounded-full bg-emerald-600/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 -right-40 -z-10 h-80 w-80 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Interactive Persona Selector (Getting Started Navigator) */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center rounded-2xl border border-neutral-800 bg-neutral-900/90 p-1 shadow-lg backdrop-blur-md">
            <button
              onClick={() => setActivePersona('buyer')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activePersona === 'buyer'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>I am a Student Buyer</span>
            </button>

            <button
              onClick={() => setActivePersona('trader')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activePersona === 'trader'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-950/40'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Store className="h-4 w-4" />
              <span>I am a Student Trader</span>
            </button>
          </div>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Contextual Dynamic Pitch & Direct Controls */}
          <div className="lg:col-span-7">
            
            {/* Collegiate Pill */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-3 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>University of Ilorin (UNILORIN)</span>
              <span className="text-emerald-700">·</span>
              <span>"Better by Far" Trade Hub</span>
            </div>

            {/* Persona-Driven Dynamic Headlines */}
            {activePersona === 'buyer' ? (
              <>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.18]">
                  Order Food, Services & Essentials Direct to Your Dorm Room.
                </h1>
                <p className="mt-3.5 text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
                  Connect with verified Unilorites baking warm meat pies in Lagos Hostel, fixing iPhone screens near CIS Quad, cutting fades in Village 1 & 2, or styling thrift fits in Tanke. Order directly on WhatsApp with zero markup.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.18]">
                  Turn Your Dorm Skill Into an Active UNILORIN Business.
                </h1>
                <p className="mt-3.5 text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
                  List your hostel enterprise in under 2 minutes. Publish your service menu, receive instant orders directly to your WhatsApp, deliver across PS and Tanke, and build verified student reviews.
                </p>
              </>
            )}

            {/* Live Interactive Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    onSearch(e.target.value);
                  }}
                  placeholder={
                    activePersona === 'buyer'
                      ? "Search meat pie, phone screen, dorm barber, laundry runner..."
                      : "Search student ventures, category benchmarks, pricing..."
                  }
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 pl-10 pr-4 py-3 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-colors"
                />
                {inputVal && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputVal('');
                      onSearch('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs sm:text-sm font-semibold text-white transition-colors shrink-0 shadow-md shadow-emerald-950/40"
              >
                Search
              </button>
            </form>

            {/* Interactive Campus Zone Filter Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <MapPin className="h-3 w-3 text-emerald-400" />
                <span>Zone:</span>
              </span>
              {campusZones.map((zone) => {
                const isSelected = selectedCampus === zone.id;
                return (
                  <button
                    key={zone.id}
                    onClick={() => onSelectCampus(zone.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-xs'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {zone.label}
                  </button>
                );
              })}
            </div>

            {/* Primary Action Buttons Based on Persona */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {activePersona === 'buyer' ? (
                <>
                  <a
                    href="#stores-directory"
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-950/50"
                  >
                    <span>Browse UNILORIN Stores</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  {/* Dynamic Expand-from-Origin App Launch Transition Component */}
                  <ExpandFromOriginModal
                    onOpenCreateBusiness={onOpenCreateBusiness}
                  />

                  {!currentUser && (
                    <button
                      onClick={() => onOpenAuth('signup', 'student')}
                      className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs sm:text-sm font-medium text-white transition-colors hover:border-neutral-600 hover:bg-neutral-800"
                    >
                      <ShoppingBag className="h-4 w-4 text-emerald-400" />
                      <span>Sign In with Email</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={onOpenCreateBusiness}
                    className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-950 transition-all hover:bg-amber-400 shadow-lg shadow-amber-950/30"
                  >
                    <span>+ List Your Trade in 2 Mins</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <ExpandFromOriginModal
                    onOpenCreateBusiness={onOpenCreateBusiness}
                  />

                  {!currentUser ? (
                    <button
                      onClick={() => onOpenAuth('signin', 'trader')}
                      className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs sm:text-sm font-medium text-white transition-colors hover:border-neutral-600 hover:bg-neutral-800"
                    >
                      <Store className="h-4 w-4 text-amber-400" />
                      <span>Trader Sign In</span>
                    </button>
                  ) : (
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5 bg-neutral-900/60 px-3 py-2 rounded-xl border border-neutral-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Logged in as <strong>{currentUser.fullName}</strong></span>
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Requested Landing Page CTA & Feature Cards */}
            {!currentUser && (
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => onOpenAuth('signup', 'student')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-blue-950/50 transition-all transform hover:scale-[1.02] cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-xs text-neutral-400">Sign up or log in with your email in under a minute.</p>
              </div>
            )}

            {/* Feature Cards */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-3 shadow-sm">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block mb-0.5">Verified Students</span>
                  <span className="text-[11px] text-neutral-400 leading-snug block">Get a verified badge after a quick ID check.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-3 shadow-sm">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block mb-0.5">Campus Profile</span>
                  <span className="text-[11px] text-neutral-400 leading-snug block">Showcase your posts, products and achievements.</span>
                </div>
              </div>
            </div>

            {/* Credibility Badges */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-neutral-900 pt-5">
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-2.5">
                <div className="text-base sm:text-lg font-bold text-white font-mono">₦0 Fee</div>
                <div className="text-[11px] text-neutral-400">Zero commission taken</div>
              </div>
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-2.5">
                <div className="text-base sm:text-lg font-bold text-white font-mono">Direct</div>
                <div className="text-[11px] text-neutral-400">WhatsApp order chats</div>
              </div>
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-2.5">
                <div className="text-base sm:text-lg font-bold text-white font-mono">PS Hostels</div>
                <div className="text-[11px] text-neutral-400">Door-to-door delivery</div>
              </div>
              <div className="rounded-xl border border-neutral-900 bg-neutral-900/50 p-2.5">
                <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">100%</div>
                <div className="text-[11px] text-neutral-400">Verified Unilorites</div>
              </div>
            </div>

          </div>

          {/* Right Column: Launch Ready Empty State or Featured Venture */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Store className="h-8 w-8" />
              </div>
              <div>
                <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 mb-2">
                  Launch Ready Marketplace
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  No stores listed yet. Be the first vendor on Campus Foundry!
                </h3>
                <p className="mt-2 text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                  List your hostel bakes, tech repair, dorm styling, or campus brand today with zero commission fees.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenCreateBusiness}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                >
                  <Store className="h-4 w-4" />
                  <span>List Your Store First</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
