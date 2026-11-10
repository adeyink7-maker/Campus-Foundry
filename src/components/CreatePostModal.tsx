import { useState, useRef, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Tag, 
  Send, 
  Camera, 
  UploadCloud, 
  Smartphone,
  Trash2
} from 'lucide-react';
import { CampusPost, StudentLevel, StudentBusiness } from '../types';
import { useAuth } from '../context/AuthContext';
import { LiveCameraModal } from './LiveCameraModal';
import { compressImageFile, dataUrlToBlob } from '../utils/imageOptimizer';
import { uploadMedia, emitAppToast, generateVoiceUuid } from '../services/supabase';
import { getFriendlyError } from '../utils/friendlyErrors';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: CampusPost) => void | Promise<void>;
  onRequireAuth?: () => void;
  userBusinesses?: StudentBusiness[];
}

const CATEGORIES = [
  'Academics & GNS',
  'Gist & Social',
  'Student Hustle & Trades',
  'SUG & Elections',
  'Campus Life & Hostels',
  'Events & Sports',
] as const;

const UNILORIN_LOCATIONS = [
  'Senate Building Walkway',
  'Walk of Fame',
  'CBT Complex',
  'SUB Lounge & Eateries',
  'CIS Building & Labs',
  'Engineering ETF Hall',
  'Lagos Hostel (PS)',
  'Abuja / Kwara Hostels',
  'Private Hostels (Sanusi/Arafims)',
  'Tanke Gate / Sanrab',
  'UNILORIN Sports Stadium',
  'General Studies (GNS) Quad',
];

// Persistent last choice for category
let lastSelectedCategory: CampusPost['category'] = 'Academics & GNS';

