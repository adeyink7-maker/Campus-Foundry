import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  X, 
  Trophy, 
  Award, 
  Flame, 
  Users, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Share2, 
  UserPlus, 
  UserCheck, 
  MessageCircle, 
  ChevronRight, 
  ChevronDown, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Code2, 
  FileText,
  Edit3,
  Calendar,
  Star,
  CheckCircle2
} from 'lucide-react';
import { AppUser } from '../../types';
import { Achievement, PlayerCardData, PlayerCardSettings } from '../../types/playercard';
import { usePlayerCard } from '../../context/PlayerCardContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { getPlayerCardData } from '../../services/playerCardService';

interface PlayerCardOverlayProps {
  onOpenProfile?: (userId: string, userDetails?: any) => void;
}

export const PlayerCardOverlay: React.FC<PlayerCardOverlayProps> = ({ onOpenProfile }) => {
  const { isCardOpen, activeUser, closePlayerCard, openEditor, originRect } = usePlayerCard();
  const { currentUser, toggleFollowUser } = useAuth();
  const { openChatWithBusiness, openChatDrawer } = useChat();
  const prefersReducedMotion = useReducedMotion();

  const [cardData, setCardData] = useState<PlayerCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [activeTab, setActiveTab] = useState<'achievements' | 'portfolio' | 'stats'>('achievements');
  const [copiedShare, setCopiedShare] = useState(false);

  // 3D Parallax Tilt State
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const isOwner = Boolean(currentUser && activeUser && currentUser.id === activeUser.id);
  const isFollowing = Boolean(activeUser && currentUser?.followingUserIds?.includes(activeUser.id));

  // Load Card Data when modal opens
  useEffect(() => {
    if (!isCardOpen || !activeUser) return;

    let isMounted = true;
    setIsLoading(true);

    getPlayerCardData(activeUser)
      .then((data) => {
        if (isMounted) {
          setCardData(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[PlayerCard] Data load warning:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isCardOpen, activeUser]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isCardOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePlayerCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCardOpen, closePlayerCard]);

  // Pointer Parallax Move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (prefersReducedMotion || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: xRatio * 18, // max 18 deg
      y: -yRatio * 18,
    });
  }, [prefersReducedMotion]);

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  const handleFollowToggle = () => {
    if (!activeUser) return;
    toggleFollowUser(activeUser.id);
  };

  const handleSendMessage = () => {
    if (!activeUser) return;
    closePlayerCard();
    openChatDrawer();
  };

  const handleViewFullProfile = () => {
    if (!activeUser) return;
    closePlayerCard();
    onOpenProfile?.(activeUser.id, activeUser);
  };

  const handleShareCard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    }
  };

  const accentColor = cardData?.settings.accentColor || '#f59e0b';
  const jerseyNumber = cardData?.settings.jerseyNumber || 10;
  const tagline = cardData?.settings.tagline || `${activeUser?.department || 'Student'} • ${activeUser?.faculty || activeUser?.university || 'Campus'}`;

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'academic': return <GraduationCap className="h-4 w-4" />;
      case 'sports': return <Flame className="h-4 w-4" />;
      case 'leadership': return <Users className="h-4 w-4" />;
      case 'award': return <Trophy className="h-4 w-4" />;
      case 'project': return <Briefcase className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  if (!isCardOpen || !activeUser) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`${activeUser.fullName}'s World Cup Player Card`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-2xl overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) closePlayerCard();
        }}
      >
        {/* Dynamic Global Spotlights & Glow */}
        <div 
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] sm:w-[800px] rounded-full blur-[140px] opacity-40 transition-colors duration-700"
          style={{ backgroundColor: accentColor }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)]" />

        {/* Floating Broadcast Dust / Light Streaks */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-1/4 left-1/6 w-72 h-1 bg-gradient-to-r from-transparent via-white/40 to-transparent rotate-45 transform blur-sm animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-1 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent -rotate-12 transform blur-sm animate-pulse delay-700" />
        </div>

        {/* Top Control Bar */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                closePlayerCard();
                openEditor(activeUser);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-white border border-neutral-700/80 text-xs font-bold transition-all shadow-lg active:scale-95"
            >
              <Edit3 className="h-3.5 w-3.5 text-amber-400" />
              <span>Edit Card</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleShareCard}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 transition-all shadow-lg active:scale-95"
            title="Share Player Card"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={closePlayerCard}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-neutral-900/90 hover:bg-red-500/20 text-neutral-400 hover:text-white border border-neutral-700/80 transition-all shadow-lg active:scale-95"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Share Copied Toast */}
        {copiedShare && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-neutral-900/95 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Player Card link copied to clipboard!</span>
          </motion.div>
        )}

        {/* Main Card Stage Modal Container */}
        <motion.div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          initial={{ scale: 0.85, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-5xl rounded-[32px] sm:rounded-[40px] border border-neutral-800/80 bg-neutral-950/90 shadow-[0_25px_70px_rgba(0,0,0,0.9)] overflow-hidden my-auto"
          style={{
            perspective: 1200,
          }}
        >
          {/* Glowing Top Championship Border Accent */}
          <div 
            className="h-1.5 w-full transition-colors duration-500"
            style={{ 
              background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)` 
            }}
          />

          {/* Grid Layout: Desktop Left (Hero Stage) + Right (Achievements & Stats) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px] sm:min-h-[640px]">
            
            {/* ============================================================= */}
            {/* LEFT / CENTER: WORLD CUP PLAYER STAGE & LOWER THIRD           */}
            {/* ============================================================= */}
            <div className="lg:col-span-6 relative flex flex-col items-center justify-between p-6 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r border-neutral-800/80 overflow-hidden bg-gradient-to-b from-neutral-900/40 via-neutral-950 to-black">
              
              {/* Broadcast Header Badge */}
              <div className="w-full flex items-center justify-between mb-4 z-10">
                <div className="flex items-center gap-2">
                  <div 
                    className="flex h-7 w-7 items-center justify-center rounded-lg shadow-md font-black text-neutral-950 text-xs font-mono"
                    style={{ backgroundColor: accentColor }}
                  >
                    #{jerseyNumber}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-extrabold block">
                      CAMPUS FOUNDRY PLAYER CARD
                    </span>
                    <span className="text-xs text-white font-bold flex items-center gap-1.5">
                      {activeUser.university || activeUser.campus || 'Campus University'}
                      {activeUser.isVerified && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 inline" />
                      )}
                    </span>
                  </div>
                </div>

                <div 
                  className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-sm"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    color: accentColor,
                    borderColor: `${accentColor}40`,
                  }}
                >
                  {activeUser.level || '300L'} • {activeUser.role === 'trader' ? 'CAMPUS TRADER' : 'SCHOLAR'}
                </div>
              </div>

              {/* 3D Cutout Stage & Hero Photo / Short Video */}
              <div className="relative my-auto flex items-center justify-center py-4 w-full">
                
                {/* Spotlight Cone Background */}
                <div 
                  className="absolute inset-0 m-auto h-72 w-72 sm:h-84 sm:w-84 rounded-full blur-3xl opacity-30 transition-all duration-700"
                  style={{ backgroundColor: accentColor }}
                />

                {/* Concentric Stadium Rings */}
                <div className="absolute inset-0 m-auto h-64 w-64 rounded-full border border-neutral-800/60 pointer-events-none" />
                <div className="absolute inset-0 m-auto h-80 w-80 rounded-full border border-dashed border-neutral-800/40 pointer-events-none animate-[spin_60s_linear_infinite]" />

                {/* 3D Tilting Hero Container */}
                <motion.div
                  animate={{
                    rotateY: tilt.x,
                    rotateX: tilt.y,
                  }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  className="relative z-10 select-none cursor-grab active:cursor-grabbing"
                >
                  {/* Floating Motion Wrapper */}
                  <motion.div
                    animate={prefersReducedMotion ? {} : { y: [-6, 6, -6] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                    className="relative"
                  >
                    {/* Glowing Rim Light Effect */}
                    <div 
                      className="absolute -inset-2 rounded-3xl blur-md opacity-40 transition-colors duration-500"
                      style={{ backgroundColor: accentColor }}
                    />

                    {/* Cutout Hero Frame */}
                    <div className="relative h-60 w-60 sm:h-72 sm:w-72 rounded-3xl overflow-hidden bg-neutral-900 border-2 border-neutral-700/80 shadow-2xl">
                      {cardData?.settings.heroVideoUrl ? (
                        <video
                          src={cardData.settings.heroVideoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : activeUser.avatarUrl ? (
                        <img
                          src={activeUser.avatarUrl}
                          alt={activeUser.fullName}
                          className="h-full w-full object-cover object-top select-none pointer-events-none"
                        />
                      ) : (
                        <div 
                          className="h-full w-full flex items-center justify-center font-black text-6xl text-neutral-950 font-mono"
                          style={{ backgroundColor: accentColor }}
                        >
                          {activeUser.fullName.charAt(0)}
                        </div>
                      )}

                      {/* Lower Gradient Shadow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Lower-Third Sports TV Graphic Banner */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                className="w-full z-20 mt-4"
              >
                <div 
                  className="relative rounded-2xl p-4 sm:p-5 border backdrop-blur-xl shadow-2xl overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(15, 15, 15, 0.85)',
                    borderColor: `${accentColor}40`,
                  }}
                >
                  {/* TV Left Strip */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-2"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div className="pl-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight uppercase truncate flex items-center gap-1.5">
                        <span>{activeUser.fullName}</span>
                        {activeUser.isVerified && (
                          <span title="Verified Student">
                            <CheckCircle2 className="h-5 w-5 text-sky-400 fill-sky-400/20 shrink-0 inline" />
                          </span>
                        )}
                      </h2>
                      <span className="text-xs font-mono font-bold text-neutral-400">
                        {activeUser.username ? (activeUser.username.startsWith('@') ? activeUser.username : `@${activeUser.username}`) : '@student'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-neutral-300 mt-0.5 truncate">
                      {activeUser.department || 'Computer Science'} • {activeUser.faculty || 'Faculty of CIS'}
                    </p>

                    {/* Tagline */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-amber-300 font-medium italic line-clamp-1">
                        "{tagline}"
                      </p>
                      {cardData?.settings.topSkill && (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-700 text-[10px] font-mono font-bold text-neutral-300">
                          {cardData.settings.topSkill}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ============================================================= */}
            {/* RIGHT: ACHIEVEMENTS, STAT CHIPS & PORTFOLIO PANEL             */}
            {/* ============================================================= */}
            <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 bg-neutral-950/95 overflow-y-auto max-h-[640px]">
              
              <div>
                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 pb-4 border-b border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('achievements')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'achievements'
                        ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span>Achievements ({cardData?.achievements.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('stats')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'stats'
                        ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5 text-orange-400" />
                    <span>Season Stats</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('portfolio')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'portfolio'
                        ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Briefcase className="h-3.5 w-3.5 text-sky-400" />
                    <span>Portfolio</span>
                  </button>
                </div>

                {/* Stat Chips Row */}
                <div className="grid grid-cols-4 gap-2.5 py-4">
                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 font-mono block uppercase">Posts</span>
                    <span className="text-base font-black text-white font-mono">
                      {cardData?.stats.postsCount ?? 18}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 font-mono block uppercase">Followers</span>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {cardData?.stats.followersCount ?? 142}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 font-mono block uppercase">Projects</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {cardData?.stats.projectsCount ?? 3}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                    <span className="text-[10px] text-neutral-400 font-mono block uppercase">Badges</span>
                    <span className="text-base font-black text-purple-400 font-mono">
                      {cardData?.achievements.filter((a) => a.isVerified).length || 2}
                    </span>
                  </div>
                </div>

                {/* TAB 1: ACHIEVEMENTS LIST */}
                {activeTab === 'achievements' && (
                  <div className="space-y-3 mt-1">
                    {isLoading ? (
                      // Skeleton loader
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                          <div className="h-4 bg-neutral-800 rounded w-1/3" />
                          <div className="h-3 bg-neutral-800/60 rounded w-3/4" />
                        </div>
                      ))
                    ) : cardData?.achievements && cardData.achievements.length > 0 ? (
                      cardData.achievements.map((ach, idx) => {
                        const isExpanded = selectedAchievement?.id === ach.id;
                        return (
                          <motion.div
                            key={ach.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            onClick={() => setSelectedAchievement(isExpanded ? null : ach)}
                            className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div 
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                                  style={{
                                    backgroundColor: `${accentColor}15`,
                                    color: accentColor,
                                    borderColor: `${accentColor}30`,
                                  }}
                                >
                                  {getCategoryIcon(ach.category)}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                                      {ach.title}
                                    </h4>
                                    {ach.isVerified && (
                                      <span title="Verified Campus Achievement">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono">
                                    <span className="uppercase tracking-wider font-semibold text-neutral-300">
                                      {ach.category}
                                    </span>
                                    {ach.dateAchieved && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          {new Date(ach.dateAchieved).getFullYear()}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <ChevronRight className={`h-4 w-4 text-neutral-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-2 border-t border-neutral-800/80 text-xs text-neutral-300 space-y-2"
                              >
                                {ach.description && (
                                  <p className="leading-relaxed text-neutral-300">
                                    {ach.description}
                                  </p>
                                )}

                                {ach.linkUrl && (
                                  <a
                                    href={ach.linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                                  >
                                    <span>Official Verification / Link</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })
                    ) : (
                      // Empty state
                      <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30 space-y-3">
                        <Trophy className="h-8 w-8 text-neutral-500 mx-auto" />
                        <h4 className="text-sm font-bold text-white">No achievements added yet</h4>
                        <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                          {isOwner 
                            ? 'Showcase your hackathons, GPA milestones, leadership roles, and sports victories on your Player Card.'
                            : `${activeUser.fullName} has not published their achievements yet.`}
                        </p>
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              closePlayerCard();
                              openEditor(activeUser);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer"
                          >
                            + Add Your First Achievement
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SEASON STATS */}
                {activeTab === 'stats' && (
                  <div className="space-y-4 mt-2">
                    <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400 font-mono">Academic Standing</span>
                        <span className="text-xs font-bold text-emerald-400">Distinction / First Class</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full w-[94%]" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400 font-mono">Campus Influence & Reach</span>
                        <span className="text-xs font-bold text-amber-400">Top 5% CIS</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full w-[88%]" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-400 font-mono">Community Peer Rating</span>
                        <span className="text-xs font-bold text-sky-400">5.0 / 5.0 (42 endorsements)</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2">
                        <div className="bg-sky-500 h-2 rounded-full w-[98%]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: PORTFOLIO & REPOSITORIES */}
                {activeTab === 'portfolio' && (
                  <div className="space-y-3 mt-2">
                    {cardData?.settings?.portfolioLinks && cardData.settings.portfolioLinks.length > 0 ? (
                      cardData.settings.portfolioLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all text-neutral-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-800 text-sky-400">
                              {link.type === 'github' ? <Code2 className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            </div>
                            <span className="text-xs font-bold text-white">{link.title}</span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-neutral-500" />
                        </a>
                      ))
                    ) : (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/30">
                        <p className="text-xs text-neutral-400">No external portfolio links provided yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-6 mt-6 border-t border-neutral-800/80 flex flex-wrap items-center gap-2.5">
                {!isOwner ? (
                  <>
                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                        isFollowing
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="h-4 w-4 text-emerald-400" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Follow Player</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4 text-sky-400" />
                      <span>Message</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleViewFullProfile}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-all"
                    >
                      View Profile
                    </button>
                  </>
                ) : (
                  <div className="w-full flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        closePlayerCard();
                        openEditor(activeUser);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition-all shadow-md active:scale-95"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit My Player Card & Achievements</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleViewFullProfile}
                      className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold"
                    >
                      Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
