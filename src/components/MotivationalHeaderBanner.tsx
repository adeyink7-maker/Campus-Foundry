import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Quote, 
  Pause, 
  Play, 
  Building2, 
  Vote, 
  ShoppingBag, 
  BookOpen, 
  Palette,
  Compass,
  Scale
} from 'lucide-react';
import { MotivationalQuote, AppModule } from '../types';
import { MOTIVATIONAL_QUOTES } from '../data/socialMockData';

interface MotivationalHeaderBannerProps {
  currentModule: AppModule;
  onNavigateModule?: (module: AppModule) => void;
}

export const MotivationalHeaderBanner = ({
  currentModule,
  onNavigateModule,
}: MotivationalHeaderBannerProps) => {
  // Filter quotes relevant to current module or general
  const moduleQuotes = MOTIVATIONAL_QUOTES.filter((q) => {
    if (currentModule === 'politics') return q.module === 'politics';
    if (currentModule === 'marketplace') return q.module === 'marketplace';
    if (currentModule === 'academics') return q.module === 'academics';
    if (currentModule === 'news' || currentModule === 'clubs') return q.module === 'arts' || q.module === 'politics' || q.module === 'feed';
    return q.module === 'feed' || q.module === 'general';
  });

  const quotesList = moduleQuotes.length > 0 ? moduleQuotes : MOTIVATIONAL_QUOTES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Reset index when module changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [currentModule]);

  // Auto-cycle quotes every 9 seconds
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotesList.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [isPlaying, quotesList.length]);

  const activeQuote: MotivationalQuote = quotesList[currentIndex % quotesList.length] || MOTIVATIONAL_QUOTES[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quotesList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + quotesList.length) % quotesList.length);
  };

  const getModuleTheme = () => {
    switch (currentModule) {
      case 'politics':
        return {
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          gradient: 'from-rose-950/40 via-neutral-900 to-neutral-950',
          accent: 'text-rose-400',
          icon: Vote,
          label: 'SUG & Statesmanship Inspiration',
        };
      case 'marketplace':
        return {
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          gradient: 'from-amber-950/40 via-neutral-900 to-neutral-950',
          accent: 'text-amber-400',
          icon: ShoppingBag,
          label: 'Student Enterprise & Hustle Quotes',
        };
      case 'academics':
        return {
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          gradient: 'from-blue-950/40 via-neutral-900 to-neutral-950',
          accent: 'text-blue-400',
          icon: BookOpen,
          label: 'Science, Tech & Scholarly Excellence',
        };
      case 'clubs':
      case 'news':
        return {
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          gradient: 'from-purple-950/40 via-neutral-900 to-neutral-950',
          accent: 'text-purple-400',
          icon: Palette,
          label: 'Culture, Leadership & Integrity',
        };
      default:
        return {
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-950/40 via-neutral-900 to-neutral-950',
          accent: 'text-emerald-400',
          icon: Compass,
          label: 'Daily UNILORIN Mindset & Character',
        };
    }
  };

  const theme = getModuleTheme();
  const IconComponent = theme.icon;

  return (
    <div className={`relative w-full border-b border-neutral-800/80 bg-gradient-to-r ${theme.gradient} overflow-hidden`}>
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      <div className="relative mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Main Quote Content with AnimatePresence */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeQuote.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="flex items-start sm:items-center gap-3.5"
              >
                {/* Figure Avatar Photo */}
                <div className="relative shrink-0">
                  <img
                    src={activeQuote.figureImageUrl || activeQuote.imageUrl}
                    alt={activeQuote.figureName || activeQuote.author || 'Leader'}
                    className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl object-cover border border-neutral-700/80 shadow-md ring-1 ring-white/10"
                    loading="lazy"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-amber-400">
                    <Quote className="h-2.5 w-2.5" />
                  </div>
                </div>

                {/* Quote Text & Citation */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${theme.badgeBg}`}>
                      <IconComponent className="h-3 w-3" />
                      <span>{activeQuote.categoryBadge}</span>
                    </span>
                    <span className="text-[11px] font-bold text-white tracking-wide">
                      {activeQuote.figureName || activeQuote.author}
                    </span>
                    {(activeQuote.authorTitle || activeQuote.title) && (
                      <span className="text-[10px] text-neutral-400 hidden sm:inline">
                        • {activeQuote.authorTitle || activeQuote.title}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-[13px] italic text-neutral-200 leading-snug line-clamp-2">
                    "{activeQuote.quoteText || activeQuote.quote}"
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Controls: Quote Carousel & Play/Pause */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800/60">
            <span className="text-[10px] font-mono text-neutral-400">
              {currentIndex + 1} of {quotesList.length}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Previous Quote"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title={isPlaying ? 'Pause Auto-cycle' : 'Play Auto-cycle'}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                title="Next Quote"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
