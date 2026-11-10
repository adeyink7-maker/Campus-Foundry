import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  MessageSquare, 
  CheckCircle2, 
  Sparkles, 
  Star, 
  ArrowDownUp,
  Store
} from 'lucide-react';
import { StudentBusiness } from '../types';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

interface ListingCarouselFocusProps {
  businesses: StudentBusiness[];
  onSelectBusiness: (business: StudentBusiness) => void;
  onOpenTraderProfile?: (business: StudentBusiness) => void;
}

export const ListingCarouselFocus = ({
  businesses,
  onSelectBusiness,
  onOpenTraderProfile,
}: ListingCarouselFocusProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const { openChatWithBusiness } = useChat();
  const { currentUser } = useAuth();
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaY = useRef<number>(0);
  const mouseStartY = useRef<number | null>(null);
  const lastWheelTime = useRef<number>(0);

  const total = businesses.length;
  const AUTOPLAY_INTERVAL = 2000; // 2 seconds per screen time

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  // 2-second Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || total <= 1 || isDragging) return;

    const timer = setInterval(() => {
      handleNext();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [isAutoPlaying, total, isDragging, handleNext, activeIndex]);

  // Keyboard navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch swipe handling (Mobile vertical swipe)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    touchDeltaY.current = currentY - touchStartY.current;
    setDragOffsetY(touchDeltaY.current * 0.4);
  };

  const onTouchEnd = () => {
    const delta = touchDeltaY.current;
    setDragOffsetY(0);
    touchStartY.current = null;

    if (delta < -35) {
      // Swiped UP -> show next
      handleNext();
    } else if (delta > 35) {
      // Swiped DOWN -> show prev
      handlePrev();
    }
  };

  // Mouse drag handling (Desktop vertical drag)
  const onMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click and not on interactive buttons
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    setIsDragging(true);
    mouseStartY.current = e.clientY;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || mouseStartY.current === null) return;
    const delta = e.clientY - mouseStartY.current;
    setDragOffsetY(delta * 0.4);
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || mouseStartY.current === null) return;
    const delta = e.clientY - mouseStartY.current;
    setIsDragging(false);
    mouseStartY.current = null;
    setDragOffsetY(0);

    if (delta < -35) {
      handleNext();
    } else if (delta > 35) {
      handlePrev();
    }
  };

  const onMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      mouseStartY.current = null;
      setDragOffsetY(0);
    }
  };

  // Wheel / Trackpad scroll handling (Vertical flick)
  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 400) return; // throttle wheel events

    if (Math.abs(e.deltaY) > 25) {
      lastWheelTime.current = now;
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  if (total === 0) return null;
  const currentBiz = businesses[activeIndex] || businesses[0];

  return (
    <div className="relative w-full py-4 select-none">
      
      {/* Top Status */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-neutral-400">
            {activeIndex + 1} of {total}
          </span>
        </div>
      </div>

      {/* Main Vertical Carousel Stage */}
      <div 
        ref={stageRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onWheel={onWheel}
        className={`relative h-[560px] sm:h-[590px] w-full max-w-4xl mx-auto flex items-center justify-center overflow-hidden rounded-3xl cursor-grab touch-pan-y overscroll-contain ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
      >
        {/* Ambient Backlight Glow */}
        <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl -z-10 transition-all duration-700" />

        {/* Vertical Swipe Hint Indicator overlay */}
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-950/80 border border-neutral-800/80 px-3 py-1 rounded-full backdrop-blur-md shadow-lg animate-pulse">
          <ArrowDownUp className="h-3 w-3 text-emerald-400" />
          <span>Swipe Up or Down to Switch</span>
        </div>

        {/* Vertical Cards Stack */}
        <div className="relative w-full max-w-lg h-full flex items-center justify-center">
          {businesses.map((biz, idx) => {
            // Compute vertical offset from active index
            let offset = idx - activeIndex;
            if (offset < -Math.floor(total / 2)) offset += total;
            if (offset > Math.floor(total / 2)) offset -= total;

            const isCenter = offset === 0;
            const isAbove = offset === -1 || (activeIndex === 0 && idx === total - 1 && total > 2);
            const isBelow = offset === 1 || (activeIndex === total - 1 && idx === 0 && total > 2);
            const isVisible = Math.abs(offset) <= 2;

            if (!isVisible) return null;

            // Vertical positioning & styling
            let translateY = '0%';
            let scale = 'scale(0.85)';
            let opacity = '0.2';
            let zIndex = 10;
            let blur = 'blur(1px)';

            if (isCenter) {
              translateY = `${dragOffsetY}px`;
              scale = 'scale(1)';
              opacity = '1';
              zIndex = 30;
              blur = 'blur(0px)';
            } else if (isAbove) {
              translateY = `calc(-62% + ${dragOffsetY * 0.5}px)`;
              scale = 'scale(0.9)';
              opacity = '0.5';
              zIndex = 20;
              blur = 'blur(0.5px)';
            } else if (isBelow) {
              translateY = `calc(62% + ${dragOffsetY * 0.5}px)`;
              scale = 'scale(0.9)';
              opacity = '0.5';
              zIndex = 20;
              blur = 'blur(0.5px)';
            } else if (offset === -2) {
              translateY = `calc(-110% + ${dragOffsetY * 0.3}px)`;
              scale = 'scale(0.8)';
              opacity = '0.2';
              zIndex = 10;
            } else if (offset === 2) {
              translateY = `calc(110% + ${dragOffsetY * 0.3}px)`;
              scale = 'scale(0.8)';
              opacity = '0.2';
              zIndex = 10;
            }

            return (
              <div
                key={biz.id}
                onClick={() => {
                  if (isCenter) {
                    onSelectBusiness(biz);
                  } else {
                    setActiveIndex(idx);
                  }
                }}
                style={{
                  transform: `translateY(${translateY}) ${scale}`,
                  opacity,
                  zIndex,
                  filter: blur,
                }}
                className={`absolute w-full px-4 transition-all duration-400 ease-out cursor-pointer ${
                  isCenter 
                    ? 'ring-2 ring-emerald-500/80 shadow-2xl shadow-emerald-950/80 rounded-3xl' 
                    : 'hover:opacity-75 hover:scale-[0.92]'
                }`}
              >
                {/* Vertical Card Body */}
                <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/95 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between shadow-2xl">
                  <div>
                    {/* Media Banner */}
                    <div className="relative mb-3 h-44 sm:h-52 w-full overflow-hidden rounded-2xl bg-neutral-950 border border-neutral-800">
                      <img
                        src={biz.imageUrl}
                        alt={biz.name}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />

                      {/* Badges on Banner */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        {currentUser && (biz.ownerId === currentUser.id || (biz.ownerEmail && currentUser.email && biz.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())) ? (
                          <div className="flex items-center gap-1 rounded-md bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-extrabold text-neutral-950 shadow-md uppercase tracking-wider">
                            <Store className="h-3 w-3" />
                            <span>Your listing</span>
                          </div>
                        ) : biz.isTemplate ? (
                          <div className="flex items-center gap-1 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-neutral-950 shadow-md">
                            <Sparkles className="h-3 w-3" />
                            <span>Starter Template (Demo)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 rounded-md bg-emerald-500/95 px-2 py-0.5 text-[10px] font-bold text-neutral-950 shadow-md">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Live Student Trader</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 rounded-md bg-neutral-950/90 px-2 py-0.5 text-[10px] font-medium text-neutral-200 border border-neutral-800">
                          <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{biz.hostelLocation.split(',')[0]}</span>
                        </div>
                      </div>

                      {/* Bottom Banner Details */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs">
                        <span className="rounded-md bg-neutral-950/90 border border-neutral-800 px-2 py-0.5 text-[10px] text-emerald-400 font-mono font-semibold">
                          {biz.category}
                        </span>

                        {biz.acceptsHostelDelivery && (
                          <span className="flex items-center gap-1 rounded-md bg-neutral-950/90 border border-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300">
                            <Clock className="h-3 w-3 text-emerald-400" />
                            <span>{biz.deliveryTimeEstimate || 'Hostel Delivery'}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Titles */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-emerald-400 transition-colors truncate">
                          {biz.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-amber-400 font-bold shrink-0 ml-2">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span>{biz.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {biz.tagline}
                      </p>
                    </div>

                    {/* Student Founder Info - Interactive Trader Profile Entry Point */}
                    <div 
                      onClick={(e) => {
                        if (onOpenTraderProfile) {
                          e.stopPropagation();
                          onOpenTraderProfile(biz);
                        } else {
                          onSelectBusiness(biz);
                        }
                      }}
                      className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-neutral-400 border-t border-neutral-800/80 pt-2 hover:text-amber-400 transition-colors cursor-pointer group/founder"
                      title="Tap to view Trader Profile & Portfolio"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400 group-hover/founder:scale-105 transition-transform shrink-0">
                          <Store className="h-3.5 w-3.5" />
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-neutral-200 group-hover/founder:text-amber-400 block truncate">{biz.ownerName}</span>
                          <span className="text-[10px] text-amber-400/90 font-mono font-semibold block">View Trader Portfolio ➔</span>
                        </div>
                      </div>
                      <span className="text-neutral-500 truncate text-[10px] shrink-0">{biz.studentLevel} {biz.studentDept}</span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2 mt-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-neutral-500 block">From</span>
                      <span className="font-mono text-sm sm:text-base font-bold text-white">
                        ₦{biz.startingPrice.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentUser && (biz.ownerId === currentUser.id || (biz.ownerEmail && currentUser.email && biz.ownerEmail.toLowerCase() === currentUser.email.toLowerCase())) ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenTraderProfile) {
                              onOpenTraderProfile(biz);
                            } else {
                              onSelectBusiness(biz);
                            }
                          }}
                          title="Manage Store"
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 px-4 py-2 text-xs font-extrabold shadow-md transition-all cursor-pointer"
                        >
                          <Store className="h-3.5 w-3.5" />
                          <span>Manage</span>
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openChatWithBusiness(biz);
                            }}
                            title={`Chat directly with ${biz.ownerName}`}
                            className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:border-emerald-500 hover:bg-neutral-700 hover:text-emerald-300 px-3 py-2 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Chat</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenTraderProfile) {
                                onOpenTraderProfile(biz);
                              } else {
                                onSelectBusiness(biz);
                              }
                            }}
                            title="View Trader Profile & Portfolio"
                            className="flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500 hover:text-neutral-950 px-3 py-2 text-xs font-bold text-amber-300 transition-all cursor-pointer shadow-sm"
                          >
                            <Store className="h-3.5 w-3.5" />
                            <span>Portfolio</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBusiness(biz);
                            }}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>Menu</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Vertical Progress Rail & Swipe Gestures (Right side) */}
        <div className="absolute right-2 sm:right-4 z-40 flex flex-col items-center gap-2 py-4">
          <button
            onClick={handlePrev}
            aria-label="Swipe up to previous"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-emerald-500/50 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>

          <div className="flex flex-col gap-1.5 py-1">
            {businesses.map((b, i) => (
              <button
                key={b.id}
                onClick={() => {
                  setActiveIndex(i);
                }}
                aria-label={`Jump to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === activeIndex
                    ? 'h-5 w-2 bg-emerald-400 shadow-xs shadow-emerald-400/50'
                    : 'h-2 w-2 bg-neutral-800 hover:bg-neutral-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            aria-label="Swipe down to next"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-emerald-500/50 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* Inline styles for 2s progress bar animation */}
      <style>{`
        @keyframes progressFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>

    </div>
  );
};
