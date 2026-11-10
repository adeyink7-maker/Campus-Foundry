import React, { useState } from 'react';
import { 
  X, 
  ShoppingBag, 
  MessageSquare, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Store, 
  AlertCircle,
  Plus, 
  Minus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Product, StudentBusiness } from '../types';
import { formatNaira } from '../services/marketplace';
import { useCart } from '../context/CartContext';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';
import { useAuth } from '../context/AuthContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenTraderProfile?: (businessId: string) => void;
  onRequireAuth?: (action?: () => void) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenTraderProfile,
  onRequireAuth,
}) => {
  const { addToCart, cartItems } = useCart();
  const { openChatWithBusiness } = useMarketplaceChat();
  const { currentUser } = useAuth();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);

  if (!product) return null;

  const isOwnProduct = Boolean(
    currentUser && (product.ownerId === currentUser.id)
  );

  const images = product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'];

  const isSoldOut = product.stockQuantity === 0;
  const maxAvailable = product.stockQuantity != null ? product.stockQuantity : 99;

  // Check if cart contains another trader's items
  const existingOtherTraderItem = cartItems.find((ci) => ci.businessId !== product.businessId);

  const handleAddToCartAttempt = (overrideReplace = false) => {
    if (isSoldOut || isOwnProduct) return;

    if (!currentUser) {
      onRequireAuth?.(() => handleAddToCartAttempt(overrideReplace));
      return;
    }

    if (existingOtherTraderItem && !overrideReplace) {
      setReplaceConfirmOpen(true);
      return;
    }

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
      quantity,
    });

    setReplaceConfirmOpen(false);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleMessageTrader = async () => {
    if (isOwnProduct) return;

    if (!currentUser) {
      onRequireAuth?.(() => handleMessageTrader());
      return;
    }

    try {
      setIsMessaging(true);
      await openChatWithBusiness(product.businessId);
      onClose();
    } catch (err) {
      console.error('Failed to open marketplace chat:', err);
    } finally {
      setIsMessaging(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              product.kind === 'good' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {product.kind === 'good' ? 'Campus Good' : 'Student Service'}
            </span>

            {isOwnProduct && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Your listing
              </span>
            )}

            <span className="text-xs text-neutral-400 font-medium">
              {product.category}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Main Image Gallery */}
          <div className="space-y-2">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />

              {isSoldOut && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="px-4 py-2 rounded-xl bg-rose-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-lg">
                    Sold Out
                  </span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIndex === idx ? 'border-amber-500 scale-95' : 'border-neutral-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Price */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">{product.title}</h2>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {formatNaira(product.price)}
              </span>
              
              <div className="text-right">
                {isSoldOut ? (
                  <span className="text-xs font-bold text-rose-400">Sold out</span>
                ) : product.stockQuantity != null ? (
                  <span className="text-xs font-medium text-amber-300/90">
                    {product.stockQuantity} left in stock
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In stock (Unlimited)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Estimated Turnaround / Prep time */}
          {product.estimatedTime && (
            <div className="flex items-center gap-2 text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Turnaround estimate: <strong>{product.estimatedTime}</strong></span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1 pt-1">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Description</h4>
            <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {product.description || 'No detailed description provided by the trader.'}
            </p>
          </div>

          {/* Trader Card */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0">
                  {product.businessImageUrl ? (
                    <img src={product.businessImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-amber-400 m-2.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{product.businessName || 'Campus Venture'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {product.businessRating || 5.0}
                    </span>
                    <span>•</span>
                    <span className="truncate flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {product.businessHostel || 'UNILORIN Hostels'}
                    </span>
                  </div>
                </div>
              </div>

              {onOpenTraderProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTraderProfile(product.businessId);
                  }}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 whitespace-nowrap"
                >
                  View Store
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Replace Cart Confirmation Modal if adding from different trader */}
        {replaceConfirmOpen && (
          <div className="p-3.5 bg-neutral-950 border-t border-amber-500/40 text-xs space-y-2 animate-in slide-in-from-bottom">
            <div className="flex items-start gap-2 text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                Your cart currently contains items from <strong>{existingOtherTraderItem?.businessName || 'another trader'}</strong>. 
                Orders can only be placed with one campus trader at a time. Replace cart items?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReplaceConfirmOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 font-semibold hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAddToCartAttempt(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold hover:bg-amber-400"
              >
                Replace Cart & Add
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/95 flex flex-col sm:flex-row items-center gap-3 shrink-0">
          {!isOwnProduct && !isSoldOut && (
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <span className="text-xs text-neutral-400 sm:hidden">Quantity:</span>
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold font-mono min-w-[20px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxAvailable}
                  onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full flex-1">
            {isOwnProduct ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTraderProfile?.(product.businessId);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-extrabold transition-all shadow-md shadow-amber-950/40 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Manage Product & Store</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleMessageTrader}
                  disabled={isMessaging}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>{isMessaging ? 'Opening...' : 'Message Trader'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => handleAddToCartAttempt(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-amber-500 shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{addedToast ? 'Added to Cart! ✓' : isSoldOut ? 'Sold Out' : `Add to Cart (${formatNaira(product.price * quantity)})`}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
