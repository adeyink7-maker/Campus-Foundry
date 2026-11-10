import { useState } from 'react';
import { Plus, MapPin, Eye, Sparkles } from 'lucide-react';
import { CampusSnap } from '../types';
import { useAuth } from '../context/AuthContext';

interface CampusSnapsBarProps {
  snaps: CampusSnap[];
  onSelectSnap: (snap: CampusSnap) => void;
  onOpenCreateSnap: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const CampusSnapsBar = ({
  snaps,
  onSelectSnap,
  onOpenCreateSnap,
  isLoading = false,
  error = null,
  onRetry,
}: CampusSnapsBarProps) => {
  const { currentUser } = useAuth();

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>UNILORIN Campus Snaps (24h)</span>
          </span>
          <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[9px] font-mono font-bold">
            Live Stories
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCreateSnap}
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Snap</span>
        </button>
      </div>

      {/* Horizontal Scroll Stories Bar */}
      <div className="flex items-center gap-3.5 overflow-x-auto pb-1 scrollbar-none">
        
        {/* Your Story Button */}
        <button
          type="button"
          onClick={onOpenCreateSnap}
          className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
        >
          <div className="relative flex h-15 w-15 items-center justify-center rounded-2xl bg-neutral-800 border-2 border-dashed border-emerald-500/60 group-hover:border-emerald-400 group-hover:bg-neutral-700/80 transition-all p-0.5 shadow-md">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-neutral-900 text-emerald-400 group-hover:scale-105 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-neutral-950 text-[10px] font-bold">
              +
            </span>
          </div>
          <span className="text-[11px] font-medium text-neutral-300 max-w-[64px] truncate text-center">
            Your Snap
          </span>
        </button>

        {/* List of active snaps */}
        {isLoading && snaps.length === 0 ? (
          /* Loading Skeletons */
          [1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 animate-pulse">
              <div className="h-15 w-15 rounded-2xl bg-neutral-800" />
              <div className="h-2 w-10 rounded bg-neutral-800" />
            </div>
          ))
        ) : error && snaps.length === 0 ? (
          <button
            onClick={onRetry}
            className="flex items-center text-[10px] text-rose-400 font-bold px-3 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20"
          >
            Retry Snaps
          </button>
        ) : snaps.length === 0 ? (
          <div className="flex items-center text-xs text-neutral-500 italic px-3">
            Nothing here yet
          </div>
        ) : (
          snaps.map((snap) => (
            <button
              key={snap.id}
              type="button"
              onClick={() => onSelectSnap(snap)}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
            >
              <div className={`relative flex h-15 w-15 items-center justify-center rounded-2xl p-[2px] group-hover:scale-105 transition-transform shadow-md ${
                snap.hasSeen
                  ? 'bg-neutral-800'
                  : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-emerald-500'
              }`}>
                <img
                  src={snap.mediaUrl}
                  alt={snap.caption}
                  className="h-full w-full rounded-xl object-cover border border-neutral-950"
                  loading="lazy"
                />
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-amber-400">
                  <MapPin className="h-2.5 w-2.5" />
                </div>
              </div>

              <div className="text-center max-w-[70px]">
                <span className="text-[11px] font-bold text-white truncate block group-hover:text-emerald-400 transition-colors">
                  {snap.authorName.split(' ')[0]}
                </span>
                <span className="text-[9px] text-neutral-400 truncate block font-mono">
                  {snap.locationTag.split(' ')[0]}
                </span>
              </div>
            </button>
          ))
        )}

      </div>
    </div>
  );
};
