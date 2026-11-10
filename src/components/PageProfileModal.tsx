import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';
import { HubPage, PagePost, PageMember, PageMessage } from '../types';
import {
  fetchPagePostsFromSupabase,
  fetchPageMembersFromSupabase,
  joinOrFollowPageInSupabase,
  leaveOrUnfollowPageInSupabase,
  toggleMutePageNotificationsInSupabase,
  submitPageReportInSupabase,
  fetchPageMessagesFromSupabase,
  sendPageMessageInSupabase,
} from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { PageManagerModal } from './PageManagerModal';

interface PageProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: HubPage;
  onShowToast?: (msg: string) => void;
}

export const PageProfileModal: React.FC<PageProfileModalProps> = ({
  isOpen,
  onClose,
  page: initialPage,
  onShowToast,
}) => {
  const { currentUser } = useAuth();
  const [page, setPage] = useState<HubPage>(initialPage);

  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'about' | 'members' | 'chat'>('posts');
  const [posts, setPosts] = useState<PagePost[]>([]);
  const [members, setMembers] = useState<PageMember[]>([]);
  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postsErrorMsg, setPostsErrorMsg] = useState<string | null>(null);
  const [membersErrorMsg, setMembersErrorMsg] = useState<string | null>(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // User membership status state
  const [myMemberRecord, setMyMemberRecord] = useState<PageMember | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [reportReasonModalPostId, setReportReasonModalPostId] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');

  const loadPosts = async () => {
    if (!page) return;
    setIsLoadingPosts(true);
    setPostsErrorMsg(null);
    try {
      const p = await fetchPagePostsFromSupabase(page.id);
      setPosts(p);
    } catch (err: any) {
      console.error('[PageProfileModal] Error loading page posts:', err);
      setPostsErrorMsg(err?.message || 'Failed to load page posts.');
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

  useEffect(() => {
    if (initialPage) {
      setPage(initialPage);
    }
  }, [initialPage]);

  useEffect(() => {
    if (isOpen && page) {
      loadPosts();
      loadMembers();

      // Load Chat Messages if club
      if (page.type === 'club') {
        fetchPageMessagesFromSupabase(page.id)
          .then(setMessages)
          .catch((err) => console.error('[PageProfileModal] Error loading chat:', err));
      }
    }
  }, [isOpen, page, currentUser]);

  if (!isOpen || !page) return null;

  const isOwner = Boolean(
    currentUser && (
      page.ownerId === currentUser.id ||
      (page as any).ownerEmail?.toLowerCase() === currentUser.email?.toLowerCase() ||
      (page as any).ownerUsername?.toLowerCase() === currentUser.username?.toLowerCase()
    )
  );
  const isAdmin = Boolean(
    isOwner ||
    (myMemberRecord && (myMemberRecord.role === 'admin' || myMemberRecord.role === 'owner')) ||
    currentUser?.isAdmin ||
    currentUser?.staffRole === 'super_admin'
  );
  const isMember = isOwner || (myMemberRecord && myMemberRecord.status === 'active' && myMemberRecord.role !== 'follower');
  const isFollower = myMemberRecord && myMemberRecord.role === 'follower';
  const isPending = myMemberRecord && myMemberRecord.status === 'pending';

  const activeClubMembers = members.filter((m) => m.role !== 'follower' && m.status === 'active');
  const activeFollowers = members.filter((m) => m.role === 'follower' && m.status === 'active');
  const displayedCount = page.type === 'club'
    ? (activeClubMembers.length || page.membersCount || 0)
    : (activeFollowers.length || page.followersCount || 0);
  const displayedCountLabel = page.type === 'club' ? 'members' : 'followers';

  const handleJoinOrFollow = async () => {
    if (!currentUser) {
      onShowToast?.('Please sign in to join or follow this page.');
      return;
    }

    try {
      if (myMemberRecord) {
        // Leave / Unfollow
        await leaveOrUnfollowPageInSupabase(page.id, currentUser.id);
        setMyMemberRecord(null);
        onShowToast?.(page.type === 'club' ? 'Left club page.' : 'Unfollowed news page.');
      } else {
        const targetRole = page.type === 'news' || page.joinMode === 'follow_only' ? 'follower' : 'member';
        const res = await joinOrFollowPageInSupabase(page.id, currentUser.id, targetRole, page.joinMode);

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

        if (res.status === 'pending') {
          onShowToast?.('Join request sent to club admins!');
        } else {
          onShowToast?.(targetRole === 'follower' ? 'Now following page!' : 'Joined club!');
        }
      }

      // Refresh members
      const updated = await fetchPageMembersFromSupabase(page.id);
      setMembers(updated);
    } catch (e) {
      onShowToast?.('Action failed.');
    }
  };

  const handleToggleMute = async () => {
    if (!currentUser || !myMemberRecord) return;
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    await toggleMutePageNotificationsInSupabase(page.id, currentUser.id, nextVal);
    onShowToast?.(nextVal ? 'Notifications muted for this page.' : 'Notifications enabled for this page.');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !currentUser) return;
    const txt = newMessageText.trim();
    setNewMessageText('');

    const res = await sendPageMessageInSupabase(
      page.id,
      currentUser.id,
      currentUser.fullName,
      currentUser.avatarUrl,
      txt
    );

    if (res.success && res.message) {
      setMessages((prev) => [...prev, res.message!]);
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

  const eventPosts = posts.filter((p) => p.kind === 'event');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-white p-2 rounded-full bg-black/60 border border-white/10 hover:bg-black/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cover & Header Banner */}
          <div className="relative h-44 sm:h-52 w-full bg-neutral-900 overflow-hidden shrink-0">
            <img
              src={page.coverUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80'}
              alt={page.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />

            {/* Logo overlapping banner */}
            <div className="absolute bottom-4 left-6 flex items-end gap-4">
              <img
                src={page.logoUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80'}
                alt={page.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-neutral-950 shadow-xl bg-neutral-900"
                loading="lazy"
              />
              <div className="mb-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{page.name}</h1>
                  {page.isVerified && (
                    <span className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" title="Verified Campus Page">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-300 font-mono">
                  <span className="capitalize text-purple-400 font-bold">
                    {page.type === 'club' ? 'Student Club' : 'News Outlet'}
                  </span>
                  <span>•</span>
                  <span>{displayedCount} {displayedCountLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-6 py-3 border-b border-neutral-800 bg-neutral-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-neutral-300 max-w-md line-clamp-2">{page.description}</p>

            <div className="flex items-center gap-2">
              {/* Mute toggle for members */}
              {myMemberRecord && (
                <button
                  onClick={handleToggleMute}
                  className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    isMuted
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                >
                  {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>
              )}

              {/* Join / Follow / Requested button */}
              <button
                onClick={handleJoinOrFollow}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  myMemberRecord
                    ? isPending
                      ? 'bg-neutral-800 text-amber-300 border border-amber-500/30'
                      : 'bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-red-950/40 hover:text-red-300 hover:border-red-500/30'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/40'
                }`}
              >
                {myMemberRecord ? (
                  isPending ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Request Pending</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isFollower ? 'Following' : 'Member'}</span>
                    </>
                  )
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {page.type === 'news' || page.joinMode === 'follow_only'
                        ? 'Follow'
                        : page.joinMode === 'request'
                        ? 'Request to Join'
                        : 'Join Club'}
                    </span>
                  </>
                )}
              </button>

              {/* Page Manager Button for owner/admins */}
              {isAdmin && (
                <button
                  onClick={() => setIsManagerOpen(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  <span>Page Manager</span>
                </button>
              )}
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1 px-6 border-b border-neutral-800 bg-neutral-950 shrink-0">
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'posts'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'events'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Events ({eventPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              About
            </button>

            {page.type === 'club' && isMember && (
              <>
                <button
                  onClick={() => setActiveTab('members')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === 'members'
                      ? 'border-purple-500 text-white'
                      : 'border-transparent text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Members ({activeClubMembers.length})
                </button>
                {(page.joinMode === 'open' || page.joinMode === 'request') && (
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'chat'
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Club Chat</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Tab 1: Posts */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {isLoadingPosts ? (
                  <div className="text-center py-10 text-xs text-neutral-500">Loading page posts from database...</div>
                ) : postsErrorMsg ? (
                  <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 text-xs text-red-300 text-center space-y-2">
                    <p>{postsErrorMsg}</p>
                    <button
                      onClick={loadPosts}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
                    >
                      Retry
                    </button>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="p-10 text-center border border-neutral-800 rounded-2xl bg-neutral-900/30 text-xs text-neutral-400 space-y-2">
                    <Info className="w-8 h-8 text-neutral-600 mx-auto" />
                    <p>No posts published yet on this page.</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <div
                      key={post.id}
                      className={`rounded-2xl border bg-neutral-900/70 p-5 space-y-3 relative ${
                        post.isBreaking
                          ? 'border-red-500/50 bg-red-950/10 shadow-lg shadow-red-950/20'
                          : 'border-neutral-800'
                      }`}
                    >
                      {post.isBreaking && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                          <Zap className="w-3 h-3" />
                          <span>BREAKING NEWS</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={page.logoUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'}
                            alt={page.name}
                            className="w-8 h-8 rounded-lg object-cover"
                            loading="lazy"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">{page.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Report Post Trigger */}
                        <button
                          onClick={() => setReportReasonModalPostId(post.id)}
                          className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                          title="Report Post"
                        >
                          <Flag className="w-4 h-4" />
                        </button>
                      </div>

                      {post.title && <h3 className="text-base font-bold text-white leading-snug">{post.title}</h3>}
                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{post.body}</p>

                      {post.imageUrl && (
                        <div className="rounded-xl overflow-hidden max-h-80 border border-neutral-800">
                          <img
                            src={post.imageUrl}
                            alt={post.title || 'Post image'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {post.kind === 'event' && (
                        <div className="flex flex-wrap gap-3 pt-2.5 border-t border-neutral-800/80 text-xs">
                          {post.eventDate && (
                            <div className="flex items-center gap-1.5 bg-purple-500/15 text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/30 font-semibold shadow-sm">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              <span>Event Date: {new Date(post.eventDate).toLocaleString(undefined, { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                              })}</span>
                            </div>
                          )}
                          {post.eventLocation && (
                            <div className="flex items-center gap-1.5 bg-amber-500/15 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 font-semibold shadow-sm">
                              <MapPin className="w-4 h-4 text-amber-400" />
                              <span>Venue: {post.eventLocation}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Events */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                {eventPosts.length === 0 ? (
                  <div className="p-8 text-center border border-neutral-800 rounded-2xl bg-neutral-900/30 text-xs text-neutral-400">
                    No scheduled events for this page yet.
                  </div>
                ) : (
                  eventPosts.map((evt) => (
                    <div key={evt.id} className="p-4 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                          Upcoming Event
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-purple-300 font-mono font-medium">
                          <Calendar className="w-3.5 h-3.5 text-purple-400" />
                          <span>
                            {evt.eventDate 
                              ? new Date(evt.eventDate).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                              : 'TBD'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-white">{evt.title}</h3>
                      <p className="text-xs text-neutral-300">{evt.body}</p>
                      {evt.eventLocation && (
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Venue: {evt.eventLocation}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: About */}
            {activeTab === 'about' && (
              <div className="space-y-4 text-xs text-neutral-300">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <h3 className="text-sm font-bold text-white">Page Overview</h3>
                  <p className="leading-relaxed">{page.description}</p>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
                    <div>
                      <span className="text-neutral-500 block">Type:</span>
                      <span className="font-semibold text-white capitalize">{page.type}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Join Mode:</span>
                      <span className="font-semibold text-white capitalize">{page.joinMode}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Verified Status:</span>
                      <span className="font-semibold text-emerald-400">{page.isVerified ? 'Verified Official' : 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Created On:</span>
                      <span className="font-semibold text-white">{new Date(page.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Members (Clubs only) */}
            {activeTab === 'members' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Club Members Directory ({activeClubMembers.length})
                </h3>
                {membersErrorMsg ? (
                  <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 text-xs text-red-300 text-center space-y-2">
                    <p>{membersErrorMsg}</p>
                    <button
                      onClick={loadMembers}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
                    >
                      Retry
                    </button>
                  </div>
                ) : activeClubMembers.length === 0 ? (
                  <div className="p-6 text-center border border-neutral-800 rounded-xl text-xs text-neutral-400">
                    No active members listed yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeClubMembers.map((m) => (
                      <div key={m.id} className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={m.userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                            alt={m.userName || 'Member'}
                            className="w-9 h-9 rounded-full object-cover border border-neutral-700 bg-neutral-800 shrink-0"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {m.userName || (m.userId ? `Student ${m.userId.slice(0, 6)}` : 'Campus Member')}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              {m.userUsername && (
                                <span className="text-neutral-400 font-mono">@{m.userUsername}</span>
                              )}
                              <span className="text-purple-400 font-medium capitalize">• {m.role}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          m.status === 'active' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Club Chat (Members-only) */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-80 rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
                <div className="p-3 border-b border-neutral-800 bg-neutral-900 text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Members-Only Club Chat Room</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-xs text-neutral-500">
                      Welcome to the club group chat! Send a message to start conversing.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = currentUser && msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] text-neutral-500 mb-0.5 px-1">{msg.senderName}</span>
                          <div
                            className={`px-3.5 py-2 rounded-2xl text-xs max-w-xs ${
                              isMe ? 'bg-orange-600 text-white rounded-br-xs' : 'bg-neutral-800 text-neutral-200 rounded-bl-xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-2 border-t border-neutral-800 bg-neutral-950 flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type club message..."
                    className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
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
              <Flag className="w-4 h-4 text-red-400" />
              <span>Report Page Post</span>
            </h3>
            <form onSubmit={handleReportPostSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Why are you reporting this post? (e.g. misinformation, spam, harassment)"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3 text-xs text-white focus:outline-none resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportReasonModalPostId(null)}
                  className="px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
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
