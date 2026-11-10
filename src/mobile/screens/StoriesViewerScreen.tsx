import React, { useState, useEffect, useRef } from 'react';
import { MoreVertical, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { OfflineReplyManager } from '../database/OfflineReplyManager';
import { deleteSnapFromSupabase } from '../../services/supabase';

export interface MobileStoryItem {
  id: string;
  mediaUrl: string;
  type?: 'image' | 'video';
  caption?: string;
  timestamp: number;
}

export interface StoriesViewerScreenProps {
  author: {
    userId: string;
    username: string;
    fullName?: string;
    avatarUrl: string;
    department?: string;
  };
  stories: MobileStoryItem[];
  onClose: () => void;
  onOpenChatWithAuthor?: (authorId: string, replyInitialText?: string) => void;
  currentUserId?: string;
  onSnapDeleted?: (snapId: string) => void;
}

export const StoriesViewerScreen: React.FC<StoriesViewerScreenProps> = ({
  author,
  stories,
  onClose,
  onOpenChatWithAuthor,
  currentUserId,
  onSnapDeleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [reactionsSent, setReactionsSent] = useState<string[]>([]);
  const [isOfflineQueued, setIsOfflineQueued] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteSnap = async () => {
    if (!currentStory) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteSnapFromSupabase(currentStory.id, currentStory.mediaUrl);
      if (res.success) {
        onSnapDeleted?.(currentStory.id);
        setIsDeleting(false);
        setShowConfirmDelete(false);
        onClose();
      } else {
        setIsDeleting(false);
        setDeleteError(res.error || 'Failed to delete snap. Please try again.');
      }
    } catch (err: any) {
      setIsDeleting(false);
      setDeleteError(err?.message || 'Failed to delete snap. Please try again.');
    }
  };

  const currentStory = stories[currentIndex] || stories[0];
  const STORY_DURATION_MS = 5000;
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedProgressRef = useRef<number>(0);

  // Auto progression timer
  useEffect(() => {
    if (!currentStory) return;

    if (isPaused) {
      clearInterval(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now() - pausedProgressRef.current * STORY_DURATION_MS;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(1, elapsed / STORY_DURATION_MS);
      setProgress(newProgress);

      if (newProgress >= 1) {
        clearInterval(timerRef.current);
        handleNextStory();
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isPaused]);

  const handleNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      pausedProgressRef.current = 0;
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      pausedProgressRef.current = 0;
    } else {
      setProgress(0);
      pausedProgressRef.current = 0;
    }
  };

  const handlePressIn = () => {
    pausedProgressRef.current = progress;
    setIsPaused(true);
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  const handleSendReaction = async (emoji: string) => {
    setReactionsSent((prev) => [...prev, emoji]);
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);

    // Queue in WatermelonDB offline manager
    try {
      await OfflineReplyManager.enqueueReply(currentStory.id, author.userId, 'like', emoji);
      setIsOfflineQueued(true);
      setTimeout(() => setIsOfflineQueued(false), 2000);
    } catch (e) {
      console.warn('Queued reaction error:', e);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyInput.trim()) return;

    const text = replyInput.trim();
    setReplyInput('');

    try {
      await OfflineReplyManager.enqueueReply(currentStory.id, author.userId, 'reply', text);
      setIsOfflineQueued(true);
      setTimeout(() => setIsOfflineQueued(false), 2500);

      if (onOpenChatWithAuthor) {
        onOpenChatWithAuthor(author.userId, `Replying to status: "${text}"`);
      }
    } catch (e) {
      console.warn('Queue reply error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden touch-none">
      {/* Container simulating native phone viewport */}
      <div className="relative w-full max-w-md h-full max-h-[860px] bg-neutral-950 flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Story Media Background */}
        <div
          className="absolute inset-0 z-0 bg-neutral-900"
          onMouseDown={handlePressIn}
          onMouseUp={handlePressOut}
          onTouchStart={handlePressIn}
          onTouchEnd={handlePressOut}
        >
          {currentStory?.mediaUrl ? (
            <img
              src={currentStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-neutral-900 to-amber-950 p-6 text-center text-white">
              <p className="text-xl font-medium leading-relaxed">{currentStory?.caption || 'Campus Update'}</p>
            </div>
          )}

          {/* Touch navigation zones */}
          <div
            className="absolute top-16 left-0 w-1/3 bottom-24 z-10 cursor-pointer"
            onClick={handlePrevStory}
          />
          <div
            className="absolute top-16 right-0 w-2/3 bottom-24 z-10 cursor-pointer"
            onClick={handleNextStory}
          />

          {/* Subtle gradient vignette for text legibility */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/60" />
        </div>

        {/* Top Header & Segmented Progress Bars */}
        <div className="relative z-20 pt-4 px-3 space-y-2.5">
          {/* Segmented Progress Bars (WhatsApp / Instagram style) */}
          <div className="flex gap-1.5 w-full">
            {stories.map((st, idx) => {
              let fill = 0;
              if (idx < currentIndex) fill = 100;
              else if (idx === currentIndex) fill = progress * 100;
              return (
                <div key={st.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-75"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* User Info Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={author.avatarUrl}
                alt={author.username}
                className="w-10 h-10 rounded-full border-2 border-amber-500 object-cover shadow-md"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-wide">{author.username}</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded-full border border-amber-500/30">
                    Campus
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  {author.department || 'Undergraduate'} • {Math.round((Date.now() - currentStory.timestamp) / 3600000)}h ago
                </p>
              </div>
            </div>

            {/* Actions: Pause status indicator & Close button */}
            <div className="flex items-center gap-2 relative">
              {isPaused && (
                <span className="text-[10px] bg-black/60 text-amber-300 px-2 py-0.5 rounded-full backdrop-blur-md">
                  Paused
                </span>
              )}
              {currentUserId && currentUserId === author.userId && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(!showMenu);
                    }}
                    className="h-8 w-8 rounded-full bg-black/60 hover:bg-neutral-800 flex items-center justify-center text-white backdrop-blur-md transition-colors"
                    title="Snap Options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-10 w-44 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-1.5 z-30 animate-in fade-in duration-150">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          setShowConfirmDelete(true);
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Snap</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Reaction Burst Overlay */}
        {showHeartBurst && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none animate-ping duration-700">
            <span className="text-7xl drop-shadow-2xl">❤️</span>
          </div>
        )}

        {/* Offline sync banner if queued */}
        {isOfflineQueued && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-amber-500/90 text-neutral-950 font-bold text-xs rounded-full shadow-lg backdrop-blur-md animate-bounce">
            ⚡ Saved offline — will sync when connected
          </div>
        )}

        {/* Bottom Story Caption & Reply Input (WhatsApp & IG style) */}
        <div className="relative z-20 p-4 space-y-3">
          {currentStory?.caption && (
            <div className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs leading-relaxed max-h-24 overflow-y-auto">
              {currentStory.caption}
            </div>
          )}

          {/* Quick Reaction Tray (WhatsApp Status Reaction Emojis) */}
          <div className="flex justify-between px-2">
            {['❤️', '🔥', '😂', '👏', '🎓', '⚡'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendReaction(emoji)}
                className="text-xl p-1.5 hover:scale-125 active:scale-95 transition-transform"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Direct Reply Bar */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Reply to ${author.username}...`}
              value={replyInput}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              onChange={(e) => setReplyInput(e.target.value)}
              className="flex-1 bg-black/60 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/60 focus:outline-none focus:border-amber-400 backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={!replyInput.trim()}
              className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs disabled:opacity-40 transition-colors shadow-lg shadow-amber-500/20"
            >
              Send
            </button>
          </form>
        </div>

        {/* Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xs rounded-3xl bg-neutral-900 border border-neutral-800 p-6 text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Delete this snap?</h3>
                <p className="text-xs text-neutral-400">This can't be undone and will be removed instantly.</p>
              </div>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteSnap}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-neutral-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
