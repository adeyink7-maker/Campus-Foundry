import React, { useState, useRef, useEffect } from 'react';

export interface StickerData {
  id: string;
  type: 'poll' | 'location' | 'text';
  content: any;
  x: number; // Normalized (0.0 to 1.0)
  y: number; // Normalized (0.0 to 1.0)
  scale: number;
  rotation: number; // In degrees
}

export interface EditableStickerProps {
  sticker: StickerData;
  containerWidth?: number;
  containerHeight?: number;
  onUpdateTransform: (id: string, updatedData: Partial<StickerData>) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const EditableSticker: React.FC<EditableStickerProps> = ({
  sticker,
  containerWidth = 360,
  containerHeight = 640,
  onUpdateTransform,
  onDelete,
  isSelected = false,
  onSelect,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: sticker.x * containerWidth,
    startY: sticker.y * containerHeight,
  });

  const [currentPos, setCurrentPos] = useState({
    x: sticker.x * containerWidth,
    y: sticker.y * containerHeight,
  });

  useEffect(() => {
    setCurrentPos({
      x: sticker.x * containerWidth,
      y: sticker.y * containerHeight,
    });
  }, [sticker.x, sticker.y, containerWidth, containerHeight]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect?.(sticker.id);
    setIsDragging(true);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentPos.x,
      startY: currentPos.y,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();

    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const newX = Math.max(0, Math.min(containerWidth, dragStartRef.current.startX + deltaX));
    const newY = Math.max(0, Math.min(containerHeight, dragStartRef.current.startY + deltaY));

    setCurrentPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // Commit normalized coordinates back to parent
    const normalizedX = currentPos.x / containerWidth;
    const normalizedY = currentPos.y / containerHeight;

    onUpdateTransform(sticker.id, {
      x: normalizedX,
      y: normalizedY,
      scale: sticker.scale,
      rotation: sticker.rotation,
    });
  };

  const handleRotate = (angleDelta: number) => {
    const newRotation = ((sticker.rotation || 0) + angleDelta) % 360;
    onUpdateTransform(sticker.id, { rotation: newRotation });
  };

  const handleScale = (scaleDelta: number) => {
    const newScale = Math.max(0.5, Math.min(2.5, (sticker.scale || 1) + scaleDelta));
    onUpdateTransform(sticker.id, { scale: newScale });
  };

  return (
    <div
      style={{
        left: `${currentPos.x}px`,
        top: `${currentPos.y}px`,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg) scale(${sticker.scale || 1})`,
        touchAction: 'none',
      }}
      className={`absolute cursor-grab active:cursor-grabbing select-none transition-shadow z-30 group ${
        isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/50 rounded-2xl' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Sticker Content Renderers */}
      {sticker.type === 'location' && (
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/95 text-neutral-900 font-bold text-sm shadow-xl backdrop-blur-md border border-black/5">
          <span className="text-base">📍</span>
          <span className="truncate max-w-[200px]">{sticker.content?.locationName || 'Campus Landmark'}</span>
        </div>
      )}

      {sticker.type === 'poll' && (
        <div className="w-56 bg-neutral-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-3.5 shadow-2xl text-white">
          <p className="text-xs font-bold text-center mb-2.5 leading-snug">
            {sticker.content?.question || 'Ask the campus...'}
          </p>
          <div className="space-y-1.5">
            <div className="w-full h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[11px] font-semibold text-amber-300">
              {sticker.content?.option1 || 'Option A'}
            </div>
            <div className="w-full h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[11px] font-semibold text-sky-300">
              {sticker.content?.option2 || 'Option B'}
            </div>
          </div>
        </div>
      )}

      {sticker.type === 'text' && (
        <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-white font-bold text-base shadow-lg">
          {sticker.content?.text || 'Type something...'}
        </div>
      )}

      {/* Floating Action Controls on Selection */}
      {isSelected && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-lg text-[10px] text-white">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(-15);
            }}
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold"
            title="Rotate Left"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleScale(-0.1);
            }}
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold"
            title="Scale Down"
          >
            -
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleScale(0.1);
            }}
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold"
            title="Scale Up"
          >
            +
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRotate(15);
            }}
            className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold"
            title="Rotate Right"
          >
            ↻
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(sticker.id);
              }}
              className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center font-bold"
              title="Delete Sticker"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EditableSticker;
