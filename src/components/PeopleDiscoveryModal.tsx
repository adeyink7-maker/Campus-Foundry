import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Users, ShieldCheck, UserPlus, Check, Sparkles } from 'lucide-react';
import { fetchBalancedPeopleSuggestionsFromSupabase } from '../services/supabase';
import { AppUser } from '../types';

interface PeopleDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onSelectUser: (user: AppUser) => void;
  onToggleFollow: (userId: string) => void;
}

export const PeopleDiscoveryModal: React.FC<PeopleDiscoveryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onToggleFollow,
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSuggestions = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    const results = await fetchBalancedPeopleSuggestionsFromSupabase(currentUser.id, 30);
    setSuggestions(results);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      loadSuggestions();
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Discover Campus Peers</h2>
              <p className="text-[11px] text-neutral-400">Balanced mix of departmental peers, hostel mates & campus scholars</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSuggestions}
              disabled={isLoading}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
              title="Refresh suggestions"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-20 text-neutral-400 text-xs">Finding balanced peers...</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((peer) => {
              const isFollowing = currentUser.followingUserIds?.includes(peer.id);
              return (
                <div
                  key={peer.id}
                  className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => {
                      onSelectUser({
                        id: peer.id,
                        email: '',
                        fullName: peer.fullName,
                        username: peer.username,
                        role: 'student',
                        faculty: peer.faculty,
                        department: peer.department,
                        level: peer.level || '300L',
                        avatarUrl: peer.avatarUrl,
                        isVerified: peer.isVerified,
                        bio: peer.bio,
                      });
                      onClose();
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <img
                      src={peer.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt={peer.fullName}
                      className="h-12 w-12 rounded-full object-cover border-2 border-amber-500/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">{peer.fullName}</h4>
                        {peer.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] font-mono text-neutral-400 truncate">@{peer.username || 'student'}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-semibold">
                          {peer.suggestionReason}
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate">• {peer.department || peer.faculty || 'Undergraduate'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleFollow(peer.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isFollowing
                        ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        : 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-md'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-neutral-500 text-xs">No peer suggestions available right now.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeopleDiscoveryModal;
