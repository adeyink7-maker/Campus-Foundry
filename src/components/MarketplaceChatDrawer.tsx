import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Store, 
  ArrowLeft, 
  Package, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  ChevronRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../services/marketplace';
import { getFriendlyError } from '../utils/friendlyErrors';

export const MarketplaceChatDrawer: React.FC = () => {
  const { 
    isMarketplaceChatOpen, 
    closeMarketplaceChat, 
    activeConversationId, 
    activeConversation, 
    conversations, 
    messages, 
    isLoadingConversations, 
    isLoadingMessages, 
    hasMoreMessages, 
    openMarketplaceChat, 
    sendMessage, 
    loadOlderMessages, 
    setBlockStatus, 
    updateConversationStatus,
    refreshConversations,
    setSelectedOrderIdForModal
  } = useMarketplaceChat();

  const { currentUser } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (activeConversationId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeConversationId]);

  if (!isMarketplaceChatOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText;
    setInputText('');
    setIsSending(true);
    setErrorToast(null);

    try {
      await sendMessage(textToSend);
    } catch (err: unknown) {
      setErrorToast(getFriendlyError(err, 'marketplace'));
      setInputText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const isTraderInActiveConv = currentUser && activeConversation && currentUser.id === activeConversation.traderId;
  const isDeclined = activeConversation?.status === 'declined';
  const isBlocked = activeConversation?.status === 'blocked';
  const isRestrictedForBuyer = !isTraderInActiveConv && (isBlocked || isDeclined);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md h-full bg-neutral-950 border-l border-neutral-800 flex flex-col shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/90 shrink-0">
          <div className="flex items-center gap-2">
            {activeConversationId ? (
              <button
                type="button"
                onClick={() => openMarketplaceChat(undefined)}
                className="p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Store className="w-5 h-5" />
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {activeConversation ? (
                  <>
                    <span>{activeConversation.businessName || 'Marketplace Chat'}</span>
                    {isBlocked && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-medium">
                        Blocked
                      </span>
                    )}
                    {isDeclined && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium">
                        Declined
                      </span>
                    )}
                  </>
                ) : (
                  <span>Marketplace Orders & Inquiries</span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {activeConversationId ? 'Verified Campus Venture Thread' : 'Direct trade messages on Supabase'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!activeConversationId && (
              <button
                type="button"
                onClick={() => refreshConversations()}
                className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                title="Refresh conversations"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={closeMarketplaceChat}
              className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Backend Not Connected State */}
        {!isSupabaseConfigured && (
          <div className="p-4 m-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <strong className="block font-bold">Backend not connected</strong>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                Please connect Supabase with environment keys to use Marketplace messaging.
              </p>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {errorToast && (
          <div className="mx-4 mt-2 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorToast}</span>
            <button type="button" onClick={() => setErrorToast(null)} className="p-1 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MAIN BODY: Conversation List OR Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!activeConversationId ? (
            /* CONVERSATION LIST */
            <div className="space-y-2">
              {isLoadingConversations ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 rounded-2xl bg-neutral-900 animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-neutral-300">No marketplace inquiries yet</h4>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    When you tap "Message trader" on any product or order, your chat thread will appear here.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isTrader = currentUser && currentUser.id === conv.traderId;
                  const unread = isTrader ? conv.traderUnread : conv.buyerUnread;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => openMarketplaceChat(conv.id)}
                      className="w-full p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/80 border border-neutral-800/80 flex items-center justify-between gap-3 text-left transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-neutral-800 border border-neutral-700/60 overflow-hidden shrink-0 flex items-center justify-center">
                          {conv.businessImageUrl ? (
                            <img src={conv.businessImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-white truncate">
                              {conv.businessName || 'Campus Trade'}
                            </h4>
                            {conv.lastMessageAt && (
                              <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                                {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                            {conv.lastMessage || 'No messages yet'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {unread > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-black">
                            {unread}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-300 transition-colors" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            /* ACTIVE MESSAGE THREAD */
            <div className="flex flex-col min-h-full justify-between space-y-3">
              {/* Load Older Messages Button */}
              {hasMoreMessages && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={loadOlderMessages}
                    disabled={isLoadingMessages}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
                  >
                    {isLoadingMessages ? 'Loading older...' : 'Load older messages'}
                  </button>
                </div>
              )}

              {/* Trader Controls: Accept, Decline, Block */}
              {isTraderInActiveConv && (
                <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">
                      Buyer Conversation Status:
                    </span>
                    <span className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      activeConversation?.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                      activeConversation?.status === 'declined' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-rose-500/20 text-rose-400'
                    }`}>
                      {activeConversation?.status || 'accepted'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => updateConversationStatus('accepted')}
                      disabled={activeConversation?.status === 'accepted'}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all disabled:opacity-40"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConversationStatus('declined')}
                      disabled={activeConversation?.status === 'declined'}
                      className="flex-1 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold transition-all disabled:opacity-40"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => updateConversationStatus('blocked')}
                      disabled={activeConversation?.status === 'blocked'}
                      className="flex-1 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold transition-all disabled:opacity-40"
                    >
                      Block
                    </button>
                  </div>
                </div>
              )}

              {/* Message Bubbles */}
              <div className="space-y-3 flex-1">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="space-y-3 py-8">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-10 rounded-2xl bg-neutral-900 animate-pulse w-3/4" />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-2">
                    <p className="text-xs text-neutral-400">No messages yet in this marketplace conversation.</p>
                    <p className="text-[11px] text-neutral-500">Ask about availability, pickup, delivery, or custom requests.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = currentUser && msg.senderId === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                            isMine
                              ? 'bg-amber-500 text-neutral-950 font-medium rounded-br-xs'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-bl-xs'
                          }`}
                        >
                          {/* Order Reference Card if message has order_id */}
                          {msg.orderId && (
                            <div 
                              onClick={() => setSelectedOrderIdForModal(msg.orderId || null)}
                              className={`mb-2 p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-opacity hover:opacity-90 ${
                                isMine ? 'bg-black/20 text-neutral-950' : 'bg-neutral-800/80 text-amber-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Package className="w-3.5 h-3.5 shrink-0" />
                                <span className="font-mono font-bold truncate">Order #{msg.orderId.slice(0, 8)}</span>
                              </div>
                              <span className="text-[10px] underline font-bold shrink-0">View Order</span>
                            </div>
                          )}

                          <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                          <span
                            className={`block text-[9px] font-mono mt-1 ${
                              isMine ? 'text-neutral-900/70 text-right' : 'text-neutral-500'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Text Input Footer (Only when inside active thread) */}
        {activeConversationId && (
          <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 shrink-0">
            {isRestrictedForBuyer ? (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center text-xs text-rose-300 space-y-1">
                <p className="font-bold">
                  {isBlocked ? 'This conversation is currently blocked by the trader.' : 'This conversation request was declined by the trader.'}
                </p>
                <p className="text-[11px] text-rose-400/80">You cannot send messages in this thread.</p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message to trader..."
                  disabled={isSending || !isSupabaseConfigured}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending || !isSupabaseConfigured}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold transition-all disabled:opacity-40 disabled:hover:bg-amber-500 cursor-pointer shadow-md"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