export const CreatePostModal = ({
  isOpen,
  onClose,
  onPostCreated,
  onRequireAuth,
  userBusinesses = [],
}: CreatePostModalProps) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CampusPost['category']>(lastSelectedCategory);
  const [locationTag, setLocationTag] = useState(''); // Optional Campus Spot
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProfileNotice, setShowProfileNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="relative flex flex-col w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl text-center space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto">
            <Send className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Sign In to Post on Feed</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Please log in with your campus student profile to publish updates, inquiries, and news.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              onRequireAuth?.();
            }}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-xs font-bold transition-colors cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  // Handle local file upload with thumbnail preview
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    setMediaType(isVid ? 'video' : 'image');
    setSelectedFile(file);

    try {
      if (isVid) {
        const preview = URL.createObjectURL(file);
        setCustomMediaUrl(preview);
      } else {
        const compressed = await compressImageFile(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.85,
        });
        setCustomMediaUrl(compressed);
      }
    } catch {
      const preview = URL.createObjectURL(file);
      setCustomMediaUrl(preview);
    }
  };

  const handleLiveCapture = async (url: string, type: 'image' | 'video', fileOrBlob?: File | Blob) => {
    setCustomMediaUrl(url);
    setMediaType(type);
    setIsLiveCameraOpen(false);

    if (fileOrBlob) {
      const ext = type === 'video' ? 'webm' : 'jpg';
      const file = fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], `live_capture_${Date.now()}.${ext}`, { type: fileOrBlob.type || (type === 'video' ? 'video/webm' : 'image/jpeg') });
      setSelectedFile(file);
      return;
    }

    if (url.startsWith('data:')) {
      try {
        const blob = dataUrlToBlob(url);
        const ext = type === 'video' ? 'webm' : 'jpg';
        const file = new File([blob], `live_capture_${Date.now()}.${ext}`, { type: blob.type || (type === 'video' ? 'video/webm' : 'image/jpeg') });
        setSelectedFile(file);
      } catch (captureErr) {
        console.warn('[CreatePostModal]: Error converting live capture to file:', captureErr);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // LAUNCH POLISH: Prevent double submission while request is in flight
    if (isSubmitting) return;

    // LAUNCH POLISH: Input sanitization for post text
    const cleanContent = content.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

    // Text is optional ONLY if media is attached. Require text if no media.
    const hasMedia = Boolean(customMediaUrl || selectedFile);
    if (!hasMedia && !cleanContent) {
      emitAppToast('Please enter text or attach media to publish a post.', 'error');
      return;
    }

    const hasAuthorName = Boolean(currentUser?.fullName && currentUser.fullName.trim().length > 0);
    const hasAuthorLevel = Boolean(currentUser?.level && currentUser.level.trim().length > 0);

    if (!hasAuthorName || !hasAuthorLevel) {
      setShowProfileNotice(true);
      emitAppToast('Complete your profile (level, faculty, department) to post', 'error');
      return;
    }

    // Remember last selected category
    lastSelectedCategory = category;
    setIsSubmitting(true);

    try {
      let finalMedia: string | undefined = undefined;

      if (selectedFile && currentUser?.id) {
        const ext = selectedFile.name?.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
        const uuid = generateVoiceUuid();
        const storagePath = `${currentUser.id}/posts/${uuid}.${ext}`;
        const uploadedUrl = await uploadMedia('media', storagePath, selectedFile);
        finalMedia = uploadedUrl;
      } else if (customMediaUrl && !customMediaUrl.startsWith('blob:') && !customMediaUrl.startsWith('data:')) {
        finalMedia = customMediaUrl.trim();
      }

      const newPost: CampusPost = {
        id: `post_${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.fullName || 'UNILORIN Student',
        authorUsername: currentUser.username || currentUser.email.split('@')[0],
        authorAvatar: currentUser.avatarUrl || '',
        authorFaculty: currentUser.faculty || 'Faculty of Communication & Information Sciences',
        authorDept: currentUser.department || 'Computer Science',
        authorLevel: (currentUser.level as StudentLevel) || '300L',
        authorRole: currentUser.role,
        authorAccountType: currentUser.accountType || (currentUser.role === 'trader' ? 'TRADER' : 'BUYER'),
        content: cleanContent,
        category,
        locationTag: locationTag || undefined,
        mediaUrl: finalMedia,
        mediaType: finalMedia ? mediaType : undefined,
        likesCount: 1,
        likedByMe: true,
        commentsCount: 0,
        comments: [],
        createdAt: new Date().toISOString(),
        isVerifiedStudent: true,
      } as any;

      await onPostCreated(newPost);

      setContent('');
      setCustomMediaUrl('');
      setSelectedFile(null);
      setLocationTag('');
      onClose();
    } catch (err: unknown) {
      console.error('[CreatePostModal Submit Error]:', err);
      emitAppToast(getFriendlyError(err, 'post'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      >
        <div 
          className="relative flex flex-col w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Create Campus Post</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Incomplete profile warning banner */}
            {(showProfileNotice || !currentUser?.fullName?.trim() || !currentUser?.level?.trim()) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
                <span>Complete your profile to publish posts.</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent('open-edit-profile-modal'));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Profile
                </button>
              </div>
            )}

            {/* Top: Avatar and Text Box */}
            <div className="flex items-start gap-3">
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={currentUser.fullName}
                className="h-10 w-10 rounded-full object-cover border border-neutral-700 shrink-0"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{currentUser.fullName}</span>
                  <span className="text-[10px] text-neutral-400">{currentUser.level || '300L'}</span>
                </div>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={customMediaUrl ? "Add a caption (optional)..." : "What's happening on campus? (Text required if no media attached)..."}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-emerald-500 focus:outline-none leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Media Thumbnail Row (Shown ONLY after media is picked, small size with remove button) */}
            {customMediaUrl && (
              <div className="flex items-center gap-3 p-2 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 shrink-0">
                  {mediaType === 'video' ? (
                    <video src={customMediaUrl} className="h-full w-full object-cover" />
                  ) : (
                    <img src={customMediaUrl} alt="Attached media" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-neutral-200 block truncate">
                    {mediaType === 'video' ? 'Video attached' : 'Photo attached'}
                  </span>
                  <span className="text-[10px] text-neutral-400">Ready to publish</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCustomMediaUrl('');
                    setSelectedFile(null);
                  }}
                  className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors cursor-pointer"
                  title="Remove media"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Category and Location as Small Chips */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                <Tag className="h-3 w-3 text-emerald-400" />
                <span>Category (Last Used)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-emerald-500 text-neutral-950 font-bold shadow-sm'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                <MapPin className="h-3 w-3 text-amber-400" />
                <span>Campus Spot (Optional)</span>
              </div>
              <select
                value={locationTag}
                onChange={(e) => setLocationTag(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- None (General Campus) --</option>
                {UNILORIN_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Hidden File Inputs */}
            <input 
              ref={nativeCameraRef}
              type="file" 
              accept="image/*,video/*" 
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileUpload} 
            />
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*,video/*" 
              style={{ display: 'none' }}
              onChange={handleFileUpload} 
            />

            {/* Bottom Toolbar & Sticky Publish Button */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-800 mt-auto">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => nativeCameraRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2 px-3 text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
                  title="Camera Capture"
                >
                  <Camera className="h-4 w-4 text-emerald-400" />
                  <span>Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2 px-3 text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
                  title="Gallery Upload"
                >
                  <UploadCloud className="h-4 w-4 text-amber-400" />
                  <span>Gallery</span>
                </button>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 text-xs transition-colors shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Publishing...' : 'Publish'}</span>
              </motion.button>
            </div>

          </form>
        </div>
      </div>

      {/* Live Camera Modal */}
      {isLiveCameraOpen && (
        <LiveCameraModal
          isOpen={isLiveCameraOpen}
          onClose={() => setIsLiveCameraOpen(false)}
          onCapture={handleLiveCapture}
          title="Capture Live Media for Post"
        />
      )}
    </>
  );
};

