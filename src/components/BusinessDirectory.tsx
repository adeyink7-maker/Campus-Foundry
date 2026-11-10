import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  ShoppingBag, 
  Plus, 
  SlidersHorizontal, 
  CheckCircle2, 
  ArrowUpDown,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  GalleryVertical,
  LayoutGrid,
  GraduationCap,
  Building2,
  X,
  RotateCcw,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { StudentBusiness } from '../types';
import { CATEGORIES, CAMPUS_ZONES, UNILORIN_FACULTIES, ALL_UNILORIN_HOSTELS } from '../data/mockData';
import { BusinessCard } from './BusinessCard';
import { ListingCarouselFocus } from './ListingCarouselFocus';
import { HostelSelectMenu } from './HostelSelectMenu';
import { FacultyDepartmentSelector } from './FacultyDepartmentSelector';

interface BusinessDirectoryProps {
  businesses: StudentBusiness[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCampus: string;
  onSelectCampus: (campus: string) => void;
  onSelectBusiness: (business: StudentBusiness) => void;
  onOpenCreateBusiness: () => void;
  includeDemoTemplates?: boolean;
  onToggleDemoTemplates?: () => void;
  onOpenTraderProfile?: (business: StudentBusiness) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onOpenBecomeTrader?: () => void;
}

export const BusinessDirectory = ({
  businesses,
  searchQuery,
  onSearchChange,
  selectedCampus,
  onSelectCampus,
  onSelectBusiness,
  onOpenCreateBusiness,
  includeDemoTemplates = false,
  onToggleDemoTemplates,
  onOpenTraderProfile,
  isLoading = false,
  error = null,
  onRetry,
  onOpenBecomeTrader,
}: BusinessDirectoryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [deliveryOnly, setDeliveryOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'rating'>('recommended');
  const [listingFilter, setListingFilter] = useState<'all' | 'live' | 'templates'>('all');
  const [showDemoBanner, setShowDemoBanner] = useState<boolean>(true);
  const [viewLayout, setViewLayout] = useState<'carousel' | 'grid'>('carousel');
  const [selectedHostel, setSelectedHostel] = useState<string>('All');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [showAcademicFilters, setShowAcademicFilters] = useState<boolean>(false);

  // Counts of genuine live businesses vs starter mock templates
  const liveCount = useMemo(() => businesses.filter((b) => !b.isTemplate).length, [businesses]);
  const templateCount = useMemo(() => businesses.filter((b) => b.isTemplate).length, [businesses]);

  const hasActiveAcademicFilters = selectedHostel !== 'All' || selectedFaculty !== 'All' || selectedDepartment !== 'All';

  // Filtered and sorted listings
  const filteredListings = useMemo(() => {
    return businesses
      .filter((biz) => {
        // Starter template vs real student filter
        if (listingFilter === 'live' && biz.isTemplate) return false;
        if (listingFilter === 'templates' && !biz.isTemplate) return false;

        // Campus filter
        if (selectedCampus && selectedCampus !== 'All') {
          const matchesCampus = 
            biz.campus.toLowerCase().includes(selectedCampus.toLowerCase()) ||
            biz.hostelLocation.toLowerCase().includes(selectedCampus.toLowerCase());
          if (!matchesCampus) return false;
        }

        // Category filter
        if (selectedCategory && selectedCategory !== 'All Categories') {
          if (biz.category !== selectedCategory) return false;
        }

        // Specific UNILORIN Hostel Filter
        if (selectedHostel && selectedHostel !== 'All') {
          const bizHostelLower = biz.hostelLocation.toLowerCase();
          const targetHostelLower = selectedHostel.toLowerCase();
          // Extract base name without wing or parenthesis for flexible match
          const cleanTarget = targetHostelLower.replace(/\s*\([^)]*\)/g, '').trim();
          if (!bizHostelLower.includes(cleanTarget) && !targetHostelLower.includes(bizHostelLower)) {
            return false;
          }
        }

        // Specific UNILORIN Faculty Filter (out of 52 faculties)
        if (selectedFaculty && selectedFaculty !== 'All') {
          const facObj = UNILORIN_FACULTIES.find((f) => f.faculty === selectedFaculty);
          const matchesDirect = biz.studentFaculty === selectedFaculty;
          const matchesDeptInFaculty = facObj && biz.studentDept ? facObj.departments.some(d => d.toLowerCase() === biz.studentDept.toLowerCase()) : false;
          if (!matchesDirect && !matchesDeptInFaculty) {
            return false;
          }
        }

        // Specific Department Filter
        if (selectedDepartment && selectedDepartment !== 'All') {
          if (biz.studentDept?.toLowerCase() !== selectedDepartment.toLowerCase()) {
            return false;
          }
        }

        // Delivery only filter
        if (deliveryOnly && !biz.acceptsHostelDelivery) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = biz.name.toLowerCase().includes(q);
          const matchesTagline = biz.tagline.toLowerCase().includes(q);
          const matchesOwner = biz.ownerName.toLowerCase().includes(q);
          const matchesLocation = biz.hostelLocation.toLowerCase().includes(q);
          const matchesDept = biz.studentDept?.toLowerCase().includes(q);
          const matchesFaculty = biz.studentFaculty?.toLowerCase().includes(q);
          const matchesServices = biz.services?.some(
            (s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
          );
          if (!matchesName && !matchesTagline && !matchesOwner && !matchesLocation && !matchesServices && !matchesDept && !matchesFaculty) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') {
          return a.startingPrice - b.startingPrice;
        }
        if (sortBy === 'rating') {
          return b.rating - a.rating;
        }
        return b.reviewsCount - a.reviewsCount;
      });
  }, [businesses, selectedCampus, selectedCategory, selectedHostel, selectedFaculty, selectedDepartment, deliveryOnly, searchQuery, sortBy, listingFilter]);

  return (
    <section id="stores-directory" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
      
      {/* Informative Showcase Banner */}
      {showDemoBanner && templateCount > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs sm:text-sm text-neutral-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">About the {templateCount} Initial Listings:</span>
              <p className="text-neutral-300 text-xs mt-0.5 leading-relaxed">
                These {templateCount} stores are pre-seeded <strong>Starter Showcase Templates</strong> built so you can preview store menus, checkout, and live chat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {onToggleDemoTemplates && (
              <button
                type="button"
                onClick={onToggleDemoTemplates}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-900/50 transition-colors"
              >
                {includeDemoTemplates ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{includeDemoTemplates ? 'Hide Starter Templates' : 'Show Starter Templates'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDemoBanner(false)}
              className="text-neutral-400 hover:text-white text-xs px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Directory Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Campus Trade Marketplace
            </h2>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-400">
              UNILORIN Collegiate Hub
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-2xl">
            Order fresh hostel pastries, book room hair grooming, replace broken screens, or arrange express campus errands. Zero platform middleman markup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenCreateBusiness}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>List Your Business</span>
          </button>

          {/* Accurate Status Pill */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 tabular-nums bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2">
            <span className="text-emerald-400 font-bold">{liveCount} registered stores</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="mt-6 flex flex-col gap-4">
        
        {/* Listing Type Tabs (All vs Live Student Trades vs Starter Templates) */}
        <div className="flex items-center gap-2 border-b border-neutral-800/80 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setListingFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              listingFilter === 'all'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <span>All Listings</span>
            <span className="font-mono text-[10px] bg-neutral-900 px-1.5 py-0.5 rounded-full text-neutral-400">
              {businesses.length}
            </span>
          </button>

          <button
            onClick={() => setListingFilter('live')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              listingFilter === 'live'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Live Student Trades</span>
            <span className="font-mono text-[10px] bg-emerald-950 px-1.5 py-0.5 rounded-full text-emerald-300 border border-emerald-800">
              {liveCount}
            </span>
          </button>

          <button
            onClick={() => setListingFilter('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              listingFilter === 'templates'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Starter Showcase Templates</span>
            <span className="font-mono text-[10px] bg-amber-950 px-1.5 py-0.5 rounded-full text-amber-300 border border-amber-800">
              {templateCount}
            </span>
          </button>
        </div>

        {/* Search, Campus Select, Delivery Toggle, Sort */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Active Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Lagos meat pie, Tanke thrift, screen repair..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900/90 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Secondary Filter Controls */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-between md:justify-end">
            
            {/* Campus selector */}
            <select
              value={selectedCampus}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              {CAMPUS_ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.label}
                </option>
              ))}
            </select>

            {/* Room delivery toggle */}
            <button
              type="button"
              onClick={() => setDeliveryOnly(!deliveryOnly)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                deliveryOnly
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${deliveryOnly ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
              <span>Room Delivery Only</span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="recommended">Sort: Popular</option>
              <option value="price-low">Sort: Lowest Price</option>
              <option value="rating">Sort: Top Rated</option>
            </select>

            {/* Academic & Hostel Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowAcademicFilters(!showAcademicFilters)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                hasActiveAcademicFilters || showAcademicFilters
                  ? 'border-amber-500/70 bg-amber-950/40 text-amber-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Hostels & Faculties</span>
              {hasActiveAcademicFilters && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* View Mode Toggle: Vertical Focus vs Grid */}
            <div className="flex items-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 p-1">
              <button
                type="button"
                onClick={() => setViewLayout('carousel')}
                title="Vertical Focus Reel"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewLayout === 'carousel'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <GalleryVertical className="h-3.5 w-3.5" />
                <span>Vertical Reel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                title="Grid View"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewLayout === 'grid'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* UNILORIN Hostels, 16 Faculties, & Department Filter Drawer */}
        {(showAcademicFilters || hasActiveAcademicFilters) && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-3 shadow-xl backdrop-blur-md transition-all">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Filter by UNILORIN Hostel, Faculty & Department
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Find student sellers in your hall of residence or search among the 16 UNILORIN faculties.
                  </p>
                </div>
              </div>

              {hasActiveAcademicFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHostel('All');
                    setSelectedFaculty('All');
                    setSelectedDepartment('All');
                  }}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* UNILORIN Hostel Select Menu Filter */}
              <div className="lg:col-span-5">
                <HostelSelectMenu
                  selectedHostel={selectedHostel}
                  onHostelChange={setSelectedHostel}
                  allowAll={true}
                  allLabel="All UNILORIN Hostels"
                  label="Hostel Hall / Private Hall"
                  required={false}
                />
              </div>

              {/* UNILORIN 16 Faculties & Cascading Department Selector Filter */}
              <div className="lg:col-span-7">
                <FacultyDepartmentSelector
                  selectedFaculty={selectedFaculty}
                  onFacultyChange={setSelectedFaculty}
                  selectedDepartment={selectedDepartment}
                  onDepartmentChange={setSelectedDepartment}
                  allowAll={true}
                  allFacultyLabel="All 16 UNILORIN Faculties"
                  allDepartmentLabel="All Departments"
                  labelPrefix=""
                  compact={true}
                  required={false}
                />
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveAcademicFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-neutral-500 font-mono">Active Filters:</span>
                {selectedHostel !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                    <MapPin className="h-3 w-3 text-emerald-400" />
                    <span>Hostel: {selectedHostel}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedHostel('All')}
                      className="text-neutral-400 hover:text-white ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {selectedFaculty !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                    <Building2 className="h-3 w-3 text-amber-400" />
                    <span>Faculty: {selectedFaculty}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFaculty('All')}
                      className="text-neutral-400 hover:text-white ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}

                {selectedDepartment !== 'All' && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                    <GraduationCap className="h-3 w-3 text-emerald-400" />
                    <span>Dept: {selectedDepartment}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDepartment('All')}
                      className="text-neutral-400 hover:text-white ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-white border border-neutral-800/80'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

      </div>

      {/* Listings Display: Loading Skeletons vs Error vs Empty vs Grid/Carousel */}
      {isLoading && businesses.length === 0 ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3 animate-pulse"
            >
              <div className="w-full aspect-square rounded-xl bg-neutral-800" />
              <div className="h-4 w-3/4 rounded-md bg-neutral-800" />
              <div className="h-4 w-1/3 rounded-md bg-neutral-800" />
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <div className="h-3 w-1/3 rounded bg-neutral-800" />
                <div className="h-3 w-8 rounded bg-neutral-800" />
              </div>
              <div className="h-11 w-full rounded-xl bg-neutral-800" />
            </div>
          ))}
        </div>
      ) : error && businesses.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">Unable to load campus traders</h3>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            {error || 'Please check your network connection and try again.'}
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      ) : businesses.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
            <ShoppingBag className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No traders yet. Be the first to open a store</h3>
          <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Register your hostel bakes, tech repair, dorm styling, or campus brand today!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenBecomeTrader || onOpenCreateBusiness}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-neutral-950 shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
            >
              Become a Trader
            </button>
          </div>
        </div>
      ) : filteredListings.length > 0 ? (
        viewLayout === 'carousel' ? (
          <div className="mt-4">
            <ListingCarouselFocus
              businesses={filteredListings}
              onSelectBusiness={onSelectBusiness}
              onOpenTraderProfile={onOpenTraderProfile}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                onSelect={onSelectBusiness}
                onOpenTraderProfile={onOpenTraderProfile}
              />
            ))}
          </div>
        )
      ) : (
        <div className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
            <ShoppingBag className="h-7 w-7" />
          </div>

          {businesses.length === 0 ? (
            <>
              <h3 className="text-lg font-bold text-white">No Active Student Trades Listed</h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                All previous listings have been cleared. Be the first UNILORIN student founder to list your hostel bakes, tech repair, dorm styling, or campus service!
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onOpenCreateBusiness}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Plus className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
                  <span>+ List Your Trade in 2 Mins</span>
                </button>
              </div>
            </>
          ) : liveCount === 0 && (listingFilter === 'live' || !includeDemoTemplates) ? (
            <>
              <h3 className="text-lg font-bold text-white">No Live Student Businesses Registered Yet</h3>
              <p className="mt-2 text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                The marketplace currently has <strong>0 live registered student stores</strong>.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onOpenCreateBusiness}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Plus className="inline-block h-4 w-4 mr-1.5 -mt-0.5" />
                  <span>List The First UNILORIN Trade</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-white">No UNILORIN stores match your filter</h3>
              <p className="mt-1 text-xs text-neutral-400 max-w-md mx-auto">
                {searchQuery ? `No results found for "${searchQuery}".` : 'No businesses found in this selection.'} Try resetting your search or filters.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onSearchChange('');
                    setSelectedCategory('All Categories');
                    onSelectCampus('All');
                    setDeliveryOnly(false);
                    setListingFilter('all');
                  }}
                  className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={onOpenCreateBusiness}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  List Your Trade Here
                </button>
              </div>
            </>
          )}
        </div>
      )}

    </section>
  );
};
