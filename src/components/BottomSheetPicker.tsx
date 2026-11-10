import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, X } from 'lucide-react';

export interface BottomSheetOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface BottomSheetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: (string | BottomSheetOption)[];
  selectedValue: string;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}

export const BottomSheetPicker: React.FC<BottomSheetPickerProps> = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  searchPlaceholder = 'Search...',
  emptyText = 'No results found',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search when sheet opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Normalize options
  const normalizedOptions: BottomSheetOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      opt.value.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Bottom Sheet Surface */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg rounded-t-3xl border-t border-x border-white/10 bg-[#14161B] shadow-2xl flex flex-col max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Small Drag Handle */}
            <div className="w-full pt-3 pb-2 flex justify-center cursor-pointer" onClick={onClose}>
              <div className="w-10 h-1 rounded-full bg-neutral-600/80 hover:bg-neutral-500 transition-colors" />
            </div>

            {/* Header: Title & Close */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close picker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Pinned Search Input */}
            <div className="p-3 border-b border-white/[0.06] bg-[#14161B] shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="w-full h-11 rounded-xl border border-white/[0.08] bg-neutral-900/90 pl-10 pr-9 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Single-line Rows (52px tall, subtle divider, orange check icon) */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = selectedValue === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSelect(opt.value);
                        onClose();
                      }}
                      className="w-full h-[52px] min-h-[52px] px-5 flex items-center justify-between text-left hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors group cursor-pointer"
                    >
                      <div className="min-w-0 pr-3">
                        <p className={`text-xs sm:text-sm truncate ${
                          isSelected ? 'font-bold text-white' : 'font-normal text-neutral-200 group-hover:text-white'
                        }`}>
                          {opt.label}
                        </p>
                        {opt.sublabel && (
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                            {opt.sublabel}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <div className="shrink-0 flex items-center justify-center">
                          <Check className="h-4 w-4 text-orange-500 stroke-[2.5]" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-neutral-400">
                  {emptyText}
                </div>
              )}
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
