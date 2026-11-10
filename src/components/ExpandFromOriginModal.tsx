import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  MapPin, 
  Building2, 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  Store, 
  CheckCircle2,
  Zap,
  ShoppingBag
} from 'lucide-react';

interface TriggerRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: string;
}

interface ExpandFromOriginModalProps {
  onOpenCreateBusiness?: () => void;
  onExploreHostels?: () => void;
}

export const ExpandFromOriginModal: React.FC<ExpandFromOriginModalProps> = ({
  onOpenCreateBusiness,
  onExploreHostels,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState<TriggerRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const style = window.getComputedStyle(buttonRef.current);
      setTriggerRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: style.borderRadius || '16px',
      });
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    // Re-measure trigger button in case viewport resized or scrolled
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const style = window.getComputedStyle(buttonRef.current);
      setTriggerRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: style.borderRadius || '16px',
      });
    }
    setIsOpen(false);
  };

  // Calculate dynamic transform origin offsets from button's exact center to modal center
  const getInitialTransform = () => {
    if (!triggerRect) {
      return { x: 0, y: 0, scaleX: 0.2, scaleY: 0.2, opacity: 0 };
    }

    const modalWidth = Math.min(window.innerWidth * 0.92, 560);
    const modalHeight = Math.min(window.innerHeight * 0.85, 620);

    const modalCenterLeft = window.innerWidth / 2;
    const modalCenterTop = window.innerHeight / 2;

    const btnCenterLeft = triggerRect.left + triggerRect.width / 2;
    const btnCenterTop = triggerRect.top + triggerRect.height / 2;

    const deltaX = btnCenterLeft - modalCenterLeft;
    const deltaY = btnCenterTop - modalCenterTop;

    const scaleX = triggerRect.width / modalWidth;
    const scaleY = triggerRect.height / modalHeight;

    return {
      x: deltaX,
      y: deltaY,
      scaleX: Math.max(0.1, scaleX),
      scaleY: Math.max(0.1, scaleY),
      borderRadius: triggerRect.borderRadius,
      opacity: 0.9,
    };
  };

  return (
    <>
      {/* ====================================================================== */}
      {/* 1. COLLAPSED STATE (Interactive Action Button with Clear Affordance)     */}
      {/* ====================================================================== */}
      <motion.button
        ref={buttonRef}
        onClick={handleOpen}
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="group relative inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-3 text-xs sm:text-sm font-bold text-neutral-950 shadow-xl shadow-emerald-950/50 hover:shadow-emerald-500/25 border border-emerald-400/40 transition-all cursor-pointer select-none"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-neutral-950/20 text-neutral-950">
          <Zap className="h-3.5 w-3.5 fill-current" />
        </span>
        <span className="tracking-tight">Launch App Panel (Fluid Expand-from-Origin)</span>
        <span className="flex h-2 w-2 rounded-full bg-neutral-950 animate-ping ml-1" />
      </motion.button>

      {/* ====================================================================== */}
      {/* 2. EXPANDED STATE (Full Overlay Container with Dynamic Origin Transform)*/}
      {/* ====================================================================== */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={handleClose}
              className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
            />

            {/* Expanding Modal Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={getInitialTransform()}
              animate={{
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                borderRadius: '28px',
                opacity: 1,
              }}
              exit={getInitialTransform()}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 32,
                mass: 0.8,
              }}
              className="relative w-full max-w-[560px] max-h-[85vh] overflow-y-auto rounded-[28px] border border-emerald-500/40 bg-neutral-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 flex flex-col justify-between"
              style={{ transformOrigin: "center center" }}
            >
              {/* Inner Staggered Content */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.1, duration: 0.25 }}
                className="space-y-6"
              >
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-neutral-950 font-black shadow-md shadow-emerald-950/40">
                      <Zap className="h-6 w-6 fill-current" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          App Launch Transition
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Dynamic getBoundingClientRect()
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                        Fluid Origin Expansion Panel
                      </h3>
                    </div>
                  </div>

                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleClose}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Explanation Card */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 space-y-2">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Exact Dynamic Screen Coordinate Origin</span>
                  </span>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    This panel calculated the button's exact bounding box (top: {triggerRect ? Math.round(triggerRect.top) : 0}px, left: {triggerRect ? Math.round(triggerRect.left) : 0}px, {triggerRect ? Math.round(triggerRect.width) : 0}×{triggerRect ? Math.round(triggerRect.height) : 0}px) and smoothly scaled outward using spring physics, matching native iOS and Android application launch animations.
                  </p>
                </div>

                {/* Unlocked Actions Inside Panel */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                    Quick UNILORIN Actions:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        if (onExploreHostels) onExploreHostels();
                      }}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-left hover:border-emerald-500/50 hover:bg-neutral-900 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-emerald-400 mb-1">
                        <Building2 className="h-4 w-4" />
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
                        Hostels & Faculties
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Multi-step progressive drill-down navigation
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        if (onOpenCreateBusiness) onOpenCreateBusiness();
                      }}
                      className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-left hover:border-amber-500/50 hover:bg-neutral-900 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-amber-400 mb-1">
                        <Store className="h-4 w-4" />
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300">
                        List Student Trade
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Register your store in dorms or Tanke
                      </p>
                    </button>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Press ESC or click outside to reverse
                  </span>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Close Panel (Reverses to Button)
                  </button>
                </div>

              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
