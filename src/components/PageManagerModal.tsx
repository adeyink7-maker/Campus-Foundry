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
  AlertTriangle,
  Upload,
  Camera,
  UserCheck
} from 'lucide-react';
import { HubPage, PagePost, PagePostKind, PageMember, PageMemberRole } from '../types';
import {
  createPagePostInSupabase,
  updatePageDetailsInSupabase,
  fetchPageMembersFromSupabase,
  joinOrFollowPageInSupabase,
  updatePageMemberRoleInSupabase,
  getPageLeadershipLabel,
  uploadMedia,
} from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { LeadershipRoleBadge } from './LeadershipRoleBadge';

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
  const isAppAdmin = Boolean(
    currentUser?.isAdmin ||
    currentUser?.role === 'admin' ||
    currentUser?.staffRole === 'super_admin' ||
    currentUser?.staffRole === 'page_moderator'
  );

  const [activeTab, setActiveTab] = useState<'create_post' | 'edit_page' | 'join_requests' | 'members_leadership'>('create_post');

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
  const [editTagline, setEditTagline] = useState(page.tagline || '');
  const [editDescription, setEditDescription] = useState(page.description);
  const [editLogoUrl, setEditLogoUrl] = useState(page.logoUrl || '');
  const [editCoverUrl, setEditCoverUrl] = useState(page.coverUrl || '');
  const [editJoinMode, setEditJoinMode] = useState(page.joinMode);
  const [editOwnerEmail, setEditOwnerEmail] = useState(page.ownerEmail || '');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUpdatingPage, setIsUpdatingPage] = useState(false);

  // Members & requests state
  const [members, setMembers] = useState<PageMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (isOpen && page) {
      setEditName(page.name);
      setEditTagline(page.tagline || '');
      setEditDescription(page.description);
      setEditLogoUrl(page.logoUrl || '');
      setEditCoverUrl(page.coverUrl || '');
      setEditJoinMode(page.joinMode);
      setEditOwnerEmail(page.ownerEmail || '');

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

  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const path = `page-logos/${page.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const url = await uploadMedia('article-images', path, file, file.type);
      setEditLogoUrl(url);
      onShowToast?.('Logo uploaded! Click Save Changes to apply.');
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to upload logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleUploadCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const path = `page-covers/${page.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const url = await uploadMedia('article-images', path, file, file.type);
      setEditCoverUrl(url);
      onShowToast?.('Cover banner uploaded! Click Save Changes to apply.');
    } catch (err: any) {
      onShowToast?.(err?.message || 'Failed to upload cover banner.');
    } finally {
      setIsUploadingCover(false);
    }
  };

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
        tagline: editTagline.trim(),
        description: editDescription.trim(),
        logoUrl: editLogoUrl.trim(),
        coverUrl: editCoverUrl.trim(),
        joinMode: editJoinMode,
        ownerEmail: isAppAdmin ? editOwnerEmail.trim() || null : undefined,
      });
      onShowToast?.('Page details updated successfully!');
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
        const res = await joinOrFollowPageInSupabase(page.id, userId, 'member', page.joinMode);
        if (!res.success) {
          onShowToast?.(res.error || 'Approval failed.');
          return;
        }
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

  const handleUpdateMemberRole = async (targetUserId: string, newRole: PageMemberRole) => {
    try {
      const res = await updatePageMemberRoleInSupabase(page.id, targetUserId, newRole);
      if (!res.success) {
        onShowToast?.(res.error || 'Failed to update member role.');
        return;
      }
      onShowToast?.(`Role updated to ${getPageLeadershipLabel(page.type, newRole)}!`);
      const updated = await fetchPageMembersFromSupabase(page.id);
      setMembers(updated);
      if (onPageUpdated) onPageUpdated();
    } catch (e: any) {
      onShowToast?.(e?.message || 'Failed to update role.');
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
            <button
              onClick={() => setActiveTab('members_leadership')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'members_leadership'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Leadership & Roles</span>
            </button>
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
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                  placeholder="e.g. Read. Reflect. Connect."
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

              {/* Logo Upload & URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">Logo Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editLogoUrl}
                    onChange={(e) => setEditLogoUrl(e.target.value)}
                    placeholder="https://... or upload below"
                    className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                  <label className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Camera className="w-3.5 h-3.5 text-[#FF7A1A]" />
                    <span>{isUploadingLogo ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogoFile}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Cover Upload & URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">Cover Banner Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    placeholder="https://... or upload below"
                    className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                  <label className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-[#FF7A1A]" />
                    <span>{isUploadingCover ? 'Uploading...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCoverFile}
                      disabled={isUploadingCover}
                      className="hidden"
                    />
                  </label>
                </div>
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

              {/* Admin Owner Reassignment Field */}
              {isAppAdmin && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">
                      Admin: Assign Page Owner Email
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    When the club head signs up or logs in with this email, she is automatically assigned the Owner role with full management permissions. Admins can reassign this anytime.
                  </p>
                  <input
                    type="email"
                    value={editOwnerEmail}
                    onChange={(e) => setEditOwnerEmail(e.target.value)}
                    placeholder="e.g. clubhead@gmail.com"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={isUpdatingPage || isUploadingLogo || isUploadingCover}
                  className="px-5 py-2.5 rounded-xl bg-[#FF7A1A] hover:bg-[#e66c14] text-neutral-950 font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isUpdatingPage ? 'Saving...' : 'Save Changes'}
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

          {/* Tab 4: Leadership & Member Roles */}
          {activeTab === 'members_leadership' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Page Leadership & Team Roles
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Assign co-leads, moderators, or editors to help manage this page. Badges update automatically across the app.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {members.filter((m) => m.status === 'active').length === 0 ? (
                  <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 text-center text-xs text-neutral-400">
                    No active members found for this page.
                  </div>
                ) : (
                  members
                    .filter((m) => m.status === 'active')
                    .map((m) => {
                      const isMemberOwner = m.role === 'owner' || (page.ownerId && page.ownerId === m.userId);
                      const currentLabel = getPageLeadershipLabel(page.type, m.role);

                      return (
                        <div
                          key={m.id || m.userId}
                          className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={m.userAvatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                              alt={m.userName || 'Member'}
                              className="w-8 h-8 rounded-full object-cover border border-neutral-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white truncate">
                                  {m.userName || 'Student Member'}
                                </span>
                                {m.role !== 'member' && m.role !== 'follower' && (
                                  <LeadershipRoleBadge
                                    label={currentLabel}
                                    pageType={page.type}
                                    size="xs"
                                  />
                                )}
                              </div>
                              {m.userUsername && (
                                <span className="text-[10px] text-neutral-400 font-mono block truncate">
                                  {m.userUsername}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isMemberOwner ? (
                              <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-[11px] font-bold text-amber-400 border border-amber-500/20">
                                {page.type === 'club' ? 'Club Head (Owner)' : 'Editor-in-Chief'}
                              </span>
                            ) : (
                              <select
                                value={m.role}
                                onChange={(e) =>
                                  handleUpdateMemberRole(m.userId, e.target.value as PageMemberRole)
                                }
                                className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                              >
                                <option value="member">Member (Regular)</option>
                                {page.type === 'club' ? (
                                  <>
                                    <option value="co_lead">Co-lead</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                  </>
                                )}
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
