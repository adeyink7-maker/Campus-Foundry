import { MessageSquare, Sparkles } from 'lucide-react';
import { useChat } from '../context/ChatContext';

export const FloatingChatButton = () => {
  const { openChatDrawer, unreadTotalCount, isConnected } = useChat();

  return (
    <button
      onClick={openChatDrawer}
      aria-label="Open In-App Trader Chat"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-3.5 sm:px-4 sm:py-3 text-white shadow-2xl shadow-emerald-950/60 transition-all hover:scale-105 hover:from-emerald-500 hover:to-teal-400 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-emerald-400"
    >
      <div className="relative flex items-center justify-center">
        <MessageSquare className="h-5 w-5 sm:h-5 sm:w-5 group-hover:rotate-6 transition-transform" />
        {unreadTotalCount > 0 && (
          <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-mono text-[10px] font-black text-neutral-950 ring-2 ring-neutral-950 animate-bounce">
            {unreadTotalCount}
          </span>
        )}
      </div>

      <div className="hidden sm:flex flex-col text-left leading-none">
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <span>Campus Chat</span>
          <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-200 animate-pulse' : 'bg-amber-300'}`} />
        </div>
        <span className="text-[10px] text-emerald-100 font-medium">
          {unreadTotalCount > 0 ? `${unreadTotalCount} unread message${unreadTotalCount > 1 ? 's' : ''}` : 'Message UNILORIN traders'}
        </span>
      </div>
    </button>
  );
};
