import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { 
  ChatMessage, 
  ChatConversation, 
  ChatOrderSnippet, 
  StudentBusiness, 
  ChatThemeMode,
  AppUser,
} from '../types';
import { useAuth } from './AuthContext';
import { 
  supabase,
  isSupabaseConfigured,
  ensureSupabaseAuthSession,
  ensureConversationInSupabase,
  upsertConversationInSupabase, 
  insertChatMessageInSupabase, 
  fetchConversationsFromSupabase, 
  fetchMessagesFromSupabase,
  emitAppToast,
  toSafeUuid,
  isValidUuid,
  isMockConversation
} from '../services/supabase';
import { sendMessage as apiSendMessage, getOrCreateConversation } from '../services/marketplace';
import { getFriendlyError } from '../utils/friendlyErrors';

export interface SendMessageOptions {
  orderSnippet?: ChatOrderSnippet;
  voiceNote?: {
    url: string;
    duration: number;
    waveform: number[];
  };
  attachment?: {
    url: string;
    type: 'image' | 'file';
    name: string;
  };
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
}

interface ChatContextType {
  conversations: ChatConversation[];
  primaryConversations: ChatConversation[];
  requestConversations: ChatConversation[];
  activeConversationId: string | null;
  activeConversation: ChatConversation | null;
  activeMessages: ChatMessage[];
  unreadTotalCount: number;
  pendingRequestsCount: number;
  isConnected: boolean;
  isChatDrawerOpen: boolean;
  typingUser: string | null;
  chatTheme: ChatThemeMode;
  setChatTheme: (theme: ChatThemeMode) => void;
  onlinePrivacy: 'everyone' | 'contacts' | 'nobody';
  setOnlinePrivacy: (pref: 'everyone' | 'contacts' | 'nobody') => void;
  openChatDrawer: (targetTab?: 'primary' | 'requests' | any) => void;
  closeChatDrawer: () => void;
  setActiveConversationId: (id: string | null) => void;
  openChatWithBusiness: (
    business: StudentBusiness,
    initialMessage?: string,
    orderSnippet?: ChatOrderSnippet,
    asMessageRequest?: boolean
  ) => void;
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  markConversationRead: (conversationId: string) => void;
  acceptMessageRequest: (conversationId: string) => void;
  declineMessageRequest: (conversationId: string) => void;
  blockMessageRequest: (conversationId: string) => void;
  toggleMessageReaction: (messageId: string, emoji: string) => void;
  clearAllChats: () => void;
  openChatWithUser: (user: AppUser) => Promise<void>;
}

const STORAGE_CHATS_KEY = 'campus_foundry_chat_messages_v7';
const STORAGE_CONVS_KEY = 'campus_foundry_chat_conversations_v7';
const STORAGE_THEME_KEY = 'campus_foundry_chat_theme';
const STORAGE_PRIVACY_KEY = 'campus_foundry_chat_online_privacy';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Valid RFC4122 v4 UUID constants for mock users to prevent PostgreSQL 22P02 errors
export const DEMO_USER_ME = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c01';
export const DEMO_TRADER_TUNDE = 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d02';
export const DEMO_TRADER_AMINA = 'c3d4e5f6-a1b2-4c3d-ae4f-5a6b7c8d9e03';
export const DEMO_TRADER_DAVID = 'd4e5f6a1-b2c3-4d4e-bf5a-6b7c8d9e0f04';
export const DEMO_BIZ_1 = 'e5f6a1b2-c3d4-4e5f-a1b2-c3d4e5f6a101';
export const DEMO_BIZ_REQ_1 = 'f6a1b2c3-d4e5-4f6a-b2c3-d4e5f6a1b202';
export const DEMO_BIZ_REQ_2 = 'a2b3c4d5-e6f7-4a2b-8c3d-4e5f6a1b2c03';

