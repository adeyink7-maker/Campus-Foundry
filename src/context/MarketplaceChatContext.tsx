import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  MarketplaceConversation, 
  MarketplaceMessage 
} from '../types';
import { useAuth } from './AuthContext';
import { 
  isSupabaseConfigured,
  fetchConversations,
  fetchMessages,
  sendMessage as apiSendMessage,
  getOrCreateConversation,
  markConversationRead,
  setConversationStatus,
  subscribeToMessages,
  subscribeToMyConversations,
  mapMarketplaceError
} from '../services/marketplace';
import { supabase, emitAppToast } from '../services/supabase';

interface MarketplaceChatContextType {
  isMarketplaceChatOpen: boolean;
  activeConversationId: string | null;
  activeConversation: MarketplaceConversation | null;
  conversations: MarketplaceConversation[];
  messages: MarketplaceMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  totalUnreadCount: number;
  selectedOrderIdForModal: string | null;
  setSelectedOrderIdForModal: (orderId: string | null) => void;
  openMarketplaceChat: (conversationId?: string) => void;
  closeMarketplaceChat: () => void;
  openChatWithBusiness: (businessId: string, orderId?: string) => Promise<string>;
  sendMessage: (text: string, orderId?: string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  setBlockStatus: (blocked: boolean) => Promise<void>;
  updateConversationStatus: (status: 'accepted' | 'declined' | 'blocked') => Promise<void>;
  refreshConversations: () => Promise<void>;
}

const MarketplaceChatContext = createContext<MarketplaceChatContextType | undefined>(undefined);

export const MarketplaceChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isMarketplaceChatOpen, setIsMarketplaceChatOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<MarketplaceConversation[]>([]);
  const [messages, setMessages] = useState<MarketplaceMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [selectedOrderIdForModal, setSelectedOrderIdForModal] = useState<string | null>(null);

