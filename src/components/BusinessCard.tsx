import React from 'react';
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  MessageSquare, 
  Sparkles, 
  Heart,
  Store
} from 'lucide-react';
import { StudentBusiness } from '../types';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface BusinessCardProps {
  business: StudentBusiness;
  onSelect: (business: StudentBusiness) => void;
  onOpenTraderProfile?: (business: StudentBusiness) => void;
  onManageStore?: (business: StudentBusiness) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ 
  business, 
  onSelect, 
  onOpenTraderProfile,
  onManageStore
}) => {
  const { openChatWithBusiness } = useChat();
  const { toggleWishlist, isWishlisted } = useCart();
  const { currentUser } = useAuth();
  const isSaved = isWishlisted(business.id);

  const isOwnStore = Boolean(
    currentUser &&
      (business.ownerId === currentUser.id ||
        (business.ownerEmail && currentUser.email && business.ownerEmail.toLowerCase() === currentUser.email.toLowerCase()))
  );

  const handleCardClick = () => {
    onSelect(business);
  };

  const handleTraderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenTraderProfile) {
      onOpenTraderProfile(business);
    } else {
      onSelect(business);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
      className="group flex flex-col justify-between rounded-2xl border border-neutral-800/90 bg-neutral-900/80 hover:bg-neutral-900 hover:border-orange-500/50 p-3 transition-all duration-200 hover:shadow-xl hover:shadow-orange-950/20 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-orange-500/50"
    >
      <div>
        {/* Square Card Image Container */}
        <div className="relative mb-2.5 aspect-square w-full overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800/80">
          <img
            src={business.imageUrl}
            alt={business.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />

          {/* Wishlist Bookmark Button - min 44px touch target */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(business);
            }}
            title={isSaved ? 'Remove from saved' : 'Save to wishlist'}
            className={`absolute top-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-md border transition-all ${
              isSaved
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-300 hover:text-rose-400 hover:border-neutral-700'
            }`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Location Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-neutral-950/90 px-2 py-1 text-[10px] font-medium text-neutral-300 backdrop-blur-md border border-neutral-800">
            <MapPin className="h-3 w-3 text-orange-400 shrink-0" />
            <span className="truncate max-w-[80px]">{business.hostelLocation.split(',')[0]}</span>
          </div>

          {/* Verification / Your listing pill */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-neutral-950/90 border border-neutral-800 px-1.5 py-0.5 text-[10px] font-medium backdrop-blur-md">
            {isOwnStore ? (
              <span className="text-amber-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Store className="h-3 w-3 text-amber-400" />
                <span>Your listing</span>
              </span>
            ) : business.isTemplate ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="truncate max-w-[70px]">{business.category}</span>
              </span>
            ) : business.verifiedStudent ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="truncate max-w-[70px]">{business.category}</span>
              </span>
            ) : (
              <span className="text-neutral-400 flex items-center gap-1">
                <span className="truncate max-w-[80px]">{business.category}</span>
              </span>
            )}
          </div>
        </div>

        {/* Business Name */}
        <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1 leading-snug">
          {business.name}
        </h3>

        {/* Large Price */}
        <div className="mt-1 text-sm sm:text-base font-extrabold text-white font-mono tabular-nums">
          ₦{business.startingPrice.toLocaleString()}
        </div>

        {/* Trader Name & Star Rating (Tap to open Portfolio/Profile) */}
        <div 
          onClick={handleTraderClick}
          className="mt-2 flex items-center justify-between gap-1 text-xs text-neutral-300 hover:text-orange-400 cursor-pointer transition-colors pt-2 border-t border-neutral-800/80"
          title="Tap trader name to view portfolio"
        >
          <span className="truncate font-medium text-neutral-200 hover:text-orange-400 underline-offset-2 hover:underline">
            {business.ownerName}
          </span>
          <div className="flex items-center gap-1 text-orange-400 font-bold shrink-0">
            <Star className="h-3.5 w-3.5 fill-orange-400" />
            <span>{business.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button: "Manage" for own store vs "Chat" for others */}
      {isOwnStore ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onManageStore) {
              onManageStore(business);
            } else {
              onSelect(business);
            }
          }}
          className="mt-3 min-h-[44px] w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          title="Manage My Store"
        >
          <Store className="h-4 w-4" />
          <span>Manage</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openChatWithBusiness(business);
          }}
          className="mt-3 min-h-[44px] w-full rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          title={`Chat with ${business.ownerName}`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Chat</span>
        </button>
      )}
    </div>
  );
};

export default BusinessCard;