async function resolveConversationKind(convId: string, conv?: ChatConversation): Promise<'marketplace' | 'direct' | null> {
  if (conv?.kind === 'marketplace' || conv?.kind === 'direct') {
    return conv.kind;
  }
  if (conv?.businessId || convId.startsWith('conv_') || convId.startsWith('biz_') || convId.includes('biz_') || convId.includes('conv_')) {
    return 'marketplace';
  }
  if (isMockConversation(convId)) {
    return 'marketplace';
  }
  if (!isSupabaseConfigured) {
    return 'marketplace';
  }
  const safeId = toSafeUuid(convId);
  try {
    const { data: mData } = await supabase.from('marketplace_conversations').select('id').eq('id', safeId).maybeSingle();
    if (mData) return 'marketplace';
  } catch {}
  try {
    const { data: dData } = await supabase.from('chat_conversations').select('id').eq('id', safeId).maybeSingle();
    if (dData) return 'direct';
  } catch {}
  // Default fallback for any conversation originating from market/business/conv_ patterns
  return 'marketplace';
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONVS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy demo conversation IDs and self-chats
          const realOnly = parsed.filter(
            (c: ChatConversation) =>
              c.id !== '7b9c6a1e-8e4d-4b8a-9a1b-1c2d3e4f5a01' &&
              c.id !== '8c0d7b2f-9f5e-4c9b-ab2c-2d3e4f5a6b02' &&
              c.id !== '9d1e8c3a-0a6f-4da0-bc3d-3e4f5a6b7c03' &&
              !c.id.startsWith('conv_campus_bites') &&
              c.buyerId !== c.traderId
          );
          return realOnly;
        }
      }
    } catch {}
    return [];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHATS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realOnly = parsed.filter(
            (m: ChatMessage) =>
              m.conversationId !== '7b9c6a1e-8e4d-4b8a-9a1b-1c2d3e4f5a01' &&
              m.conversationId !== '8c0d7b2f-9f5e-4c9b-ab2c-2d3e4f5a6b02' &&
              m.conversationId !== '9d1e8c3a-0a6f-4da0-bc3d-3e4f5a6b7c03' &&
              !m.conversationId.startsWith('conv_campus_bites') &&
              !m.text?.includes('Engineering Mathematics')
          );
          return realOnly;
        }
      }
    } catch {}
    return [];
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [typingMap, setTypingMap] = useState<Record<string, string>>({});
  
  const [chatTheme, setChatThemeState] = useState<ChatThemeMode>(() => {
    try {
      return (localStorage.getItem(STORAGE_THEME_KEY) as ChatThemeMode) || 'whatsapp';
    } catch {
      return 'whatsapp';
    }
  });

  const [onlinePrivacy, setOnlinePrivacyState] = useState<'everyone' | 'contacts' | 'nobody'>(() => {
    try {
      return (localStorage.getItem(STORAGE_PRIVACY_KEY) as any) || 'everyone';
    } catch {
      return 'everyone';
    }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const setChatTheme = (theme: ChatThemeMode) => {
    setChatThemeState(theme);
    try {
      localStorage.setItem(STORAGE_THEME_KEY, theme);
    } catch {}
  };

  const setOnlinePrivacy = (pref: 'everyone' | 'contacts' | 'nobody') => {
    setOnlinePrivacyState(pref);
    try {
      localStorage.setItem(STORAGE_PRIVACY_KEY, pref);
    } catch {}
  };

  // Persist conversations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CONVS_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHATS_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // BroadcastChannel sync
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('campus_foundry_chat_channel');
      broadcastChannelRef.current = channel;
      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'NEW_MESSAGE') {
          handleIncomingMessage(payload.message, payload.conversation);
        } else if (type === 'READ_CONVERSATION') {
          handleMarkReadLocal(payload.conversationId);
        } else if (type === 'ACCEPT_REQUEST') {
          handleAcceptRequestLocal(payload.conversationId);
        }
      };
      return () => channel.close();
    } catch {}
  }, []);

  // Initial cloud conversation fetch from Supabase
  useEffect(() => {
    if (!currentUser?.id || !isSupabaseConfigured) return;
    fetchConversationsFromSupabase(currentUser.id)
      .then((cloudConvs) => {
        if (cloudConvs && cloudConvs.length > 0) {
          setConversations((prev) => {
            const map = new Map<string, ChatConversation>();
            prev.forEach((c) => map.set(c.id, c));
            cloudConvs.forEach((c) => map.set(c.id, c));
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => {
        console.error('[Supabase fetchConversations error]:', err);
      });
  }, [currentUser?.id]);

  // Initial cloud messages fetch from Supabase when conversation opens
  useEffect(() => {
    if (!activeConversationId || !isSupabaseConfigured) return;

    // Skip Supabase queries for conversations that are local mock data
    if (isMockConversation(activeConversationId)) {
      return;
    }

    const safeConvId = toSafeUuid(activeConversationId);
    
    // 1. Fetch existing messages from chat_messages table
    fetchMessagesFromSupabase(safeConvId)
      .then((cloudMsgs) => {
        if (cloudMsgs && cloudMsgs.length > 0) {
          setMessages((prev) => {
            const map = new Map<string, ChatMessage>();
            // Keep messages belonging to other conversations
            prev.filter((m) => m.conversationId !== safeConvId).forEach((m) => map.set(m.id, m));
            // Add messages loaded from chat_messages table
            cloudMsgs.forEach((m) => map.set(m.id, m));
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => {
        console.error('[Supabase fetchMessages error]:', err);
      });

    // 2. Realtime listener for incoming messages on chat_messages table
    const channel = supabase
      .channel(`rt_chat_msgs_${safeConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${safeConvId}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (!row) return;
          const incoming: ChatMessage = {
            id: row.id,
            conversationId: row.conversation_id,
            businessId: '',
            businessName: '',
            senderId: row.sender_id,
            senderName: row.sender_id,
            senderRole: 'student',
            recipientId: row.recipient_id,
            recipientName: 'Participant',
            text: row.text || '',
            isRead: Boolean(row.is_read),
            deliveryState: row.is_read ? 'read' : 'delivered',
            orderSnippet: row.order_snippet || undefined,
            timestamp: row.created_at,
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  const handleIncomingMessage = (msg: ChatMessage, conv?: ChatConversation) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });

    if (conv) {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== conv.id);
        return [conv, ...filtered];
      });
    }
  };

  const handleMarkReadLocal = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
    setMessages((prev) =>
      prev.map((m) => (m.conversationId === convId ? { ...m, isRead: true, deliveryState: 'read' } : m))
    );
  };

  const handleAcceptRequestLocal = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, isMessageRequest: false, requestStatus: 'accepted' }
          : c
      )
    );
  };

  const acceptMessageRequest = (conversationId: string) => {
    handleAcceptRequestLocal(conversationId);
    broadcastChannelRef.current?.postMessage({
      type: 'ACCEPT_REQUEST',
      payload: { conversationId },
    });

    const target = conversations.find((c) => c.id === conversationId);
    if (target) {
      upsertConversationInSupabase({ ...target, isMessageRequest: false, requestStatus: 'accepted' })
        .catch((err) => console.error('[Supabase acceptMessageRequest Error]:', err));
    }
  };

  const declineMessageRequest = (conversationId: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) => prev.filter((m) => m.conversationId !== conversationId));
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
    const target = conversations.find((c) => c.id === conversationId);
    if (target) {
      upsertConversationInSupabase({ ...target, requestStatus: 'declined' })
        .catch((err) => console.error('[Supabase declineMessageRequest Error]:', err));
    }
  };

  const blockMessageRequest = (conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, requestStatus: 'blocked' }
          : c
      )
    );
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
    }
    const target = conversations.find((c) => c.id === conversationId);
    if (target) {
      upsertConversationInSupabase({ ...target, requestStatus: 'blocked' })
        .catch((err) => console.error('[Supabase blockMessageRequest Error]:', err));
    }
  };

  const toggleMessageReaction = (messageId: string, emoji: string) => {
    const userId = currentUser?.id || 'usr_me';
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentReactions = m.reactions || {};
        const currentUsers = currentReactions[emoji] || [];
        const hasReacted = currentUsers.includes(userId);

        const updatedUsers = hasReacted
          ? currentUsers.filter((u) => u !== userId)
          : [...currentUsers, userId];

        const nextReactions = { ...currentReactions };
        if (updatedUsers.length === 0) {
          delete nextReactions[emoji];
        } else {
          nextReactions[emoji] = updatedUsers;
        }

        return { ...m, reactions: nextReactions };
      })
    );
  };

  const markConversationRead = (conversationId: string) => {
    handleMarkReadLocal(conversationId);
    broadcastChannelRef.current?.postMessage({
      type: 'READ_CONVERSATION',
      payload: { conversationId },
    });
  };

  const openChatWithBusiness = async (
    business: StudentBusiness,
    initialMessage?: string,
    orderSnippet?: ChatOrderSnippet,
    asMessageRequest = false
  ) => {
    // Guard: trader must not be able to chat with their own store
    const isOwnStore = Boolean(
      currentUser &&
        (business.ownerId === currentUser.id ||
          (business.ownerEmail && currentUser.email && business.ownerEmail.toLowerCase() === currentUser.email.toLowerCase()))
    );

    if (isOwnStore) {
      emitAppToast("You can't message your own store", 'error');
      return;
    }

    const buyerId = currentUser?.id || DEMO_USER_ME;
    const buyerName = currentUser?.fullName || 'Student Buyer';
    const rawConvId = `conv_${business.id}_${buyerId}`.replace(/[^a-zA-Z0-9_]/g, '_');
    let conversationId = toSafeUuid(rawConvId);

    // Try fetching/creating real marketplace_conversations row via RPC if available
    if (isSupabaseConfigured) {
      try {
        const rpcConvId = await getOrCreateConversation(business.id);
        if (rpcConvId && isValidUuid(rpcConvId)) {
          conversationId = rpcConvId;
        }
      } catch (err) {
        console.warn('[openChatWithBusiness] getOrCreateConversation notice:', err);
      }
    }

    let conv = conversations.find((c) => c.id === conversationId || c.businessId === business.id);
    if (!conv) {
      conv = {
        id: conversationId,
        kind: 'marketplace',
        businessId: toSafeUuid(business.id),
        businessName: business.name,
        businessImageUrl: business.imageUrl,
        traderName: business.ownerName,
        traderId: toSafeUuid(business.ownerEmail || DEMO_TRADER_TUNDE),
        traderHostel: business.hostelLocation,
        buyerId,
        buyerName,
        buyerEmail: currentUser?.email,
        lastMessage: initialMessage || 'Direct inquiry started on Campus Foundry.',
        lastMessageTimestamp: new Date().toISOString(),
        unreadCount: 0,
        isMessageRequest: asMessageRequest,
        requestStatus: asMessageRequest ? 'pending' : 'accepted',
        isOnline: true,
        lastSeen: 'Online',
      };
      setConversations((prev) => [conv!, ...prev]);
    } else {
      conversationId = conv.id;
    }

    setActiveConversationId(conversationId);
    setIsChatDrawerOpen(true);

    if (initialMessage || orderSnippet) {
      await sendMessageDirect(
        conversationId,
        business,
        initialMessage || 'Order inquiry placed via Campus Foundry',
        { orderSnippet }
      );
    }
  };

  const sendMessageDirect = async (
    convId: string,
    businessInfo: { id: string; name: string; ownerName: string; ownerEmail?: string; hostelLocation: string; imageUrl?: string },
    text: string,
    options?: SendMessageOptions
  ) => {
    const targetConv = conversations.find((c) => c.id === convId);
    const resolvedKind = await resolveConversationKind(convId, targetConv);
    if (!resolvedKind) {
      console.error('[Supabase send error]: Conversation not found in marketplace_conversations or chat_conversations for', convId);
      emitAppToast('This conversation no longer exists', 'error');
      setActiveConversationId(null);
      setIsChatDrawerOpen(false);
      return;
    }
    const convKind = resolvedKind;
    const isStoreChat = convKind === 'marketplace';
    const isMock = isMockConversation(convId);
    let authUid: string | null = null;

    // 1. Verify or auto-establish Supabase auth session only for real cloud conversations
    if (isSupabaseConfigured && !isMock) {
      try {
        authUid = await ensureSupabaseAuthSession();
      } catch (authErr) {
        console.warn('[Supabase Auth Warning]:', authErr);
      }
    }

    const isTraderSender = currentUser?.role === 'trader';
    const senderId = authUid || currentUser?.id || DEMO_USER_ME;
    const senderName = currentUser?.fullName || (isTraderSender ? 'Student Trader' : 'Student Buyer');

    const safeMsgId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : toSafeUuid(`msg_${Date.now()}_${Math.random()}`);
    const safeConvId = toSafeUuid(convId);
    const recipientId = isTraderSender
      ? toSafeUuid(businessInfo.ownerEmail || DEMO_USER_ME)
      : toSafeUuid(businessInfo.ownerEmail || DEMO_TRADER_TUNDE);

    const newMessage: ChatMessage = {
      id: safeMsgId,
      conversationId: safeConvId,
      businessId: isStoreChat ? toSafeUuid(businessInfo.id) : '',
      businessName: businessInfo.name,
      senderId,
      senderName,
      senderRole: isTraderSender ? 'trader' : 'student',
      recipientId,
      recipientName: isTraderSender ? 'Student Buyer' : businessInfo.ownerName,
      text,
      timestamp: new Date().toISOString(),
      isRead: false,
      deliveryState: 'sent',
      hostelLocation: currentUser?.hostelLocation || 'Lagos Hostel',
      orderSnippet: options?.orderSnippet,
      replyToMessage: options?.replyTo,
      voiceNoteUrl: options?.voiceNote?.url,
      voiceDuration: options?.voiceNote?.duration,
      voiceWaveform: options?.voiceNote?.waveform,
    };

    const updatedConv: ChatConversation = {
      id: safeConvId,
      kind: convKind,
      businessId: isStoreChat ? toSafeUuid(businessInfo.id) : '',
      businessName: businessInfo.name,
      businessImageUrl: (businessInfo as any).imageUrl,
      traderName: businessInfo.ownerName,
      traderId: recipientId,
      traderHostel: businessInfo.hostelLocation,
      buyerId: isTraderSender ? DEMO_USER_ME : senderId,
      buyerName: isTraderSender ? 'Student Buyer' : senderName,
      lastMessage: options?.voiceNote ? '🎤 Voice note' : text,
      lastMessageTimestamp: newMessage.timestamp,
      unreadCount: 0,
      isMessageRequest: false,
      requestStatus: 'accepted',
      isOnline: true,
      lastSeen: 'Online',
    };

    // 2. Persist to Supabase based on conversation kind
    if (isSupabaseConfigured && authUid && !isMock) {
      if (convKind === 'marketplace') {
        try {
          // If safeConvId is a generated client UUID, get or create real conversation ID
          let realMarketplaceConvId = safeConvId;
          if (businessInfo.id && businessInfo.id !== '00000000-0000-4000-8000-000000000000') {
            try {
              const rpcConvId = await getOrCreateConversation(businessInfo.id);
              if (rpcConvId && isValidUuid(rpcConvId)) {
                realMarketplaceConvId = rpcConvId;
              }
            } catch (rpcErr) {
              console.warn('[MarketplaceChat] getOrCreateConversation fallback:', rpcErr);
            }
          }

          const marketplaceMsg = await apiSendMessage(
            realMarketplaceConvId,
            text,
            senderId,
            undefined,
            {
              voiceNoteUrl: options?.voiceNote?.url,
              voiceDuration: options?.voiceNote?.duration,
              attachmentUrl: options?.attachment?.url,
              attachmentType: options?.attachment?.type,
            }
          );
          newMessage.id = marketplaceMsg.id;
          newMessage.timestamp = marketplaceMsg.createdAt;
          newMessage.conversationId = realMarketplaceConvId;
          updatedConv.id = realMarketplaceConvId;
        } catch (dbErr: unknown) {
          console.error('[Supabase save error]:', dbErr);
          const friendly = getFriendlyError(dbErr, 'dm');
          emitAppToast(friendly, 'error');
          throw dbErr;
        }
      } else {
        // Direct conversation: verify row in chat_conversations FIRST
        const conversationExists = await ensureConversationInSupabase(updatedConv, authUid);
        if (!conversationExists) {
          console.error('[Supabase send error]: Conversation row creation/check failed for', safeConvId);
          emitAppToast(getFriendlyError(new Error('Conversation thread could not be created'), 'dm'), 'error');
          return;
        }
        try {
          await insertChatMessageInSupabase(newMessage, authUid);
        } catch (dbErr: unknown) {
          console.error('[Supabase save error]:', dbErr);
          const friendly = getFriendlyError(dbErr, 'dm');
          emitAppToast(friendly, 'error');
          throw dbErr;
        }
      }
    }

    // 3. Update local state
    handleIncomingMessage(newMessage, updatedConv);

    broadcastChannelRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      payload: { message: newMessage, conversation: updatedConv },
    });
  };

  const sendMessage = async (text: string, options?: SendMessageOptions) => {
    if (!activeConversationId) return;
    const currentConv = conversations.find((c) => c.id === activeConversationId);
    if (!currentConv) return;

    await sendMessageDirect(
      activeConversationId,
      {
        id: currentConv.businessId,
        name: currentConv.businessName,
        ownerName: currentConv.traderName,
        ownerEmail: currentConv.traderId,
        hostelLocation: currentConv.traderHostel,
        imageUrl: currentConv.businessImageUrl,
      } as any,
      text.trim(),
      options
    );
  };

  const sendTyping = (isTyping: boolean) => {
    if (!activeConversationId) return;
    setTypingMap((prev) => ({
      ...prev,
      [activeConversationId]: isTyping ? 'typing...' : '',
    }));
  };

  const clearAllChats = () => {
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    try {
      localStorage.removeItem(STORAGE_CHATS_KEY);
      localStorage.removeItem(STORAGE_CONVS_KEY);
    } catch {}
  };

  const primaryConversations = conversations.filter(
    (c) => !c.isMessageRequest || c.requestStatus === 'accepted'
  );

  const requestConversations = conversations.filter(
    (c) => c.isMessageRequest && c.requestStatus === 'pending'
  );

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const activeMessages = messages.filter((m) => m.conversationId === activeConversationId);
  const unreadTotalCount = primaryConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const pendingRequestsCount = requestConversations.length;

  return (
    <ChatContext.Provider
      value={{
        conversations,
        primaryConversations,
        requestConversations,
        activeConversationId,
        activeConversation,
        activeMessages,
        unreadTotalCount,
        pendingRequestsCount,
        isConnected,
        isChatDrawerOpen,
        typingUser: activeConversationId ? typingMap[activeConversationId] || null : null,
        chatTheme,
        setChatTheme,
        onlinePrivacy,
        setOnlinePrivacy,
        openChatDrawer: (targetTab) => {
          setIsChatDrawerOpen(true);
          if (targetTab === 'requests' && requestConversations.length > 0) {
            setActiveConversationId(requestConversations[0].id);
          }
        },
        closeChatDrawer: () => setIsChatDrawerOpen(false),
        setActiveConversationId: (id) => {
          setActiveConversationId(id);
          if (id) markConversationRead(id);
        },
        openChatWithBusiness,
        sendMessage,
        sendTyping,
        markConversationRead,
        acceptMessageRequest,
        declineMessageRequest,
        blockMessageRequest,
        toggleMessageReaction,
        clearAllChats,
        openChatWithUser: async (user: AppUser) => {
          if (!currentUser) {
            emitAppToast('You must be logged in to chat', 'error');
            return;
          }
          if (currentUser.id === user.id) {
            emitAppToast("You can't message yourself", 'error');
            return;
          }

          // Check if conversation exists
          const existingConv = conversations.find(
            (c) => (c.buyerId === currentUser.id && c.traderId === user.id) || (c.buyerId === user.id && c.traderId === currentUser.id)
          );
          
          if (existingConv) {
            setActiveConversationId(existingConv.id);
            setIsChatDrawerOpen(true);
            return;
          }

          // Create new conversation
          const convId = toSafeUuid(`conv_${currentUser.id}_${user.id}`);
          const isFollowing = currentUser.followingUserIds?.includes(user.id);
          
          const newConv: ChatConversation = {
            id: convId,
            kind: 'direct',
            businessId: '',
            businessName: user.fullName,
            traderName: user.fullName,
            traderId: user.id,
            traderHostel: user.hostelLocation || '',
            buyerId: currentUser.id,
            buyerName: currentUser.fullName,
            lastMessage: 'Started a new conversation',
            lastMessageTimestamp: new Date().toISOString(),
            unreadCount: 0,
            isMessageRequest: !isFollowing,
            requestStatus: isFollowing ? 'accepted' : 'pending',
            isOnline: true,
            lastSeen: 'Online',
          };

          setConversations((prev) => [newConv, ...prev]);
          setActiveConversationId(convId);
          setIsChatDrawerOpen(true);
          
          if (isSupabaseConfigured) {
              await upsertConversationInSupabase(newConv);
          }
        },
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
