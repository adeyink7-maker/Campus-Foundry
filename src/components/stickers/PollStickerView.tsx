import React, { useMemo } from 'react';
import { PollSticker } from '../../types/stickers';

export interface PollProps {
  sticker: PollSticker;
  onVote: (stickerId: string, optionId: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const PollStickerView: React.FC<PollProps> = ({
  sticker,
  onVote,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const totalVotes = useMemo(() => {
    return sticker.options.reduce((acc, opt) => acc + (opt.votes || 0), 0);
  }, [sticker.options]);

  const hasVoted = Boolean(sticker.userVotedOptionId);

  const handleVote = (optionId: string) => {
    if (!hasVoted) {
      onVote(sticker.id, optionId);
    }
  };

  return (
    <div
      onMouseDown={onInteractionStart}
      onMouseUp={onInteractionEnd}
      onTouchStart={onInteractionStart}
      onTouchEnd={onInteractionEnd}
      className="w-64 max-w-[280px] bg-neutral-900/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl text-white select-none pointer-events-auto"
    >
      <h3 className="text-sm font-bold text-center mb-3 leading-snug drop-shadow">
        {sticker.question}
      </h3>

      <div className="space-y-2">
        {sticker.options.map((option) => {
          const isSelected = sticker.userVotedOptionId === option.id;
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleVote(option.id)}
              className={`relative w-full h-10 rounded-xl overflow-hidden text-left px-3 text-xs font-semibold transition-all border ${
                isSelected
                  ? 'border-amber-400/80 bg-amber-500/20'
                  : 'border-white/10 bg-white/10 hover:bg-white/15'
              }`}
            >
              {/* Animated / Rendered Vote Percentage Fill Bar */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isSelected ? 'bg-amber-500/40' : 'bg-white/20'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between h-full">
                <span className="truncate pr-2">{option.text}</span>
                {hasVoted && (
                  <span className="font-mono text-[11px] font-bold opacity-90">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-[10px] text-center text-neutral-400 mt-2">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </p>
      )}
    </div>
  );
};

export default PollStickerView;
