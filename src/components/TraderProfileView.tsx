import React, { useState, useEffect, useCallback } from 'react';
import { 
  Store, 
  MapPin, 
  Phone, 
  Star, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  MessageSquare, 
  Edit3, 
  Bookmark, 
  Share2, 
  Tag, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  X
} from 'lucide-react';
import { StudentBusiness, Product, MarketplaceReview } from '../types';
import { useAuth } from '../context/AuthContext';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';
import { useCart } from '../context/CartContext';
import { EditTraderProfileModal } from './EditTraderProfileModal';
import { LongPressAvatar } from './playercard/LongPressAvatar';
import { ProductDetailModal } from './ProductDetailModal';
import { MyStoreModal } from './MyStoreModal';
import { 
  listProducts, 
  createProduct, 
  setProductActive, 
  fetchReviews, 
  formatNaira, 
  isSupabaseConfigured,
  mapMarketplaceError
} from '../services/marketplace';

export interface TraderProfileViewProps {
  business: StudentBusiness;
  onBack?: () => void;
  onUpdateBusiness?: (updated: StudentBusiness) => void;
}

export const TraderProfileView: React.FC<TraderProfileViewProps> = ({
  business: initialBusiness,
  onBack,
  onUpdateBusiness,
}) => {
  const { currentUser } = useAuth();
  const { openChatWithBusiness } = useMarketplaceChat();
  const { toggleWishlist, isWishlisted, addToCart } = useCart();

  const [business, setBusiness] = useState<StudentBusiness>(initialBusiness);
  const [activeTab, setActiveTab] = useState<'goods' | 'services' | 'reviews'>('goods');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMyStoreModalOpen, setIsMyStoreModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Supabase Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline Product Creation State for Owner
  const [isAddingGood, setIsAddingGood] = useState(false);
  const [goodName, setGoodName] = useState('');
  const [goodPrice, setGoodPrice] = useState('');
  const [goodDesc, setGoodDesc] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceTurnaround, setServiceTurnaround] = useState('Same Day');
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  useEffect(() => {
    setBusiness(initialBusiness);
  }, [initialBusiness]);

  const isOwner = Boolean(
    currentUser &&
      (business.ownerId === currentUser.id ||
        (business.ownerEmail && currentUser.email && business.ownerEmail.toLowerCase() === currentUser.email.toLowerCase()))
  );

  // Load products from Supabase
  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !business?.id) return;
    try {
      setIsLoadingProducts(true);
      const { products: data } = await listProducts({
        businessId: business.id,
        isActive: isOwner ? undefined : true,
        pageSize: 100,
      });
      setProducts(data);
    } catch (err: unknown) {
      console.warn('[TraderProfileView] Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [business?.id, isOwner]);

  // Load reviews from Supabase
  const loadReviews = useCallback(async () => {
    if (!isSupabaseConfigured || !business?.id) return;
    try {
      setIsLoadingReviews(true);
      const data = await fetchReviews(business.id);
      setReviews(data);
    } catch (err: unknown) {
      console.warn('[TraderProfileView] Failed to load reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [business?.id]);

  useEffect(() => {
    loadProducts();
    loadReviews();
  }, [loadProducts, loadReviews]);

  const isSaved = isWishlisted(business.id);
  const isOpenForBusiness = business.activeOrdersToday !== undefined ? business.activeOrdersToday > 0 : true;

  const handleUpdate = (updated: StudentBusiness) => {
    setBusiness(updated);
    onUpdateBusiness?.(updated);
  };

  const handleCreateGood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goodName.trim() || !goodPrice || !currentUser) return;

    try {
      setIsSubmittingItem(true);
      setErrorMessage(null);
      await createProduct({
        businessId: business.id,
        ownerId: currentUser.id,
        kind: 'good',
        title: goodName.trim(),
        description: goodDesc.trim(),
        price: Math.max(0, Number(goodPrice)),
        category: business.category,
        stockQuantity: 10,
        images: [business.imageUrl],
        isActive: true,
      });

      setGoodName('');
      setGoodPrice('');
      setGoodDesc('');
      setIsAddingGood(false);
      await loadProducts();
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !servicePrice || !currentUser) return;

    try {
      setIsSubmittingItem(true);
      setErrorMessage(null);
      await createProduct({
        businessId: business.id,
        ownerId: currentUser.id,
        kind: 'service',
        title: serviceName.trim(),
        description: serviceDesc.trim(),
        price: Math.max(0, Number(servicePrice)),
        category: business.category,
        estimatedTime: serviceTurnaround.trim() || 'Same Day',
        stockQuantity: null, // unlimited
        images: [business.imageUrl],
        isActive: true,
      });

      setServiceName('');
      setServicePrice('');
      setServiceDesc('');
      setServiceTurnaround('Same Day');
      setIsAddingService(false);
      await loadProducts();
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleToggleActive = async (prod: Product) => {
    try {
      await setProductActive(prod.id, !prod.isActive);
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    }
  };

  const handleShareTrader = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const handleOpenMarketplaceChat = async () => {
    try {
      await openChatWithBusiness(business.id);
    } catch (err) {
      console.error('Failed to open marketplace chat with trader:', err);
    }
  };

  const goodsList = products.filter((p) => p.kind === 'good');
  const servicesList = products.filter((p) => p.kind === 'service');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-white font-sans space-y-6">
      
      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Back Header */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold transition-all cursor-pointer shadow-md"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400" />
          <span>Back to Marketplace</span>
        </button>
      )}

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. HEADER & TRADER IDENTITY BANNER */}
      <div className="relative rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden space-y-6">
        
        {/* Top Status & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          
          {/* Availability Status Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
            isOpenForBusiness
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isOpenForBusiness ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>{isOpenForBusiness ? 'Open for Business' : 'Away / In Lectures'}</span>
          </div>

          {/* Owner or Buyer Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwner ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMyStoreModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Store className="h-4 w-4" />
                  <span>Manage Products</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => toggleWishlist(business)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isSaved
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                  title="Bookmark Trader"
                >
                  <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleShareTrader}
                  className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors"
                  title="Share Trader Link"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                <a
                  href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-extrabold text-xs shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Phone className="h-4 w-4" />
                  <span>WhatsApp</span>
                </a>

                {/* Message Trader Button (OPENS MARKETPLACE CHAT DRAWER) */}
                <button
                  type="button"
                  onClick={handleOpenMarketplaceChat}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Message Trader</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Brand Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={business.imageUrl}
            alt={business.name}
            className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-amber-400 p-0.5 shadow-2xl shrink-0"
          />

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white">{business.name}</h1>
              <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-xs font-mono font-bold">
                {business.category}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-bold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verified Student Founder</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-medium">
              {business.tagline || business.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <LongPressAvatar
                  userId={business.ownerId || `trader_${business.id}`}
                  name={business.ownerName}
                  size="xs"
                  showRingHint
                  className="rounded-full shadow-xs"
                />
                <span className="font-semibold text-neutral-200">{business.ownerName}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                <span>{business.hostelLocation || 'UNILORIN Hostels'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Credibility metrics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-800 text-center">
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="text-xs text-neutral-400 font-medium">Rating Score</div>
            <div className="text-sm sm:text-base font-extrabold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
              <Star className="h-4 w-4 fill-current" />
              <span>{business.rating} / 5.0</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="text-xs text-neutral-400 font-medium">Verified Reviews</div>
            <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
              {reviews.length} reviews
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="text-xs text-neutral-400 font-medium">Catalog Items</div>
            <div className="text-sm sm:text-base font-extrabold text-amber-400 mt-0.5">
              {products.length} live
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
            <div className="text-xs text-neutral-400 font-medium">Hostel Delivery</div>
            <div className="text-sm sm:text-base font-extrabold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>Supported</span>
            </div>
          </div>
        </div>
      </div>

      {copiedToast && (
        <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
          Storefront link copied to clipboard!
        </div>
      )}

      {/* 2. TABBED PORTFOLIO SHOWCASE (READS FROM products & reviews TABLES) */}
      <div className="flex items-center justify-center border-b border-neutral-800 text-xs font-bold uppercase tracking-wider text-neutral-400">
        <button
          type="button"
          onClick={() => setActiveTab('goods')}
          className={`flex items-center gap-2 py-3 px-6 border-b-2 transition-all cursor-pointer ${
            activeTab === 'goods'
              ? 'border-amber-400 text-amber-400 font-extrabold'
              : 'border-transparent hover:text-white'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Goods ({goodsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 py-3 px-6 border-b-2 transition-all cursor-pointer ${
            activeTab === 'services'
              ? 'border-amber-400 text-amber-400 font-extrabold'
              : 'border-transparent hover:text-white'
          }`}
        >
          <Tag className="h-4 w-4" />
          <span>Services ({servicesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 py-3 px-6 border-b-2 transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-amber-400 text-amber-400 font-extrabold'
              : 'border-transparent hover:text-white'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>Reviews ({reviews.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="py-4 space-y-4">
        
        {/* TAB 1: GOODS & PRODUCTS */}
        {activeTab === 'goods' && (
          <div className="space-y-4">
            {isOwner && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300">Manage Your Storefront Goods</h4>
                  <p className="text-[11px] text-neutral-400">Post physical food combos, tech accessories, or merch</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingGood(!isAddingGood)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isAddingGood ? 'Close Form' : '+ Add Product'}</span>
                </button>
              </div>
            )}

            {isOwner && isAddingGood && (
              <form onSubmit={handleCreateGood} className="p-5 rounded-2xl bg-neutral-900 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="h-4 w-4 text-amber-400" />
                    <span>List New Good / Product in Database</span>
                  </h4>
                  <button type="button" onClick={() => setIsAddingGood(false)} className="text-neutral-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smoky Turkey & Jollof Rice"
                      value={goodName}
                      onChange={(e) => setGoodName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Price (₦ Naira) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 2500"
                      value={goodPrice}
                      onChange={(e) => setGoodPrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Freshly peppered turkey, plantain, coleslaw..."
                    value={goodDesc}
                    onChange={(e) => setGoodDesc(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingGood(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingItem}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
                  >
                    {isSubmittingItem ? 'Saving to Database...' : 'Save Product'}
                  </button>
                </div>
              </form>
            )}

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-32 rounded-2xl bg-neutral-900 animate-pulse" />
                ))}
              </div>
            ) : goodsList.length === 0 ? (
              <div className="p-12 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800 space-y-2">
                <ShoppingBag className="h-10 w-10 text-neutral-600 mx-auto mb-1" />
                <h4 className="text-sm font-bold text-white">No Goods Listed in Database</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {isOwner ? 'Click "+ Add Product" to list your first item.' : 'This trader has not listed any goods yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {goodsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 transition-all shadow-lg flex flex-col justify-between space-y-3 cursor-pointer group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.stockQuantity === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                              Sold Out
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                              In Stock
                            </span>
                          )}
                          {isOwner && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(item);
                              }}
                              title={item.isActive ? 'Deactivate' : 'Activate'}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white"
                            >
                              {item.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {item.description || 'Verified student good.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-sm font-mono font-black text-amber-400">{formatNaira(item.price)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(item);
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                      >
                        View & Order →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVICES */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {isOwner && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-300">Manage Your Storefront Services</h4>
                  <p className="text-[11px] text-neutral-400">Offer laptop repairs, exam tutoring, hairstyling, or delivery runs</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingService(!isAddingService)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isAddingService ? 'Close Form' : '+ Add Service'}</span>
                </button>
              </div>
            )}

            {isOwner && isAddingService && (
              <form onSubmit={handleCreateService} className="p-5 rounded-2xl bg-neutral-900 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="h-4 w-4 text-emerald-400" />
                    <span>List New Service in Database</span>
                  </h4>
                  <button type="button" onClick={() => setIsAddingService(false)} className="text-neutral-400 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Service Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MacBook M1 Screen Replacement"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Starting Price (₦) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 5000"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Estimated Turnaround</label>
                    <input
                      type="text"
                      placeholder="e.g. Same Day, 2 Hours, Weekend"
                      value={serviceTurnaround}
                      onChange={(e) => setServiceTurnaround(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Original parts with 30-day warranty"
                      value={serviceDesc}
                      onChange={(e) => setServiceDesc(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingService(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingItem}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-40"
                  >
                    {isSubmittingItem ? 'Saving...' : 'Save Service'}
                  </button>
                </div>
              </form>
            )}

            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-32 rounded-2xl bg-neutral-900 animate-pulse" />
                ))}
              </div>
            ) : servicesList.length === 0 ? (
              <div className="p-12 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800 space-y-2">
                <Tag className="h-10 w-10 text-neutral-600 mx-auto mb-1" />
                <h4 className="text-sm font-bold text-white">No Services Listed in Database</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {isOwner ? 'Click "+ Add Service" to offer repairs, hair styling, or tutoring.' : 'This trader has not listed any services yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {servicesList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProduct(item)}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-400/50 transition-all shadow-lg flex flex-col justify-between space-y-3 cursor-pointer group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{item.title}</h4>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.estimatedTime && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.estimatedTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {item.description || 'Verified student service.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-sm font-mono font-black text-emerald-400">{formatNaira(item.price)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(item);
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        Inquire & Order →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REVIEWS (READS FROM reviews TABLE) */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {isLoadingReviews ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-20 rounded-2xl bg-neutral-900 animate-pulse" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800 space-y-2">
                <Star className="h-10 w-10 text-neutral-600 mx-auto mb-1" />
                <h4 className="text-sm font-bold text-white">No Reviews Yet</h4>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  When verified student buyers complete their orders, their ratings will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{rev.reviewerName}</span>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          Verified Buyer
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-neutral-500 font-mono block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {isOwner && (
        <EditTraderProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          business={business}
          onUpdateBusiness={handleUpdate}
        />
      )}

      {/* My Store Products Manager Modal */}
      {isOwner && (
        <MyStoreModal
          isOpen={isMyStoreModalOpen}
          onClose={() => {
            setIsMyStoreModalOpen(false);
            loadProducts();
          }}
          myStore={business}
          onUpdateStore={handleUpdate}
        />
      )}
    </div>
  );
};
