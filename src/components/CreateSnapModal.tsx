import React, { useState, useRef, type FormEvent } from 'react';
import { 
  X, 
  MapPin, 
  Camera, 
  UploadCloud, 
  Users, 
  Check, 
  Radio, 
  Image as ImageIcon
} from 'lucide-react';
import { CampusSnap, StudentLevel, StorySticker } from '../types';
import { useAuth } from '../context/AuthContext';
import { LiveCameraModal } from './LiveCameraModal';
import { uploadSnapMedia, emitAppToast } from '../services/supabase';
import { dataUrlToBlob } from '../utils/imageOptimizer';
import { getFriendlyError } from '../utils/friendlyErrors';

interface CreateSnapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapCreated: (newSnap: CampusSnap) => void | Promise<void>;
  onRequireAuth?: () => void;
}

const UNILORIN_LANDMARK_TAGS = [
  'Senate Building Walkway',
  'Walk of Fame',
  'CBT Examination Centre',
  'SUB Lounge & Quad',
  'Faculty of Arts Quad',
  'CIS Block & Basement',
  'Faculty of Engineering (ETF)',
  'Lagos Hostel Quad',
  'Abuja / Kwara Hostel',
  'Tanke Gate / Sanrab Loop',
  'UNILORIN Sports Stadium',
  'Main Auditorium Lawn',
];

