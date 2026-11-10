import React from 'react';
import { StorySticker } from '../../types/stickers';
import { PollStickerView } from './PollStickerView';
import { LocationStickerView } from './LocationStickerView';

export interface OverlayProps {
  stickers: StorySticker[];
  onVotePoll: (stickerId: string, optionId: string) => void;
  onStickerTouchStart?: () => void;
  onStickerTouchEnd?: () => void;
}

export const StickerOverlayContainer: React.FC<OverlayProps> = ({
  stickers,
  onVotePoll,
  onStickerTouchStart,
  onStickerTouchEnd,
}) => {
  if (!stickers || stickers.length === 0) return null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden select-none">
      {stickers.map((sticker) => {
        // Normalized positioning (0.0 to 1.0) mapped to percentage coordinates
        const left = `${sticker.x * 100}%`;
        const top = `${sticker.y * 100}%`;
        const rotation = sticker.rotation || 0;
        const scale = sticker.scale || 1;

        return (
          <div
            key={sticker.id}
            style={{
              left,
              top,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              transformOrigin: 'center center',
            }}
            className="absolute flex items-center justify-center pointer-events-auto"
          >
            {sticker.type === 'poll' && (
              <PollStickerView
                sticker={sticker}
                onVote={onVotePoll}
                onInteractionStart={onStickerTouchStart}
                onInteractionEnd={onStickerTouchEnd}
              />
            )}

            {sticker.type === 'location' && (
              <LocationStickerView
                sticker={sticker}
                onInteractionStart={onStickerTouchStart}
                onInteractionEnd={onStickerTouchEnd}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StickerOverlayContainer;
