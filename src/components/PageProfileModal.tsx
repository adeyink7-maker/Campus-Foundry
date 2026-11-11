import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Users,
  Bell,
  BellOff,
  UserPlus,
  UserCheck,
  Settings,
  Calendar,
  MapPin,
  MessageSquare,
  Flag,
  Sparkles,
  Zap,
  Info,
  Clock,
  Send,
  Plus,
  ExternalLink,
  BookOpen,
  Quote,
  CheckCircle2,
  Share2,
  Headphones,
  Mic,
  Coffee,
  MessageCircle,
  Bookmark,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HubPage, PagePost, PageMember, PageMessage, PageLeader } from '../types';
import {
  fetchPagePostsFromSupabase,
  fetchPageMembersFromSupabase,
  joinOrFollowPageInSupabase,
  leaveOrUnfollowPageInSupabase,
  toggleMutePageNotificationsInSupabase,
  submitPageReportInSupabase,
  fetchPageMessagesFromSupabase,
  sendPageMessageInSupabase,
  claimOrSyncPageOwnerInSupabase,
  autoAssignPageOwnerByEmail,
  fetchPageLeadership,
  CHAPTER_AND_CO_ACTIVITIES,
  ClubActivityItem,
} from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { PageManagerModal } from './PageManagerModal';
import { LeadershipRoleBadge } from './LeadershipRoleBadge';

interface PageProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: HubPage;
  onShowToast?: (msg: string) => void;
  onOpenUserProfile?: (userId: string) => void;
}

