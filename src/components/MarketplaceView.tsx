import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Store, 
  Search, 
  MapPin, 
  Sparkles, 
  Plus, 
  Compass, 
  ShieldCheck, 
  ArrowRight,
  Package,
  AlertCircle,
  Filter,
  X,
  RefreshCw,
  Clock,
  Star
} from 'lucide-react';
import { StudentBusiness, BusinessBlueprint, UserRole, Product, ProductKind } from '../types';
import { BusinessDirectory } from './BusinessDirectory';
import { CampusHubsView } from './CampusHubsView';
import { TraderBlueprintsView } from './TraderBlueprintsView';
import { CampusDirectoryView } from './CampusDirectoryView';
import { HeroSection } from './HeroSection';
import { TraderProfileView } from './TraderProfileView';
import { TraderDashboard } from './TraderDashboard';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { MyOrdersModal } from './MyOrdersModal';
import { MyStoreModal } from './MyStoreModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { 
  listProducts, 
  isSupabaseConfigured, 
  mapMarketplaceError 
} from '../services/marketplace';

const MARKET_CATEGORIES = [
  'All',
  'Food & Grills',
  'Tech & Gadgets',
  'Fashion & Thrift',
  'Academics & Print',
  'Beauty & Hair',
  'Services & Repairs',
];

interface MarketplaceViewProps {
  businesses: StudentBusiness[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCampus: string;
  onSelectCampus: (campus: string) => void;
  onSelectBusiness: (business: StudentBusiness) => void;
  onOpenCreateBusiness: () => void;
  onOpenBecomeTrader?: () => void;
  onApplyBlueprint?: (blueprint: BusinessBlueprint) => void;
  onOpenAuth: (mode?: 'signin' | 'signup', role?: UserRole) => void;
  activeTraderBusiness?: StudentBusiness | null;
  onOpenTraderProfile?: (business: StudentBusiness) => void;
  onClearTraderBusiness?: () => void;
  onUpdateBusiness?: (updated: StudentBusiness) => void;
  isLoadingBusinesses?: boolean;
  businessesError?: string | null;
  onRetryBusinesses?: () => void;
}

export const MarketplaceView = ({
  businesses,
  searchQuery,
  onSearchChange,
  selectedCampus,
  onSelectCampus,
  onSelectBusiness,
  onOpenCreateBusiness,
  onOpenBecomeTrader,
  onApplyBlueprint,
  onOpenAuth,
  activeTraderBusiness,
  onOpenTraderProfile: externalOpenTraderProfile,
  onClearTraderBusiness,
  onUpdateBusiness,
  isLoadingBusinesses = false,
  businessesError = null,
  onRetryBusinesses,
}: MarketplaceViewProps) => {
  const { currentUser } = useAuth();
  const { addToCart } = useCart();

  // Navigation Subtabs
  const [subTab, setSubTab] = useState<'catalog' | 'stores' | 'vendor_hub' | 'hostels' | 'hubs' | 'blueprints'>('catalog');
  const [localTraderProfile, setLocalTraderProfile] = useState<StudentBusiness | null>(null);

  // Filter States for Product Catalog
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedKind, setSelectedKind] = useState<ProductKind | 'all'>('all');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  // Products Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  // Modals
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [selectedMyStore, setSelectedMyStore] = useState<StudentBusiness | null>(null);

  // 300ms Debounce on Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Products from Supabase
  const loadCatalogProducts = useCallback(async (page: number, append = false) => {
    if (!isSupabaseConfigured) {
      setProducts([]);
      setTotalCount(0);
      return;
    }

    try {
      setIsLoadingProducts(true);
      setProductError(null);

      const result = await listProducts({
        search: debouncedSearch,
        category: selectedCategory,
        kind: selectedKind,
        page,
        pageSize: 24,
      });

      if (append) {
        setProducts((prev) => [...prev, ...result.products]);
      } else {
        setProducts(result.products);
      }
      setTotalCount(result.totalCount);
    } catch (err: unknown) {
      console.warn('[MarketplaceView] loadCatalogProducts error:', err);
      setProductError(mapMarketplaceError(err));
    } finally {
      setIsLoadingProducts(false);
    }
  }, [debouncedSearch, selectedCategory, selectedKind]);

  // Trigger catalog fetch when filters change
  useEffect(() => {
    setCurrentPage(1);
    loadCatalogProducts(1, false);
  }, [loadCatalogProducts]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadCatalogProducts(nextPage, true);
  };

  // If parent passes activeTraderBusiness, use it; otherwise use local selection
  const activeTraderProfile = activeTraderBusiness !== undefined ? (activeTraderBusiness || localTraderProfile) : localTraderProfile;

