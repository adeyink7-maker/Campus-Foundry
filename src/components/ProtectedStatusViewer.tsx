import React from 'react';

export interface ProtectedStatusViewerProps {
  statusMediaUri: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  authorName?: string;
  onClose: () => void;
  onScreenshotAttempt?: () => void;
}

export const ProtectedStatusViewer: React.FC<ProtectedStatusViewerProps> = ({
  statusMediaUri,
  mediaType = 'image',
  caption,
  authorName,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none">
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold">{authorName || 'Campus Story'}</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
            Encrypted & Protected
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-white flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {mediaType === 'video' ? (
          <video
            src={statusMediaUri}
            autoPlay
            playsInline
            loop
            className="w-full h-full object-contain pointer-events-auto"
          />
        ) : (
          <img
            src={statusMediaUri}
            alt="Protected story"
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        )}
        {caption && (
          <div className="absolute bottom-6 left-4 right-4 bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white text-sm shadow-xl pointer-events-none">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProtectedStatusViewer;
