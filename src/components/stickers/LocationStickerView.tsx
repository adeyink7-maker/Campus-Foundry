import React from 'react';
import { LocationSticker } from '../../types/stickers';

export interface LocationProps {
  sticker: LocationSticker;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const LocationStickerView: React.FC<LocationProps> = ({
  sticker,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const handleOpenMaps = () => {
    const lat = sticker.latitude;
    const lng = sticker.longitude;
    const label = encodeURIComponent(sticker.locationName);

    if (typeof window !== 'undefined') {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}(${label})`, '_blank');
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenMaps}
      onMouseDown={onInteractionStart}
      onMouseUp={onInteractionEnd}
      onTouchStart={onInteractionStart}
      onTouchEnd={onInteractionEnd}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 hover:bg-white text-neutral-900 font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer backdrop-blur-md border border-black/5 select-none"
    >
      <span className="text-sm">📍</span>
      <span className="truncate max-w-[200px]">{sticker.locationName}</span>
    </button>
  );
};

export default LocationStickerView;
