import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, ChevronLeft, ChevronRight, MapPin, Eye, Heart, ShieldCheck } from 'lucide-react';
import { CampusSnap } from '../types';
import { StorySticker } from '../types/stickers';
import { StickerOverlayContainer } from './stickers/StickerOverlayContainer';
import { useScreenSecurity } from '../hooks/useScreenSecurity';

export interface StatusAuthor {
  userId?: string;
  username?: string;
  avatarUrl?: string;
  authorName?: string;
  authorLevel?: string;
}

export interface OfflineAwareStatusContainerProps {
  statusItems?: CampusSnap[];
  statuses?: any[];
  currentAuthor?: StatusAuthor;
  initialIndex?: number;
  onClose?: () => void;
  onStatusChange?: (index: number) => void;
}

export const OfflineAwareStatusContainer: React.FC<OfflineAwareStatusContainerProps> = ({
  statusItems,
  statuses,
  currentAuthor,
  initialIndex = 0,
  onClose,
  onStatusChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [screenshotBlocked, setScreenshotBlocked] = useState(false);

  // Horizontal Swipe Gesture State
  const [dragOffsetX, setDragOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });

  // Normalize statuses input
  const normalizedList = (statusItems && statusItems.length > 0)
    ? statusItems
    : (statuses && statuses.length > 0)
    ? statuses.map((s, idx) => ({
        id: s.id || `status_${idx}`,
        authorId: currentAuthor?.userId || 'user_1',
        authorName: currentAuthor?.username || currentAuthor?.authorName || 'Campus Student',
        authorAvatar: currentAuthor?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        authorDept: 'Computer Science',
        authorLevel: currentAuthor?.authorLevel || '300L',
        locationTag: s.locationTag || 'UNILORIN Senate Building',
        mediaUrl: s.mediaUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
        caption: s.caption || 'Campus moments captured in real time ✨',
        createdAt: new Date().toISOString(),
        expiresInHours: 24,
        viewsCount: s.viewsCount || 0,
      }))
    : [];

  const currentStatus = normalizedList[currentIndex];

  // Monitor Online/Offline Network Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Screen Capture Defense
  useScreenSecurity({
    enabled: Boolean(currentStatus),
    onScreenshotTaken: () => {
      setScreenshotBlocked(true);
      setTimeout(() => setScreenshotBlocked(false), 3000);
    },
  });

  // Story Auto-Advance Progress Timer (5000ms)
  useEffect(() => {
    if (!currentStatus) return;
    setProgress(0);
    setLiked(false);
    setDragOffsetX(0);

    const duration = 5000;
    const intervalTime = 50;
    let accumulated = 0;

    const interval = setInterval(() => {
      if (isPaused || isSwiping) return;

      accumulated += intervalTime;
      const pct = Math.min(100, (accumulated / duration) * 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        handleNextStatus();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, isSwiping]);

  const handleNextStatus = () => {
    if (currentIndex < normalizedList.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onStatusChange?.(nextIdx);
    } else if (onClose) {
      onClose();
    }
  };

  const handlePrevStatus = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      onStatusChange?.(prevIdx);
    }
  };

  // Horizontal Swipe Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsSwiping(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSwiping) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    setDragOffsetX(deltaX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSwiping) return;
    setIsSwiping(false);

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaTime = Date.now() - dragStartRef.current.time;
    const velocityX = deltaX / Math.max(1, deltaTime);

    const SWIPE_THRESHOLD = 70; // px
    const VELOCITY_THRESHOLD = 0.28; // px/ms

    if (deltaX < -SWIPE_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
      // Swipe Left -> Next Status
      if (currentIndex < normalizedList.length - 1) {
        setDragOffsetX(-320);
        setTimeout(() => {
          setDragOffsetX(0);
          handleNextStatus();
        }, 160);
      } else {
        setDragOffsetX(0);
      }
    } else if (deltaX > SWIPE_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
      // Swipe Right -> Prev Status
      if (currentIndex > 0) {
        setDragOffsetX(320);
        setTimeout(() => {
          setDragOffsetX(0);
          handlePrevStatus();
        }, 160);
      } else {
        setDragOffsetX(0);
      }
    } else {
      // Tap vs Drag Handling
      if (Math.abs(deltaX) < 10 && deltaTime < 300) {
        const containerWidth = e.currentTarget.clientWidth || 360;
        const clickX = e.clientX - e.currentTarget.getBoundingClientRect().left;

        if (clickX < containerWidth * 0.3) {
          handlePrevStatus();
        } else if (clickX > containerWidth * 0.7) {
          handleNextStatus();
        }
      }
      setDragOffsetX(0);
    }
  };

  if (!currentStatus) return null;

  // Sample Interactive Stickers
  const demoStickers: StorySticker[] = (currentStatus as any).stickers || [
    {
      id: `loc_${currentStatus.id}`,
      type: 'location',
      locationName: currentStatus.locationTag || 'Campus Center',
      latitude: 8.4799,
      longitude: 4.5418,
      x: 0.5,
      y: 0.28,
      scale: 1,
      rotation: 0,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 select-none">
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragOffsetX}px) scale(${1 - Math.min(0.08, Math.abs(dragOffsetX) / 3000)}) rotate(${dragOffsetX / 40}deg)`,
          transition: isSwiping ? 'none' : 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative flex flex-col h-full max-h-[88vh] w-full max-w-sm rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl cursor-grab active:cursor-grabbing touch-none"
      >
        {/* Offline Status Badge */}
        {!isOnline && (
          <div className="absolute top-10 left-3 right-3 z-50 bg-amber-600/90 text-neutral-950 text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg backdrop-blur">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline Mode • Playing Cached Encrypted Media</span>
          </div>
        )}

        {/* Screenshot Protection Toast */}
        {screenshotBlocked && (
          <div className="absolute top-14 left-4 right-4 z-50 bg-rose-600/90 backdrop-blur text-white text-xs font-bold py-2 px-3 rounded-2xl shadow-xl text-center border border-rose-400 animate-bounce">
            📸 Screenshot attempt blocked & logged to author
          </div>
        )}

        {/* Stack Progress Segment Bars */}
        <div className="absolute top-3 left-3 right-3 z-40 flex items-center gap-1.5">
          {normalizedList.map((item, idx) => {
            let barPct = 0;
            if (idx < currentIndex) barPct = 100;
            else if (idx === currentIndex) barPct = progress;

            return (
              <div key={item.id || idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75 ease-linear rounded-full"
                  style={{ width: `${barPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Bar with Author Info */}
        <div className="absolute top-6 left-3 right-3 z-40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={currentStatus.authorAvatar}
              alt={currentStatus.authorName}
              className="h-9 w-9 rounded-full object-cover border-2 border-emerald-400"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white drop-shadow">
                  {currentStatus.authorName}
                </span>
                <span className="text-[10px] text-neutral-300 font-mono drop-shadow">
                  • {currentStatus.authorLevel}
                </span>
                <span className="flex items-center gap-0.5 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  E2EE
                </span>
              </div>
              {currentStatus.locationTag && (
                <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold drop-shadow">
                  <MapPin className="h-3 w-3" />
                  <span>{currentStatus.locationTag}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-400 animate-pulse" />
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Media Frame */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          <img
            src={currentStatus.mediaUrl}
            alt={currentStatus.caption}
            className="h-full w-full object-cover pointer-events-none select-none"
            draggable={false}
          />

          {/* Interactive Sticker Overlay */}
          <StickerOverlayContainer
            stickers={demoStickers}
            onVotePoll={() => {}}
            onStickerTouchStart={() => setIsPaused(true)}
            onStickerTouchEnd={() => setIsPaused(false)}
          />

          {/* Side Chevron Buttons */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevStatus}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur transition-all"
              aria-label="Previous status"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {currentIndex < normalizedList.length - 1 && (
            <button
              type="button"
              onClick={handleNextStatus}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white backdrop-blur transition-all"
              aria-label="Next status"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Caption & Stats */}
        <div className="absolute bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/80 to-transparent space-y-2">
          {currentStatus.caption && (
            <p className="text-xs text-white leading-relaxed font-medium drop-shadow-md">
              {currentStatus.caption}
            </p>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs text-neutral-300">
            {currentAuthor?.userId && currentAuthor.userId === currentStatus.authorId ? (
              <span className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                <Eye className="h-3.5 w-3.5" />
                <span>{currentStatus.viewsCount} {currentStatus.viewsCount === 1 ? 'view' : 'views'}</span>
              </span>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors ${
                liked ? 'text-rose-500' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
              <span>{liked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OfflineAwareStatusContainer;
