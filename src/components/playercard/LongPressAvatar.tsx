import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppUser } from '../../types';
import { usePlayerCard } from '../../context/PlayerCardContext';

export interface LongPressAvatarProps {
  user?: Partial<AppUser> & { id?: string; fullName?: string; avatarUrl?: string; hasUnseenSnap?: boolean };
  userId?: string;
  name?: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showRingHint?: boolean;
  className?: string;
  avatarClassName?: string;
  showVerifiedBadge?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  disableLongPress?: boolean;
  children?: React.ReactNode;
  alt?: string;
}

const SIZE_MAP = {
  xs: { wrapper: 'h-7 w-7', svgSize: 34, stroke: 2.5, radius: 14 },
  sm: { wrapper: 'h-9 w-9', svgSize: 42, stroke: 2.5, radius: 18 },
  md: { wrapper: 'h-11 w-11', svgSize: 52, stroke: 3, radius: 22 },
  lg: { wrapper: 'h-14 w-14', svgSize: 64, stroke: 3, radius: 28 },
  xl: { wrapper: 'h-20 w-20', svgSize: 90, stroke: 3.5, radius: 40 },
  '2xl': { wrapper: 'h-28 w-28 md:h-36 md:w-36', svgSize: 154, stroke: 4, radius: 70 },
};

const HOLD_DURATION_MS = 450;
const MOVE_THRESHOLD_PX = 10;

export const LongPressAvatar: React.FC<LongPressAvatarProps> = ({
  user,
  userId,
  name,
  avatarUrl,
  size = 'md',
  showRingHint = false,
  className = '',
  avatarClassName = '',
  showVerifiedBadge = true,
  onClick,
  disableLongPress = false,
  children,
  alt,
}) => {
  const { openPlayerCard, handlePrefetch } = usePlayerCard();
  const avatarRef = useRef<HTMLDivElement>(null);

  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0); // 0 to 100

  const timerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasTriggeredRef = useRef(false);

  const effectiveId = user?.id || userId || 'usr_unknown';
  const effectiveName = user?.fullName || name || 'Campus Student';
  const effectiveAvatar = user?.avatarUrl || avatarUrl;

  const normalizedUser: AppUser = {
    id: effectiveId,
    email: user?.email || `${user?.username || 'student'}@campus.edu`,
    fullName: effectiveName,
    username: user?.username || `@${effectiveName.toLowerCase().replace(/\s+/g, '_')}`,
    role: user?.role || 'student',
    accountType: user?.accountType || 'BUYER',
    avatarUrl: effectiveAvatar,
    university: user?.university || user?.campus || 'Campus University',
    faculty: user?.faculty || 'Communication & Information Sciences',
    department: user?.department || 'Computer Science',
    level: user?.level || '300L',
    matricNumber: user?.matricNumber,
    hostelLocation: user?.hostelLocation || 'Lagos Hostel',
    whatsapp: user?.whatsapp,
    isVerified: user?.isVerified ?? true,
    postsCount: user?.postsCount || 18,
    followersCount: user?.followersCount || 142,
    followingCount: user?.followingCount || 88,
  };

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPressing(false);
    setPressProgress(0);
  }, []);

  const triggerReveal = useCallback(() => {
    hasTriggeredRef.current = true;
    cancelPress();

    // Subtle tactile haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 40, 25]);
      } catch {}
    }

    const rect = avatarRef.current?.getBoundingClientRect();
    openPlayerCard(normalizedUser, rect);
  }, [cancelPress, openPlayerCard, normalizedUser]);

  const updateProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
    setPressProgress(progress);

    if (progress < 100) {
      animFrameRef.current = window.requestAnimationFrame(updateProgress);
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disableLongPress || e.button !== 0) return; // Only primary button/touch

    hasTriggeredRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    startTimeRef.current = Date.now();
    setIsPressing(true);
    setPressProgress(0);

    // Prefetch card data immediately in background
    handlePrefetch(normalizedUser);

    // Start animated progress
    animFrameRef.current = window.requestAnimationFrame(updateProgress);

    // Trigger timer
    timerRef.current = window.setTimeout(() => {
      triggerReveal();
    }, HOLD_DURATION_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPressing) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);

    if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
      cancelPress();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPressing) {
      cancelPress();
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // If long press was triggered, suppress the standard click
    if (hasTriggeredRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const rect = avatarRef.current?.getBoundingClientRect();
      openPlayerCard(normalizedUser, rect);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (animFrameRef.current) window.cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const sizeCfg = SIZE_MAP[size] || SIZE_MAP.md;
  const circumference = 2 * Math.PI * sizeCfg.radius;
  const strokeDashoffset = circumference - (pressProgress / 100) * circumference;

  return (
    <div
      ref={avatarRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelPress}
      onPointerLeave={cancelPress}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={(e) => {
        // Suppress browser long-press context menu on mobile/desktop
        e.preventDefault();
      }}
      tabIndex={0}
      role="button"
      aria-label={`${normalizedUser.fullName}'s profile. Press and hold to reveal World Cup Player Card.`}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none touch-none outline-none group/avatar transition-transform active:scale-95 ${className}`}
      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
    >
      {/* Dynamic Animated Circular Progress Ring */}
      {isPressing && (
        <svg
          className="absolute inset-0 -m-1 pointer-events-none z-20 animate-in fade-in zoom-in-75 duration-150"
          width="100%"
          height="100%"
          viewBox={`0 0 ${sizeCfg.svgSize} ${sizeCfg.svgSize}`}
          style={{
            transform: 'rotate(-90deg)',
            width: `calc(100% + 8px)`,
            height: `calc(100% + 8px)`,
            left: '-4px',
            top: '-4px',
          }}
        >
          {/* Background track */}
          <circle
            cx={sizeCfg.svgSize / 2}
            cy={sizeCfg.svgSize / 2}
            r={sizeCfg.radius}
            fill="none"
            stroke="rgba(245, 158, 11, 0.25)"
            strokeWidth={sizeCfg.stroke}
          />
          {/* Glowing active stroke */}
          <circle
            cx={sizeCfg.svgSize / 2}
            cy={sizeCfg.svgSize / 2}
            r={sizeCfg.radius}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={sizeCfg.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
          />
        </svg>
      )}

      {/* Avatar Image / Fallback Initials */}
      <div className={`relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-700/80 group-hover/avatar:border-amber-400/90 transition-all ${sizeCfg.wrapper} ${avatarClassName}`}>
        {normalizedUser.avatarUrl ? (
          <img
            src={normalizedUser.avatarUrl}
            alt={alt || normalizedUser.fullName}
            draggable={false}
            className="h-full w-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 font-black text-neutral-950 font-mono text-sm">
            {normalizedUser.fullName?.charAt(0) || 'U'}
          </div>
        )}
      </div>

      {/* Verification Badge */}
      {showVerifiedBadge && normalizedUser.isVerified && (
        <div
          className="absolute -bottom-1 -right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-neutral-950 shadow-md ring-2 ring-neutral-950"
          title="Verified Student"
        >
          <ShieldCheck className="h-2.5 w-2.5" />
        </div>
      )}

      {/* Snap Ring */}
      {showRingHint && (
        <div 
          className={`absolute -inset-1 rounded-full border-2 transition-colors ${
            user?.hasUnseenSnap 
              ? 'border-amber-400' 
              : 'border-neutral-700'
          }`} 
        />
      )}

      {children}
    </div>
  );
};

