import React, { useState, useRef } from 'react';
import { EditableSticker, StickerData } from './EditableSticker';

export interface StoryEditorProps {
  mediaUri: string;
  mediaType?: 'image' | 'video';
  onPublishStory: (payload: { mediaUri: string; stickers: StickerData[] }) => void;
  onClose?: () => void;
}

export const StoryEditorCanvas: React.FC<StoryEditorProps> = ({
  mediaUri,
  mediaType = 'image',
  onPublishStory,
  onClose,
}) => {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState<boolean>(false);
  const [showPollModal, setShowPollModal] = useState<boolean>(false);

  // Poll Form State
  const [pollQuestion, setPollQuestion] = useState('Which project is best?');
  const [pollOpt1, setPollOpt1] = useState('AI Tutor 🤖');
  const [pollOpt2, setPollOpt2] = useState('Campus Cart 🛒');

  // Location Form State
  const [locationName, setLocationName] = useState('Engineering Complex');

  const canvasRef = useRef<HTMLDivElement>(null);

  // Add a new Location Sticker
  const addLocationSticker = (name?: string) => {
    const newSticker: StickerData = {
      id: `sticker_loc_${Date.now()}`,
      type: 'location',
      content: { locationName: name || locationName || 'Victoria Island, Lagos' },
      x: 0.5,
      y: 0.35,
      scale: 1,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    setShowLocationPicker(false);
  };

  // Add a new Poll Sticker
  const addPollSticker = () => {
    const newSticker: StickerData = {
      id: `sticker_poll_${Date.now()}`,
      type: 'poll',
      content: {
        question: pollQuestion || 'Which design?',
        option1: pollOpt1 || 'Minimal',
        option2: pollOpt2 || 'Bold',
      },
      x: 0.5,
      y: 0.4,
      scale: 1,
      rotation: 0,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedStickerId(newSticker.id);
    setShowPollModal(false);
  };

  // Update sticker transform state
  const handleUpdateTransform = (id: string, updatedData: Partial<StickerData>) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updatedData } : s))
    );
  };

  // Delete sticker
  const handleDeleteSticker = (id: string) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) setSelectedStickerId(null);
  };

  // Export metadata payload to backend
  const handlePublish = () => {
    onPublishStory({
      mediaUri,
      stickers,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none">
      {/* Top Action Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm font-bold">Story Editor</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white flex items-center justify-center font-bold transition-colors border border-white/10 shadow-lg"
          >
            ✕
          </button>
        )}
      </div>

      {/* Story Canvas Frame */}
      <div
        ref={canvasRef}
        onClick={() => setSelectedStickerId(null)}
        className="relative w-full max-w-sm h-[80vh] max-h-[700px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-950 flex items-center justify-center"
      >
        {/* Background Media Preview */}
        {mediaType === 'video' ? (
          <video
            src={mediaUri}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <img
            src={mediaUri}
            alt="Story background"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        )}

        {/* Interactive Sticker Overlay Canvas */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {stickers.map((sticker) => (
            <EditableSticker
              key={sticker.id}
              sticker={sticker}
              containerWidth={canvasRef.current?.clientWidth || 360}
              containerHeight={canvasRef.current?.clientHeight || 640}
              onUpdateTransform={handleUpdateTransform}
              onDelete={handleDeleteSticker}
              isSelected={selectedStickerId === sticker.id}
              onSelect={(id) => setSelectedStickerId(id)}
            />
          ))}
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="w-full max-w-sm px-4 pt-4 flex items-center justify-between gap-2 z-40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-white/15 text-white text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>📍</span>
            <span>Location</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPollModal(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-white/15 text-white text-xs font-bold shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>📊</span>
            <span>Poll</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handlePublish}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-bold text-xs shadow-xl active:scale-95 transition-all flex items-center gap-1.5"
        >
          <span>Share Story</span>
          <span>➔</span>
        </button>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-3xl p-5 text-white shadow-2xl">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span>📍</span> Tag Campus Location
            </h3>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. SUB Shop 04, Faculty of Eng"
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white mb-3 focus:outline-none focus:border-amber-400"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => addLocationSticker(locationName)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400"
              >
                Add Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poll Creator Modal */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 rounded-3xl p-5 text-white shadow-2xl">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <span>📊</span> Create Interactive Poll
            </h3>
            <div className="space-y-2 mb-4">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Question</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ask something..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Option 1</label>
                <input
                  type="text"
                  value={pollOpt1}
                  onChange={(e) => setPollOpt1(e.target.value)}
                  placeholder="First choice"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-1">Option 2</label>
                <input
                  type="text"
                  value={pollOpt2}
                  onChange={(e) => setPollOpt2(e.target.value)}
                  placeholder="Second choice"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addPollSticker}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400"
              >
                Add Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditorCanvas;