export const CreateSnapModal: React.FC<CreateSnapModalProps> = ({
  isOpen,
  onClose,
  onSnapCreated,
  onRequireAuth,
}) => {
  const { currentUser } = useAuth();
  const [caption, setCaption] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  
  // Privacy Settings ('all' | 'close_friends')
  const [privacySetting, setPrivacySetting] = useState<'all' | 'close_friends'>('all');
  
  // Interactive Poll Sticker Toggle & State
  const [pollData, setPollData] = useState<{ question: string; opt1: string; opt2: string } | null>(null);

  // Active Bottom Sheet ('audience' | 'location' | 'poll' | null)
  const [activeSheet, setActiveSheet] = useState<'audience' | 'location' | 'poll' | null>(null);
  const [tempPollQ, setTempPollQ] = useState('Attending today? 🔥');
  const [tempOpt1, setTempOpt1] = useState('Yes, definitely!');
  const [tempOpt2, setTempOpt2] = useState('Studying in room');

  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="relative flex flex-col w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-center space-y-4 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mx-auto">
            <Camera className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold">Sign In to Post Campus Stories</h3>
          <p className="text-xs text-neutral-400">
            Share 24-hour auto-expiring media moments with granular privacy controls.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequireAuth?.();
            }}
            className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 py-2.5 text-xs font-bold transition-colors cursor-pointer"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) {
      onRequireAuth?.();
      return;
    }

    try {
      setIsUploadingMedia(true);
      const result = await uploadSnapMedia(file, currentUser.id);
      if (result) {
        setCustomMediaUrl(result.url);
        setMediaType(result.mediaType);
      }
    } catch (err: any) {
      console.error('[Snap Upload Handler Error]:', err);
      emitAppToast('Failed to upload media. Please try again.', 'error');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();

    // LAUNCH POLISH: Double-submit prevention while upload is active
    if (isUploadingMedia) return;

    const targetMediaUrl = customMediaUrl.trim();
    if (!targetMediaUrl || targetMediaUrl.startsWith('blob:')) {
      emitAppToast('Please select or capture photo/video media for your story.', 'error');
      return;
    }

    const stickers: StorySticker[] = [];

    if (locationTag) {
      stickers.push({
        id: `loc_${Date.now()}`,
        type: 'location',
        locationName: locationTag,
        latitude: 8.4799,
        longitude: 4.5418,
        x: 0.5,
        y: 0.22,
      });
    }

    if (pollData && pollData.question.trim()) {
      stickers.push({
        id: `poll_${Date.now()}`,
        type: 'poll',
        question: pollData.question.trim(),
        options: [
          { id: 'opt_1', text: pollData.opt1.trim() || 'Option 1', votes: 1 },
          { id: 'opt_2', text: pollData.opt2.trim() || 'Option 2', votes: 0 },
        ],
        x: 0.5,
        y: 0.55,
      });
    }

    const newSnap: CampusSnap = {
      id: `snap_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.fullName || 'Student',
      authorUsername: currentUser.username || currentUser.email.split('@')[0],
      authorAvatar: currentUser.avatarUrl || '',
      authorDept: currentUser.department || 'General Studies',
      authorLevel: (currentUser.level as StudentLevel) || '300L',
      locationTag: locationTag || UNILORIN_LANDMARK_TAGS[0],
      mediaUrl: targetMediaUrl,
      mediaType,
      caption: caption.trim(),
      createdAt: new Date().toISOString(),
      expiresInHours: 24,
      viewsCount: 0,
      privacySetting,
      stickers,
    };

    try {
      await onSnapCreated(newSnap);
      setCaption('');
      setCustomMediaUrl('');
      onClose();
    } catch (err: unknown) {
      console.error('[CreateSnapModal Submit Error]:', err);
      emitAppToast(getFriendlyError(err, 'snap'), 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none overflow-hidden">
      {/* Fullscreen Mobile Story Composer container */}
      <div className="relative w-full h-full sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl sm:border sm:border-neutral-800 bg-neutral-950 overflow-hidden flex flex-col justify-between shadow-2xl text-white">

        {/* Hidden inputs for gallery upload & file picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Top Header Row: Close (X) on left, Icon Row on right (Audience, Location, Poll) */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-black/70 transition-colors cursor-pointer shadow-md"
            aria-label="Close Composer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Small row of icon buttons for audience, location tag, poll */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSheet(activeSheet === 'audience' ? null : 'audience')}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border transition-colors cursor-pointer shadow-md ${
                privacySetting === 'close_friends' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'
              }`}
              title="Audience Privacy"
            >
              <Users className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet(activeSheet === 'location' ? null : 'location')}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border transition-colors cursor-pointer shadow-md ${
                locationTag ? 'bg-amber-500 text-black font-bold border-amber-400' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'
              }`}
              title="Add Location Tag"
            >
              <MapPin className="h-4.5 w-4.5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveSheet(activeSheet === 'poll' ? null : 'poll')}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border transition-colors cursor-pointer shadow-md ${
                pollData ? 'bg-amber-500 text-black font-bold border-amber-400' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'
              }`}
              title="Add Interactive Poll"
            >
              <Radio className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Media Viewport Filling Screen */}
        <div className="relative w-full h-full bg-neutral-900 flex items-center justify-center overflow-hidden">
          {customMediaUrl ? (
            mediaType === 'video' ? (
              <video src={customMediaUrl} autoPlay loop playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={customMediaUrl} alt="Story Media" className="h-full w-full object-cover" />
            )
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-white">
                <ImageIcon className="h-8 w-8 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Create 24-Hour Story</h4>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Capture a live moment or upload photo/video from your device gallery.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLiveCameraOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-black px-5 py-3 text-xs font-bold transition-all shadow-lg hover:bg-neutral-200 cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Open Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white border border-white/20 px-5 py-3 text-xs font-semibold transition-all hover:bg-white/20 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4 text-amber-400" />
                  <span>Gallery</span>
                </button>
              </div>

              {isUploadingMedia && (
                <div className="flex items-center gap-2 text-xs text-amber-400 pt-2">
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span>Processing media upload...</span>
                </div>
              )}
            </div>
          )}

          {/* Active Poll Badge on Media if Present */}
          {pollData && customMediaUrl && (
            <div className="absolute inset-x-6 top-24 z-20 bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl space-y-2 pointer-events-none">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Interactive Poll</span>
              <p className="text-xs font-bold text-white">{pollData.question}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded-xl p-2 text-center text-xs font-semibold text-white">{pollData.opt1}</div>
                <div className="bg-white/10 rounded-xl p-2 text-center text-xs font-semibold text-white">{pollData.opt2}</div>
              </div>
            </div>
          )}

          {/* Active Location Badge on Media if Present */}
          {locationTag && customMediaUrl && (
            <div className="absolute top-20 left-4 z-20 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20 flex items-center gap-1.5 text-xs font-semibold text-white shadow-lg pointer-events-none">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span>{locationTag}</span>
            </div>
          )}
        </div>

        {/* Bottom Overlay: Caption Input (Optional) & One Primary Share Button */}
        <div className="absolute bottom-6 inset-x-4 z-30 flex flex-col gap-3 pointer-events-auto">
          {/* Optional Caption Input */}
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption to your story (optional)..."
            className="w-full rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 px-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400 shadow-xl"
          />

          {/* Primary Share Button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isUploadingMedia || !customMediaUrl}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 py-3.5 text-xs sm:text-sm font-bold text-neutral-950 transition-all shadow-xl shadow-amber-950/50 cursor-pointer"
          >
            <Check className="h-4.5 w-4.5" />
            <span>Share Story (24 Hours)</span>
          </button>
        </div>

        {/* Compact Bottom Sheet Modals for Audience, Location, Poll */}
        {activeSheet && (
          <div 
            className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end animate-in fade-in"
            onClick={() => setActiveSheet(null)}
          >
            <div 
              className="w-full bg-neutral-900 border-t border-neutral-800 rounded-t-3xl p-6 space-y-4 max-h-[70vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <h4 className="text-sm font-bold text-white">
                  {activeSheet === 'audience' && 'Story Audience Privacy'}
                  {activeSheet === 'location' && 'Tag UNILORIN Landmark'}
                  {activeSheet === 'poll' && 'Add Interactive Poll'}
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="p-1 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 1. Audience Sheet Content */}
              {activeSheet === 'audience' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrivacySetting('all');
                      setActiveSheet(null);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      privacySetting === 'all'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <span>🌍 All Campus Contacts</span>
                    {privacySetting === 'all' && <Check className="h-4 w-4 text-amber-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrivacySetting('close_friends');
                      setActiveSheet(null);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      privacySetting === 'close_friends'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                    }`}
                  >
                    <span>⭐ Close Friends & Founders</span>
                    {privacySetting === 'close_friends' && <Check className="h-4 w-4 text-emerald-400" />}
                  </button>
                </div>
              )}

              {/* 2. Location Sheet Content */}
              {activeSheet === 'location' && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationTag('');
                      setActiveSheet(null);
                    }}
                    className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-400 hover:text-white text-left"
                  >
                    No Landmark Tag
                  </button>
                  {UNILORIN_LANDMARK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setLocationTag(tag);
                        setActiveSheet(null);
                      }}
                      className={`w-full p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        locationTag === tag
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      📍 {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* 3. Poll Sheet Content */}
              {activeSheet === 'poll' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-400 uppercase">Poll Question</label>
                    <input
                      type="text"
                      value={tempPollQ}
                      onChange={(e) => setTempPollQ(e.target.value)}
                      placeholder="Ask your campus a question..."
                      className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase">Option 1</label>
                      <input
                        type="text"
                        value={tempOpt1}
                        onChange={(e) => setTempOpt1(e.target.value)}
                        className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-neutral-400 uppercase">Option 2</label>
                      <input
                        type="text"
                        value={tempOpt2}
                        onChange={(e) => setTempOpt2(e.target.value)}
                        className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    {pollData && (
                      <button
                        type="button"
                        onClick={() => {
                          setPollData(null);
                          setActiveSheet(null);
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold"
                      >
                        Remove Poll
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPollData({ question: tempPollQ, opt1: tempOpt1, opt2: tempOpt2 });
                        setActiveSheet(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold"
                    >
                      Apply Poll Sticker
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Live Camera Modal Integration */}
      {isLiveCameraOpen && (
        <LiveCameraModal
          isOpen={isLiveCameraOpen}
          onClose={() => setIsLiveCameraOpen(false)}
          onCapture={async (url, type, fileOrBlob) => {
            setIsLiveCameraOpen(false);
            if (!currentUser) return;
            try {
              setIsUploadingMedia(true);
              let targetBlob: File | Blob | null = fileOrBlob || null;
              if (!targetBlob && url.startsWith('data:')) {
                try {
                  targetBlob = dataUrlToBlob(url);
                } catch {}
              }
              if (!targetBlob && url.startsWith('blob:')) {
                try {
                  const res = await fetch(url);
                  targetBlob = await res.blob();
                } catch {}
              }

              if (!targetBlob) {
                emitAppToast('Unable to process captured media.', 'error');
                return;
              }

              const result = await uploadSnapMedia(targetBlob, currentUser.id);
              if (result?.url && !result.url.startsWith('blob:')) {
                setCustomMediaUrl(result.url);
                setMediaType(result.mediaType);
              }
            } catch (err: any) {
              console.error('[Live Capture Upload Error]:', err);
              emitAppToast('Failed to upload camera media: ' + (err?.message || 'Upload error'), 'error');
            } finally {
              setIsUploadingMedia(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default CreateSnapModal;

