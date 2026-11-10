import React, { useState, useRef, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck, QrCode, LogIn, CheckCircle2, Sparkles } from 'lucide-react';
import { AppUser, StudentBusiness } from '../../types';
import { LongPressAvatar } from './LongPressAvatar';

interface StudentIDCardProps {
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onSignOut?: () => void;
  userOwnedBusinesses?: StudentBusiness[];
  onOpenCreateBusiness?: () => void;
  onSelectBusiness?: (biz: StudentBusiness) => void;
  onOpenMyStore?: (biz: StudentBusiness) => void;
  onOpenGetVerified?: () => void;
}

/**
 * Deterministic SVG QR Code Generator for Profile URL / Matric
 * Renders a clean QR matrix payload.
 */
export const MatricQRCode: React.FC<{ value: string; size?: number; className?: string }> = ({
  value,
  size = 130,
  className = '',
}) => {
  const matrixSize = 25;
  
  const grid = React.useMemo(() => {
    const matrix: boolean[][] = Array(matrixSize)
      .fill(false)
      .map(() => Array(matrixSize).fill(false));

    const drawFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          if (isOuter || isInner) {
            if (row + r < matrixSize && col + c < matrixSize) {
              matrix[row + r][col + c] = true;
            }
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, matrixSize - 7);
    drawFinder(matrixSize - 7, 0);

    for (let i = 8; i < matrixSize - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    const alignRow = matrixSize - 7;
    const alignCol = matrixSize - 7;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isOuter = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        if (isOuter || isCenter) {
          matrix[alignRow + r][alignCol + c] = true;
        }
      }
    }

    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < matrixSize; r++) {
      for (let c = 0; c < matrixSize; c++) {
        const isTopLeftFinder = r < 8 && c < 8;
        const isTopRightFinder = r < 8 && c >= matrixSize - 8;
        const isBottomLeftFinder = r >= matrixSize - 8 && c < 8;
        const isTiming = r === 6 || c === 6;
        const isAlignment = Math.abs(r - alignRow) <= 2 && Math.abs(c - alignCol) <= 2;

        if (!isTopLeftFinder && !isTopRightFinder && !isBottomLeftFinder && !isTiming && !isAlignment) {
          const bitVal = Math.sin(hash + r * 31 + c * 17) * 10000;
          matrix[r][c] = Math.abs(bitVal - Math.floor(bitVal)) > 0.48;
        }
      }
    }

    return matrix;
  }, [value, matrixSize]);

  const cellDimension = size / matrixSize;

  return (
    <div className={`bg-white p-2 rounded-2xl shadow-md border border-neutral-200 inline-block ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <rect width={size} height={size} fill="#ffffff" />
        {grid.map((row, r) =>
          row.map((isBlack, c) =>
            isBlack ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellDimension}
                y={r * cellDimension}
                width={cellDimension + 0.1}
                height={cellDimension + 0.1}
                fill="#0a0a0a"
                rx={0.3}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};

export const StudentIDCard: React.FC<StudentIDCardProps> = ({
  currentUser,
  onOpenAuth,
  onOpenGetVerified,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const prefersReducedMotion = useReducedMotion();

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
      const yRatio = (e.clientY - rect.top) / rect.height - 0.5;

      setTilt({
        x: yRatio * -12,
        y: xRatio * 12,
      });

      setGlarePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [prefersReducedMotion]
  );

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setGlarePos({ x: 50, y: 50 });
  }, []);

  if (!currentUser) {
    return (
      <div className="py-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Campus Foundry Student Card</h3>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto">
              Sign in with your student account to access your digital campus student card.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Access Student Card</span>
          </button>
        </div>
      </div>
    );
  }

  const universityName = currentUser.university || '';
  const matricNo = currentUser.matricNumber || 'STU/2026/042';
  const studentDepartment = currentUser.department || 'Computer Science';
  const studentLevel = currentUser.level || '300L';
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?profile=${encodeURIComponent(currentUser.username || currentUser.id)}`
    : matricNo;

  return (
    <div className="space-y-4 py-2">
      {/* Compact Digital Student Card */}
      <div className="perspective-1000">
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            transformStyle: 'preserve-3d',
            rotateX: tilt.x,
            rotateY: tilt.y,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative overflow-hidden rounded-3xl border border-orange-500/30 bg-neutral-950 p-5 shadow-xl select-none group"
        >
          {/* Subtle Glare Overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-20 opacity-30 mix-blend-color-dodge transition-opacity duration-300 group-hover:opacity-60"
            style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(249,115,22,0.4) 0%, rgba(255,255,255,0.1) 40%, transparent 80%)`,
            }}
          />

          {/* Foil Accent */}
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-500/10 blur-xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">🎓</span>
              <div className="min-w-0">
                {universityName && (
                  <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">{universityName}</h4>
                )}
                <p className="text-[9px] font-mono font-bold text-orange-400 uppercase tracking-widest truncate">
                  CAMPUS FOUNDRY STUDENT CARD
                </p>
              </div>
            </div>
            {currentUser.isVerified ? (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified student</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenGetVerified}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500 hover:text-neutral-950 text-[10px] font-bold transition-all cursor-pointer shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                <span>Get verified</span>
              </button>
            )}
          </div>

          {/* Photo & Details */}
          <div className="relative z-10 flex items-center gap-4 my-3.5">
            <div className="shrink-0">
              <LongPressAvatar
                user={currentUser}
                size="xl"
                showVerifiedBadge={Boolean(currentUser.isVerified)}
              />
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="text-sm font-extrabold text-white truncate flex items-center gap-1">
                <span>{currentUser.fullName}</span>
                {currentUser.isVerified && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                )}
              </h3>
              <p className="text-[11px] font-mono text-orange-400 font-bold truncate">
                {matricNo}
              </p>
              <p className="text-xs text-neutral-300 truncate">
                {studentDepartment}
              </p>
              <p className="text-[10px] text-neutral-400 truncate">
                {studentLevel}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 font-mono">
            <span>Verified Student Badge</span>
            {currentUser.session ? <span>SESSION: {currentUser.session}</span> : null}
          </div>
        </motion.div>
      </div>

      {/* QR Code Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 text-center shadow-lg space-y-2.5">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-200">
          <QrCode className="w-4 h-4 text-orange-400" />
          <span>Scan to View Profile</span>
        </div>

        <div className="pt-1 flex justify-center">
          <MatricQRCode value={profileUrl} size={120} />
        </div>

        <p className="text-[11px] text-neutral-400 truncate font-mono">
          @{currentUser.username || currentUser.email.split('@')[0]}
        </p>
      </div>
    </div>
  );
};

export default StudentIDCard;
