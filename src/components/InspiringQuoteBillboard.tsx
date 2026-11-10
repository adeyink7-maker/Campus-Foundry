import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Quote as QuoteIcon, 
  Sparkles,
  Pause,
  Play,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';

// Highly-optimized, lightweight local bundled portraits (~20KB each)
import alikoDangoteImg from '../assets/images/aliko_dangote_portrait_1790940289570.jpg';
import ibukunAwosikaImg from '../assets/images/ibukun_awosika_portrait_1790939474231.jpg';
import femiOtedolaImg from '../assets/images/femi_otedola_portrait_1790939487250.jpg';
import henryFordImg from '../assets/images/henry_ford_portrait_1790940304887.jpg';
import kiichiroToyodaImg from '../assets/images/kiichiro_toyoda_portrait_1790940336483.jpg';
import nikolaTeslaImg from '../assets/images/nikola_tesla_portrait_1790940322902.jpg';
import madamWalkerImg from '../assets/images/madam_walker_portrait_1790940349868.jpg';
import tonyElumeluImg from '../assets/images/tony_elumelu_portrait_1790940367182.jpg';

// Highly-optimized, lightweight local backdrop scenes (~90KB each)
import dangoteSceneImg from '../assets/images/dangote_industrial_scene_1790940642635.jpg';
import awosikaSceneImg from '../assets/images/awosika_corporate_scene_1790940658161.jpg';
import otedolaSceneImg from '../assets/images/otedola_energy_scene_1790940671427.jpg';
import fordSceneImg from '../assets/images/ford_factory_scene_1790940685030.jpg';
import toyodaSceneImg from '../assets/images/toyoda_automotive_scene_1790940699572.jpg';
import teslaSceneImg from '../assets/images/tesla_laboratory_scene_1790940712651.jpg';
import walkerSceneImg from '../assets/images/walker_apothecary_scene_1790940726641.jpg';
import elumeluSceneImg from '../assets/images/elumelu_financial_scene_1790940739345.jpg';

export interface InspiringQuoteItem {
  id: string | number;
  portrait_url: string;
  quote_text: string;
  author_name: string;
  author_title: string;
  background_scene_url: string;
  scene_title: string;
}

export interface InspiringQuoteBillboardProps {
  /** Array of inspiring quote objects */
  quotes?: InspiringQuoteItem[];
  /** Auto-rotation delay in milliseconds. Defaults to 7000 (7.0 seconds for relaxed, rhythmic reading). */
  autoAdvanceInterval?: number;
  /** Whether billboard starts minimized or dismissed */
  initialDismissed?: boolean;
  /** Callback fired when billboard is dismissed */
  onDismiss?: () => void;
  /** Optional custom class name */
  className?: string;
}

export const BUSINESS_GREATS_QUOTES: InspiringQuoteItem[] = [
  {
    id: 'dangote-1',
    portrait_url: alikoDangoteImg,
    quote_text: 'To build a successful enterprise, you must start small and dream big. In the journey of commerce and manufacturing, tenacity of purpose is supreme.',
    author_name: 'Aliko Dangote',
    author_title: 'Founder & Chairman, Dangote Group · Africa’s Foremost Industrial Titan',
    background_scene_url: dangoteSceneImg,
    scene_title: 'Dangote Petrochemical Refinery & Industrial Dawn Complex',
  },
  {
    id: 'awosika-2',
    portrait_url: ibukunAwosikaImg,
    quote_text: 'Whatever trade or enterprise you build, do it with integrity and diligence. Success is never an accident; it is the compound reward of preparation and character.',
    author_name: 'Dr. Mrs. Ibukun Awosika',
    author_title: 'Founder, The Chair Centre Group · Former Chairman, First Bank of Nigeria',
    background_scene_url: awosikaSceneImg,
    scene_title: 'Metropolitan Executive Boardroom & Skyline at Sunrise',
  },
  {
    id: 'otedola-3',
    portrait_url: femiOtedolaImg,
    quote_text: 'In business, you must have the audacity to take calculated risks and the relentless discipline to execute. True wealth is meaningful only when it empowers others.',
    author_name: 'Femi Otedola',
    author_title: 'Chairman, Geregu Power Plc · Renowned Investor & Philanthropist',
    background_scene_url: otedolaSceneImg,
    scene_title: 'Geregu Clean Energy Station & Coastal Grid at Twilight',
  },
  {
    id: 'ford-4',
    portrait_url: henryFordImg,
    quote_text: 'Whether you think you can, or you think you can’t — you are right. Failure is simply the opportunity to begin again, this time more intelligently.',
    author_name: 'Henry Ford',
    author_title: 'Founder, Ford Motor Company · Pioneer of Industrial Mass Production & Modern Assembly',
    background_scene_url: fordSceneImg,
    scene_title: 'Historic 1920s Ford Automotive Assembly Forge & Plant',
  },
  {
    id: 'toyoda-5',
    portrait_url: kiichiroToyodaImg,
    quote_text: 'Before you say you can’t do something, try it. The Toyota way is to never be satisfied with existing methods — continuous improvement is the lifeblood of trade.',
    author_name: 'Kiichiro Toyoda',
    author_title: 'Founder, Toyota Motor Corporation · Architect of Just-In-Time Lean Production',
    background_scene_url: toyodaSceneImg,
    scene_title: 'Precision Toyota Lean Engineering & Prototype Studio',
  },
  {
    id: 'tesla-6',
    portrait_url: nikolaTeslaImg,
    quote_text: 'The present is theirs; the future, for which I really worked, is mine. Transformational enterprise begins with an uncompromising vision of what could be.',
    author_name: 'Nikola Tesla',
    author_title: 'Visionary Electrical Inventor & Engineer · Pioneer of Alternating Current & Wireless Power',
    background_scene_url: teslaSceneImg,
    scene_title: 'High-Voltage Atmospheric Electrical Physics Laboratory',
  },
  {
    id: 'walker-7',
    portrait_url: madamWalkerImg,
    quote_text: 'I got my start by giving myself a start. Don’t sit down and wait for the opportunities to come. Get up and make them!',
    author_name: 'Madam C. J. Walker',
    author_title: 'Cosmetics Manufacturing Mogul · America’s First Self-Made Female Millionaire Entrepreneur',
    background_scene_url: walkerSceneImg,
    scene_title: 'Turn-of-the-Century Artisanal Botanical Apothecary & Salon',
  },
  {
    id: 'elumelu-8',
    portrait_url: tonyElumeluImg,
    quote_text: 'No one can develop Africa but Africans. The private sector is the engine that drives social wealth and economic opportunity across the continent.',
    author_name: 'Tony Elumelu',
    author_title: 'Founder, Tony Elumelu Foundation · Chairman, Heirs Holdings & United Bank for Africa',
    background_scene_url: elumeluSceneImg,
    scene_title: 'Modern African Financial & Banking Commerce Center at Dusk',
  },
];

