import React, { useState, useEffect } from 'react';

export interface Option {
  id: string;
  text: string;
  votes: number;
}

export interface RealtimePollProps {
  storyId: string;
  stickerId: string;
  question: string;
  initialOptions: Option[];
  userVotedOptionId?: string;
  ws?: WebSocket | null;
  onVoteCast?: (optionId: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

export const RealtimePollSticker: React.FC<RealtimePollProps> = ({
  storyId,
  stickerId,
  question,
  initialOptions,
  userVotedOptionId,
  ws,
  onVoteCast,
  onInteractionStart,
  onInteractionEnd,
}) => {
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(userVotedOptionId);

  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);

  useEffect(() => {
    if (userVotedOptionId) {
      setSelectedOptionId(userVotedOptionId);
    }
  }, [userVotedOptionId]);

  useEffect(() => {
    if (!ws) return;

    // Join WebSocket room for this specific story
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'JOIN_STORY_ROOM', data: { storyId } }));
    } else {
      const handleOpen = () => {
        ws.send(JSON.stringify({ event: 'JOIN_STORY_ROOM', data: { storyId } }));
      };
      ws.addEventListener('open', handleOpen);
    }

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (
          payload.event === 'POLL_UPDATED' &&
          payload.data.stickerId === stickerId
        ) {
          const updatedTallies: { id: string; votes: number }[] = payload.data.options;

          // Merge live totals into state
          setOptions((prevOptions) =>
            prevOptions.map((opt) => {
              const match = updatedTallies.find((t) => t.id === opt.id);
              return match ? { ...opt, votes: match.votes } : opt;
            })
          );
        }
      } catch (e) {
        console.error('[RealtimePollSticker] Error handling poll WS message:', e);
      }
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'LEAVE_STORY_ROOM', data: { storyId } }));
      }
    };
  }, [ws, storyId, stickerId]);

  const handleCastVote = (optionId: string) => {
    if (selectedOptionId) return; // Prevent double vote on client

    setSelectedOptionId(optionId);

    // Optimistically increment vote count locally
    setOptions((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt))
    );

    onVoteCast?.(optionId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          event: 'POLL_VOTE',
          data: {
            storyId,
            stickerId,
            optionId,
          },
        })
      );
    }
  };

  const totalVotes = options.reduce((acc, curr) => acc + curr.votes, 0);

  return (
    <div
      onMouseDown={onInteractionStart}
      onMouseUp={onInteractionEnd}
      onTouchStart={onInteractionStart}
      onTouchEnd={onInteractionEnd}
      className="w-60 bg-white/95 backdrop-blur-xl border border-black/10 rounded-2xl p-3.5 shadow-2xl text-neutral-900 select-none pointer-events-auto"
    >
      <h3 className="text-sm font-bold text-center mb-3 leading-snug text-neutral-900">
        {question}
      </h3>

      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleCastVote(option.id)}
              disabled={Boolean(selectedOptionId)}
              className={`relative w-full h-10 rounded-xl overflow-hidden text-left px-3 text-xs font-semibold transition-all border ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-150 text-neutral-800'
              }`}
            >
              {/* Dynamic Fill Bar */}
              {selectedOptionId && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isSelected ? 'bg-blue-500/25' : 'bg-neutral-300/40'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between h-full">
                <span className="truncate pr-2">{option.text}</span>
                {selectedOptionId && (
                  <span className="font-mono text-[11px] font-bold text-blue-600">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedOptionId && (
        <p className="text-[10px] text-center text-neutral-500 mt-2">
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </p>
      )}
    </div>
  );
};

export default RealtimePollSticker;
