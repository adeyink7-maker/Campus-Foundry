import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Share2, 
  MapPin, 
  Store, 
  Repeat, 
  Quote, 
  ExternalLink, 
  MessageSquare, 
  UserPlus, 
  UserCheck, 
  Trash2, 
  X, 
  MoreHorizontal,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Flag
} from 'lucide-react';
import { CampusPost, StudentBusiness, PostReactionCounts, CampusSnap } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { emitAppToast } from '../services/supabase';
import { LongPressAvatar } from './playercard/LongPressAvatar';

interface PostCardProps {
  post: CampusPost;
  onLikeToggle?: (postId: string) => void;
  onAddComment?: (postId: string, commentText: string) => void;
  onSelectBusiness?: (business: StudentBusiness) => void;
  onDeletePost?: (postId: string) => void;
  allBusinesses?: StudentBusiness[];
  onOpenAuthorProfile?: (authorId: string) => void;
  onOpenMyStore?: (business: StudentBusiness) => void;
  onRequireAuth?: (action?: () => void) => void;
  activeSnap?: CampusSnap;
  onSelectSnap?: (snap: CampusSnap) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikeToggle,
  onSelectBusiness,
  onDeletePost,
  allBusinesses = [],
  onOpenAuthorProfile,
  onOpenMyStore,
  onRequireAuth,
  activeSnap,
  onSelectSnap,
}) => {
  const { currentUser, toggleFollowUser } = useAuth();
  const { openChatWithBusiness, openChatDrawer } = useChat();
  
  // Local reactive reactions state
  const [reactions, setReactions] = useState<PostReactionCounts>(() => {
    return (
      post.reactions || {
        heart: post.likesCount || 0,
        fire: 0,
        lightbulb: 0,
        clap: 0,
        myReaction: post.likedByMe ? 'heart' : undefined,
      }
    );
  });

  // Reshare & Quote state
  const [resharesCount, setResharesCount] = useState<number>(post.resharesCount || 0);
  const [isReshared, setIsReshared] = useState<boolean>(post.resharedByMe || false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [quoteComment, setQuoteComment] = useState<string>('');
  const [myQuote, setMyQuote] = useState<{ author: string; text: string } | null>(null);

  const [copiedToast, setCopiedToast] = useState(false);

  // Check if author has a linked business in the marketplace
  const linkedBusiness = allBusinesses.find(
    (b) =>
      b.ownerId === post.authorId ||
      b.id === post.authorBusinessId ||
      (post.authorBusinessName && b.name.toLowerCase() === post.authorBusinessName.toLowerCase())
  );

  const isFollowingAuthor = currentUser?.followingUserIds?.includes(post.authorId);
  const isMyPost = currentUser?.id === post.authorId;

  const handleToggleLike = () => {
    if (!currentUser) {
      onRequireAuth?.(() => handleToggleLike());
      return;
    }

    setReactions((prev) => {
      const isAlready = prev.myReaction === 'heart';
      return {
        ...prev,
        heart: isAlready ? Math.max(0, prev.heart - 1) : prev.heart + 1,
        myReaction: isAlready ? undefined : 'heart',
      };
    });

    if (onLikeToggle) {
      onLikeToggle(post.id);
    }
  };

  const handleSimpleReshare = () => {
    if (isReshared) {
      setIsReshared(false);
      setResharesCount((c) => Math.max(0, c - 1));
    } else {
      setIsReshared(true);
      setResharesCount((c) => c + 1);
    }
    setIsMoreMenuOpen(false);
  };

  const handleConfirmQuoteReshare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteComment.trim()) return;
    setMyQuote({
      author: currentUser?.fullName || 'You',
      text: quoteComment.trim(),
    });
    setIsReshared(true);
    setResharesCount((c) => c + 1);
    setIsQuoteModalOpen(false);
    setQuoteComment('');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2200);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Academics & GNS':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Student Hustle & Trades':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'SUG & Elections':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Events & Sports':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-neutral-300 bg-neutral-800 border-neutral-700';
    }
  };

  return (
    <article className={`rounded-3xl border bg-neutral-900/90 p-4 backdrop-blur-xl shadow-xl transition-all flex flex-col gap-3 ${
      post.isBreaking
        ? 'border-red-500/50 bg-red-950/20 shadow-red-950/30'
        : 'border-neutral-800 hover:border-neutral-700/80'
    }`}>
      {post.isBreaking && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
          <Zap className="w-3.5 h-3.5" />
          <span>BREAKING NEWS</span>
        </div>
      )}
      
      {/* Top Author Metadata & Academic Identity or Page Identity */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {post.pageName ? (
            <div className="flex items-center gap-3">
              <img
                src={post.pageLogoUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'}
                alt={post.pageName}
                className="w-10 h-10 rounded-xl object-cover border border-neutral-800 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white inline-flex items-center gap-1">
                    <span>{post.pageName}</span>
                    {post.pageIsVerified && (
                      <span title="Verified Page">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      </span>
                    )}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-mono font-bold border ${
                    post.pageType === 'news'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  }`}>
                    {post.pageType === 'news' ? 'News' : 'Club'}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">Official Page Broadcast • {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <LongPressAvatar
                user={{
                  id: post.authorId,
                  fullName: post.authorName,
                  username: post.authorUsername || `@${post.authorName.toLowerCase().replace(/\s+/g, '_')}`,
                  avatarUrl: post.authorAvatar,
                  department: post.authorDept,
                  level: post.authorLevel,
                  faculty: post.authorFaculty,
                  isVerified: post.isVerifiedStudent,
                  hasUnseenSnap: activeSnap ? !activeSnap.hasSeen : false,
                }}
                size="md"
                showRingHint={Boolean(activeSnap)}
                onClick={(e) => {
                  if (activeSnap && onSelectSnap) {
                    onSelectSnap(activeSnap);
                  } else {
                    onOpenAuthorProfile?.(post.authorId);
                  }
                }}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    onClick={() => onOpenAuthorProfile?.(post.authorId)}
                    className="text-xs sm:text-sm font-bold text-white hover:text-orange-400 cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    <span>{post.authorName}</span>
                    {(post.isVerifiedStudent || (post as any).isVerified) && (
                      <span title="Verified Student">
                        <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20 shrink-0" />
                      </span>
                    )}
                  </span>

                  <span className="rounded-md bg-neutral-800 px-2 py-0.5 text-xs font-mono text-neutral-300 border border-neutral-700">
                    {post.authorLevel}
                  </span>

                  {post.authorRole === 'trader' && (
                    <span className="rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 text-xs font-mono font-bold">
                      Trader
                    </span>
                  )}

                  {!isMyPost && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentUser) {
                          onRequireAuth?.(() => toggleFollowUser(post.authorId));
                          return;
                        }
                        toggleFollowUser(post.authorId);
                      }}
                      className={`min-h-[44px] min-w-[44px] flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full transition-all cursor-pointer ${
                        isFollowingAuthor
                          ? 'bg-neutral-800 text-neutral-300 hover:text-red-400 border border-neutral-700'
                          : 'border border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'
                      }`}
                    >
                      {isFollowingAuthor ? (
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
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-300 truncate mt-1">
                  <span>{post.authorDept || 'UNILORIN Student'}</span>
                  <span>•</span>
                  <time>{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category & Location Badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getCategoryColor(post.category)}`}>
            {post.category}
          </span>
          {post.locationTag && (
            <span className="flex items-center gap-1 text-xs text-orange-400 font-mono">
              <MapPin className="h-3.5 w-3.5" />
              <span>{post.locationTag.split(',')[0]}</span>
            </span>
          )}
        </div>
      </div>

      {/* Post Text Content - Minimum 13px */}
      <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line font-medium">
        {post.content}
      </p>

      {/* Attached Media Photo / Video */}
      {post.mediaUrl && (
        <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 aspect-video sm:aspect-auto sm:max-h-96 shadow-lg">
          {post.mediaType === 'video' ? (
            <video
              src={post.mediaUrl}
              controls
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      )}

      {/* Linked Student Business Card */}
      {(() => {
        const hasExplicitAttachedStore = Boolean(post.productSnippet || (post as any).attachedStoreExplicitly || post.authorBusinessId);
        const showStoreCard = linkedBusiness && (post.category === 'Student Hustle & Trades' || hasExplicitAttachedStore);
        if (!showStoreCard || !linkedBusiness) return null;

        return (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-neutral-950 font-bold shrink-0 shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                  <span>{linkedBusiness.name}</span>
                  <span className="text-xs text-orange-300 font-mono font-normal">({linkedBusiness.category})</span>
                  {isMyPost && (
                    <span className="rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                      Your listing
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-300 line-clamp-1">
                  {linkedBusiness.tagline}
                </p>
              </div>
            </div>

            {isMyPost ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onOpenMyStore?.(linkedBusiness)}
                className="min-h-[44px] rounded-xl bg-neutral-800 hover:bg-neutral-700 text-orange-300 border border-orange-500/40 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-2 shadow-md"
              >
                <span>Manage store</span>
                <ExternalLink className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onSelectBusiness?.(linkedBusiness)}
                className="min-h-[44px] rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-2 shadow-md"
              >
                <span>View & Order</span>
                <ExternalLink className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        );
      })()}

      {/* Quoted Repost Render */}
      {myQuote && (
        <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 font-mono">
            <Repeat className="h-4 w-4" />
            <span>Reshared by {myQuote.author}</span>
          </div>
          <p className="text-xs text-neutral-200">{myQuote.text}</p>
        </div>
      )}

      {/* ======================================================== */}
      {/* COLLAPSED SINGLE ROW ACTION BAR (Like, Comment, Share, "...") */}
      {/* Orange is primary action color, Neutral outlines for controls */}
      {/* All buttons min 44x44px touch targets */}
      {/* ======================================================== */}
      <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
        
        {/* Like Button */}
        <button
          type="button"
          disabled={isMyPost}
          onClick={handleToggleLike}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
            isMyPost
              ? 'border border-neutral-800 bg-neutral-900/50 text-neutral-500 cursor-not-allowed'
              : reactions.myReaction === 'heart'
              ? 'border-orange-500/40 bg-orange-500/10 text-orange-400 font-bold cursor-pointer'
              : 'border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white cursor-pointer'
          }`}
          title={isMyPost ? "You cannot like your own post" : "Like Post"}
        >
          <Heart className={`h-4 w-4 ${reactions.myReaction === 'heart' ? 'fill-current text-orange-400' : ''}`} />
          <span className="font-mono text-xs">{reactions.heart}</span>
        </button>

        {/* Comment / Message Button (Hidden on own posts per Rule 2 & 4) */}
        {!isMyPost && (
          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                onRequireAuth?.();
                return;
              }
              if (currentUser && post.authorId === currentUser.id) {
                emitAppToast("You can't message yourself", 'error');
                return;
              }
              if (linkedBusiness) {
                openChatWithBusiness(linkedBusiness, `Saw your post: "${post.content.slice(0, 35)}..."`, undefined, true);
              } else {
                openChatDrawer('requests');
              }
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            title="Comment / Message"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium hidden sm:inline">Comment</span>
          </button>
        )}

        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          title="Share Post Link"
        >
          <Share2 className="h-4 w-4" />
          <span className="text-xs font-medium">{copiedToast ? 'Copied!' : 'Share'}</span>
        </button>

        {/* "..." Dropdown Menu Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer border border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            title="More Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {/* More Options Dropdown Popup */}
          {isMoreMenuOpen && (
            <div className="absolute right-0 bottom-12 z-30 w-48 rounded-2xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl space-y-1">
              <button
                type="button"
                onClick={handleSimpleReshare}
                className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-orange-400 transition-colors"
              >
                <Repeat className="h-4 w-4 text-orange-400" />
                <span>{isReshared ? 'Undo Repost' : `Repost (${resharesCount})`}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setIsQuoteModalOpen(true);
                }}
                className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-orange-400 transition-colors"
              >
                <Quote className="h-4 w-4 text-orange-400" />
                <span>Quote Post</span>
              </button>

              {isMyPost && onDeletePost && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onDeletePost(post.id);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Post</span>
                </button>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Quote Repost Dialog Modal */}
      {isQuoteModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setIsQuoteModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Quote className="h-4 w-4 text-orange-400" />
                <span>Quote Reshare Post</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsQuoteModalOpen(false)} 
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Original Post Preview */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
              <div className="font-bold text-orange-400">{post.authorName} · {post.authorDept}</div>
              <p className="text-neutral-300 line-clamp-2">{post.content}</p>
            </div>

            <form onSubmit={handleConfirmQuoteReshare} className="space-y-4">
              <textarea
                rows={3}
                required
                value={quoteComment}
                onChange={(e) => setQuoteComment(e.target.value)}
                placeholder="Add your thoughts or insights to quote this post..."
                className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-400 resize-none"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  Post Quote Reshare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </article>
  );
};

export default PostCard;

