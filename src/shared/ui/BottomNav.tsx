import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Store, Building2, Plus, Bell, MessageSquare, User } from 'lucide-react';
import { useChat } from '@/context/ChatContext';

export const BottomNav: React.FC<{
  onOpenCreateAction: () => void;
}> = ({ onOpenCreateAction }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadTotalCount } = useChat();

  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/feed' && (currentPath === '/' || currentPath === '/feed')) return true;
    return currentPath.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 border-t border-neutral-800/90 backdrop-blur-lg pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <div className="grid grid-cols-7 h-14 max-w-lg mx-auto items-center px-1">
        
        {/* 1. Feed */}
        <button
          type="button"
          onClick={() => navigate('/feed')}
          className="flex flex-col items-center justify-center h-full gap-0.5 text-center transition-colors"
        >
          <Home
            className={`h-[22px] w-[22px] ${
              isActive('/feed') ? 'text-orange-500' : 'text-neutral-500'
            }`}
          />
          <span
            className={`text-[10px] leading-none font-medium truncate max-w-full px-0.5 ${
              isActive('/feed') ? 'text-orange-500 font-bold' : 'text-neutral-500'
            }`}
          >
            Feed
          </span>
        </button>

        {/* 2. Market */}
        <button
          type="button"
          onClick={() => navigate('/market')}
          className="flex flex-col items-center justify-center h-full gap-0.5 text-center transition-colors"
        >
          <Store
            className={`h-[22px] w-[22px] ${
              isActive('/market') ? 'text-orange-500' : 'text-neutral-500'
            }`}
          />
          <span
            className={`text-[10px] leading-none font-medium truncate max-w-full px-0.5 ${
              isActive('/market') ? 'text-orange-500 font-bold' : 'text-neutral-500'
            }`}
          >
            Market
          </span>
        </button>

        {/* 3. Hubs */}
        <button
          type="button"
          onClick={() => navigate('/hubs')}
          className="flex flex-col items-center justify-center h-full gap-0.5 text-center transition-colors"
        >
          <Building2
            className={`h-[22px] w-[22px] ${
              isActive('/hubs') ? 'text-orange-500' : 'text-neutral-500'
            }`}
          />
          <span
            className={`text-[10px] leading-none font-medium truncate max-w-full px-0.5 ${
              isActive('/hubs') ? 'text-orange-500 font-bold' : 'text-neutral-500'
            }`}
          >
            Hubs
          </span>
        </button>

        {/* 4. Center "+" Button (Raised 52px Circle) */}
        <div className="flex items-center justify-center relative">
          <button
            type="button"
            onClick={onOpenCreateAction}
            aria-label="Create New"
            className="w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/40 border-2 border-neutral-950 -translate-y-3 hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="h-[26px] w-[26px] stroke-[2.5] block p-0" />
          </button>
        </div>

        {/* 5. Alerts */}
        <button
          type="button"
          onClick={() => navigate('/alerts')}
          className="flex flex-col items-center justify-center h-full gap-0.5 text-center transition-colors relative"
        >
          <div className="relative">
            <Bell
              className={`h-[22px] w-[22px] ${
                isActive('/alerts') ? 'text-orange-500' : 'text-neutral-500'
              }`}
            />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-neutral-950" />
          </div>
          <span
            className={`text-[10px] leading-none font-medium truncate max-w-full px-0.5 ${
              isActive('/alerts') ? 'text-orange-500 font-bold' : 'text-neutral-500'
            }`}
          >
            Alerts
          </span>
        </button>

        {/* 6. Chats */}
        <button
          type="button"
          onClick={() => navigate('/chats')}
          className="flex flex-col items-center justify-center h-full gap-0.5 text-center transition-colors relative"
        >
          <div className="relative">
            <MessageSquare
              className={`h-[22px] w-[22px] ${
                isActive('/chats') ? 'text-orange-500' : 'text-neutral-500'
              }`}
            />
            {unreadTotalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-neutral-950 ring-2 ring-neutral-950">
                {unreadTotalCount}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] leading-none font-medium truncate max-w-full px-0.5 ${
              isActive('/chats') ? 'text-orange-500 font-bold' : 'text-neutral-500'
            }`}
          >
            Chats
          </span>
        </button>

        {/* 7. Profile */}
        <button
          type="button"
          onClick={() => navigate('/profile/me')}
          className="flex flex-col items-center justify-center h-full gap-0.5 text-center transition-colors"
        >
          <User
            className={`h-[22px] w-[22px] ${
              isActive('/profile') ? 'text-orange-500' : 'text-neutral-500'
            }`}
          />
          <span
            className={`text-[10px] leading-none font-medium truncate max-w-full px-0.5 ${
              isActive('/profile') ? 'text-orange-500 font-bold' : 'text-neutral-500'
            }`}
          >
            Profile
          </span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;
