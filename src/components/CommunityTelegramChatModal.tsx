import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Send, 
  Lock, 
  Unlock, 
  Pin, 
  ShieldCheck, 
  UserPlus, 
  UserMinus, 
  VolumeX, 
  Smile, 
  Hash, 
  Search, 
  Settings, 
  MessageSquare,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Crown,
  Share2
} from 'lucide-react';
import { CampusClub, CommunityMember, CommunityMessage } from '../types';
import { useAuth } from '../context/AuthContext';

interface CommunityTelegramChatModalProps {
  club: CampusClub;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

const INITIAL_DEMO_MEMBERS: CommunityMember[] = [
  {
    id: 'mem_1',
    name: 'Mustapha Babatunde',
    username: '@mustapha_pres',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    role: 'admin',
    customTitle: 'President & Admin',
    joinedAt: '2 months ago',
  },
  {
    id: 'mem_2',
    name: 'Amina Yusuf',
    username: '@amina_lead',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    role: 'admin',
    customTitle: 'Tech Lead / Admin',
    joinedAt: '1 month ago',
  },
  {
    id: 'mem_3',
    name: 'David Oladipo',
    username: '@david_mod',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    role: 'moderator',
    customTitle: 'Community Moderator',
    joinedAt: '3 weeks ago',
  },
  {
    id: 'mem_4',
    name: 'Blessing Kalu',
    username: '@blessing_k',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100',
    role: 'member',
    joinedAt: '1 week ago',
  },
  {
    id: 'mem_5',
    name: 'Chidi Okonkwo',
    username: '@chidi_dev',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    role: 'member',
    joinedAt: '3 days ago',
  },
];

const INITIAL_DEMO_MESSAGES: CommunityMessage[] = [
  {
    id: 'cmsg_1',
    channelId: 'general',
    senderId: 'mem_1',
    senderName: 'Mustapha Babatunde',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    senderRole: 'admin',
    customTitle: 'President & Admin',
    text: 'Welcome everyone to the official UNILORIN Supergroup! Please review the pinned schedule for upcoming hackathons and townhall sessions.',
    timestamp: '10:15 AM',
    pinned: true,
  },
  {
    id: 'cmsg_2',
    channelId: 'general',
    senderId: 'mem_2',
    senderName: 'Amina Yusuf',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    senderRole: 'admin',
    customTitle: 'Tech Lead / Admin',
    text: 'Registration for the Cloud Architecture workshop at the CIS Auditorium is now live. First 50 students get free cloud credits.',
    timestamp: '11:42 AM',
  },
  {
    id: 'cmsg_3',
    channelId: 'general',
    senderId: 'mem_4',
    senderName: 'Blessing Kalu',
    senderAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100',
    senderRole: 'member',
    text: 'Is the workshop open to 100L beginners as well, or strictly final year students?',
    timestamp: '12:05 PM',
  },
  {
    id: 'cmsg_4',
    channelId: 'general',
    senderId: 'mem_1',
    senderName: 'Mustapha Babatunde',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    senderRole: 'admin',
    customTitle: 'President & Admin',
    text: 'Open to all levels across all faculties! Beginners will have dedicated mentors.',
    timestamp: '12:08 PM',
  },
];

export const CommunityTelegramChatModal: React.FC<CommunityTelegramChatModalProps> = ({
  club,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { currentUser } = useAuth();
  
  // Telegram Sub-Channels / Topics
  const [activeChannelId, setActiveChannelId] = useState<'general' | 'announcements' | 'events' | 'resources'>('general');
  
  // WhatsApp Admin Control: Chat Lock ("Only Admins Can Send Messages")
  const [isChatLocked, setIsChatLocked] = useState<boolean>(club.isChatLocked || false);
  
  // Member Management Drawer
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false);
  const [members, setMembers] = useState<CommunityMember[]>(INITIAL_DEMO_MEMBERS);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  
  // Message Stream
  const [messages, setMessages] = useState<CommunityMessage[]>(INITIAL_DEMO_MESSAGES);
  const [inputText, setInputText] = useState('');

  // Add Member Input
  const [newMemberName, setNewMemberName] = useState('');

  if (!isOpen) return null;

  const currentUserMember = currentUser ? members.find((m) => m.id === currentUser.id || m.username === `@${currentUser.username}`) : null;
  const isAdmin = Boolean(
    currentUser && (
      currentUser.isAdmin || 
      currentUser.staffRole === 'super_admin' || 
      currentUser.staffRole === 'page_moderator' || 
      currentUserMember?.role === 'admin' || 
      currentUserMember?.role === 'moderator'
    )
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (isChatLocked && !isAdmin) {
      alert('This group is currently locked by admins. Only designated community admins can send messages.');
      return;
    }

    const newMsg: CommunityMessage = {
      id: `cmsg_${Date.now()}`,
      channelId: activeChannelId,
      senderId: currentUser?.id || 'usr_me',
      senderName: currentUser?.fullName || 'You (Student)',
      senderAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      senderRole: isAdmin ? 'admin' : 'member',
      customTitle: isAdmin ? 'Verified Admin' : undefined,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleToggleChatLock = () => {
    const nextState = !isChatLocked;
    setIsChatLocked(nextState);
    onShowToast?.(
      nextState
        ? '🔒 Group chat locked: Only admins can send messages now.'
        : '🔓 Group chat unlocked: All members can communicate freely.'
    );
  };

  const handleRemoveMember = (id: string, name: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    onShowToast?.(`${name} was removed from the community group.`);
  };

  const handleToggleMuteMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const next = !m.isMuted;
          onShowToast?.(next ? `${m.name} is now muted in this group.` : `${m.name} unmuted.`);
          return { ...m, isMuted: next };
        }
        return m;
      })
    );
  };

  const handlePromoteAdmin = (id: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          onShowToast?.(`🎉 ${m.name} promoted to Community Admin.`);
          return { ...m, role: 'admin', customTitle: 'Admin & Coordinator' };
        }
        return m;
      })
    );
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const newMem: CommunityMember = {
      id: `mem_${Date.now()}`,
      name: newMemberName.trim(),
      username: `@${newMemberName.toLowerCase().replace(/\s+/g, '_')}`,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: 'member',
      joinedAt: 'Just now',
    };
    setMembers((prev) => [...prev, newMem]);
    setNewMemberName('');
    onShowToast?.(`${newMem.name} added to the group!`);
  };

  const filteredMembers = members.filter((m) => {
    if (!searchMemberQuery.trim()) return true;
    const q = searchMemberQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
  });

  const channels = [
    { id: 'general', name: 'General Chat', icon: Hash },
    { id: 'announcements', name: 'Announcements', icon: Pin },
    { id: 'events', name: 'Events & Workshops', icon: Sparkles },
    { id: 'resources', name: 'Shared Docs & Media', icon: Paperclip },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="w-full h-full sm:max-w-5xl sm:h-[90vh] rounded-none sm:rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl flex flex-col overflow-hidden text-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ======================================================== */}
        {/* TOP SUPERGROUP HEADER (Telegram / WhatsApp Hybrid) */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={club.logoUrl}
              alt={club.name}
              className="h-10 w-10 rounded-2xl object-cover border border-neutral-700 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white truncate">{club.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Telegram Supergroup
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                <span>{(club.memberCount || 0).toLocaleString()} members</span>
                {isChatLocked && (
                  <>
                    <span>•</span>
                    <span className="text-rose-400 font-bold flex items-center gap-0.5">
                      <Lock className="h-3 w-3" /> Chat Locked (Admins Only)
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* WhatsApp Admin Broadcast Lock Toggle */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleToggleChatLock}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                  isChatLocked
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500 hover:text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
                title="Toggle Admin-Only Messaging (Lock Group)"
              >
                {isChatLocked ? <Lock className="h-3.5 w-3.5 text-rose-400" /> : <Unlock className="h-3.5 w-3.5 text-emerald-400" />}
                <span className="hidden sm:inline">{isChatLocked ? 'Unlock Chat' : 'Lock Chat (Admin Only)'}</span>
              </button>
            )}

            {/* Members Management Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsMemberManagerOpen(!isMemberManagerOpen)}
              className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                isMemberManagerOpen
                  ? 'bg-amber-500 text-neutral-950 border-amber-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title="Manage Group Members & Permissions"
            >
              <Users className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pinned Announcement Banner */}
        <div className="px-5 py-2.5 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-400 text-[11px] shrink-0">Pinned Message:</span>
            <p className="text-neutral-300 truncate text-[11px]">
              Annual General Meeting & Hackathon Registration: Saturday 10:00 AM at SUB Lawn.
            </p>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono shrink-0 ml-2">Jump ➔</span>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sub-Channels Sidebar (Telegram Model) */}
          <div className="w-56 border-r border-neutral-800 bg-neutral-950/70 p-3 hidden md:flex flex-col space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider px-2 py-1">
              Sub-Channels & Topics
            </span>
            {channels.map((ch) => {
              const Icon = ch.icon;
              const isSel = activeChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannelId(ch.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    isSel
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Stream Window */}
          <div className="flex-1 flex flex-col bg-[#0d141b] overflow-hidden">
            
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isAdminSender = msg.senderRole === 'admin';
                return (
                  <div key={msg.id} className="flex items-start gap-3 group">
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      className="h-9 w-9 rounded-xl object-cover border border-neutral-700 shrink-0 mt-0.5"
                    />

                    <div className="flex-1 min-w-0 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3 shadow-md max-w-xl">
                      <div className="flex items-center gap-2 justify-between mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{msg.senderName}</span>
                          {isAdminSender && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                              <Crown className="h-2.5 w-2.5" />
                              <span>{msg.customTitle || 'Admin'}</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono">{msg.timestamp}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Composer Bar */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950">
              {isChatLocked && !isAdmin ? (
                /* Locked Banner (WhatsApp Broadcast Mode) */
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4 text-rose-400" />
                  <span>Only community admins can send messages to this group</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isChatLocked ? "Broadcasting as Admin..." : `Message #${activeChannelId}...`}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                  />

                  <button
                    type="submit"
                    className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* WHATSAPP-STYLE ADMIN GOVERNANCE & MEMBER MANAGEMENT PANEL */}
          {/* ======================================================== */}
          {isMemberManagerOpen && (
            <div className="w-80 sm:w-96 border-l border-neutral-800 bg-neutral-950 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
              
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Community Members ({members.length})
                  </h4>
                  <p className="text-[10px] text-neutral-400">Admin Governance & Autonomy</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMemberManagerOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="p-3 border-b border-neutral-800 flex gap-1.5">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Student name to add..."
                  className="flex-1 p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </form>

              {/* Members List with Action Menu */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredMembers.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={mem.avatarUrl}
                        alt={mem.name}
                        className="h-9 w-9 rounded-xl object-cover border border-neutral-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-white truncate">{mem.name}</span>
                          {mem.role === 'admin' && (
                            <Crown className="h-3 w-3 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono truncate block">
                          {mem.customTitle || mem.username}
                        </span>
                      </div>
                    </div>

                    {/* Admin Action Menu for Member */}
                    <div className="flex items-center gap-1 shrink-0">
                      {mem.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handlePromoteAdmin(mem.id)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 transition-colors"
                          title="Promote to Admin"
                        >
                          <Crown className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleMuteMember(mem.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          mem.isMuted
                            ? 'bg-rose-500 text-white'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
                        }`}
                        title={mem.isMuted ? 'Unmute Member' : 'Mute Member'}
                      >
                        <VolumeX className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(mem.id, mem.name)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-500 hover:text-white text-neutral-400 transition-colors"
                        title="Remove / Kick from Group"
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group Permissions Config */}
              <div className="p-3 border-t border-neutral-800 bg-neutral-950 text-[11px] text-neutral-400 space-y-1">
                <span className="font-bold text-neutral-300 block">WhatsApp Governance Rules:</span>
                <p>• Only admins can pin messages & change group info</p>
                <p>• Members must follow campus honor code</p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CommunityTelegramChatModal;
