import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Sparkles, Bell } from 'lucide-react';

export interface CarouselMessageItem {
  id?: string | number;
  text: string;
  badge?: string;
  link?: string;
  linkText?: string;
}

export type CarouselMessage = string | CarouselMessageItem;

export interface StickyHeaderCarouselProps {
  /** Array of string messages or rich message objects */
  messages?: CarouselMessage[];
  /** Auto-rotation interval in milliseconds. Defaults to 4000 (4 seconds). */
  interval?: number;
  /** Whether to auto-cycle automatically. Defaults to true. */
  autoPlay?: boolean;
  /** Whether to pause auto-play on hover or focus. Defaults to true. */
  pauseOnHover?: boolean;
  /** Show left and right chevron arrows. Defaults to true. */
  showControls?: boolean;
  /** Show the close dismiss button. Defaults to true. */
  showCloseButton?: boolean;
  /** Callback fired when dismissed */
  onClose?: () => void;
  /** Optional custom CSS class */
  className?: string;
}

const DEFAULT_MESSAGES: CarouselMessageItem[] = [
  {
    badge: 'Campus Alert',
    text: '⚡ Express hostel delivery now live for Lagos, CIS & Tanke zones.',
    linkText: 'Explore Stores',
    link: '#stores-directory',
  },
  {
    badge: 'UNILORIN Verified',
    text: '🎓 100% Student-to-Student Collegiate Marketplace — Zero middleman markup.',
  },
  {
    badge: 'New Trader Bonus',
    text: '🚀 List your dorm laundry, baking, or repair trade for free in under 2 minutes.',
    linkText: 'List Business',
  },
  {
    badge: 'Safe Trading',
    text: '🛡️ In-app real-time encrypted chat now enabled for all verified traders.',
  },
];

export const StickyHeaderCarousel: React.FC<StickyHeaderCarouselProps> = ({
  messages = DEFAULT_MESSAGES,
  interval = 4000,
  autoPlay = true,
  pauseOnHover = true,
  showControls = true,
  showCloseButton = true,
  onClose,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = messages.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  // Reset & start timer whenever currentIndex or pause state changes
  useEffect(() => {
    if (!autoPlay || total <= 1 || isPaused || !isVisible) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, total, isPaused, isVisible, interval, handleNext, currentIndex]);

  if (!isVisible || total === 0) return null;

  const currentItem = messages[currentIndex];
  const itemText = typeof currentItem === 'string' ? currentItem : currentItem.text;
  const itemBadge = typeof currentItem === 'string' ? undefined : currentItem.badge;
  const itemLink = typeof currentItem === 'string' ? undefined : currentItem.link;
  const itemLinkText = typeof currentItem === 'string' ? undefined : currentItem.linkText;

  return (
    <aside
      role="region"
      aria-label="Announcement Carousel"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      onFocus={() => pauseOnHover && setIsPaused(true)}
      onBlur={() => pauseOnHover && setIsPaused(false)}
      style={{ top: 0, zIndex: 1000 }}
      className={`sticky top-0 z-[1000] w-full border-b border-emerald-500/20 bg-neutral-950/95 backdrop-blur-md text-neutral-200 shadow-md transition-all ${className}`}
    >
      <div className="mx-auto flex h-10 sm:h-11 max-w-7xl items-center justify-between px-3 sm:px-6 text-xs">
        
        {/* Left Control Arrow */}
        {showControls && total > 1 ? (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous announcement"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800/80 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <div className="w-7 hidden sm:block" />
        )}

        {/* Center: Animated Crossfade Message */}
        <div 
          className="relative flex-1 overflow-hidden px-2 text-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex items-center justify-center gap-2 truncate"
            >
              {/* Optional Accent Badge */}
              {itemBadge && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 shrink-0">
                  <Sparkles className="h-2.5 w-2.5 text-emerald-400" />
                  <span>{itemBadge}</span>
                </span>
              )}

              {/* Announcement Text */}
              <span className="truncate font-medium text-neutral-200">
                {itemText}
              </span>

              {/* Optional Action Link */}
              {itemLinkText && (
                <a
                  href={itemLink || '#'}
                  className="hidden md:inline-flex items-center text-[11px] font-bold text-emerald-400 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-300 shrink-0 transition-colors"
                >
                  {itemLinkText} &rarr;
                </a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Controls: Next Arrow & Close Button */}
        <div className="flex items-center gap-1">
          {showControls && total > 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next announcement"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800/80 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {showCloseButton && (
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close announcement bar"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800/80 hover:text-rose-400 transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </aside>
  );
};
