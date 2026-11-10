import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Camera, Smartphone, UploadCloud, Video, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { compressImageFile } from '../utils/imageOptimizer';

export interface HybridCameraCaptureRef {
  openNativeCamera: (facing?: 'environment' | 'user') => void;
  openGallery: () => void;
}

export interface HybridCameraCaptureProps {
  onCapture: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  onOpenWebcam?: () => void;
  facingMode?: 'environment' | 'user';
  className?: string;
  buttonText?: string;
  showAllButtons?: boolean;
}

export const HybridCameraCapture = forwardRef<HybridCameraCaptureRef, HybridCameraCaptureProps>(({
  onCapture,
  onOpenWebcam,
  facingMode = 'environment',
  className = '',
  buttonText = 'Open Camera',
  showAllButtons = true,
}, ref) => {
  const [currentFacing, setCurrentFacing] = useState<'environment' | 'user'>(facingMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileCheck = Boolean(/android|ipad|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1));
      setIsMobile(mobileCheck);
    }
  }, []);

  const openNativeCamera = (facing?: 'environment' | 'user') => {
    if (facing) setCurrentFacing(facing);
    // Programmatically trigger native device camera
    if (nativeInputRef.current) {
      nativeInputRef.current.value = '';
      nativeInputRef.current.click();
    }
  };

  const openGallery = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  useImperativeHandle(ref, () => ({
    openNativeCamera,
    openGallery,
  }));

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    setIsProcessing(true);

    try {
      if (isVideo) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            onCapture(event.target.result, 'video');
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        const compressed = await compressImageFile(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.85,
        });
        onCapture(compressed, 'image');
        setIsProcessing(false);
      }
    } catch (err) {
      console.warn('Media processing fallback to direct read:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onCapture(event.target.result, isVideo ? 'video' : 'image');
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 1. Primary Invisible Native Camera Input (Delegates directly to iOS / Android native camera app) */}
      <input
        type="file"
        accept="image/*,video/*"
        capture={currentFacing}
        style={{ display: 'none' }}
        ref={nativeInputRef}
        onChange={handleFileCapture}
      />

      {/* 2. Secondary Invisible Gallery / Document File Input */}
      <input
        type="file"
        accept="image/*,video/*"
        style={{ display: 'none' }}
        ref={galleryInputRef}
        onChange={handleFileCapture}
      />

      {/* Action Buttons */}
      {showAllButtons ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Primary Action: Direct Native Device Camera Trigger */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            disabled={isProcessing}
            onClick={() => openNativeCamera('environment')}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-2.5 px-3 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
            title="Open native device camera application"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Camera className="h-4 w-4 text-emerald-200" />
            )}
            <span>{isProcessing ? 'Processing...' : buttonText}</span>
          </motion.button>

          {/* Secondary Action: Choose from Photo Gallery / Files */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            disabled={isProcessing}
            onClick={openGallery}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-2.5 px-3 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            title="Select photo or video from device gallery"
          >
            <UploadCloud className="h-4 w-4 text-amber-400" />
            <span>Upload File</span>
          </motion.button>

          {/* Tertiary Action: WebRTC In-Browser Viewfinder (optional / desktop) */}
          {onOpenWebcam && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              disabled={isProcessing}
              onClick={onOpenWebcam}
              className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700/80 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Launch in-browser live webcam viewfinder"
            >
              <Smartphone className="h-3.5 w-3.5 text-blue-400" />
              <span>Web Viewfinder</span>
            </motion.button>
          )}
        </div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          disabled={isProcessing}
          onClick={() => openNativeCamera('environment')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white py-2.5 px-4 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            <RefreshCw className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Camera className="h-4 w-4 text-emerald-200" />
          )}
          <span>{isProcessing ? 'Processing...' : buttonText}</span>
        </motion.button>
      )}
    </div>
  );
});

HybridCameraCapture.displayName = 'HybridCameraCapture';
