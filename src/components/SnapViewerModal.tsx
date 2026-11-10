import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Eye, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Music, 
  Sparkles, 
  Users, 
  Lock, 
  ChevronUp, 
  Smile, 
  Flame,
  Volume2,
  VolumeX,
  Share2,
  MoreVertical,
  Trash2,
  Loader2
} from 'lucide-react';
import { CampusSnap, SnapViewerRecord } from '../types';
import { StorySticker } from '../types/stickers';
import { StickerOverlayContainer } from './stickers/StickerOverlayContainer';
import { useScreenSecurity } from '../hooks/useScreenSecurity';
import { LongPressAvatar } from './playercard/LongPressAvatar';
import { useAuth } from '../context/AuthContext';
import { deleteCampusSnapInSupabase, recordSnapView, fetchSnapViewers, emitAppToast } from '../services/supabase';
import { getFriendlyError } from '../utils/friendlyErrors';

interface SnapViewerModalProps {
  snap: CampusSnap | null;
  snapsList: CampusSnap[];
  onClose: () => void;
  onNextSnap: () => void;
  onPrevSnap: () => void;
  onOpenAuthorProfile?: (authorId: string, authorDetails?: any) => void;
  onDeleteSnap?: (snapId: string) => void;
}

export const SnapViewerModal = ({
  snap,
  snapsList,
  onClose,
  onNextSnap,
  onPrevSnap,
  onOpenAuthorProfile,
  onDeleteSnap,
}: SnapViewerModalProps) => {
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isViewersDrawerOpen, setIsViewersDrawerOpen] = useState(false);
  const [screenshotAttempted, setScreenshotAttempted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isAuthor = currentUser?.id && snap ? currentUser.id === snap.authorId : false;

  const handleDeleteSnapConfirmed = async () => {
    if (!snap) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteCampusSnapInSupabase(snap.id, snap.mediaUrl);
      onDeleteSnap?.(snap.id);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      console.error('[Delete Snap Error]:', err);
      setIsDeleting(false);
      const friendly = getFriendlyError(err, 'snap');
      setDeleteError(friendly);
      emitAppToast(friendly, 'error');
    }
  };

  // Seamless Swipe Gesture State
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  const onNextSnapRef = useRef(onNextSnap);
  const onPrevSnapRef = useRef(onPrevSnap);

  // Local state for interactive stickers on this snap
  const [activeStickers, setActiveStickers] = useState<StorySticker[]>([]);

  useEffect(() => {
    onNextSnapRef.current = onNextSnap;
    onPrevSnapRef.current = onPrevSnap;
  }, [onNextSnap, onPrevSnap]);

  // Screen capture & screenshot protection
  useScreenSecurity({
    enabled: Boolean(snap),
    onScreenshotTaken: () => {
      setScreenshotAttempted(true);
      setTimeout(() => setScreenshotAttempted(false), 3000);
    },
  });

  // Real snap views state
  const [realViewsCount, setRealViewsCount] = useState<number>(snap?.viewsCount || 0);
  const [realViewersList, setRealViewersList] = useState<SnapViewerRecord[]>(snap?.viewersList || []);

  useEffect(() => {
    if (!snap) return;

    let isMounted = true;
    setRealViewsCount(snap.viewsCount || 0);

    async function syncSnapViews() {
      if (!snap) return;
      // Record view if current user is viewing someone else's snap
      if (currentUser?.id && currentUser.id !== snap.authorId) {
        const count = await recordSnapView(snap.id, currentUser.id, snap.authorId);
        if (isMounted && count > 0) {
          setRealViewsCount(count);
        }
      }

      // Fetch latest views count and viewers list from snap_views
      const { count, viewers } = await fetchSnapViewers(snap.id);
      if (isMounted) {
        if (count > 0 || viewers.length > 0) {
          setRealViewsCount(count);
          setRealViewersList(viewers);
        } else {
          setRealViewersList(snap.viewersList || []);
        }
      }
    }

    syncSnapViews();
    return () => { isMounted = false; };
  }, [snap?.id, currentUser?.id]);

  // Initialize interactive stickers
  useEffect(() => {
    if (!snap) return;

    if (snap.stickers && snap.stickers.length > 0) {
      setActiveStickers(snap.stickers);
    } else {
      const demoStickers: StorySticker[] = [];

      if (snap.locationTag) {
        demoStickers.push({
          id: `loc_${snap.id}`,
          type: 'location',
          locationName: snap.locationTag,
          latitude: 8.4799,
          longitude: 4.5418,
          x: 0.5,
          y: 0.22,
          scale: 1,
          rotation: 0,
        });
      }

      if (snap.id.includes('snap_1') || snap.caption?.toLowerCase().includes('quiz') || snap.caption?.toLowerCase().includes('poll')) {
        demoStickers.push({
          id: `poll_${snap.id}`,
          type: 'poll',
          question: 'Are you attending today?',
          options: [
            { id: 'opt_1', text: 'Yes, definitely! 🔥', votes: 16 },
            { id: 'opt_2', text: 'Studying in library 📚', votes: 7 },
          ],
          x: 0.5,
          y: 0.55,
          scale: 1,
          rotation: 0,
        });
      }

      setActiveStickers(demoStickers);
    }
  }, [snap]);

  // Story auto-advancing timer (5000ms)
  useEffect(() => {
    if (!snap) return;
    setProgress(0);
    setLiked(false);
    setDragOffsetX(0);
    setIsViewersDrawerOpen(false);

    const duration = 5000;
    const intervalTime = 50;
    let accumulated = 0;

    const interval = setInterval(() => {
      if (isPaused || isSwiping || isViewersDrawerOpen) return;

      accumulated += intervalTime;
      const pct = Math.min(100, (accumulated / duration) * 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onNextSnapRef.current?.();
        }, 20);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [snap?.id, isPaused, isSwiping, isViewersDrawerOpen]);

  // Handle Touch / Pointer Drag Gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isViewersDrawerOpen) return;
    setIsSwiping(true);
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwiping || isViewersDrawerOpen) return;
    const deltaX = e.clientX - touchStartRef.current.x;
    setDragOffsetX(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSwiping || isViewersDrawerOpen) return;
    setIsSwiping(false);

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocityX = deltaX / Math.max(1, deltaTime);

    // Swipe up to view real-time viewer list
    if (deltaY < -60 && Math.abs(deltaX) < 40) {
      setIsViewersDrawerOpen(true);
      return;
    }

    const SWIPE_THRESHOLD = 75;
    const VELOCITY_THRESHOLD = 0.3;

    if (deltaX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
      setDragOffsetX(-320);
      setTimeout(() => {
        setDragOffsetX(0);
        onNextSnapRef.current?.();
      }, 180);
    } else if (deltaX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
      setDragOffsetX(320);
      setTimeout(() => {
        setDragOffsetX(0);
        onPrevSnapRef.current?.();
      }, 180);
    } else {
      if (Math.abs(deltaX) < 10 && deltaTime < 300) {
        const containerWidth = e.currentTarget.clientWidth || 360;
        const clickX = e.clientX - e.currentTarget.getBoundingClientRect().left;

        if (clickX < containerWidth * 0.3) {
          onPrevSnapRef.current?.();
        } else if (clickX > containerWidth * 0.7) {
          onNextSnapRef.current?.();
        }
      }
      setDragOffsetX(0);
    }
  };

  const handleVotePoll = (stickerId: string, optionId: string) => {
    setActiveStickers((prev) =>
      prev.map((s) => {
        if (s.id === stickerId && s.type === 'poll') {
          return {
            ...s,
            userVotedOptionId: optionId,
            options: s.options.map((opt) =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
          };
        }
        return s;
      })
    );
  };

  if (!snap) return null;

  const currentSnapIndex = snapsList.findIndex((s) => s.id === snap.id);
  const totalSnaps = snapsList.length;
  const isCloseFriends = snap.privacySetting === 'close_friends';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in select-none"
      onClick={onClose}
    >
      
      {/* Screenshot protection toast */}
      {screenshotAttempted && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60 rounded-full bg-rose-600/90 border border-rose-400 px-4 py-2 text-xs font-bold text-white shadow-2xl flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Screenshot blocked for user privacy & security</span>
        </div>
      )}

      {/* Main Story Container Frame (Instagram / WhatsApp Model) */}
      <div 
        className="relative flex flex-col w-full max-w-sm sm:max-w-md h-[92vh] sm:h-[88vh] rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl transition-transform"
        style={{
          transform: `translateX(${dragOffsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        
        {/* Progress Bar Segments */}
        <div className="absolute top-3 left-3 right-3 z-40 flex items-center gap-1.5">
          {snapsList.map((item, idx) => {
            let fillPct = 0;
            if (idx < currentSnapIndex) fillPct = 100;
            else if (idx === currentSnapIndex) fillPct = progress;

            return (
              <div key={item.id} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Header: Author Avatar, Name, Close Friends Badge & Actions */}
        <div className="absolute top-7 left-3 right-3 z-40 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2.5">
            <LongPressAvatar
              userId={snap.authorId}
              avatarUrl={snap.authorAvatar}
              name={snap.authorName}
              size="sm"
              showRingHint
              className={`rounded-full ${isCloseFriends ? 'ring-2 ring-emerald-400' : 'ring-1 ring-amber-400'}`}
              onClick={() => {
                onClose();
                onOpenAuthorProfile?.(snap.authorId);
              }}
            />

            <div 
              onClick={() => {
                onClose();
                onOpenAuthorProfile?.(snap.authorId);
              }}
              className="cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold leading-tight group-hover:text-amber-400 transition-colors">
                <span>{snap.authorName}</span>
                {isCloseFriends && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-neutral-950 font-bold text-[9px] uppercase tracking-wider">
                    Close Friends
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 font-mono">
                <span>{snap.authorDept}</span>
                <span>•</span>
                <span>24h Status</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isAuthor && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 backdrop-blur transition-all"
                  title="Options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-10 w-36 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl overflow-hidden z-60 animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete snap</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 backdrop-blur transition-all"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/70 text-white/90 backdrop-blur transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Music Track Overlay Pill (Instagram Music Model) */}
        {snap.musicTrack && (
          <div className="absolute top-18 left-3 z-40 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-white text-[10px] font-mono shadow-lg animate-in fade-in">
            <Music className="h-3 w-3 text-amber-400 animate-pulse" />
            <span className="truncate max-w-[180px]">{snap.musicTrack.artist} — {snap.musicTrack.title}</span>
            <div className="flex items-center gap-0.5 ml-1">
              <span className="h-2 w-0.5 bg-amber-400 animate-bounce" />
              <span className="h-3 w-0.5 bg-amber-400 animate-pulse" />
              <span className="h-1.5 w-0.5 bg-amber-400" />
            </div>
          </div>
        )}

        {/* Main Media Canvas (HD Photo or Video) */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {snap.mediaType === 'video' ? (
            <video
              src={snap.mediaUrl}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              className="h-full w-full object-cover pointer-events-none select-none"
            />
          ) : (
            <img
              src={snap.mediaUrl}
              alt={snap.caption}
              className="h-full w-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          )}

          {/* Interactive Stickers Overlay */}
          <StickerOverlayContainer
            stickers={activeStickers}
            onVotePoll={handleVotePoll}
            onStickerTouchStart={() => setIsPaused(true)}
            onStickerTouchEnd={() => setIsPaused(false)}
          />

          {/* Left/Right Navigation buttons for accessibility */}
          {currentSnapIndex > 0 && (
            <button
              type="button"
              onClick={onPrevSnap}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur transition-all"
              aria-label="Previous story"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentSnapIndex < totalSnaps - 1 && (
            <button
              type="button"
              onClick={onNextSnap}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur transition-all"
              aria-label="Next story"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Bottom Caption & Interactive Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/80 to-transparent space-y-2.5">
          {snap.caption && (
            <p className="text-xs text-white leading-relaxed font-medium drop-shadow-md">
              {snap.caption}
            </p>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-white/15 text-xs text-neutral-300">
            
            {/* Real-Time Viewer Count Trigger (Author Only) */}
            {currentUser?.id && currentUser.id === snap.authorId ? (
              <button
                type="button"
                onClick={() => setIsViewersDrawerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>{realViewsCount} {realViewsCount === 1 ? 'view' : 'views'}</span>
                <ChevronUp className="h-3 w-3 text-neutral-400" />
              </button>
            ) : (
              <div />
            )}

            {/* Like & Share Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                className={`p-2 rounded-full backdrop-blur transition-transform active:scale-90 ${
                  liked ? 'bg-rose-500/20 text-rose-500' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* REAL-TIME VIEWER LIST DRAWER (Author Only) */}
        {/* ====================================================== */}
        {isViewersDrawerOpen && currentUser?.id === snap.authorId && (
          <div 
            className="absolute inset-x-0 bottom-0 top-16 z-50 rounded-t-3xl bg-neutral-900/98 border-t border-neutral-700 p-5 flex flex-col space-y-4 animate-in slide-in-from-bottom-10 backdrop-blur-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Status Viewers ({realViewsCount})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsViewersDrawerOpen(false)}
                className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {realViewersList.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 font-mono">
                  No views yet.
                </div>
              ) : (
                realViewersList.map((viewer) => (
                  <div
                    key={viewer.id}
                    className="p-2.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={viewer.avatarUrl}
                        alt={viewer.name}
                        className="h-10 w-10 rounded-full object-cover border border-neutral-700"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{viewer.name}</h4>
                        <p className="text-[10px] text-neutral-400 font-mono">{viewer.dept}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[10px] text-neutral-500 font-mono">{viewer.viewedAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-neutral-800 text-center text-[10px] font-mono text-neutral-400">
              Only verified contacts can view your statuses based on your privacy filter.
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-70 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-full max-w-xs rounded-3xl bg-neutral-900 border border-neutral-700 p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
              <div className="text-center space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mb-2">
                  <Trash2 className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Delete Snap?</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  This status and its media will be permanently deleted and removed from your story ring.
                </p>
                {deleteError && (
                  <p className="text-[11px] text-rose-400 font-medium pt-1">{deleteError}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteSnapConfirmed}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SnapViewerModal;
