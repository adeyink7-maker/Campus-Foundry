import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Bookmark, 
  Store, 
  Share2, 
  MessageCircle, 
  UserPlus, 
  UserCheck, 
  MapPin, 
  GraduationCap, 
  ExternalLink, 
  ShieldCheck, 
  Heart, 
  MessageSquare, 
  Edit3, 
  X,
  CheckCircle2,
  LogOut,
  Settings,
  Plus,
  MoreVertical,
  IdCard,
  Camera,
  ShoppingBag,
  AlertTriangle,
  Lock,
  UserX,
  FileText,
  PenLine,
  BookOpen,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { emitAppToast } from '../services/supabase';
import { AppUser, CampusPost, CampusSnap, StudentBusiness, UserLeadershipRole } from '../types';
import { fetchUserPublishedArticles, fetchUserSavedArticles } from '../services/articles';
import { checkIsApprovedWriter } from '../services/writers';
import { fetchUserLeadershipRoles } from '../services/supabase';
import type { ArticleWithAuthor } from '../types/articles';
import { EditProfileModal } from './EditProfileModal';
import { VerificationModal } from './VerificationModal';
import { StudentIDCard } from './playercard/StudentIDCard';
import { LeadershipRoleBadge } from './LeadershipRoleBadge';
import { PageProfileModal } from './PageProfileModal';