  // Track oldest message timestamp for pagination
  const oldestMessageTimeRef = useRef<string | null>(null);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Compute total unread count for current user
  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return conversations.reduce((acc, c) => {
      const isTrader = currentUser.id === c.traderId;
      const unread = isTrader ? c.traderUnread : c.buyerUnread;
      return acc + (unread || 0);
    }, 0);
  }, [conversations, currentUser]);

  // Refresh conversations list
  const refreshConversations = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUser) {
      setConversations([]);
      return;
    }
    try {
      setIsLoadingConversations(true);
      const data = await fetchConversations();
      setConversations(data);
    } catch (err) {
      console.warn('[MarketplaceChat] Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser]);

  // Load conversations on mount & when currentUser changes
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;
    const unsubscribe = subscribeToMyConversations(currentUser.id, () => {
      refreshConversations();
    });
    return () => {
      unsubscribe();
    };
  }, [currentUser, refreshConversations]);

  // Load messages when activeConversationId changes
  useEffect(() => {
    if (!isSupabaseConfigured || !activeConversationId) {
      setMessages([]);
      oldestMessageTimeRef.current = null;
      setHasMoreMessages(false);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    fetchMessages(activeConversationId)
      .then((loaded) => {
        if (!isMounted) return;
        setMessages(loaded);
        if (loaded.length > 0) {
          oldestMessageTimeRef.current = loaded[0].createdAt;
          setHasMoreMessages(loaded.length >= 30);
        } else {
          oldestMessageTimeRef.current = null;
          setHasMoreMessages(false);
        }
      })
      .catch((err) => {
        console.warn('[MarketplaceChat] Failed to fetch messages:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    // Mark conversation read via RPC
    markConversationRead(activeConversationId).catch(() => {});

    // Update unread count locally in conversation state
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeConversationId) return c;
        const isTrader = currentUser?.id === c.traderId;
        return isTrader ? { ...c, traderUnread: 0 } : { ...c, buyerUnread: 0 };
      })
    );

    // Realtime subscription for active message thread
    const unsubscribeMessages = subscribeToMessages(activeConversationId, (incoming) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
      // Mark read if chat is currently open
      markConversationRead(activeConversationId).catch(() => {});
    });

    return () => {
      isMounted = false;
      unsubscribeMessages();
    };
  }, [activeConversationId, currentUser?.id]);

  // Load older messages (pagination, 30 at a time)
  const loadOlderMessages = useCallback(async () => {
    if (!activeConversationId || !oldestMessageTimeRef.current || isLoadingMessages) return;

    try {
      setIsLoadingMessages(true);
      const older = await fetchMessages(activeConversationId, oldestMessageTimeRef.current);
      if (older.length > 0) {
        oldestMessageTimeRef.current = older[0].createdAt;
        setMessages((prev) => [...older, ...prev]);
        setHasMoreMessages(older.length >= 30);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.warn('[MarketplaceChat] Failed to load older messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [activeConversationId, isLoadingMessages]);

  const openMarketplaceChat = useCallback((conversationId?: string) => {
    if (conversationId) {
      setActiveConversationId(conversationId);
    }
    setIsMarketplaceChatOpen(true);
  }, []);

  const closeMarketplaceChat = useCallback(() => {
    setIsMarketplaceChatOpen(false);
  }, []);

  // Filter conversations so user's own store is not listed in buyer conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (c) =>
        c.buyerId !== c.traderId &&
        c.id !== '7b9c6a1e-8e4d-4b8a-9a1b-1c2d3e4f5a01' &&
        !(currentUser && c.buyerId === currentUser.id && c.traderId === currentUser.id)
    );
  }, [conversations, currentUser]);

  // Start or open conversation with a student business
  const openChatWithBusiness = useCallback(async (businessId: string, orderId?: string): Promise<string> => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase backend not connected.');
    }
    if (!currentUser) {
      throw new Error('Please sign in to message this trader.');
    }

    // Guard: trader must not be able to chat with their own store
    if (currentUser.businessProfileId === businessId) {
      emitAppToast("You can't message your own store", 'error');
      throw new Error("You can't message your own store");
    }

    // Check database or local conversations if trader_id is currentUser.id
    const existingOwnConv = conversations.find(
      (c) => c.businessId === businessId && c.traderId === currentUser.id
    );
    if (existingOwnConv) {
      emitAppToast("You can't message your own store", 'error');
      throw new Error("You can't message your own store");
    }

    // Check student_businesses table owner_id
    try {
      const { data: biz } = await supabase
        .from('student_businesses')
        .select('owner_id')
        .eq('id', businessId)
        .maybeSingle();

      if (biz && biz.owner_id === currentUser.id) {
        emitAppToast("You can't message your own store", 'error');
        throw new Error("You can't message your own store");
      }
    } catch {
      // Ignore check errors and let RPC or logic proceed
    }

    try {
      const convId = await getOrCreateConversation(businessId);
      setActiveConversationId(convId);
      setIsMarketplaceChatOpen(true);
      await refreshConversations();

      if (orderId) {
        // Send initial order reference message if requested
        await apiSendMessage(convId, `Hello! Inquiring regarding Order #${orderId.slice(0, 8)}`, currentUser.id, orderId);
      }

      return convId;
    } catch (err) {
      console.error('[MarketplaceChat] openChatWithBusiness error:', err);
      const msg = mapMarketplaceError(err);
      emitAppToast(msg, 'error');
      throw new Error(msg);
    }
  }, [currentUser, conversations, refreshConversations]);

  // Send message with optimistic update & rollback on error
  const sendMessage = useCallback(async (text: string, orderId?: string): Promise<void> => {
    if (!activeConversationId) {
      throw new Error('No active conversation selected.');
    }
    if (!currentUser) {
      throw new Error('Please sign in to send messages.');
    }
    const cleanText = text.trim();
    if (!cleanText) return;

    // Optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMessage: MarketplaceMessage = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      body: cleanText,
      orderId: orderId || null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Update conversation last message preview optimistically
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? {
              ...c,
              lastMessage: cleanText,
              lastMessageAt: optimisticMessage.createdAt,
            }
          : c
      )
    );

    try {
      const saved = await apiSendMessage(activeConversationId, cleanText, currentUser.id, orderId);
      // Replace optimistic message with actual db record
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch (err) {
      // Rollback on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      throw new Error(mapMarketplaceError(err));
    }
  }, [activeConversationId, currentUser]);

  // Trader can set conversation status (accept, decline, block)
  const updateConversationStatus = useCallback(async (status: 'accepted' | 'declined' | 'blocked'): Promise<void> => {
    if (!activeConversationId) return;
    try {
      await setConversationStatus(activeConversationId, status);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversationId ? { ...c, status } : c))
      );
    } catch (err) {
      console.error('[MarketplaceChat] updateConversationStatus error:', err);
      throw new Error(mapMarketplaceError(err));
    }
  }, [activeConversationId]);

  // Trader can block or unblock
  const setBlockStatus = useCallback(async (blocked: boolean): Promise<void> => {
    await updateConversationStatus(blocked ? 'blocked' : 'accepted');
  }, [updateConversationStatus]);

  return (
    <MarketplaceChatContext.Provider
      value={{
        isMarketplaceChatOpen,
        activeConversationId,
        activeConversation,
        conversations: filteredConversations,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        hasMoreMessages,
        totalUnreadCount,
        selectedOrderIdForModal,
        setSelectedOrderIdForModal,
        openMarketplaceChat,
        closeMarketplaceChat,
        openChatWithBusiness,
        sendMessage,
        loadOlderMessages,
        setBlockStatus,
        updateConversationStatus,
        refreshConversations,
      }}
    >
      {children}
    </MarketplaceChatContext.Provider>
  );
};

export const useMarketplaceChat = () => {
  const context = useContext(MarketplaceChatContext);
  if (!context) {
    throw new Error('useMarketplaceChat must be used within a MarketplaceChatProvider');
  }
  return context;
};
