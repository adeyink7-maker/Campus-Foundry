import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FilePlus,
  Settings,
  Users,
  Check,
  Zap,
  Calendar,
  MapPin,
  Flame,
  ShieldCheck,
  Trash2,
  Bell,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { HubPage, PagePost, PagePostKind, PageMember } from '../types';
import {
  createPagePostInSupabase,
  updatePageDetailsInSupabase,
  fetchPageMembersFromSupabase,
  joinOrFollowPageInSupabase,
} from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: HubPage;
  onShowToast?: (msg: string) => void;
  onPostCreated?: (post: PagePost) => void;
  onPageUpdated?: () => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  isOpen,
  onClose,
  page,
  onShowToast,
  onPostCreated,
  onPageUpdated,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'create_post' | 'edit_page' | 'join_requests'>('create_post');

  // Create Post state
  const [postKind, setPostKind] = useState<PagePostKind>('announcement');
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postImage, setPostImage] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Edit Page state
  const [editName, setEditName] = useState(page.name);
  const [editDescription, setEditDescription] = useState(page.description);
  const [editLogoUrl, setEditLogoUrl] = useState(page.logoUrl || '');
  const [editCoverUrl, setEditCoverUrl] = useState(page.coverUrl || '');
  const [editJoinMode, setEditJoinMode] = useState(page.joinMode);
  const [isUpdatingPage, setIsUpdatingPage] = useState(false);

  // Members & requests state
  const [members, setMembers] = useState<PageMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen && page) {
      setEditName(page.name);
      setEditDescription(page.description);
      setEditLogoUrl(page.logoUrl || '');
      setEditCoverUrl(page.coverUrl || '');
      setEditJoinMode(page.joinMode);

      setIsLoadingMembers(true);
      fetchPageMembersFromSupabase(page.id).then((m) => {
        setMembers(m);
        setIsLoadingMembers(false);
      });
    }
  }, [isOpen, page]);

  if (!isOpen) return null;

  // News pages can only post if approved AND verified. Club pages can post once approved.
  const canPost = page.type === 'news'
    ? page.status === 'approved' && page.isVerified
    : page.status === 'approved';

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postBody.trim()) {
      onShowToast?.('Post body cannot be empty.');
      return;
    }

    if (!canPost) {
      if (page.type === 'news') {
        onShowToast?.('News outlet pages must be approved and verified by app admins to post.');
      } else {
        onShowToast?.('This page must be approved before publishing posts.');
      }
      return;
    }

    if (!currentUser) return;

    setIsPosting(true);
    try {
      const res = await createPagePostInSupabase({
        pageId: page.id,
        authorId: currentUser.id,
        kind: isBreaking ? 'breaking' : postKind,
        title: postTitle.trim(),
        body: postBody.trim(),
        imageUrl: postImage.trim(),
        eventDate: eventDate || undefined,
        eventLocation: eventLocation.trim() || undefined,
        isBreaking,
        pageName: page.name,
        pageLogoUrl: page.logoUrl,
        pageType: page.type,
        pageIsVerified: page.isVerified,
      });

      if (res.success && res.post) {
        onShowToast?.(isBreaking ? '🚨 Breaking News published & notified to followers!' : 'Post published successfully!');
        if (onPostCreated) onPostCreated(res.post);

        // Reset form
        setPostTitle('');
        setPostBody('');
        setPostImage('');
        setEventDate('');
        setEventLocation('');
        setIsBreaking(false);
        onClose();
      } else {
        onShowToast?.(res.error || 'Failed to create post.');
      }
    } catch (err: any) {
      onShowToast?.(err?.message || 'Error creating post.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleUpdatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPage(true);
    try {
      await updatePageDetailsInSupabase(page.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        logoUrl: editLogoUrl.trim(),
        coverUrl: editCoverUrl.trim(),
        joinMode: editJoinMode,
      });
      onShowToast?.('Page details updated!');
      if (onPageUpdated) onPageUpdated();
    } catch (err: any) {
      onShowToast?.('Failed to update page.');
    } finally {
      setIsUpdatingPage(false);
    }
  };

  const handleReviewJoinRequest = async (userId: string, approve: boolean) => {
    try {
      if (approve) {
        await joinOrFollowPageInSupabase(page.id, userId, 'member', page.joinMode);
        onShowToast?.('Member approved!');
      } else {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        onShowToast?.('Join request rejected.');
      }

      const updated = await fetchPageMembersFromSupabase(page.id);
      setMembers(updated);
    } catch (e) {
      onShowToast?.('Action failed.');
    }
  };

  const pendingRequests = members.filter((m) => m.status === 'pending');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <img
              src={page.logoUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'}
              alt={page.name}
              className="w-10 h-10 rounded-xl object-cover border border-neutral-800"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-bold text-white">{page.name}</h2>
                {page.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-xs text-neutral-400 font-mono">Page Manager Dashboard</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-5">
            <button
              onClick={() => setActiveTab('create_post')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'create_post'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Create Post</span>
            </button>
            <button
              onClick={() => setActiveTab('edit_page')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'edit_page'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Page</span>
            </button>
            {page.type === 'club' && (
              <button
                onClick={() => setActiveTab('join_requests')}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'join_requests'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Requests ({pendingRequests.length})</span>
              </button>
            )}
          </div>

          {/* Tab 1: Create Post */}
          {activeTab === 'create_post' && (
            <div>
              {!canPost ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2 mb-4">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Posting Disabled</span>
                  </div>
                  <p>
                    {page.type === 'news'
                      ? 'News pages can only publish posts once approved and marked as Verified by app administrators.'
                      : 'This club page must be approved by an administrator before publishing posts.'}
                  </p>
                </div>
              ) : null}

              <form onSubmit={handleCreatePost} className="space-y-4">
                {/* Kind Selector */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Post Kind
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['announcement', 'event', 'article'] as PagePostKind[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          setPostKind(k);
                          setIsBreaking(false);
                        }}
                        className={`capitalize px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                          postKind === k && !isBreaking
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        {k}
                      </button>
                    ))}
                    {page.type === 'news' && (
                      <button
                        type="button"
                        onClick={() => setIsBreaking(!isBreaking)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                          isBreaking
                            ? 'bg-red-600 text-white border-red-500 animate-pulse'
                            : 'bg-neutral-900 text-red-400 border-neutral-800'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>🚨 Breaking News</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Headline or Event Title"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Content Body *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={postBody}
                    onChange={(e) => setPostBody(e.target.value)}
                    placeholder="Write your announcement or news article..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Event Fields */}
                {postKind === 'event' && (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-900 border border-neutral-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-purple-400" />
                        <span>Event Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        <span>Venue / Location</span>
                      </label>
                      <input
                        type="text"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="e.g. Main Auditorium"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Media Banner Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={postImage}
                    onChange={(e) => setPostImage(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPosting || !canPost}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer flex items-center gap-2"
                  >
                    {isPosting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isBreaking ? 'Publish Breaking News' : 'Publish Post'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Edit Page */}
          {activeTab === 'edit_page' && (
            <form onSubmit={handleUpdatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Page Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Logo Image URL</label>
                <input
                  type="url"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  value={editCoverUrl}
                  onChange={(e) => setEditCoverUrl(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {page.type === 'club' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Join Mode</label>
                  <select
                    value={editJoinMode}
                    onChange={(e) => setEditJoinMode(e.target.value as any)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  >
                    <option value="open">Open (Anyone joins immediately)</option>
                    <option value="request">Request (Requires admin approval)</option>
                    <option value="follow_only">Follow Only</option>
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isUpdatingPage}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Join Requests */}
          {activeTab === 'join_requests' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Pending Join Requests ({pendingRequests.length})
              </h3>
              {pendingRequests.length === 0 ? (
                <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 text-center text-xs text-neutral-400">
                  No pending membership requests for this club.
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">{req.userName || req.userId}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">Role requested: {req.role}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewJoinRequest(req.userId, true)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReviewJoinRequest(req.userId, false)}
                          className="px-3 py-1 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