// Feather / Lucide standard inline SVG for Instagram
const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const PageProfileModal: React.FC<PageProfileModalProps> = ({
  isOpen,
  onClose,
  page: initialPage,
  onShowToast,
  onOpenUserProfile,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [page, setPage] = useState<HubPage>(initialPage);

  const [activeTab, setActiveTab] = useState<'about' | 'activities' | 'membership' | 'announcements' | 'events'>('about');
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [members, setMembers] = useState<PageMember[]>([]);
  const [leaders, setLeaders] = useState<PageLeader[]>([]);

  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsErrorMsg, setPostsErrorMsg] = useState<string | null>(null);
  const [membersErrorMsg, setMembersErrorMsg] = useState<string | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // User membership status state
  const [myMemberRecord, setMyMemberRecord] = useState<PageMember | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [reportReasonModalPostId, setReportReasonModalPostId] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');

  // Refs for tracking sticky bar visibility
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerJoinBtnRef = useRef<HTMLAnchorElement>(null);
  const membershipCardRef = useRef<HTMLDivElement>(null);
  const membershipTabCardRef = useRef<HTMLDivElement>(null);

  const [isHeaderJoinVisible, setIsHeaderJoinVisible] = useState(true);
  const [isMembershipCardVisible, setIsMembershipCardVisible] = useState(false);

  const isChapterAndCo =
    page.slug === 'chapter-and-co-book-club' ||
    page.id === 'c4a973a0-9e6e-44ef-94c6-e91d6df4b001' ||
    page.name.toLowerCase().includes('chapter & co');

  const loadPosts = async () => {
    if (!page) return;
    setIsLoadingPosts(true);
    setPostsErrorMsg(null);
    try {
      const p = await fetchPagePostsFromSupabase(page.id);
      setPosts(p);
    } catch (err: any) {
      console.error('[PageProfileModal] Error loading page posts:', err);
      setPostsErrorMsg(err?.message || 'Failed to load announcements.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const loadMembers = async () => {
    if (!page) return;
    setMembersErrorMsg(null);
    try {
      const m = await fetchPageMembersFromSupabase(page.id);
      setMembers(m);
      if (currentUser) {
        const mine = m.find((item) => item.userId === currentUser.id);
        setMyMemberRecord(mine || null);
        setIsMuted(!!mine?.isMuted);
      }
    } catch (err: any) {
      console.error('[PageProfileModal] Error loading page members:', err);
      setMembersErrorMsg(err?.message || 'Failed to load page members.');
    }
  };

  const loadLeaders = async () => {
    if (!page) return;
    try {
      const l = await fetchPageLeadership(page.id, page.type, page.ownerId, page.ownerEmail);
      setLeaders(l);
    } catch (err: any) {
      console.error('[PageProfileModal] Error loading page leadership:', err);
    }
  };

  useEffect(() => {
    if (initialPage) {
      setPage(initialPage);
    }
  }, [initialPage]);

  useEffect(() => {
    if (isOpen && page) {
      loadPosts();
      loadMembers();
      loadLeaders();
    }
  }, [isOpen, page?.id, currentUser?.id]);

  // Roles & Ownership detection
  const isOwner = Boolean(
    currentUser && (
      (page.ownerId && page.ownerId === currentUser.id) ||
      (page.ownerEmail && currentUser.email && page.ownerEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
      ((page as any).ownerUsername && currentUser.username && (page as any).ownerUsername.trim().toLowerCase() === currentUser.username.trim().toLowerCase())
    )
  );

  const isAppAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.role === 'admin' ||
    currentUser?.staffRole === 'super_admin' ||
    currentUser?.staffRole === 'page_moderator'
  );

  const isAdmin = Boolean(
    isOwner ||
    isAppAdmin ||
    (myMemberRecord && (myMemberRecord.role === 'admin' || myMemberRecord.role === 'owner'))
  );

  // Automatic ownership sync:
  // 1. If currentUser email matches owner_email, immediately grant owner role and sync in DB.
  // 2. If page has owner_email but owner_id is missing, auto-lookup in background.
  useEffect(() => {
    if (!page) return;

    if (currentUser?.id && currentUser?.email && page.ownerEmail) {
      if (page.ownerEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase() && page.ownerId !== currentUser.id) {
        claimOrSyncPageOwnerInSupabase(page.id, currentUser.id, currentUser.email)
          .then(() => {
            setPage((prev) => ({ ...prev, ownerId: currentUser.id }));
            loadMembers();
          })
          .catch((err) => console.warn('[Auto-sync owner error]:', err));
      }
    }

    if (page.ownerEmail && !page.ownerId) {
      autoAssignPageOwnerByEmail(page.id, page.ownerEmail)
        .then((assignedOwnerId) => {
          if (assignedOwnerId) {
            setPage((prev) => ({ ...prev, ownerId: assignedOwnerId }));
          }
        })
        .catch(() => {});
    }
  }, [page?.id, page?.ownerEmail, page?.ownerId, currentUser?.id, currentUser?.email]);

  // Sticky bottom bar intersection observer:
  // Appears ONLY after header button scrolls out of view, and hides when Membership card is on screen.
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === headerJoinBtnRef.current) {
            setIsHeaderJoinVisible(entry.isIntersecting);
          } else if (entry.target === membershipCardRef.current || entry.target === membershipTabCardRef.current) {
            setIsMembershipCardVisible(entry.isIntersecting);
          }
        });
      },
      {
        root,
        threshold: 0.1,
      }
    );

    if (headerJoinBtnRef.current) observer.observe(headerJoinBtnRef.current);
    if (membershipCardRef.current) observer.observe(membershipCardRef.current);
    if (membershipTabCardRef.current) observer.observe(membershipTabCardRef.current);

    return () => observer.disconnect();
  }, [activeTab, page]);

  if (!isOpen || !page) return null;

  // REAL DATA ONLY: Count real users who followed/joined this page
  const realMemberCount = members.filter((m) => m.status === 'active').length;

  // Header meta line logic:
  // When no members: "Student Club · Launched 9 Nov 2026"
  // Show "1 member" / "N members" only once the count is 1 or more
  const isClub = page.type === 'club';
  const typeLabel = isClub ? 'Student Club' : 'News Outlet';
  const launchDateText = page.launchDate || (isChapterAndCo ? '9 November 2026' : '');

  const metaLine = realMemberCount > 0
    ? `${typeLabel}${launchDateText ? ` · Launched ${launchDateText}` : ''} · ${realMemberCount === 1 ? '1 member' : `${realMemberCount} members`}`
    : `${typeLabel}${launchDateText ? ` · Launched ${launchDateText}` : ''}`;

  const handleJoinOrFollow = async () => {
    if (!currentUser) {
      onShowToast?.('Please sign in to follow this club.');
      return;
    }

    try {
      if (myMemberRecord) {
        // Leave / Unfollow
        await leaveOrUnfollowPageInSupabase(page.id, currentUser.id);
        setMyMemberRecord(null);
        onShowToast?.(page.type === 'club' ? 'Unfollowed club.' : 'Unfollowed news page.');
      } else {
        const targetRole = 'follower';
        const res = await joinOrFollowPageInSupabase(page.id, currentUser.id, targetRole, page.joinMode);

        if (!res.success) {
          onShowToast?.(res.error || 'Unable to update page membership. Please try again.');
          return;
        }

        const newRec: PageMember = {
          id: `pm-${Date.now()}`,
          pageId: page.id,
          userId: currentUser.id,
          role: targetRole,
          status: res.status,
          isMuted: false,
          createdAt: new Date().toISOString(),
        };
        setMyMemberRecord(newRec);
        onShowToast?.('Now following Chapter & Co Book Club!');
      }

      // Refresh members
      const updated = await fetchPageMembersFromSupabase(page.id);
      setMembers(updated);
    } catch (e) {
      onShowToast?.('Action could not be completed.');
    }
  };

  const handleToggleMute = async () => {
    if (!currentUser || !myMemberRecord) return;
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    await toggleMutePageNotificationsInSupabase(page.id, currentUser.id, nextVal);
    onShowToast?.(nextVal ? 'Notifications muted for this club.' : 'Notifications enabled for this club.');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        onShowToast?.('Club page link copied!');
      } else {
        onShowToast?.('Club page link copied!');
      }
    } catch {
      onShowToast?.('Club page link copied!');
    }
  };

  const handleReportPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReasonModalPostId || !reportText.trim() || !currentUser) return;

    await submitPageReportInSupabase({
      pageId: page.id,
      postId: reportReasonModalPostId,
      reporterId: currentUser.id,
      reason: reportText.trim(),
    });

    onShowToast?.('Report submitted to app administrators for review.');
    setReportReasonModalPostId(null);
    setReportText('');
  };

  // Activity cards helper
  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-orange-400" />;
      case 'Users': return <Users className="w-5 h-5 text-orange-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-orange-400" />;
      case 'Headphones': return <Headphones className="w-5 h-5 text-orange-400" />;
      case 'Mic': return <Mic className="w-5 h-5 text-orange-400" />;
      case 'Coffee': return <Coffee className="w-5 h-5 text-orange-400" />;
      case 'MessageCircle': return <MessageCircle className="w-5 h-5 text-orange-400" />;
      case 'Bookmark': return <Bookmark className="w-5 h-5 text-orange-400" />;
      default: return <BookOpen className="w-5 h-5 text-orange-400" />;
    }
  };

  const eventPosts = posts.filter((p) => p.kind === 'event');
  const joinFormUrl = page.externalLinks?.joinFormUrl || 'https://forms.gle/PH2wLwkGVrtPKs16A';
  const instagramUrl = page.externalLinks?.instagramUrl || 'https://www.instagram.com/ilorin_bookclub';

  const showStickyJoin = !isHeaderJoinVisible && !isMembershipCardVisible;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="w-full max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 z-20 text-white p-2.5 rounded-full bg-black/60 border border-white/20 hover:bg-black/80 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Scrollable Container */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
            {/* 1. Cover Banner */}
            <div className="relative h-48 sm:h-56 w-full bg-neutral-900 overflow-hidden shrink-0">
              <img
                src={page.coverUrl || 'https://images.unsplash.com/photo-1507842229451-7f01be7fe7ab?w=1200&auto=format&fit=crop&q=80'}
                alt={page.name}
                className="w-full h-full object-cover opacity-80"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-black/40" />

              {/* Badges in Cover */}
              <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-orange-500 text-neutral-950 font-bold text-xs shadow-md">
                  Newly launched
                </span>
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-neutral-300 border border-white/15 text-xs font-semibold">
                  Books & Reading
                </span>
              </div>

              {/* Logo and Title Over Cover */}
              <div className="absolute bottom-4 left-4 sm:left-6 right-4 sm:right-6 flex items-end gap-3.5">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-neutral-800 p-0.5 bg-neutral-900 shadow-xl shrink-0">
                  <img
                    src={page.logoUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80'}
                    alt={page.name}
                    className="w-full h-full rounded-[14px] object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="mb-0.5 space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight truncate">
                      {page.name}
                    </h1>
                    {page.isVerified && (
                      <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Verified Student Club">
                        <ShieldCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base font-bold text-[#FF7A1A] tracking-wide">
                    {page.tagline || 'Read. Reflect. Connect.'}
                  </p>
                  <p className="text-xs text-neutral-400 font-mono">
                    {metaLine}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. ONE Action Row Only */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-900 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Primary Join Button */}
                <a
                  ref={headerJoinBtnRef}
                  href={joinFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Join the Club</span>
                  <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                </a>

                {/* Outlined Follow Button */}
                <button
                  type="button"
                  onClick={handleJoinOrFollow}
                  className={`min-h-[44px] px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    myMemberRecord
                      ? 'border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                      : 'border-neutral-700 bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700'
                  }`}
                >
                  {myMemberRecord ? (
                    <>
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                {/* Icon-Only Instagram Button */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram page"
                  title="@ilorin_bookclub on Instagram"
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                >
                  <InstagramIcon className="w-4 h-4 text-orange-400" />
                </a>

                {/* Icon-Only Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share page"
                  title="Share page link"
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 flex items-center justify-center transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Owner / Admin Manage Button */}
              <div className="flex items-center gap-2">
                {myMemberRecord && (
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    aria-label={isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center transition-colors ${
                      isMuted
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsManagerOpen(true)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-orange-400" />
                    <span>Manage</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. TABS (Plain names only) */}
            <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-neutral-800 bg-neutral-900/60 shrink-0 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('about')}
                className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'about'
                    ? 'border-b-2 border-[#FF7A1A] text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                About
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'activities'
                    ? 'border-b-2 border-[#FF7A1A] text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Activities
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('membership')}
                className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'membership'
                    ? 'border-b-2 border-[#FF7A1A] text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Membership
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'announcements'
                    ? 'border-b-2 border-[#FF7A1A] text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Announcements
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`min-h-[44px] px-4 py-2.5 whitespace-nowrap transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'events'
                    ? 'border-b-2 border-[#FF7A1A] text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Events
              </button>
            </div>

            {/* 4. Tab Content Area */}
            <div className="p-4 sm:p-6 flex-1 space-y-6">
              {/* TAB 1: ABOUT */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  {/* Short About Story Card */}
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                      <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <span>About Chapter & Co</span>
                      </h3>
                      <span className="text-xs text-neutral-400">
                        Books & Reading
                      </span>
                    </div>

                    <p className="text-sm text-neutral-300 leading-relaxed">
                      {page.description ||
                        "What if reading became more than just a personal activity? What if it became an opportunity to connect with people, exchange ideas, discover new perspectives and grow together? That's the idea behind Chapter & Co. If you've been looking for a community that inspires you to read, think, connect and grow, this is your invitation. Join us as one of our founding members!"}
                    </p>

                    {/* Handle as small text */}
                    <div className="pt-2 flex items-center gap-1.5 text-xs text-neutral-400">
                      <InstagramIcon className="w-3.5 h-3.5 text-orange-400" />
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white font-semibold transition-colors"
                      >
                        @ilorin_bookclub
                      </a>
                    </div>
                  </div>

                  {/* Led By Leadership Card */}
                  {leaders.length > 0 && (
                    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                        <h4 className="text-base font-bold text-white flex items-center gap-2">
                          <Crown className="w-4 h-4 text-orange-400" />
                          <span>Led by</span>
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {leaders.map((leader) => {
                          const displayName = leader.fullName?.trim() || leader.username || 'Club Head';
                          return (
                            <button
                              key={leader.userId}
                              type="button"
                              onClick={() => {
                                if (onOpenUserProfile) {
                                  onOpenUserProfile(leader.userId);
                                } else {
                                  onClose();
                                  navigate(`/profile/${leader.userId}`);
                                }
                              }}
                              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 hover:bg-neutral-800/50 transition-colors text-left cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={leader.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                                  alt={displayName}
                                  className="w-10 h-10 rounded-full object-cover border border-neutral-800 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs sm:text-sm text-white group-hover:text-orange-400 transition-colors truncate">
                                      {displayName}
                                    </span>
                                    <LeadershipRoleBadge
                                      label={leader.label}
                                      pageType={page.type}
                                      size="xs"
                                    />
                                  </div>
                                </div>
                              </div>

                              <span className="text-xs text-neutral-400 group-hover:text-white font-semibold transition-colors shrink-0">
                                View profile &rarr;
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Membership Card */}
                  <div
                    ref={membershipCardRef}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          Membership
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                        Open
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                        <span className="text-xs text-neutral-400 uppercase tracking-wider block font-semibold">
                          Membership Fee
                        </span>
                        <div className="text-xl font-extrabold text-white">
                          ₦2,000
                        </div>
                        <span className="text-xs text-neutral-400">
                          One-time payment
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                        <span className="text-xs text-neutral-400 uppercase tracking-wider block font-semibold">
                          Registration Status
                        </span>
                        <div className="text-base font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Open for Founding Members</span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          Open to students across faculties
                        </span>
                      </div>
                    </div>

                    {/* How to join steps */}
                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-300">
                        How to Join:
                      </h4>
                      <ol className="space-y-1.5 text-xs text-neutral-300 font-medium">
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                          <span>Tap Join the Club</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                          <span>Fill the registration form</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-200 font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                          <span>Complete payment with the club</span>
                        </li>
                      </ol>
                    </div>

                    <p className="text-xs text-neutral-400">
                      Payment and registration are handled by the club, not inside the app.
                    </p>

                    <a
                      href={joinFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                    >
                      <span>Join the Club</span>
                      <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                    </a>
                  </div>

                  {/* Motto Quote */}
                  <div className="pt-2 pb-4 text-center">
                    <p className="italic text-xs sm:text-sm text-neutral-400">
                      "{page.motto || 'Creativity is intelligence having fun.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: ACTIVITIES */}
              {activeTab === 'activities' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        Club Activities
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        What we do together as Chapter & Co community members
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CHAPTER_AND_CO_ACTIVITIES.map((act) => (
                      <div
                        key={act.id}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 sm:p-5 space-y-2 shadow-sm flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center shrink-0">
                              {getActivityIcon(act.iconName)}
                            </div>
                            <h4 className="font-bold text-base text-white">
                              {act.name}
                            </h4>
                          </div>
                          {act.description && act.description.trim().length > 0 && (
                            <p className="text-xs text-neutral-300 leading-relaxed">
                              {act.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Plain text closing note */}
                  <div className="p-4 text-center">
                    <p className="text-xs italic text-neutral-400">
                      ...and more to come
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: MEMBERSHIP */}
              {activeTab === 'membership' && (
                <div className="space-y-6">
                  <div
                    ref={membershipTabCardRef}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6 space-y-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          Club Membership
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Join Chapter & Co Book Club as a founding member
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                        Open
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                        <span className="text-xs text-neutral-400 uppercase tracking-wider block font-semibold">
                          Membership Fee
                        </span>
                        <div className="text-2xl font-black text-white">
                          ₦2,000
                        </div>
                        <span className="text-xs text-neutral-400">
                          One-time payment
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 space-y-1">
                        <span className="text-xs text-neutral-400 uppercase tracking-wider block font-semibold">
                          Registration Status
                        </span>
                        <div className="text-base font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Open to all students</span>
                        </div>
                        <span className="text-xs text-neutral-400">
                          All university levels and departments welcome
                        </span>
                      </div>
                    </div>

                    {/* How to join steps */}
                    <div className="p-5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-300">
                        How to Join in 3 Easy Steps:
                      </h4>
                      <ol className="space-y-2 text-xs sm:text-sm text-neutral-300 font-medium">
                        <li className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                          <span>Tap Join the Club below to open the official registration form</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                          <span>Fill the registration form with your student details and reading preferences</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                          <span>Complete payment with the club coordinates provided on the form</span>
                        </li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs text-neutral-300 space-y-1">
                      <p className="font-semibold text-white">Payment Notice:</p>
                      <p>Payment and registration are handled by the club, not inside the app.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <a
                        href={joinFormUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[44px] py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
                      >
                        <span>Join the Club</span>
                        <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                      </a>

                      {/* Contact the club link */}
                      <div className="pt-2 text-center">
                        <a
                          href={instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:underline font-semibold"
                        >
                          <InstagramIcon className="w-3.5 h-3.5 text-orange-400" />
                          <span>Contact the club via Instagram</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ANNOUNCEMENTS */}
              {activeTab === 'announcements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Announcements
                    </h3>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setIsManagerOpen(true)}
                        className="min-h-[40px] px-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Post an announcement</span>
                      </button>
                    )}
                  </div>

                  {isLoadingPosts ? (
                    <div className="text-center py-12 text-xs text-neutral-500">Loading announcements...</div>
                  ) : postsErrorMsg ? (
                    <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 text-xs text-red-300 text-center space-y-2">
                      <p>{postsErrorMsg}</p>
                      <button
                        type="button"
                        onClick={loadPosts}
                        className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
                      >
                        Retry
                      </button>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="p-10 text-center border border-neutral-800 rounded-2xl bg-neutral-900 space-y-3">
                      <BookOpen className="w-8 h-8 text-neutral-500 mx-auto" />
                      <p className="text-sm font-bold text-white">
                        No announcements yet. Follow the club to get updates.
                      </p>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                        Official book selections, meeting dates, and discussion prompts will appear here.
                      </p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setIsManagerOpen(true)}
                          className="mt-2 min-h-[44px] px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Post an announcement</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    posts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={page.logoUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&auto=format&fit=crop&q=80'}
                              alt={page.name}
                              className="w-8 h-8 rounded-lg object-cover border border-neutral-800"
                              loading="lazy"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white">{page.name}</span>
                                {post.authorLeadershipLabel && (
                                  <LeadershipRoleBadge label={post.authorLeadershipLabel} pageType={page.type} size="xs" />
                                )}
                              </div>
                              <span className="text-[11px] text-neutral-400 block">
                                {post.authorName ? `by ${post.authorName} · ` : ''}
                                {new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setReportReasonModalPostId(post.id)}
                            className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Report Post"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        </div>

                        {post.title && <h4 className="text-base font-bold text-white">{post.title}</h4>}
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{post.body}</p>

                        {post.imageUrl && (
                          <div className="rounded-xl overflow-hidden max-h-80 border border-neutral-800">
                            <img
                              src={post.imageUrl}
                              alt={post.title || 'Announcement image'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: EVENTS */}
              {activeTab === 'events' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Events
                    </h3>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setIsManagerOpen(true)}
                        className="min-h-[40px] px-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add an event</span>
                      </button>
                    )}
                  </div>

                  {eventPosts.length === 0 ? (
                    <div className="p-10 text-center border border-neutral-800 rounded-2xl bg-neutral-900 space-y-3">
                      <Calendar className="w-8 h-8 text-neutral-500 mx-auto" />
                      <p className="text-sm font-bold text-white">
                        No upcoming events yet. Follow the club to get updates.
                      </p>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                        Dates for Physical Meetups, Virtual Discussions, and Guest Sessions will be posted here.
                      </p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setIsManagerOpen(true)}
                          className="mt-2 min-h-[44px] px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add an event</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    eventPosts.map((post) => (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white">{post.title || 'Club Event'}</span>
                          <span className="text-xs text-neutral-400">
                            {new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{post.body}</p>

                        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-neutral-800 text-xs">
                          {post.eventDate && (
                            <div className="flex items-center gap-1.5 bg-orange-500/10 text-orange-400 px-3 py-1.5 rounded-xl border border-orange-500/20 font-semibold">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(post.eventDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                            </div>
                          )}
                          {post.eventLocation && (
                            <div className="flex items-center gap-1.5 bg-neutral-800 text-neutral-200 px-3 py-1.5 rounded-xl border border-neutral-700 font-semibold">
                              <MapPin className="w-4 h-4 text-orange-400" />
                              <span>{post.eventLocation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 5. Sticky Bottom "Join the Club" Bar */}
          <AnimatePresence>
            {showStickyJoin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="p-3.5 sm:px-6 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 z-30 flex items-center justify-between gap-3 shrink-0 shadow-lg"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white truncate">
                    Chapter & Co Book Club
                  </div>
                  <div className="text-xs text-neutral-400">
                    ₦2,000 · One-time payment
                  </div>
                </div>

                <a
                  href={joinFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <span>Join the Club</span>
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Page Manager Drawer Modal */}
      {isManagerOpen && (
        <PageManagerModal
          isOpen={isManagerOpen}
          onClose={() => setIsManagerOpen(false)}
          page={page}
          onShowToast={onShowToast}
          onPostCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
          onPageUpdated={() => {
            fetchPageMembersFromSupabase(page.id).then(setMembers);
          }}
        />
      )}

      {/* Report Reason Modal */}
      {reportReasonModalPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              <span>Report Announcement</span>
            </h3>
            <form onSubmit={handleReportPostSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Why are you reporting this announcement? (e.g. misinformation, spam, offensive)"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportReasonModalPostId(null)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
