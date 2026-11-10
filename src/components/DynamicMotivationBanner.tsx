import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Quote, 
  Pause, 
  Vote, 
  ShoppingBag, 
  Palette, 
  Compass, 
  Cpu, 
  Hand,
  Sparkles
} from 'lucide-react';
import { MotivationCard, AppModule, DomainCategory } from '../types';
import { BANNER_DATABASE } from '../data/socialMockData';

interface DynamicMotivationBannerProps {
  currentModule?: AppModule;
  activeCard?: MotivationCard;
  onNavigateModule?: (module: AppModule) => void;
}

export const DynamicMotivationBanner = ({
  currentModule = 'feed',
  activeCard: externalActiveCard,
  onNavigateModule,
}: DynamicMotivationBannerProps) => {
  // Map module to targeted DomainCategory
  const targetDomain: DomainCategory = useMemo(() => {
    switch (currentModule) {
      case 'politics':
        return 'POLITICS';
      case 'marketplace':
        return 'MARKETPLACE';
      case 'academics':
        return 'TECH';
      case 'clubs':
      case 'news':
        return 'ARTS';
      default:
        return 'GENERAL';
    }
  }, [currentModule]);

  // Route-filtered cards preserving atomic single-object definitions
  const filteredCards = useMemo(() => {
    const matched = BANNER_DATABASE.filter((card) => {
      if (targetDomain === 'POLITICS') return card.domainCategory === 'POLITICS';
      if (targetDomain === 'MARKETPLACE') return card.domainCategory === 'MARKETPLACE';
      if (targetDomain === 'TECH') return card.domainCategory === 'TECH';
      if (targetDomain === 'ARTS') return card.domainCategory === 'ARTS';
      return card.domainCategory === 'GENERAL' || card.domainCategory === 'POLITICS' || card.domainCategory === 'MARKETPLACE';
    });
    return matched.length > 0 ? matched : BANNER_DATABASE;
  }, [targetDomain]);

  // Single integer index pointer ensuring synchronized image-name-quote state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPressHolding, setIsPressHolding] = useState(false);
  const [dragDirection, setDragDirection] = useState<number>(0);

  // Reset index on module change
  useEffect(() => {
    setCurrentIndex(0);
  }, [currentModule]);

  // Auto-rotation timer (6.5 seconds), strictly paused on Press-and-Hold
  useEffect(() => {
    if (isPressHolding || externalActiveCard) return;
    const interval = setInterval(() => {
      setDragDirection(1);
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [isPressHolding, externalActiveCard, filteredCards.length]);

  // Single-Object Atomic Binding: The UI component strictly consumes only activeCard
  const activeCard: MotivationCard = useMemo(() => {
    if (externalActiveCard) return externalActiveCard;
    const safeIndex = Math.abs(currentIndex) % filteredCards.length;
    return filteredCards[safeIndex] || BANNER_DATABASE[0];
  }, [externalActiveCard, currentIndex, filteredCards]);

  const handleNext = () => {
    setDragDirection(1);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    setDragDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  // Drag / Swipe Gesture handler
  const handleDragEnd = (_e: any, info: PanInfo) => {
    const swipeThreshold = 45;
    if (info.offset.x < -swipeThreshold) {
      handleNext();
    } else if (info.offset.x > swipeThreshold) {
      handlePrev();
    }
  };

  // Domain-specific styling and ambient visual backdrops
  const theme = useMemo(() => {
    switch (activeCard.domainCategory) {
      case 'POLITICS':
        return {
          containerGradient: 'from-rose-950/80 via-neutral-900 to-neutral-950',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          accentColor: 'text-rose-400',
          icon: Vote,
          domainTitle: 'Statesmanship & Governance',
          backdropSvg: (
            <svg className="absolute -right-10 -bottom-10 h-64 w-64 text-rose-500/5 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7v2h20V7L12 2zm-8 8v9h3v-9H4zm5 0v9h3v-9H9zm5 0v9h3v-9h-3zm5 0v9h3v-9h-3zM2 20v2h20v-2H2z" />
            </svg>
          ),
        };
      case 'MARKETPLACE':
        return {
          containerGradient: 'from-amber-950/80 via-neutral-900 to-neutral-950',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          accentColor: 'text-amber-400',
          icon: ShoppingBag,
          domainTitle: 'Collegiate Enterprise & Hustle',
          backdropSvg: (
            <svg className="absolute -right-10 -bottom-10 h-64 w-64 text-amber-500/5 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.12h-2.01c-.13-.88-.73-1.54-2.18-1.54-1.45 0-2.27.68-2.27 1.55 0 .76.54 1.39 2.59 1.9 2.61.64 4.31 1.58 4.31 3.82 0 1.69-1.28 2.92-3.14 3.29z" />
            </svg>
          ),
        };
      case 'TECH':
        return {
          containerGradient: 'from-blue-950/80 via-neutral-900 to-neutral-950',
          badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          accentColor: 'text-blue-400',
          icon: Cpu,
          domainTitle: 'Computing, Invention & Science',
          backdropSvg: (
            <svg className="absolute -right-10 -bottom-10 h-64 w-64 text-blue-500/5 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 2v2H4v2h2v12H4v2h2v2h2v-2h8v2h2v-2h2v-2h-2V6h2V4h-2V2h-2v2H8V2H6zm2 4h8v12H8V6zm2 2v8h4V8h-4z" />
            </svg>
          ),
        };
      case 'ARTS':
        return {
          containerGradient: 'from-purple-950/80 via-neutral-900 to-neutral-950',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          accentColor: 'text-purple-400',
          icon: Palette,
          domainTitle: 'Literary Mastery & Voice',
          backdropSvg: (
            <svg className="absolute -right-10 -bottom-10 h-64 w-64 text-purple-500/5 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
            </svg>
          ),
        };
      default:
        return {
          containerGradient: 'from-emerald-950/80 via-neutral-900 to-neutral-950',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          accentColor: 'text-emerald-400',
          icon: Compass,
          domainTitle: 'Character, Intellect & Vision',
          backdropSvg: (
            <svg className="absolute -right-10 -bottom-10 h-64 w-64 text-emerald-500/5 pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z" />
            </svg>
          ),
        };
    }
  }, [activeCard.domainCategory]);

  const IconComponent = theme.icon;

  return (
    <div
      className={`relative w-full border-b border-neutral-800/80 bg-gradient-to-r ${theme.containerGradient} ${activeCard.backdropThemeCss || ''} overflow-hidden select-none touch-pan-y`}
      onPointerDown={() => setIsPressHolding(true)}
      onPointerUp={() => setIsPressHolding(false)}
      onPointerLeave={() => setIsPressHolding(false)}
    >
      {/* Background Graphic Asset Overlay */}
      {theme.backdropSvg}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          {/* Main Figure & Quote Container with Swipe Motion */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait" custom={dragDirection}>
              <motion.div
                key={`banner-card-${activeCard.id}`}
                custom={dragDirection}
                initial={{ opacity: 0, x: dragDirection > 0 ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dragDirection > 0 ? -30 : 30 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex items-start sm:items-center gap-3.5"
              >
                {/* Synchronized Figure Portrait with Key Enforcing Atomic Re-mount */}
                <div className="figure-portrait-wrapper relative shrink-0">
                  <motion.img
                    key={`portrait-${activeCard.id}`}
                    whileHover={{ scale: 1.05 }}
                    src={activeCard.figureImageUrl}
                    alt={activeCard.figureName}
                    className="figure-portrait-image h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover border-2 border-neutral-700/80 shadow-lg ring-2 ring-white/10"
                    loading="eager"
                    onError={(e) => {
                      // Safe fallback handler if image asset fails to load
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/assets/images/placeholders/default_figure.png";
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-amber-400 shadow-sm">
                    <Quote className="h-2.5 w-2.5" />
                  </div>
                </div>

                {/* Synchronized Quote & Attribution */}
                <div className="quote-content-wrapper flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${theme.badgeClass}`}>
                      <IconComponent className="h-3 w-3" />
                      <span>{activeCard.categoryBadge || theme.domainTitle}</span>
                    </span>

                    <p className="figure-attribution text-xs sm:text-[13px] font-bold text-white tracking-tight">
                      <span className="figure-name">{activeCard.figureName}</span>
                    </p>

                    {activeCard.authorTitle && (
                      <span className="text-[10px] text-neutral-400 font-medium hidden sm:inline">
                        • {activeCard.authorTitle}
                      </span>
                    )}
                  </div>

                  <blockquote className="quote-text text-xs sm:text-[13px] italic text-neutral-200 leading-snug line-clamp-2">
                    "{activeCard.quoteText}"
                  </blockquote>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Interactive Gestures & Hold-to-Pause Visual Indicator */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/60">
            <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
              {isPressHolding ? (
                <span className="flex items-center gap-1 text-amber-400 font-bold animate-pulse">
                  <Pause className="h-3 w-3" />
                  <span>Timer Paused (Holding)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Hand className="h-3 w-3 text-emerald-400" />
                  <span>← Swipe to Browse • Hold to Pause →</span>
                </span>
              )}
              <span className="rounded-md bg-neutral-900/90 px-1.5 py-0.5 border border-neutral-800 text-neutral-300 font-bold">
                {((Math.abs(currentIndex) % filteredCards.length) + 1)}/{filteredCards.length}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
