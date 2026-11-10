import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  CheckCheck, 
  Check, 
  Store, 
  ShieldCheck, 
  Clock, 
  ChevronLeft,
  MoreVertical,
  Trash2,
  Mic,
  MicOff,
  Paperclip,
  Smile,
  Play,
  Pause,
  CornerUpLeft,
  UserX,
  Palette,
  Eye,
  Lock,
  ArrowDown,
  Copy,
  Heart,
  ThumbsUp,
  Flame,
  SmilePlus,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useChat, SendMessageOptions } from '../context/ChatContext';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';
import { useAuth } from '../context/AuthContext';
import { ChatThemeMode } from '../types';
import { uploadVoiceNoteAudio, getPlayableAudioUrl } from '../services/supabase';
import { getFriendlyError } from '../utils/friendlyErrors';

export type ChatScreenRatio = 'standard' | 'wide' | 'compact';

export const ChatDrawer = () => {
  const { 
    isChatDrawerOpen, 
    closeChatDrawer, 
    primaryConversations,
    requestConversations,
    pendingRequestsCount,
    activeConversation, 
    activeConversationId, 
    setActiveConversationId, 
    activeMessages, 
    sendMessage, 
    sendTyping, 
    typingUser, 
    isConnected,
    chatTheme,
    setChatTheme,
    onlinePrivacy,
    setOnlinePrivacy,
    acceptMessageRequest,
    declineMessageRequest,
    blockMessageRequest,
    toggleMessageReaction,
    clearAllChats
  } = useChat();

  const { conversations: marketplaceConversations, openMarketplaceChat } = useMarketplaceChat();
  const { currentUser } = useAuth();
  
  // Navigation tabs: 'primary' vs 'requests' vs 'marketplace'
  const [activeTab, setActiveTab] = useState<'primary' | 'requests' | 'marketplace'>('primary');
  
  // Input & Reply state
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);
  
  // Voice note recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Voice note playback speeds per message: id -> speed (1, 1.5, 2)
  const [voicePlaybackSpeeds, setVoicePlaybackSpeeds] = useState<Record<string, number>>({});
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Media Attachment Modal State
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; name: string; type: 'image' | 'file' } | null>(null);
  const [attachmentCaption, setAttachmentCaption] = useState('');

  // Dropdown More Menu State
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Active Long-Press / Context Menu Message ID
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // UI Scroll & Latest button
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages.length, typingUser, activeConversationId]);

  // Handle Scroll to toggle Floating "Scroll to latest" Button
  const handleScrollMessages = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isUp);
  };

  const scrollToLatest = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Toast notification state
  const [chatToast, setChatToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setChatToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setChatToast(null);
    }, 4000);
  };

  useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.message) {
        showToast(detail.message, detail.type || 'error');
      }
    };
    window.addEventListener('campus-toast', handleGlobalToast);
    return () => {
      window.removeEventListener('campus-toast', handleGlobalToast);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  if (!isChatDrawerOpen) return null;

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    sendTyping(false);

    const options: SendMessageOptions = {};
    if (replyingTo) {
      options.replyTo = replyingTo;
      setReplyingTo(null);
    }

    try {
      await sendMessage(textToSend, options);
      scrollToLatest();
    } catch (err: unknown) {
      console.error('[Send Message Error]:', err);
      showToast(getFriendlyError(err, 'dm'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const handleStartVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = 'Microphone recording is not supported in this browser environment.';
        showToast(msg);
        setMicPermissionDenied(true);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(200);
      setMicPermissionDenied(false);
      setMicErrorMessage(null);
      setIsRecordingVoice(true);
    } catch (err: any) {
      const isPermissionDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.name === 'SecurityError';

      let msg = '';
      if (isPermissionDenied) {
        msg = 'Microphone access blocked. Please enable mic permissions in browser settings.';
      } else {
        msg = `Could not access microphone: ${err?.message || 'Device error'}`;
      }

      showToast(msg);
      setMicErrorMessage(msg);
      setMicPermissionDenied(true);
    }
  };

  const handleCancelVoiceRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      audioChunksRef.current = [];
    } catch {
      // safe cleanup
    }
    setMicPermissionDenied(false);
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
  };

  const handleSendVoiceRecording = async () => {
    setIsUploadingVoice(true);
    const duration = Math.max(1, recordingSeconds);
    const userId = currentUser?.id || 'usr_me';

    let voiceNotePath = '';

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          if (!mediaRecorderRef.current) return resolve();
          mediaRecorderRef.current.onstop = () => resolve();
          mediaRecorderRef.current.stop();
        });
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;

      if (audioChunksRef.current.length > 0) {
        const rawMime = audioChunksRef.current[0].type || 'audio/webm';
        const cleanMime = rawMime.split(';')[0].trim();
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
        audioChunksRef.current = [];

        voiceNotePath = await uploadVoiceNoteAudio(audioBlob, userId);
      } else {
        showToast('No audio recorded.');
        setIsUploadingVoice(false);
        setIsRecordingVoice(false);
        setRecordingSeconds(0);
        return;
      }

      const sampleWaveform = Array.from({ length: 16 }, () => Math.floor(Math.random() * 65 + 30));

      await sendMessage('', {
        voiceNote: {
          url: voiceNotePath,
          duration,
          waveform: sampleWaveform,
        },
        replyTo: replyingTo || undefined,
      });
      scrollToLatest();
    } catch (err: unknown) {
      console.error('[Send Voice Note Error]:', err);
      showToast(getFriendlyError(err, 'voice'));
    } finally {
      setIsUploadingVoice(false);
      setIsRecordingVoice(false);
      setMicPermissionDenied(false);
      setRecordingSeconds(0);
      setReplyingTo(null);
    }
  };

  const handleToggleVoicePlay = (msgId: string, url: string) => {
    if (playingVoiceId === msgId) {
      audioPlayerRef.current?.pause();
      setPlayingVoiceId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const playableSrc = getPlayableAudioUrl(url);
      const audio = new Audio(playableSrc);
      const currentSpeed = voicePlaybackSpeeds[msgId] || 1;
      audio.playbackRate = currentSpeed;
      audio.onended = () => setPlayingVoiceId(null);
      audio.onerror = () => {
        showToast(`Could not play voice note: failed to load audio.`);
        setPlayingVoiceId(null);
      };
      audio.play().catch(() => {
        setPlayingVoiceId(null);
      });
      audioPlayerRef.current = audio;
      setPlayingVoiceId(msgId);
    }
  };

  const handleCycleSpeed = (msgId: string) => {
    const currentSpeed = voicePlaybackSpeeds[msgId] || 1;
    const nextSpeed = currentSpeed === 1 ? 1.5 : currentSpeed === 1.5 ? 2 : 1;
    setVoicePlaybackSpeeds((prev) => ({ ...prev, [msgId]: nextSpeed }));
    if (playingVoiceId === msgId && audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSendAttachment = async () => {
    if (!attachmentPreview) return;
    await sendMessage(attachmentCaption.trim(), {
      attachment: attachmentPreview,
      replyTo: replyingTo || undefined,
    });
    setAttachmentPreview(null);
    setAttachmentCaption('');
    setIsAttachmentModalOpen(false);
    setReplyingTo(null);
    scrollToLatest();
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format Duration correctly (0:10 instead of 0:010)
  const formatVoiceDuration = (sec: number = 0) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Date Header Formatter
  const getMessageDateLabel = (isoString: string) => {
    try {
      const msgDate = new Date(isoString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (msgDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      if (msgDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const isCurrentConvARequest = Boolean(
    activeConversation &&
    activeConversation.isMessageRequest &&
    activeConversation.requestStatus === 'pending'
  );

  const handleCopyMessageText = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeChatDrawer}
    >
      <div 
        className="w-full h-full sm:max-w-5xl sm:h-[88vh] rounded-none sm:rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl flex flex-col overflow-hidden text-neutral-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Error / Alert Toast Notification */}
        {chatToast && (
          <div className={`absolute top-14 left-4 right-4 z-50 flex items-center justify-between gap-3 p-3 rounded-2xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 ${
            chatToast.type === 'success'
              ? 'bg-emerald-600/95 border-emerald-400 text-white'
              : 'bg-rose-600/95 border-rose-400 text-white'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 shrink-0 text-white" />
              <span className="text-xs font-semibold truncate">{chatToast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setChatToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 text-white shrink-0 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {copiedToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-neutral-800 border border-neutral-700 text-white text-xs font-semibold shadow-xl animate-in fade-in">
            Message copied to clipboard
          </div>
        )}
        
        {/* ======================================================== */}
        {/* SLIM MESSENGER HEADER BAR                                */}
        {/* ======================================================== */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md shrink-0 z-20">
          
          <div className="flex items-center gap-3 min-w-0">
            {activeConversation ? (
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveConversationId(null)}
                  className="p-1.5 -ml-1.5 rounded-xl bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="relative shrink-0">
                  <div className="h-9 w-9 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 flex items-center justify-center">
                    {activeConversation.businessImageUrl ? (
                      <img 
                        src={activeConversation.businessImageUrl} 
                        alt={activeConversation.businessName} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <Store className="h-4 w-4 text-orange-400" />
                    )}
                  </div>
                  {activeConversation.isOnline && onlinePrivacy !== 'nobody' && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-[280px]">
                      {activeConversation.businessName}
                    </h3>
                    <ShieldCheck className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  </div>

                  {/* Slim status line: online, last seen, or typing... */}
                  <div className="text-[11px] text-neutral-400 truncate">
                    {typingUser ? (
                      <span className="text-orange-400 font-medium animate-pulse">typing...</span>
                    ) : activeConversation.isOnline && onlinePrivacy !== 'nobody' ? (
                      <span className="text-emerald-400 font-medium">Online</span>
                    ) : (
                      <span className="text-neutral-500">
                        {activeConversation.traderName || 'Active student'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Direct Messages</h3>
                  <p className="text-[10px] text-neutral-400">Campus Foundry Direct Threads</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Right Header Controls */}
          <div className="flex items-center gap-1">
            {/* More Menu Dropdown */}
            {activeConversation && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Chat Options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-11 z-50 w-48 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-1.5 text-xs animate-in fade-in space-y-0.5">
                    <div className="px-2 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                      Chat Settings
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setChatTheme(chatTheme === 'dark' ? 'whatsapp' : 'dark');
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-orange-400" />
                        <span>Toggle Wallpaper</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearAllChats();
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 transition-colors font-medium cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear History</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Close Drawer Button */}
            <button
              type="button"
              onClick={closeChatDrawer}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN TWO-PANEL SPLIT BODY                                */}
        {/* ======================================================== */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ------------------------------------------------------ */}
          {/* LEFT CONVERSATION LIST                                 */}
          {/* ------------------------------------------------------ */}
          <div className={`${activeConversation ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 md:w-88 flex-col border-r border-neutral-800/80 bg-neutral-950 shrink-0`}>
            
            {/* Tab Switcher */}
            <div className="p-2.5 border-b border-neutral-800 bg-neutral-950 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('primary')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'primary'
                    ? 'bg-orange-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>Primary</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'primary' ? 'bg-neutral-950/20 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {primaryConversations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'requests'
                    ? 'bg-orange-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <span>Requests</span>
                {pendingRequestsCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500 text-white font-extrabold animate-pulse">
                    {pendingRequestsCount}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-400">
                    0
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('marketplace')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'marketplace'
                    ? 'bg-orange-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Trade</span>
              </button>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {activeTab === 'primary' ? (
                primaryConversations.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-xs">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                    <p className="font-bold text-neutral-300">No active chats yet</p>
                    <p className="text-[11px] mt-1">Message student vendors or peers across campus.</p>
                  </div>
                ) : (
                  primaryConversations.map((conv) => {
                    const isSelected = conv.id === activeConversationId;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setActiveConversationId(conv.id)}
                        className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                          isSelected
                            ? 'bg-neutral-800 border border-neutral-700/80 shadow-sm'
                            : 'hover:bg-neutral-900'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={conv.businessImageUrl || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=100'}
                            alt={conv.businessName}
                            className="h-10 w-10 rounded-full object-cover border border-neutral-700"
                          />
                          {conv.isOnline && onlinePrivacy !== 'nobody' && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white truncate">{conv.businessName}</h4>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {formatMessageTime(conv.lastMessageTimestamp)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[11px] text-neutral-400 truncate pr-2">
                              {conv.lastMessage}
                            </p>
                            {conv.unreadCount > 0 && (
                              <span className="h-4 min-w-[16px] px-1 rounded-full bg-orange-500 text-neutral-950 text-[10px] font-bold font-mono flex items-center justify-center">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : activeTab === 'requests' ? (
                requestConversations.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-xs">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="font-bold text-neutral-300">No message requests</p>
                  </div>
                ) : (
                  requestConversations.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setActiveConversationId(req.id)}
                      className="p-3 rounded-2xl cursor-pointer transition-all border bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 flex items-center gap-3"
                    >
                      <img
                        src={req.businessImageUrl || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100'}
                        alt={req.businessName}
                        className="h-10 w-10 rounded-full object-cover border border-neutral-700 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{req.businessName}</h4>
                          <span className="text-[9px] font-mono text-orange-400 font-bold uppercase">Pending</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {req.lastMessage}
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : (
                marketplaceConversations.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-xs space-y-2">
                    <Store className="h-8 w-8 mx-auto text-orange-400" />
                    <p className="font-bold text-neutral-300">No trade chats yet</p>
                  </div>
                ) : (
                  marketplaceConversations.map((conv) => {
                    const isTrader = currentUser && currentUser.id === conv.traderId;
                    const unread = isTrader ? conv.traderUnread : conv.buyerUnread;
                    const displayName = isTrader
                      ? (conv.buyerName || conv.businessName || 'Student Buyer')
                      : (conv.businessName || 'Campus Store');

                    return (
                      <div
                        key={conv.id}
                        onClick={() => openMarketplaceChat(conv.id)}
                        className="p-3 rounded-2xl cursor-pointer transition-all border bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {conv.businessImageUrl ? (
                              <img src={conv.businessImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Store className="w-4 h-4 text-orange-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{displayName}</h4>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {conv.lastMessage || 'No messages yet'}
                            </p>
                          </div>
                        </div>

                        {unread > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-neutral-950 text-[10px] font-extrabold shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* RIGHT CHAT MESSENGER WINDOW                            */}
          {/* ------------------------------------------------------ */}
          <div className={`${activeConversation ? 'flex' : 'hidden sm:flex'} flex-1 flex-col overflow-hidden relative bg-neutral-950`}>
            
            {activeConversation ? (
              <>
                {/* Messages Stream Container */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScrollMessages}
                  className="flex-1 overflow-y-auto p-4 space-y-1 relative"
                >
                  {/* Render messages grouped by date & consecutive senders */}
                  {activeMessages.map((msg, idx) => {
                    const isMe = msg.senderId === (currentUser?.id || 'usr_me') || msg.senderName === 'You';
                    const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;

                    // Grouping math
                    const prevMsg = activeMessages[idx - 1];
                    const nextMsg = activeMessages[idx + 1];

                    const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;
                    const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

                    // Date Header Check
                    const dateLabel = getMessageDateLabel(msg.timestamp);
                    const prevDateLabel = prevMsg ? getMessageDateLabel(prevMsg.timestamp) : null;
                    const showDateHeader = dateLabel && dateLabel !== prevDateLabel;

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Date Separator Pill */}
                        {showDateHeader && (
                          <div className="flex justify-center my-3">
                            <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-medium text-neutral-400 shadow-xs">
                              {dateLabel}
                            </span>
                          </div>
                        )}

                        <div 
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg relative ${
                            isLastInGroup ? 'mb-2' : 'mb-0.5'
                          }`}
                        >
                          {/* Quoted Reply snippet */}
                          {msg.replyToMessage && (
                            <div className={`mb-1 max-w-sm rounded-xl p-2 text-xs border border-neutral-700 bg-neutral-900 text-neutral-300 flex items-start gap-1.5 ${isMe ? 'mr-1' : 'ml-1'}`}>
                              <CornerUpLeft className="h-3 w-3 text-orange-400 shrink-0 mt-0.5" />
                              <div className="truncate">
                                <span className="font-bold text-orange-400 text-[10px] block">{msg.replyToMessage.senderName}</span>
                                <span className="text-[11px] truncate block text-neutral-300">{msg.replyToMessage.text}</span>
                              </div>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            onClick={() => setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)}
                            className={`relative max-w-[85%] sm:max-w-md p-3 transition-all cursor-pointer ${
                              isMe
                                ? 'bg-orange-500 text-neutral-950 font-medium rounded-2xl rounded-tr-xs'
                                : 'bg-neutral-800 text-white rounded-2xl rounded-tl-xs border border-neutral-700/60'
                            }`}
                          >
                            {/* Sender name for first message in group from recipient */}
                            {!isMe && isFirstInGroup && (
                              <div className="text-[10px] font-bold text-orange-400 mb-0.5">
                                {msg.senderName}
                              </div>
                            )}

                            {/* Media Attachment */}
                            {msg.attachmentUrl && (
                              <div className="mb-2 rounded-xl overflow-hidden border border-black/20 max-h-60 bg-neutral-950">
                                {msg.attachmentType === 'image' ? (
                                  <img src={msg.attachmentUrl} alt="Attachment" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="p-3 flex items-center gap-2 text-xs text-white">
                                    <Paperclip className="h-4 w-4 text-orange-400" />
                                    <span className="truncate">{msg.attachmentName || 'Document'}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Voice Note Player */}
                            {msg.voiceNoteUrl && (
                              <div className={`p-2 rounded-xl mb-1 flex items-center gap-2.5 ${isMe ? 'bg-orange-600/30' : 'bg-neutral-900/80'}`}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleVoicePlay(msg.id, msg.voiceNoteUrl!);
                                  }}
                                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer ${
                                    isMe ? 'bg-neutral-950 text-orange-400' : 'bg-orange-500 text-neutral-950'
                                  }`}
                                >
                                  {playingVoiceId === msg.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                                </button>

                                {/* Waveform Bars */}
                                <div className="flex-1 flex items-center gap-1 h-5">
                                  {(msg.voiceWaveform || [40, 70, 90, 50, 80, 60, 30, 95, 75, 45, 60, 80]).map((val, bIdx) => (
                                    <span
                                      key={bIdx}
                                      style={{ height: `${Math.max(20, val)}%` }}
                                      className={`w-1 rounded-full ${
                                        playingVoiceId === msg.id ? 'bg-emerald-400 animate-pulse' : isMe ? 'bg-neutral-950/70' : 'bg-neutral-400'
                                      }`}
                                    />
                                  ))}
                                </div>

                                <span className="text-[10px] font-mono font-bold">
                                  {formatVoiceDuration(msg.voiceDuration || 10)}
                                </span>

                                {/* Speed Toggle */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCycleSpeed(msg.id);
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border cursor-pointer ${
                                    isMe ? 'border-neutral-950/30 bg-neutral-950/20 text-neutral-950' : 'border-neutral-700 bg-neutral-800 text-neutral-300'
                                  }`}
                                >
                                  {voicePlaybackSpeeds[msg.id] || 1}x
                                </button>
                              </div>
                            )}

                            {/* Text Content */}
                            {msg.text && (
                              <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                {msg.text}
                              </p>
                            )}

                            {/* Timestamp & Status ticks (only shown on last message of group or if media/voice) */}
                            {(isLastInGroup || msg.voiceNoteUrl || msg.attachmentUrl) && (
                              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-neutral-950/70' : 'text-neutral-400'}`}>
                                <span>{formatMessageTime(msg.timestamp)}</span>
                                {isMe && (
                                  <span title={msg.isRead || msg.deliveryState === 'read' ? 'Read' : 'Sent'}>
                                    {msg.isRead || msg.deliveryState === 'read' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-neutral-950 font-extrabold" />
                                    ) : msg.deliveryState === 'delivered' ? (
                                      <CheckCheck className="h-3.5 w-3.5 text-neutral-900/60" />
                                    ) : (
                                      <Check className="h-3.5 w-3.5 text-neutral-900/60" />
                                    )}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Context Action Menu for Long Press / Tap */}
                            {activeMenuMsgId === msg.id && (
                              <div 
                                className="absolute bottom-full mb-1 right-0 z-30 flex items-center gap-1 p-1 rounded-2xl bg-neutral-900 border border-neutral-700 shadow-2xl animate-in fade-in"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {['❤️', '👍', '🔥', '😂', '😮', '👏'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      toggleMessageReaction(msg.id, emoji);
                                      setActiveMenuMsgId(null);
                                    }}
                                    className="p-1 text-sm hover:scale-125 transition-transform cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo({ id: msg.id, senderName: msg.senderName, text: msg.text || 'Voice note' });
                                    setActiveMenuMsgId(null);
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                                  title="Reply"
                                >
                                  <CornerUpLeft className="h-3.5 w-3.5" />
                                </button>
                                {msg.text && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleCopyMessageText(msg.text!);
                                      setActiveMenuMsgId(null);
                                    }}
                                    className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                                    title="Copy"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Reaction Badges */}
                          {hasReactions && (
                            <div className={`flex items-center gap-1 -mt-1.5 z-10 ${isMe ? 'mr-1' : 'ml-1'}`}>
                              {Object.entries(msg.reactions!).map(([emoji, users]) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleMessageReaction(msg.id, emoji)}
                                  className="px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-[10px] shadow-sm flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform"
                                >
                                  <span>{emoji}</span>
                                  <span className="text-[9px] font-mono text-neutral-400 font-bold">{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}

                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Floating "Scroll to latest" Button */}
                {showScrollBottom && (
                  <button
                    type="button"
                    onClick={scrollToLatest}
                    className="absolute bottom-20 right-4 z-20 p-2.5 rounded-full bg-neutral-900 border border-neutral-700 text-orange-400 shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title="Scroll to latest message"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                )}

                {/* Quoted Message Active Bar */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-xs shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <CornerUpLeft className="h-4 w-4 text-orange-400 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-orange-400 block text-[10px]">Replying to {replyingTo.senderName}</span>
                        <span className="text-neutral-300 text-[11px] truncate block">{replyingTo.text}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* ==================================================== */}
                {/* BOTTOM COMPOSER INPUT BAR                            */}
                {/* ==================================================== */}
                <div className="p-3 border-t border-neutral-800 bg-neutral-950 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
                  {micPermissionDenied && (
                    <div className="mb-2 p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <MicOff className="h-4 w-4 text-orange-400 shrink-0" />
                        <span className="truncate">{micErrorMessage || 'Microphone access blocked. Click retry to allow mic.'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStartVoiceRecording}
                        className="px-2 py-1 rounded-lg bg-orange-500 text-neutral-950 font-bold text-[10px] cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {isRecordingVoice ? (
                    <div className="flex items-center justify-between gap-3 p-2 bg-neutral-900 rounded-3xl border border-rose-500/40">
                      <div className="flex items-center gap-2.5 px-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-mono font-bold text-rose-400">
                          {recordingSeconds}s
                        </span>
                        <span className="text-[11px] text-neutral-400 hidden sm:inline">Hold or slide to cancel</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelVoiceRecording}
                          className="px-3 py-1.5 rounded-2xl bg-neutral-800 text-neutral-300 text-xs font-bold hover:bg-neutral-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isUploadingVoice}
                          onClick={handleSendVoiceRecording}
                          className="px-4 py-1.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-60 cursor-pointer"
                        >
                          {isUploadingVoice ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Send</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                      {/* Attach Button */}
                      <button
                        type="button"
                        onClick={() => setIsAttachmentModalOpen(true)}
                        className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-orange-400 transition-colors cursor-pointer shrink-0"
                        title="Attach file"
                      >
                        <Paperclip className="h-5 w-5" />
                      </button>

                      {/* Bigger Rounded Input Bar */}
                      <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder={isCurrentConvARequest ? "Accept request above..." : "Type a message..."}
                        disabled={isCurrentConvARequest}
                        className="flex-1 px-5 py-3 rounded-full bg-neutral-900 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                      />

                      {/* Mic or Send Button */}
                      {inputText.trim() ? (
                        <button
                          type="submit"
                          className="p-3 rounded-full bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0"
                          title="Send message"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartVoiceRecording}
                          disabled={isCurrentConvARequest}
                          className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-orange-400 hover:bg-orange-500 hover:text-neutral-950 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                          title="Record voice note"
                        >
                          <Mic className="h-5 w-5" />
                        </button>
                      )}
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-500 space-y-3">
                <div className="h-16 w-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-orange-400 shadow-xl">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Select a chat to begin</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mt-1">
                    Connect directly with student sellers and founders across campus.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Media Attachment Modal */}
      {isAttachmentModalOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setIsAttachmentModalOpen(false)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 space-y-4 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-orange-400" />
                <span>Send Photo or Document</span>
              </h3>
              <button type="button" onClick={() => setIsAttachmentModalOpen(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 block">Select Sample Attachment:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAttachmentPreview({
                    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600',
                    name: 'Product Photo.jpg',
                    type: 'image'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-orange-500 text-left text-xs text-neutral-200 cursor-pointer"
                >
                  📸 Product Photo
                </button>
                <button
                  type="button"
                  onClick={() => setAttachmentPreview({
                    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600',
                    name: 'Document_Receipt.pdf',
                    type: 'file'
                  })}
                  className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-orange-500 text-left text-xs text-neutral-200 cursor-pointer"
                >
                  📄 Document PDF
                </button>
              </div>
            </div>

            {attachmentPreview && (
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                  <span>Attached: {attachmentPreview.name}</span>
                </div>
                <input
                  type="text"
                  value={attachmentCaption}
                  onChange={(e) => setAttachmentCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAttachmentModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-xs font-semibold hover:bg-neutral-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAttachment}
                disabled={!attachmentPreview}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold shadow-md disabled:opacity-40 cursor-pointer"
              >
                Send Attachment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatDrawer;