export interface UserProfileViewProps {
  user?: AppUser | null;
  userPosts?: CampusPost[];
  userSnaps?: CampusSnap[];
  userBusinesses?: StudentBusiness[];
  onOpenCreatePost?: () => void;
  onOpenCreateBusiness?: () => void;
  onSelectBusiness?: (biz: StudentBusiness) => void;
  onOpenTraderProfile?: (biz: StudentBusiness) => void;
  onOpenBecomeTrader?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user: targetUserProp,
  userPosts = [],
  userSnaps = [],
  userBusinesses = [],
  onOpenCreatePost,
  onOpenCreateBusiness,
  onSelectBusiness,
  onOpenBecomeTrader,
}) => {
  const navigate = useNavigate();
  const { currentUser, toggleFollowUser, signOut, syncUserProfileFromSupabase, updateUser } = useAuth();
  const { openChatWithUser } = useChat();

  const activeUser = targetUserProp || currentUser;
  const isOwner = Boolean(currentUser && activeUser && currentUser.id === activeUser.id);

  // Tabs: 'posts' | 'articles' | 'products' | 'saved' | 'student_card'
  const [activeTab, setActiveTab] = useState<'posts' | 'articles' | 'products' | 'saved' | 'student_card'>('posts');
  
  const [authorArticles, setAuthorArticles] = useState<ArticleWithAuthor[]>([]);
  const [savedArticles, setSavedArticles] = useState<ArticleWithAuthor[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isApprovedWriter, setIsApprovedWriter] = useState(false);
  const [leadershipRoles, setLeadershipRoles] = useState<UserLeadershipRole[]>([]);
  const [showAllLeadershipRoles, setShowAllLeadershipRoles] = useState(false);
  const [selectedLeaderPageModal, setSelectedLeaderPageModal] = useState<any | null>(null);

  const visibleLeadershipRoles = showAllLeadershipRoles ? leadershipRoles : leadershipRoles.slice(0, 2);
  const remainingRolesCount = leadershipRoles.length - visibleLeadershipRoles.length;

  const isTrader = Boolean(
    activeUser &&
    (activeUser.accountType === 'TRADER' ||
     activeUser.role === 'trader' ||
     userBusinesses.length > 0)
  );

  useEffect(() => {
    if (activeUser?.id) {
      setIsLoadingArticles(true);
      fetchUserPublishedArticles(activeUser.id)
        .then(setAuthorArticles)
        .finally(() => setIsLoadingArticles(false));

      checkIsApprovedWriter(activeUser.id).then(setIsApprovedWriter);
      fetchUserLeadershipRoles(activeUser.id).then(setLeadershipRoles);
    }
  }, [activeUser?.id]);

  useEffect(() => {
    if (activeTab === 'articles' && !isApprovedWriter && !isLoadingArticles) {
      setActiveTab('posts');
    }
    if (activeTab === 'products' && !isTrader) {
      setActiveTab('posts');
    }
  }, [activeTab, isApprovedWriter, isTrader, isLoadingArticles]);

  useEffect(() => {
    if (isOwner && currentUser?.id) {
      setIsLoadingSaved(true);
      fetchUserSavedArticles(currentUser.id)
        .then(setSavedArticles)
        .finally(() => setIsLoadingSaved(false));
    }
  }, [isOwner, currentUser?.id, activeTab]);
  
  // Modals & Menu
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMoreUserMenu, setShowMoreUserMenu] = useState(false);
  
  // Follow state
  const isFollowedLocal = Boolean(activeUser && currentUser?.followingUserIds?.includes(activeUser.id));
  
  // Cover banner edit state
  const [coverUrl, setCoverUrl] = useState<string>(activeUser?.coverUrl || '');
  const [coverImageFailed, setCoverImageFailed] = useState(false);
  
  // Lightbox preview modal
  const [selectedGridItem, setSelectedGridItem] = useState<{
    id: string;
    mediaUrl?: string;
    caption: string;
    likesCount: number;
    commentsCount?: number;
    createdAt: string;
  } | null>(null);

  const [shareToast, setShareToast] = useState(false);

  if (!activeUser) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400">
        <p className="text-sm font-semibold mb-3">No user profile selected.</p>
      </div>
    );
  }

  const displayUsername = activeUser.username
    ? activeUser.username.startsWith('@')
      ? activeUser.username
      : `@${activeUser.username}`
    : (activeUser.email ? `@${activeUser.email.split('@')[0]}` : `@student_${activeUser.id.slice(0, 5)}`);

  const universityName = activeUser.university || activeUser.campus || '';
  const postsCount = userPosts.length;
  const followersCount = (activeUser.followersCount ?? 0) + (isFollowedLocal ? 1 : 0);
  const followingCount = activeUser.followingCount ?? 0;
  const productsCount = userBusinesses.length;

  // Fake check for active story ring around avatar
  const hasActiveStory = userSnaps.length > 0;

  // Followers / Following list modal
  const [activeListModal, setActiveListModal] = useState<'followers' | 'following' | null>(null);

  const handleToggleFollow = () => {
    toggleFollowUser(activeUser.id);
  };

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    }
  };

  const handleDirectMessage = () => {
    if (currentUser && activeUser && currentUser.id === activeUser.id) {
      emitAppToast("You can't message yourself", 'error');
      return;
    }
    openChatWithUser(activeUser as AppUser);
  };

  const handleChangeCoverImage = () => {
    const sampleCovers = [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200',
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
    ];
    const nextCover = sampleCovers[(sampleCovers.indexOf(coverUrl) + 1) % sampleCovers.length];
    setCoverUrl(nextCover);
    setCoverImageFailed(false);
    if (isOwner) {
      updateUser({ coverUrl: nextCover });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-0 sm:px-4 py-0 sm:py-6 text-white font-sans">
      
      {/* 1. PROFILE HEADER WITH COVER BANNER */}
      <div className="relative bg-neutral-900 rounded-none sm:rounded-3xl border-b sm:border border-neutral-800 overflow-hidden shadow-xl">
        
        {/* Cover Banner */}
        <div className="relative h-36 sm:h-48 w-full bg-neutral-950 overflow-hidden">
          {coverUrl && !coverImageFailed ? (
            <img 
              src={coverUrl} 
              alt="Cover Banner" 
              loading="lazy"
              onError={() => setCoverImageFailed(true)}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-orange-950/70 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.35),transparent_70%)]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
          
          {/* Change Cover Button (Owner only) */}
          {isOwner && (
            <button
              type="button"
              onClick={handleChangeCoverImage}
              className="absolute top-3 right-3 sm:right-14 p-2 rounded-xl bg-black/60 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Change cover photo"
            >
              <Camera className="h-3.5 w-3.5 text-orange-400" />
              <span className="hidden sm:inline">Change Cover</span>
            </button>
          )}

          {/* Settings Icon (Owner top right) */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black text-white backdrop-blur-md border border-white/10 transition-colors cursor-pointer"
              title="Profile Settings"
            >
              <Settings className="h-4 w-4 text-neutral-300 hover:text-white" />
            </button>
          )}
        </div>

        {/* Profile Content Overlay */}
        <div className="px-4 sm:px-6 pb-6 pt-0 relative z-10">
          
          {/* Avatar row with stats/buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            
            {/* Avatar with Story Ring and Add Story badge */}
            <div className="relative self-center sm:self-auto shrink-0">
              <div className={`p-1 rounded-full ${
                hasActiveStory ? 'bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500' : 'bg-neutral-800'
              }`}>
                <img
                  src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                  alt={activeUser.fullName}
                  loading="lazy"
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover border-4 border-neutral-900 bg-neutral-950"
                />
              </div>

              {/* Add story shortcut on owner avatar */}
              {isOwner && (
                <button
                  type="button"
                  onClick={onOpenCreatePost}
                  className="absolute bottom-1 right-1 p-1.5 rounded-full bg-orange-500 text-neutral-950 shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-neutral-900"
                  title="Add Story / Post"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                </button>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center justify-center sm:justify-end gap-2 self-center sm:self-end">
              {isOwner ? (
                <>
                  {isApprovedWriter && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate('/write')}
                        className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                        title="Write a new article"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        <span>Write</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/my-articles')}
                        className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="My Articles"
                      >
                        <FileText className="h-3.5 w-3.5 text-orange-400" />
                        <span>Articles</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-orange-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700 cursor-pointer"
                    title="Share profile"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleToggleFollow}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isFollowedLocal
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700'
                        : 'bg-orange-500 text-neutral-950 hover:bg-orange-400 font-extrabold shadow-md'
                    }`}
                  >
                    {isFollowedLocal ? (
                      <>
                        <UserCheck className="h-4 w-4 text-emerald-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectMessage}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-orange-400" />
                    <span>Message</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoreUserMenu(!showMoreUserMenu)}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700 cursor-pointer"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {showMoreUserMenu && (
                      <div className="absolute right-0 top-11 z-30 w-40 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-1 text-xs space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            emitAppToast(`Blocked @${activeUser.username || activeUser.fullName}`, 'success');
                            setShowMoreUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-neutral-300 font-medium"
                        >
                          Block User
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            emitAppToast(`Reported @${activeUser.username || activeUser.fullName}`, 'success');
                            setShowMoreUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800 text-rose-400 font-medium"
                        >
                          Report Profile
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>

          {/* User Name, Username, Verified Badge & Bio */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{activeUser.fullName}</span>
                  {activeUser.isVerified && (
                    <span title="Verified Student">
                      <CheckCircle2 className="h-5 w-5 text-sky-400 fill-sky-400/20" />
                    </span>
                  )}
                  {isApprovedWriter && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold tracking-tight flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                      <span>Verified Writer</span>
                    </span>
                  )}
                </h1>
                <p className="text-xs font-mono text-neutral-400 font-semibold mt-0.5">
                  {displayUsername}
                </p>

                {/* Derived Page Leadership Role Lines */}
                {leadershipRoles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {visibleLeadershipRoles.map((roleItem) => (
                      <button
                        key={`${roleItem.pageId}_${roleItem.role}`}
                        type="button"
                        onClick={() => {
                          setSelectedLeaderPageModal({
                            id: roleItem.pageId,
                            name: roleItem.pageName,
                            slug: roleItem.pageSlug,
                            type: roleItem.pageType,
                            logoUrl: roleItem.pageLogoUrl,
                            status: 'approved',
                            joinMode: 'open',
                            isVerified: true,
                            createdAt: new Date().toISOString(),
                            description: '',
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800/90 text-xs font-semibold text-neutral-200 transition-all cursor-pointer group shrink-0"
                        title={`Open ${roleItem.pageName}`}
                      >
                        <LeadershipRoleBadge
                          label={roleItem.label}
                          pageType={roleItem.pageType}
                          size="xs"
                        />
                        <span className="text-neutral-400 font-normal">·</span>
                        <span className="font-bold text-white group-hover:text-[#FF7A1A] transition-colors truncate">
                          {roleItem.pageName}
                        </span>
                      </button>
                    ))}

                    {remainingRolesCount > 0 && !showAllLeadershipRoles && (
                      <button
                        type="button"
                        onClick={() => setShowAllLeadershipRoles(true)}
                        className="text-[11px] font-bold text-orange-400 hover:underline block mt-0.5 cursor-pointer"
                      >
                        +{remainingRolesCount} more
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tappable Stats Row */}
              <div className="flex items-center gap-6 py-2 px-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-300 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('posts')}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="font-extrabold text-white text-sm block leading-none">{postsCount}</span>
                  <span className="text-[10px] text-neutral-400">Posts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListModal('followers')}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="font-extrabold text-white text-sm block leading-none">{followersCount}</span>
                  <span className="text-[10px] text-neutral-400">Followers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveListModal('following')}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="font-extrabold text-white text-sm block leading-none">{followingCount}</span>
                  <span className="text-[10px] text-neutral-400">Following</span>
                </button>
              </div>
            </div>

            {/* Department, Level, Faculty & University Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>{activeUser.level || '300L'}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium">
                {activeUser.department || 'Computer Science'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-medium">
                {activeUser.faculty || 'Sciences'}
              </span>
              {universityName && (
                <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400 text-xs font-mono font-medium">
                  🎓 {universityName}
                </span>
              )}
            </div>

            {/* Bio */}
            <p className="text-xs sm:text-sm text-neutral-300 pt-1 leading-relaxed max-w-2xl">
              {activeUser.bio || 'Campus student connecting, discovering opportunities, and trading on Campus Foundry.'}
            </p>

            {activeUser.hostelLocation && (
              <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium pt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{activeUser.hostelLocation}</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {shareToast && (
        <div className="my-3 p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center animate-in fade-in">
          Profile link copied to clipboard!
        </div>
      )}

      {/* 2. TABS UNDER HEADER */}
      <div className="mt-4 border-b border-neutral-800 flex items-center justify-around sm:justify-start sm:gap-8 text-xs font-bold uppercase tracking-wider text-neutral-400 bg-neutral-950/80 backdrop-blur-md sticky top-16 z-20">
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'posts'
              ? 'border-orange-500 text-orange-400 font-extrabold'
              : 'border-transparent hover:text-white'
          }`}
        >
          <Grid className="h-4 w-4" />
          <span>Posts</span>
        </button>

        {isApprovedWriter && (
          <button
            type="button"
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'articles'
                ? 'border-orange-500 text-orange-400 font-extrabold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Articles {authorArticles.length > 0 && `(${authorArticles.length})`}</span>
          </button>
        )}

        {isTrader && (
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'border-orange-500 text-orange-400 font-extrabold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Products {productsCount > 0 && `(${productsCount})`}</span>
          </button>
        )}

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'border-orange-500 text-orange-400 font-extrabold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            <span>Saved</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('student_card')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 border-b-2 transition-all cursor-pointer ${
            activeTab === 'student_card'
              ? 'border-orange-500 text-orange-400 font-extrabold'
              : 'border-transparent hover:text-white'
          }`}
        >
          <IdCard className="h-4 w-4" />
          <span>Student Card</span>
        </button>
      </div>

      {/* 3. TAB CONTENTS */}
      <div className="py-4">
        
        {/* TAB 1: POSTS (3-column photo/video grid with text posts) */}
        {activeTab === 'posts' && (
          <div>
            {userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800">
                <Grid className="h-10 w-10 text-neutral-600 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">No Posts Yet</h3>
                <p className="text-xs text-neutral-400 max-w-xs mb-4">
                  {isOwner ? 'Share your first update with peers.' : `${activeUser.fullName} has not posted anything yet.`}
                </p>
                {isOwner && onOpenCreatePost && (
                  <button
                    type="button"
                    onClick={onOpenCreatePost}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-neutral-950 text-xs font-bold hover:bg-orange-400 transition-all cursor-pointer"
                  >
                    Share First Post
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() =>
                      setSelectedGridItem({
                        id: post.id,
                        mediaUrl: post.mediaUrl,
                        caption: post.content,
                        likesCount: post.likesCount,
                        commentsCount: post.commentsCount,
                        createdAt: post.createdAt,
                      })
                    }
                    className="group relative aspect-square bg-neutral-900 rounded-2xl overflow-hidden cursor-pointer shadow-md border border-neutral-800"
                  >
                    {post.mediaUrl ? (
                      <img
                        src={post.mediaUrl}
                        alt={post.content}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full p-3 flex flex-col justify-between bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-200">
                        <p className="text-[11px] font-medium line-clamp-4 leading-relaxed">{post.content}</p>
                        <span className="text-[9px] font-mono text-orange-400 font-bold">Text Post</span>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-xs sm:text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4 fill-white" />
                        <span>{post.likesCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 fill-white" />
                        <span>{post.commentsCount}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ARTICLES (Published articles by author) */}
        {activeTab === 'articles' && isApprovedWriter && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Published Articles ({authorArticles.length})
              </h3>
              {isOwner && isApprovedWriter && (
                <button
                  type="button"
                  onClick={() => navigate('/write')}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  <span>Write Article</span>
                </button>
              )}
            </div>

            {isLoadingArticles ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-neutral-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-neutral-800 rounded w-3/4" />
                      <div className="h-2.5 bg-neutral-800 rounded w-full" />
                      <div className="h-2 bg-neutral-800 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : authorArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800">
                <BookOpen className="h-10 w-10 text-neutral-600 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">No Published Articles</h3>
                <p className="text-xs text-neutral-400 max-w-xs mb-4">
                  {isOwner ? 'Share deep insights, project write-ups, or campus guides.' : `${activeUser.fullName} has not published any articles yet.`}
                </p>
                {isOwner && isApprovedWriter && (
                  <button
                    type="button"
                    onClick={() => navigate('/write')}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-neutral-950 text-xs font-bold hover:bg-orange-400 transition-all cursor-pointer"
                  >
                    Write First Article
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {authorArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => navigate(`/article/${art.id}`)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 transition-all cursor-pointer shadow-md flex gap-3 sm:gap-4 items-start group"
                  >
                    {art.cover_url && (
                      <img
                        src={art.cover_url}
                        alt={art.title}
                        loading="lazy"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-neutral-800 group-hover:scale-[1.02] transition-transform"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                          {art.category || 'General'}
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {art.read_minutes} min read
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                      {art.excerpt && (
                        <p className="text-xs text-neutral-300 line-clamp-2 mt-1 leading-relaxed">
                          {art.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400 font-mono">
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <Heart className="w-3 h-3 fill-rose-500/30" />
                          {art.likes_count ?? 0}
                        </span>
                        <span>{art.published_at ? new Date(art.published_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS (Marketplace listings) */}
        {activeTab === 'products' && isTrader && (
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Marketplace Listings ({userBusinesses.length})
              </h3>
              {isOwner && isTrader && onOpenCreateBusiness && (
                <button
                  type="button"
                  onClick={onOpenCreateBusiness}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Add Listing</span>
                </button>
              )}
            </div>

            {userBusinesses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800">
                <Store className="h-10 w-10 text-neutral-600 mb-2" />
                <h3 className="text-sm font-bold text-white mb-1">No Active Listings</h3>
                <p className="text-xs text-neutral-400 max-w-xs mb-4">
                  {isOwner ? 'Turn your skills or items into campus listings.' : 'This user has no active trade listings.'}
                </p>
                {isOwner && isTrader && onOpenCreateBusiness && (
                  <button
                    type="button"
                    onClick={onOpenCreateBusiness}
                    className="px-4 py-2 rounded-xl bg-orange-500 text-neutral-950 text-xs font-bold hover:bg-orange-400 transition-all cursor-pointer"
                  >
                    + Add First Listing
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userBusinesses.map((biz) => (
                  <div
                    key={biz.id}
                    onClick={() => onSelectBusiness?.(biz)}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 transition-all cursor-pointer shadow-lg space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={biz.imageUrl}
                        alt={biz.name}
                        loading="lazy"
                        className="h-12 w-12 rounded-xl object-cover border border-neutral-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate flex items-center gap-1">
                          <span>{biz.name}</span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        </h4>
                        <span className="text-[10px] text-orange-400 font-semibold block">{biz.category}</span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">{biz.description}</p>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-800">
                      <span className="font-extrabold text-emerald-400">₦{biz.startingPrice.toLocaleString()}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold uppercase">
                        In Stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED (Owner Only - Bookmarked Articles) */}
        {activeTab === 'saved' && isOwner && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Saved Articles ({savedArticles.length})
              </h3>
            </div>

            {isLoadingSaved ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 animate-pulse flex gap-4">
                    <div className="w-20 h-20 rounded-xl bg-neutral-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-neutral-800 rounded w-3/4" />
                      <div className="h-2.5 bg-neutral-800 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : savedArticles.length === 0 ? (
              <div className="p-10 text-center bg-neutral-900/40 rounded-3xl border border-neutral-800 space-y-2">
                <Bookmark className="h-10 w-10 text-neutral-600 mx-auto" />
                <h4 className="text-xs font-bold text-white">No Saved Articles Yet</h4>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                  Bookmark articles across CampusFoundry to read them offline or save for reference later.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => navigate(`/article/${art.id}`)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 transition-all cursor-pointer shadow-md flex gap-3 sm:gap-4 items-start group"
                  >
                    {art.cover_url && (
                      <img
                        src={art.cover_url}
                        alt={art.title}
                        loading="lazy"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-neutral-800 group-hover:scale-[1.02] transition-transform"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                          {art.category || 'General'}
                        </span>
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {art.read_minutes} min read
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2">
                        {art.title}
                      </h4>
                      {art.excerpt && (
                        <p className="text-xs text-neutral-300 line-clamp-2 mt-1 leading-relaxed">
                          {art.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400 font-mono">
                        <span className="text-neutral-300 font-medium">By {art.author?.name || 'Student Writer'}</span>
                        <span>•</span>
                        <span>{art.published_at ? new Date(art.published_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STUDENT CARD */}
        {activeTab === 'student_card' && (
          <div className="max-w-md mx-auto">
            <StudentIDCard
              currentUser={activeUser}
              onOpenAuth={() => {}}
              onOpenGetVerified={() => setIsVerificationModalOpen(true)}
            />
          </div>
        )}

      </div>

      {/* 4. LIGHTBOX MODAL FOR POSTS */}
      {selectedGridItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          onClick={() => setSelectedGridItem(null)}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedGridItem(null)}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {selectedGridItem.mediaUrl && (
              <img
                src={selectedGridItem.mediaUrl}
                alt="Post Preview"
                className="w-full max-h-[60vh] object-cover"
              />
            )}

            <div className="p-4 space-y-2">
              <p className="text-xs text-white leading-relaxed">{selectedGridItem.caption}</p>
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800 font-mono">
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Heart className="h-3.5 w-3.5 fill-current" />
                  <span>{selectedGridItem.likesCount} likes</span>
                </span>
                <span>{new Date(selectedGridItem.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-5 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-400" />
                <span>Account & Privacy Settings</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-neutral-200 cursor-pointer"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Edit3 className="h-4 w-4 text-orange-400" />
                  <span>Edit Profile Details</span>
                </span>
                <span className="text-[10px] text-neutral-500">Name, bio, level</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsVerificationModalOpen(true);
                }}
                className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-neutral-200 cursor-pointer"
              >
                <span className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Student Verification</span>
                </span>
                <span className="text-[10px] text-neutral-500">
                  {currentUser?.isVerified ? 'Verified ✓' : 'Get verified'}
                </span>
              </button>

              {isOwner && !isTrader && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    if (onOpenBecomeTrader) {
                      onOpenBecomeTrader();
                    } else if (onOpenCreateBusiness) {
                      onOpenCreateBusiness();
                    }
                  }}
                  className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 flex items-center justify-between text-amber-400 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2 font-medium">
                    <Store className="h-4 w-4 text-amber-400" />
                    <span>Start Selling</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-bold">Register Business &rarr;</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsSettingsOpen(false);
                  signOut();
                }}
                className="w-full py-3 rounded-2xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Student Verification Upload Modal */}
      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onStatusUpdated={() => {
          if (currentUser) {
            syncUserProfileFromSupabase(currentUser.id);
          }
        }}
      />

      {/* Followers / Following List Modal */}
      {activeListModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveListModal(null)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-5 space-y-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold capitalize">
                {activeListModal} ({activeListModal === 'followers' ? followersCount : followingCount})
              </h3>
              <button
                type="button"
                onClick={() => setActiveListModal(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                    🎓
                  </div>
                  <div>
                    <span className="font-bold text-white block">Campus Peer</span>
                    <span className="text-[10px] text-neutral-500 font-mono">@campus_student</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-[10px] text-neutral-300 font-bold">
                  Student
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Profile Modal triggered by leadership role line */}
      {selectedLeaderPageModal && (
        <PageProfileModal
          isOpen={!!selectedLeaderPageModal}
          onClose={() => setSelectedLeaderPageModal(null)}
          page={selectedLeaderPageModal}
        />
      )}

    </div>
  );
};

export default UserProfileView;
