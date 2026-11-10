import React, { useState } from 'react';

export interface StoryItem {
  id: string;
  url: string;
  caption?: string;
  type?: 'image' | 'video';
}

export interface StoryAccount {
  id: string;
  username: string;
  avatarUrl?: string;
  stories: StoryItem[];
}

export interface StoryViewerProps {
  accounts: StoryAccount[];
  initialAccountIndex?: number;
  onClose?: () => void;
  onOpenAuthorProfile?: (username: string) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  accounts,
  initialAccountIndex = 0,
  onClose,
  onOpenAuthorProfile,
}) => {
  const [currentAccountIndex, setCurrentAccountIndex] = useState(initialAccountIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);

  const currentAccount = accounts[currentAccountIndex] || accounts[0];
  const currentStories = currentAccount?.stories || [];

  const handleNext = () => {
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentAccountIndex < accounts.length - 1) {
      setCurrentAccountIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else if (onClose) {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentAccountIndex > 0) {
      const prevIdx = currentAccountIndex - 1;
      setCurrentAccountIndex(prevIdx);
      setCurrentStoryIndex(accounts[prevIdx].stories.length - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 select-none">
      <div className="relative flex flex-col h-full max-h-[88vh] w-full max-w-sm rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl">
        <div className="absolute top-3 left-3 right-3 z-40 flex items-center gap-1.5">
          {currentStories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-400 transition-all duration-150 ease-linear rounded-full"
                style={{
                  width: idx <= currentStoryIndex ? '100%' : '0%',
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-6 left-3 right-3 z-40 flex items-center justify-between">
          <div
            onClick={() => onOpenAuthorProfile?.(currentAccount?.username)}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={currentAccount?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentAccount?.username}
              className="h-8 w-8 rounded-full object-cover border border-orange-400"
            />
            <span className="text-xs font-bold text-white drop-shadow">
              {currentAccount?.username}
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs font-bold hover:bg-black"
            >
              ✕
            </button>
          )}
        </div>

        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden cursor-pointer">
          <img
            src={currentStories[currentStoryIndex]?.url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'}
            alt={currentAccount?.username}
            className="h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full" onClick={handlePrev} />
            <div className="w-1/2 h-full" onClick={handleNext} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