  const handleOpenTrader = (biz: StudentBusiness) => {
    setLocalTraderProfile(biz);
    externalOpenTraderProfile?.(biz);
  };

  const handleBackFromTrader = () => {
    setLocalTraderProfile(null);
    onClearTraderBusiness?.();
  };

  const isElevatedTrader = currentUser?.accountType === 'TRADER' || currentUser?.role === 'trader';

  // Filter current user's owned trades
  const myTrades = currentUser
    ? businesses.filter(
        (b) =>
          b.ownerId === currentUser.id ||
          (b.ownerEmail && currentUser.email && b.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())
      )
    : [];

  if (activeTraderProfile) {
    return (
      <TraderProfileView
        business={activeTraderProfile}
        onBack={handleBackFromTrader}
        onUpdateBusiness={(updated) => {
          setLocalTraderProfile(updated);
          onUpdateBusiness?.(updated);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      
      {/* Product Detail Sheet */}
      <ProductDetailModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
        onOpenTraderProfile={(businessId) => {
          const found = businesses.find((b) => b.id === businessId);
          if (found) {
            handleOpenTrader(found);
          }
        }}
        onRequireAuth={(action) => onOpenAuth(action as any, 'student')}
      />

      {/* Buyer My Orders Modal */}
      <MyOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
      />

      {/* Trader My Store Product Management Modal */}
      {selectedMyStore && (
        <MyStoreModal
          isOpen={Boolean(selectedMyStore)}
          onClose={() => {
            setSelectedMyStore(null);
            loadCatalogProducts(currentPage, false);
          }}
          myStore={selectedMyStore}
          onUpdateStore={(updated) => {
            setSelectedMyStore(updated);
            onUpdateBusiness?.(updated);
          }}
          onOpenStorePublicView={(store) => {
            setSelectedMyStore(null);
            handleOpenTrader(store);
          }}
        />
      )}

      {/* Backend not connected notice */}
      {!isSupabaseConfigured && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <strong className="block font-bold">Backend not connected</strong>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Supabase environment keys are missing or invalid. Connect your Supabase project in .env to place real orders and list goods.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Header Hero */}
      <HeroSection
        onSearch={onSearchChange}
        searchQuery={searchQuery}
        selectedCampus={selectedCampus}
        onSelectCampus={onSelectCampus}
        onOpenAuth={onOpenAuth}
        onOpenCreateBusiness={onOpenCreateBusiness}
        onSelectFeatured={(bizId: string) => {
          const found = businesses.find((b) => b.id === bizId);
          if (found) onSelectBusiness(found);
        }}
      />

      {/* Elevation Banner for Buyers */}
      {!isElevatedTrader && (
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-neutral-950 p-5 sm:p-6 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Start Your Campus Venture</h3>
                <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[9px] font-mono font-bold">
                  Zero Commission
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                Elevate your student account to list food, services, fashion, or tech gadgets. Get orders straight to your WhatsApp with verified UNILORIN trust badges.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setIsMyOrdersOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-bold px-4 py-2.5 text-xs transition-colors cursor-pointer shrink-0"
            >
              <Package className="h-3.5 w-3.5 text-amber-400" />
              <span>My Orders</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onOpenBecomeTrader || onOpenCreateBusiness}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold px-5 py-2.5 text-xs transition-all shadow-lg shadow-amber-950/50 cursor-pointer shrink-0"
            >
              <span>Become a Trader</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs inside Marketplace */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* TAB 1: PRODUCT CATALOG (PRIMARY) */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setSubTab('catalog')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              subTab === 'catalog'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Products & Services ({totalCount})</span>
          </motion.button>

          {/* TAB 2: STORES DIRECTORY */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setSubTab('stores')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              subTab === 'stores'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Campus Stores & Ventures ({businesses.length})</span>
          </motion.button>

          {/* TAB 3: TRADER OPERATIONS HUB */}
          {isElevatedTrader && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setSubTab('vendor_hub')}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                subTab === 'vendor_hub'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              <Package className="h-3.5 w-3.5 text-emerald-400" />
              <span>Trader Dashboard ({myTrades.length})</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setSubTab('hostels')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              subTab === 'hostels'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Hostels & Faculties Drill-Down</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setSubTab('hubs')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              subTab === 'hubs'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Campus Hubs</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setSubTab('blueprints')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shrink-0 ${
              subTab === 'blueprints'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-950/40'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Starter Blueprints</span>
          </motion.button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {myTrades.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setSelectedMyStore(myTrades[0])}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md"
            >
              <Store className="h-3.5 w-3.5 text-emerald-400" />
              <span>My Store</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsMyOrdersOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md"
          >
            <Package className="h-3.5 w-3.5 text-amber-400" />
            <span>My Orders</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={isElevatedTrader ? onOpenCreateBusiness : (onOpenBecomeTrader || onOpenCreateBusiness)}
            className="hidden sm:flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isElevatedTrader ? '+ List New Trade' : 'Become Trader'}</span>
          </motion.button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SUBTAB 1: PRODUCT CATALOG (REAL SUPABASE PRODUCTS GRID)    */}
      {/* ========================================================== */}
      {subTab === 'catalog' && (
        <div className="space-y-5">
          {/* Filters Bar: Kind + Category Chips */}
          <div className="space-y-3 p-4 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Goods / Services Filter */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedKind('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedKind === 'all'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedKind('good')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedKind === 'good'
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Goods Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedKind('service')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    selectedKind === 'service'
                      ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Services Only
                </button>
              </div>

              {/* Total count badge */}
              <div className="text-xs text-neutral-400 font-mono">
                Showing {products.length} of {totalCount} items
              </div>
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {MARKET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-neutral-800 text-amber-400 border border-amber-500/40 shadow-sm'
                      : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Error Notice */}
          {productError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <span>{productError}</span>
              <button
                type="button"
                onClick={() => loadCatalogProducts(1, false)}
                className="text-amber-400 underline font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Products Grid (24 per page) */}
          {isLoadingProducts && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl bg-neutral-900 border border-neutral-800 aspect-3/4 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 px-4 bg-neutral-900/40 rounded-3xl border border-neutral-800 space-y-3">
              <ShoppingBag className="w-12 h-12 text-neutral-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No products match your criteria</h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {searchQuery
                  ? `No items found matching "${searchQuery}". Try different keywords or reset filters.`
                  : 'Be the first student trader to list goods in this category!'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => setSelectedProductForModal(product)}
                    onQuickAdd={(e) => {
                      e.stopPropagation();
                      const addAction = () => {
                        addToCart({
                          businessId: product.businessId,
                          businessName: product.businessName || 'Campus Trader',
                          businessImageUrl: product.businessImageUrl,
                          businessWhatsapp: product.businessWhatsapp,
                          traderHostel: product.businessHostel,
                          serviceId: product.id,
                          productId: product.id,
                          name: product.title,
                          price: product.price,
                          quantity: 1,
                        });
                      };
                      if (!currentUser) {
                        onOpenAuth(addAction as any, 'student');
                        return;
                      }
                      addAction();
                    }}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {products.length < totalCount && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingProducts}
                    className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-400 text-xs font-bold transition-all shadow-md disabled:opacity-50"
                  >
                    {isLoadingProducts ? 'Loading more products...' : `Load More Products (${totalCount - products.length} remaining)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* SUBTAB 2: STORES & VENTURES DIRECTORY                      */}
      {/* ========================================================== */}
      {subTab === 'stores' && (
        <BusinessDirectory
          businesses={businesses}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedCampus={selectedCampus}
          onSelectCampus={onSelectCampus}
          onSelectBusiness={onSelectBusiness}
          onOpenCreateBusiness={onOpenCreateBusiness}
          onOpenTraderProfile={handleOpenTrader}
          isLoading={isLoadingBusinesses}
          error={businessesError}
          onRetry={onRetryBusinesses}
          onOpenBecomeTrader={onOpenBecomeTrader}
        />
      )}

      {/* ========================================================== */}
      {/* SUBTAB 3: TRADER OPERATIONS DASHBOARD (TRADER ONLY)        */}
      {/* ========================================================== */}
      {subTab === 'vendor_hub' && (
        <TraderDashboard
          myBusinesses={myTrades}
          onClose={() => setSubTab('catalog')}
        />
      )}

      {/* SUBTAB 4: HOSTELS & FACULTIES DRILL-DOWN */}
      {subTab === 'hostels' && (
        <CampusDirectoryView
          onSelectHostelFilter={(hostelName) => {
            onSearchChange(hostelName);
            setSubTab('catalog');
          }}
          onSelectDepartmentFilter={(dept) => {
            onSearchChange(dept);
            setSubTab('catalog');
          }}
          onOpenCreateBusiness={onOpenCreateBusiness}
        />
      )}

      {/* SUBTAB 5: CAMPUS HUBS */}
      {subTab === 'hubs' && (
        <CampusHubsView
          onSelectHubZone={(zone) => {
            onSearchChange(zone);
            setSubTab('catalog');
          }}
          onOpenCreateBusiness={onOpenCreateBusiness}
        />
      )}

      {/* SUBTAB 6: STARTER BLUEPRINTS */}
      {subTab === 'blueprints' && (
        <TraderBlueprintsView
          onApplyBlueprint={(bp) => onApplyBlueprint?.(bp)}
        />
      )}
    </div>
  );
};
