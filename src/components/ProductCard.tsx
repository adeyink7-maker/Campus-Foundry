import React from 'react';
import { 
  Store, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Plus, 
  Clock, 
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { Product } from '../types';
import { formatNaira } from '../services/marketplace';
import { useAuth } from '../context/AuthContext';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onQuickAdd?: (e: React.MouseEvent) => void;
  onManage?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onQuickAdd, onManage }) => {
  const { currentUser } = useAuth();
  const isSoldOut = product.stockQuantity === 0;
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

  const isOwnProduct = Boolean(
    currentUser && (product.ownerId === currentUser.id)
  );

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700/80 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-xl transition-all cursor-pointer text-white"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square w-full bg-neutral-950 overflow-hidden">
        <img
          src={image}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Kind Badge & Your listing Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm ${
            product.kind === 'good'
              ? 'bg-amber-500/90 text-neutral-950'
              : 'bg-emerald-500/90 text-neutral-950'
          }`}>
            {product.kind === 'good' ? 'Good' : 'Service'}
          </span>

          {isOwnProduct && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-neutral-950 text-[9px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm">
              Your listing
            </span>
          )}
        </div>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg">
              Sold Out
            </span>
          </div>
        )}

        {/* Stock Alert Badge */}
        {!isSoldOut && product.stockQuantity != null && product.stockQuantity <= 5 && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-neutral-950 text-[9px] font-bold backdrop-blur-md">
            Only {product.stockQuantity} left
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="truncate">{product.category}</span>
            {product.estimatedTime && (
              <span className="font-mono text-neutral-400 flex items-center gap-0.5 shrink-0">
                <Clock className="w-3 h-3 text-amber-400/80" />
                {product.estimatedTime}
              </span>
            )}
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-amber-400 transition-colors">
            {product.title}
          </h3>
        </div>

        {/* Trader info & Price */}
        <div className="pt-2 border-t border-neutral-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span className="truncate flex items-center gap-1 font-medium">
              <Store className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">{product.businessName || 'Campus Trade'}</span>
            </span>

            {product.businessRating != null && (
              <span className="flex items-center gap-0.5 text-amber-400 font-bold shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                {product.businessRating}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
              {formatNaira(product.price)}
            </span>

            {isOwnProduct ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onManage) onManage();
                  else onClick();
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-[11px] transition-all cursor-pointer shadow-sm"
                title="Manage Product"
              >
                Manage
              </button>
            ) : (
              onQuickAdd && !isSoldOut && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickAdd(e);
                  }}
                  className="p-1.5 rounded-xl bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-200 transition-all cursor-pointer"
                  title="Quick Add to Cart"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
