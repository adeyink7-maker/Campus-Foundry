import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useMarketplaceChat } from '../../context/MarketplaceChatContext';
import { uploadVoiceNoteAudio, getPlayableAudioUrl, emitAppToast } from '../../services/supabase';

export interface MobileChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  isAudio?: boolean;
  audioDuration?: string;
  voiceNoteUrl?: string;
  timestamp: number | string;
  isMe: boolean;
  status: 'sent' | 'read';
  reactions?: { [emoji: string]: number };
}

export interface RealTimeChatScreenProps {
  chatType: 'direct' | 'group' | 'channel' | 'marketplace';
  recipient: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string;
    isVerifiedStudent?: boolean;
    department?: string;
    online?: boolean;
    isAcceptedContact?: boolean;
  };
  currentUser: {
    id: string;
    name: string;
    avatarUrl: string;
    isAdmin?: boolean;
  };
  onBack: () => void;
}

export const RealTimeChatScreen: React.FC<RealTimeChatScreenProps> = ({
  chatType,
  recipient,
  currentUser,
  onBack,
}) => {
  const { activeMessages: directMessages, setActiveConversationId, sendMessage: sendDirectMessage } = useChat();
  const { messages: marketplaceMessages, sendMessage: sendMarketplaceMessage } = useMarketplaceChat();

  const [inputMessage, setInputMessage] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isMarketplace = chatType === 'marketplace' || recipient.id.startsWith('biz_') || recipient.id.startsWith('conv_');

  useEffect(() => {
    if (!isMarketplace && recipient.id) {
      setActiveConversationId(recipient.id);
    }
  }, [isMarketplace, recipient.id]);

  // Load real messages matching conversation ID or recipient ID
  const relevantMessages = isMarketplace
    ? marketplaceMessages.filter((m: any) => m.conversationId === recipient.id)
    : directMessages;

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [relevantMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textToSend = inputMessage.trim();
    if (!textToSend || isSending) return;

    setInputMessage('');
    setIsSending(true);

    try {
      if (isMarketplace) {
        await sendMarketplaceMessage(textToSend);
      } else {
        await sendDirectMessage(textToSend);
      }
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } catch (err: any) {
      console.error('[RealTimeChatScreen] send error:', err);
      emitAppToast(err?.message || 'Failed to send message', 'error');
      setInputMessage(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleStartVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        emitAppToast('Audio recording is not supported in this browser.', 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(200);
      setIsRecordingAudio(true);
    } catch (err: any) {
      console.warn('[Microphone Access Error]:', err);
      emitAppToast('Microphone access denied or unavailable.', 'error');
    }
  };

  const handleStopAndSendVoiceRecording = async () => {
    if (!isRecordingAudio) return;
    setIsRecordingAudio(false);
    setIsSending(true);

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          if (!mediaRecorderRef.current) return resolve();
          mediaRecorderRef.current.onstop = () => resolve();
          mediaRecorderRef.current.stop();
        });
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;

      if (audioChunksRef.current.length > 0) {
        const rawMime = audioChunksRef.current[0].type || 'audio/webm';
        const cleanMime = rawMime.split(';')[0].trim();
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });
        audioChunksRef.current = [];

        const publicUrl = await uploadVoiceNoteAudio(audioBlob, currentUser.id);

        if (isMarketplace) {
          await sendMarketplaceMessage('🎤 Voice note', undefined);
        } else {
          await sendDirectMessage('🎤 Voice note', {
            voiceNote: {
              url: publicUrl,
              duration: 5,
              waveform: [40, 70, 90, 50, 80, 60, 30, 95, 75, 45],
            },
          });
        }
      }
    } catch (err: any) {
      console.error('[Voice Note Upload Error]:', err);
      emitAppToast('Failed to record/send voice note: ' + (err?.message || 'Error'), 'error');
    } finally {
      setIsSending(false);
    }
  };

  const renderStatusCheck = (isRead: boolean) => {
    return isRead ? (
      <span className="text-sky-400 font-bold ml-1 text-[11px]">✓✓</span>
    ) : (
      <span className="text-neutral-400 ml-1 text-[11px]">✓</span>
    );
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 bg-neutral-950 text-white overflow-hidden relative">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-3 bg-neutral-900 border-b border-neutral-800 z-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1 text-neutral-300 hover:text-white rounded-full hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            ←
          </button>
          <div className="relative">
            <img
              src={recipient.avatarUrl}
              alt={recipient.name}
              className="w-10 h-10 rounded-full object-cover border border-amber-500/40"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white leading-tight">{recipient.name}</span>
              {recipient.isVerifiedStudent && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/30">
                  Verified
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight">
              {recipient.handle}
            </p>
          </div>
        </div>
      </div>

      {/* Message Feed Canvas */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-neutral-950">
        {relevantMessages.map((msg: any) => {
          const isMe = msg.senderId === currentUser.id;
          const textContent = msg.body || msg.text || '';
          const isRead = Boolean(msg.isRead || msg.readAt);
          const voiceUrl = msg.voiceNoteUrl;

          return (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isMe ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3 relative text-xs leading-relaxed ${
                  isMe
                    ? 'bg-orange-500 text-neutral-950 font-medium rounded-2xl rounded-tr-xs shadow-md'
                    : 'bg-neutral-800 text-white rounded-2xl rounded-tl-xs border border-neutral-700/60 shadow-md'
                }`}
              >
                {voiceUrl ? (
                  <div className="flex items-center gap-2 py-1">
                    <audio src={getPlayableAudioUrl(voiceUrl)} controls className="h-8 max-w-[200px]" />
                  </div>
                ) : (
                  <p className="break-words">{textContent}</p>
                )}

                <div
                  className={`flex items-center gap-1 mt-1 text-[10px] ${
                    isMe ? 'justify-end text-neutral-950/70 font-mono' : 'justify-end text-neutral-400 font-mono'
                  }`}
                >
                  <span>
                    {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMe && renderStatusCheck(isRead)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-2.5 bg-neutral-900 border-t border-neutral-800 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-neutral-800/90 border border-neutral-700/70 rounded-full px-4 py-2.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-amber-500 transition-colors"
          />

          {inputMessage.trim() ? (
            <button
              type="submit"
              disabled={isSending}
              className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              ➤
            </button>
          ) : (
            <button
              type="button"
              onClick={isRecordingAudio ? handleStopAndSendVoiceRecording : handleStartVoiceRecording}
              disabled={isSending}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isRecordingAudio
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
              title={isRecordingAudio ? 'Tap to stop & send voice note' : 'Tap to record voice note'}
            >
              🎤
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
