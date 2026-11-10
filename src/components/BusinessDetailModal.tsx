import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Star, 
  CheckCircle2, 
  MessageCircle, 
  MessageSquare,
  ShoppingBag, 
  Clock, 
  Plus, 
  Minus, 
  ShieldCheck,
  Send,
  Phone,
  Store,
  User,
  Heart,
  Package
} from 'lucide-react';
import { StudentBusiness, StudentServiceItem, ChatOrderSnippet, Product } from '../types';
import { listProducts } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';
import { useCart } from '../context/CartContext';
import { ALL_UNILORIN_HOSTELS } from '../data/mockData';
import { HostelSelectMenu } from './HostelSelectMenu';

interface BusinessDetailModalProps {
  business: StudentBusiness | null;
  onClose: () => void;
  onOpenTraderProfile?: (business: StudentBusiness) => void;
  onRequireAuth?: (action?: () => void) => void;
}

export const BusinessDetailModal = ({ business, onClose, onOpenTraderProfile, onRequireAuth }: BusinessDetailModalProps) => {
  const { currentUser } = useAuth();
  const { openChatWithBusiness } = useMarketplaceChat();
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  
  // Track quantities for items
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customerHostel, setCustomerHostel] = useState(() => {
    return ALL_UNILORIN_HOSTELS.find((h) => currentUser?.hostelLocation?.includes(h)) || 'Lagos Hostel (Male)';
  });
  const [customerRoomNumber, setCustomerRoomNumber] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [addedToast, setAddedToast] = useState(false);

  // Products from Supabase 'products' table for this business
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    if (!business?.id) {
      setProducts([]);
      return;
    }
    let isMounted = true;
    setIsLoadingProducts(true);
    setProductsError(null);

    listProducts({ businessId: business.id, pageSize: 100 })
      .then((res) => {
        if (isMounted) {
          setProducts(res.products);
        }
      })
      .catch((err) => {
        console.warn('[BusinessDetailModal] failed to load products:', err);
        if (isMounted) {
          setProductsError('Unable to load products.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [business?.id]);

  // Lock body scroll while modal is active (Must be called before any early return)
  useEffect(() => {
    if (!business) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [business]);

  // Unified items list: prefers real products from Supabase products table
  const displayItems = useMemo(() => {
    if (products.length > 0) {
      return products.map((p) => ({
        id: p.id,
        name: p.title,
        price: p.price,
        description: p.description,
        imageUrl: p.images && p.images.length > 0 ? p.images[0] : null,
        stockQuantity: p.stockQuantity,
        isProduct: true,
      }));
    }
    return (business?.services || []).map((s) => ({
      id: s.id,
      name: s.name,
      price: s.price,
      description: s.description,
      imageUrl: null as string | null,
      stockQuantity: null as number | null,
      isProduct: false,
    }));
  }, [products, business?.services]);

  if (!business) return null;

  const isSaved = isWishlisted(business.id);
  const fullCustomerRoom = `${customerHostel}${customerRoomNumber.trim() ? `, ${customerRoomNumber.trim()}` : ''}`;

  const handleQuantityChange = (itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [itemId]: next };
    });
  };

  // Calculate order total
  const selectedItems = displayItems.filter((s) => (quantities[s.id] || 0) > 0);
  const totalAmount = selectedItems.reduce((acc, item) => {
    return acc + item.price * (quantities[item.id] || 0);
  }, 0);

  const handleAddToCart = () => {
    if (!currentUser) {
      onRequireAuth?.(() => handleAddToCart());
      return;
    }
    if (selectedItems.length === 0) {
      // If none selected with counter, add the first item with quantity 1
      const defaultItem = displayItems[0] || {
        id: 'svc_default',
        name: business.name + ' Service',
        price: business.startingPrice,
        isProduct: false,
      };
      addToCart({
        businessId: business.id,
        businessName: business.name,
        businessImageUrl: business.imageUrl,
        businessWhatsapp: business.whatsapp,
        traderHostel: business.hostelLocation,
        serviceId: defaultItem.id,
        productId: defaultItem.isProduct ? defaultItem.id : undefined,
        name: defaultItem.name,
        price: defaultItem.price,
        quantity: 1,
        customNotes: customNote.trim() || undefined,
      });
    } else {
      selectedItems.forEach((item) => {
        addToCart({
          businessId: business.id,
          businessName: business.name,
          businessImageUrl: business.imageUrl,
          businessWhatsapp: business.whatsapp,
          traderHostel: business.hostelLocation,
          serviceId: item.id,
          productId: item.isProduct ? item.id : undefined,
          name: item.name,
          price: item.price,
          quantity: quantities[item.id] || 1,
          customNotes: customNote.trim() || undefined,
        });
      });
    }

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  // Generate WhatsApp order link
  const generateWhatsAppUrl = () => {
    const cleanNumber = business.whatsapp.replace(/[^0-9]/g, '');
    
    let message = `Hello ${business.ownerName}! 👋\nI found *${business.name}* on UNILORIN Campus Foundry.\n\n`;

    if (selectedItems.length > 0) {
      message += `I'd like to place an order for:\n`;
      selectedItems.forEach((item) => {
        const qty = quantities[item.id];
        message += `• ${qty}x ${item.name} (₦${(item.price * qty).toLocaleString()})\n`;
      });
      message += `\n*Estimated Total:* ₦${totalAmount.toLocaleString()}\n`;
    } else {
      message += `I'm interested in your services and would like to ask about availability.\n`;
    }

    if (fullCustomerRoom.trim()) {
      message += `*My Delivery Room/Hostel:* ${fullCustomerRoom.trim()}\n`;
    }
    if (customNote.trim()) {
      message += `*Note:* ${customNote.trim()}\n`;
    }

    message += `\nPlease confirm if you're taking orders right now. Thank you!`;

    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleStartInAppChat = async () => {
    if (!currentUser) {
      onRequireAuth?.(() => handleStartInAppChat());
      return;
    }
    try {
      onClose();
      await openChatWithBusiness(business.id);
    } catch (err) {
      console.error('[BusinessDetailModal] Failed to open marketplace chat:', err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="relative flex flex-col max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Visual */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 overflow-hidden bg-neutral-950">
          <img
            src={business.imageUrl}
            alt={business.name}
            className="h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent" />

          {/* Wishlist toggle button */}
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                onRequireAuth?.(() => toggleWishlist(business));
                return;
              }
              toggleWishlist(business);
            }}
            title={isSaved ? 'Remove from saved' : 'Save to wishlist'}
            className={`absolute top-3 right-12 rounded-full p-2 backdrop-blur-md border transition-colors ${
              isSaved
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:text-rose-400 hover:bg-neutral-800'
            }`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-neutral-950/80 p-2 text-neutral-300 hover:text-white backdrop-blur-md border border-neutral-800 hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Location and delivery tags */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 rounded-lg bg-neutral-950/90 px-3 py-1.5 text-neutral-200 border border-neutral-800 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold">{business.hostelLocation}</span>
            </div>

            {business.acceptsHostelDelivery && (
              <div className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-neutral-950 shadow-md">
                <Clock className="h-3.5 w-3.5" />
                <span>Hostel Delivery ({business.deliveryTimeEstimate})</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Header Title & Owner Profile */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-neutral-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                  {business.category}
                </span>
                {currentUser && (business.ownerId === currentUser.id || (business.ownerEmail && currentUser.email && business.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())) && (
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                    Your listing
                  </span>
                )}
                <span className="text-neutral-500 text-xs">·</span>
                <span className="text-xs text-neutral-400">{business.campus}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                {business.name}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                {business.description}
              </p>
            </div>

            <div className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 shrink-0 self-start">
              <Star className="h-4 w-4 fill-amber-400" />
              <span>{business.rating.toFixed(1)}</span>
              <span className="text-neutral-500 text-xs font-normal">({business.reviewsCount} reviews)</span>
            </div>
          </div>

          {/* Student Founder Profile Badge */}
          <div 
            onClick={() => {
              onClose();
              onOpenTraderProfile?.(business);
            }}
            className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3.5 flex items-center justify-between cursor-pointer hover:border-amber-400/60 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 group-hover:scale-105 transition-transform">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">{business.ownerName}</span>
                  {business.verifiedStudent && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <div className="text-xs text-neutral-400">
                  {business.studentDept} · {business.studentLevel} · View Trader Portfolio ➔
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold block">Full Portfolio</span>
              <span className="font-mono text-emerald-400 font-bold text-xs">
                {displayItems.length} Listed Items
              </span>
            </div>
          </div>

          {/* Products & Services Catalog from Supabase 'products' table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-4 w-4 text-amber-400" />
                <span>{products.length > 0 ? 'Store Products & Menu' : 'Services & Menu Items'}</span>
              </h3>
              <span className="text-[11px] text-neutral-500">
                Select items to calculate total & order
              </span>
            </div>

            {isLoadingProducts ? (
              /* Loading Skeletons */
              <div className="space-y-2.5">
                {[1, 2].map((n) => (
                  <div key={n} className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-neutral-950/40 animate-pulse">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-neutral-800" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3.5 w-1/3 rounded bg-neutral-800" />
                        <div className="h-3 w-1/2 rounded bg-neutral-800" />
                      </div>
                    </div>
                    <div className="h-8 w-20 rounded-xl bg-neutral-800" />
                  </div>
                ))}
              </div>
            ) : displayItems.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-neutral-800 bg-neutral-950/30">
                <Package className="h-7 w-7 text-neutral-500 mx-auto mb-2" />
                <p className="text-xs text-neutral-400">No products listed by this trader yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayItems.map((item) => {
                  const qty = quantities[item.id] || 0;
                  const isSoldOut = item.stockQuantity === 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        qty > 0
                          ? 'border-emerald-500/50 bg-emerald-950/20'
                          : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700'
                      }`}
                    >
                      <div className="mr-3 flex items-center gap-3 flex-1 min-w-0">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-12 w-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800 shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.name}
                            </span>
                            {qty > 0 && (
                              <span className="rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-1.5 py-0.2 font-bold shrink-0">
                                {qty} in cart
                              </span>
                            )}
                            {isSoldOut && (
                              <span className="rounded bg-rose-500/20 text-rose-400 text-[10px] font-mono px-1.5 py-0.2 font-bold shrink-0">
                                Sold Out
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug line-clamp-1">
                              {item.description}
                            </p>
                          )}
                          <div className="font-mono text-emerald-400 font-bold text-xs mt-1">
                            ₦{item.price.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={qty === 0 || isSoldOut}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <span className="w-5 text-center font-mono text-xs font-bold text-white">
                          {qty}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          disabled={isSoldOut}
                          className="h-7 w-7 flex items-center justify-center rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery Note & Customer Hostel Input */}
          <div className="space-y-3 pt-2">
            <HostelSelectMenu
              selectedHostel={customerHostel}
              onHostelChange={setCustomerHostel}
              roomNumber={customerRoomNumber}
              onRoomNumberChange={setCustomerRoomNumber}
              showRoomInput={true}
              label="Your Delivery UNILORIN Hostel & Room"
              roomPlaceholder="e.g. Block B Room 102"
              required={false}
            />

            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Order Notes / Preferences (Optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Extra pepper, deliver by 2:00 PM"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer with Instant WhatsApp Checkout */}
        <div className="border-t border-neutral-800 bg-neutral-950 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Estimated Total</span>
            <div className="font-mono text-lg font-bold text-white">
              {totalAmount > 0 ? (
                <>
                  <span className="text-emerald-400">₦{totalAmount.toLocaleString()}</span>
                  <span className="text-xs text-neutral-400 font-normal ml-2">({selectedItems.length} items)</span>
                </>
              ) : (
                <span className="text-xs text-neutral-400 font-normal">Select items above</span>
              )}
            </div>
          </div>

          {currentUser && (business.ownerId === currentUser.id || (business.ownerEmail && currentUser.email && business.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())) ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTraderProfile?.(business);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs sm:text-sm font-extrabold text-neutral-950 shadow-lg transition-all cursor-pointer"
            >
              <Store className="h-4 w-4" />
              <span>Manage Store</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-emerald-500/50 px-3.5 py-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                <ShoppingBag className="h-4 w-4 text-emerald-400" />
                <span>{addedToast ? 'Added to Cart ✓' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={handleStartInAppChat}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-3.5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat In-App</span>
              </button>

              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 hover:text-white px-3.5 py-3 text-xs sm:text-sm font-bold text-neutral-200 transition-all"
              >
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};