export const InspiringQuoteBillboard: React.FC<InspiringQuoteBillboardProps> = ({
  quotes = BUSINESS_GREATS_QUOTES,
  autoAdvanceInterval = 8000, // 8.0s calm, leisurely reading duration
  initialDismissed = false,
  onDismiss,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(initialDismissed);
  const [isPaused, setIsPaused] = useState(false);
  const [manualCycleKey, setManualCycleKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = quotes.length;

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
    setManualCycleKey((k) => k + 1);
  }, [total]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setManualCycleKey((k) => k + 1);
  }, [total]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Auto-advance cycle (pauses when hovered or dismissed)
  useEffect(() => {
    if (isDismissed || isPaused || total <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, autoAdvanceInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isDismissed, isPaused, total, autoAdvanceInterval, handleNext, currentIndex, manualCycleKey]);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDismissed) return;
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, isDismissed]);

  if (isDismissed || total === 0) {
    return (
      <div className="sticky top-0 z-50 flex justify-end px-4 py-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/95 backdrop-blur-md px-3.5 py-1.5 text-[11px] font-semibold text-neutral-200 hover:text-emerald-400 hover:border-emerald-500/50 shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
          aria-label="Re-open Inspiring Business Greats Billboard"
        >
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span>Show Business Greats Showcase</span>
          <RotateCcw className="h-3 w-3 ml-0.5 opacity-70" />
        </button>
      </div>
    );
  }

  const currentQuote = quotes[currentIndex];

  return (
    <aside
      role="region"
      aria-label="Inspiring Business Greats Showcase Billboard"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      style={{
        WebkitBackdropFilter: 'blur(16px)',
        backdropFilter: 'blur(16px)',
      }}
      className={`sticky top-0 z-50 w-full overflow-hidden border-b border-neutral-800/80 bg-neutral-950 shadow-2xl transition-all duration-300 min-h-[17.5rem] h-[19rem] sm:h-[18rem] md:h-72 lg:h-80 max-h-[22rem] select-none ${className}`}
    >
      {/* 1. CINEMATIC BACKGROUND SCENES - SMOOTH CROSSFADE IN UNISON */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {quotes.map((q, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={q.id + '-bg'}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                isActive
                  ? 'opacity-100 scale-100 z-10'
                  : 'opacity-0 scale-102 z-0 pointer-events-none'
              }`}
              style={{
                transitionProperty: 'opacity, transform',
                transitionDuration: '1200ms',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <img
                src={q.background_scene_url}
                alt={q.scene_title}
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover object-center filter brightness-[0.72] saturate-[1.2] contrast-[1.08]"
              />
            </div>
          );
        })}

        {/* Directional Contrast Gradient: Dark on the left for crisp typography, open & visible on the right */}
        <div className="absolute inset-0 z-20 bg-gradient-to-r from-neutral-950/95 via-neutral-950/65 to-neutral-950/20 pointer-events-none" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-neutral-950/90 via-transparent to-neutral-950/35 pointer-events-none" />
      </div>

      {/* 2. Top Bar: Accent Tag, Scene Indicator, Counter & Controls */}
      <div className="relative z-30 mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-8 pt-3 sm:pt-4 text-xs">
        
        {/* Left: Inspiring Tag & Backdrop Scene Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/70 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md shadow-md">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Commercial & Industrial Titans</span>
          </div>

          {/* Smooth Fade In / Fade Out Scene Indicator Badge with subtle slide-up */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-950/65 px-2.5 py-0.5 text-[10px] text-neutral-300 backdrop-blur-md">
            <ImageIcon className="h-3 w-3 text-emerald-400" />
            <AnimatePresence mode="wait">
              <motion.span
                key={currentQuote.scene_title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="truncate max-w-xs"
              >
                {currentQuote.scene_title}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Counter, Controls (Play/Pause, Left/Right Arrows, Close) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          <span className="hidden sm:inline font-mono text-[11px] text-neutral-300 tabular-nums px-1 mr-1">
            {currentIndex + 1} / {total}
          </span>

          {/* Pause / Resume Button */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume auto-cycle' : 'Pause auto-cycle'}
            aria-label={isPaused ? 'Resume quote cycle' : 'Pause quote cycle'}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-700/80 bg-neutral-900/80 text-neutral-300 hover:border-emerald-500/50 hover:bg-neutral-800 hover:text-white transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-400" /> : <Pause className="h-3.5 w-3.5" />}
          </button>

          {/* Previous Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous business great"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-700/80 bg-neutral-900/80 text-neutral-300 hover:border-emerald-500/50 hover:bg-neutral-800 hover:text-white transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next business great"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-700/80 bg-neutral-900/80 text-neutral-300 hover:border-emerald-500/50 hover:bg-neutral-800 hover:text-white transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dismiss / Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss billboard"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-700/80 bg-neutral-900/80 text-neutral-400 hover:border-rose-500/50 hover:bg-neutral-800 hover:text-rose-300 transition-all backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. Billboard Main Body: UNIFIED SLIDE CONTAINER WITH RIGID VERTICAL ANCHORING */}
      <div 
        className="relative z-30 mx-auto flex h-[calc(100%-3.25rem)] max-w-7xl items-center px-4 sm:px-8 py-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Rigid-height stage: Locks vertical alignment so portrait NEVER shifts up/down across quotes */}
        <div className="relative w-full h-44 sm:h-36 md:h-40 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuote.id}
              initial={{ opacity: 0, y: 24, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -22, filter: 'blur(3px)' }}
              transition={{ 
                duration: 0.85, 
                ease: [0.22, 1, 0.36, 1] // Luxurious, relaxed cubic bezier
              }}
              className="absolute inset-0 flex flex-col sm:flex-row items-center gap-4 sm:gap-7 lg:gap-10"
            >
              
              {/* Fixed Portrait Container - Both portrait & text fade in and out TOGETHER */}
              <div className="relative shrink-0 flex-shrink-0">
                <div className="relative h-20 w-20 sm:h-28 sm:w-28 lg:h-32 lg:w-32 flex-shrink-0 overflow-hidden rounded-full border-2 border-emerald-400/80 p-0.5 shadow-2xl shadow-emerald-950/80 bg-neutral-900 backdrop-blur-md transition-transform duration-300 hover:scale-105">
                  <img
                    src={currentQuote.portrait_url}
                    alt={currentQuote.author_name}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full rounded-full object-cover object-top select-none pointer-events-none"
                  />
                </div>

                {/* Subtle Glowing Aura ring around portrait */}
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-emerald-500/25 blur-xl scale-125" />
              </div>

              {/* Typography Area - Rigid reserved height prevents vertical jumping */}
              <div className="flex-1 text-center sm:text-left min-w-0 flex flex-col justify-center">
                
                {/* Decorative Quotation Mark Icon */}
                <div className="hidden sm:inline-flex items-center mb-1 text-emerald-400/40">
                  <QuoteIcon className="h-5 w-5 lg:h-6 lg:w-6 rotate-180 fill-current" />
                </div>

                {/* Main Inspiring Quote */}
                <blockquote className="font-serif sm:font-sans text-sm sm:text-lg md:text-xl lg:text-2xl font-extrabold tracking-tight text-white leading-snug sm:leading-snug drop-shadow-md max-w-4xl line-clamp-3 sm:line-clamp-none">
                  "{currentQuote.quote_text}"
                </blockquote>

                {/* Author Attribution */}
                <div className="mt-1.5 sm:mt-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <cite className="font-sans text-xs sm:text-sm md:text-base font-bold text-emerald-300 not-italic tracking-wide">
                    — {currentQuote.author_name}
                  </cite>
                  <span className="hidden sm:inline text-neutral-400 text-xs">·</span>
                  <span className="text-[11px] sm:text-xs md:text-sm text-neutral-200 font-medium truncate max-w-2xl">
                    {currentQuote.author_title}
                  </span>
                </div>

              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Bottom Rail: Animated Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900/80 overflow-hidden z-30">
        <motion.div
          key={currentIndex + (isPaused ? '-paused' : '-active')}
          initial={{ width: '0%' }}
          animate={{ width: isPaused ? '0%' : '100%' }}
          transition={{
            duration: isPaused ? 0 : autoAdvanceInterval / 1000,
            ease: 'linear',
          }}
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-sm shadow-emerald-400/80"
        />
      </div>

    </aside>
  );
};
