import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Video, 
  Square, 
  RotateCw, 
  X, 
  Check, 
  RefreshCw, 
  AlertCircle,
  UploadCloud,
  ShieldAlert,
  Zap,
  ZapOff,
  Image as ImageIcon
} from 'lucide-react';
import { captureAndCompressVideoFrame, compressImageFile, dataUrlToBlob } from '../utils/imageOptimizer';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (mediaUrl: string, mediaType: 'image' | 'video', fileOrBlob?: File | Blob) => void;
  title?: string;
}

export const LiveCameraModal = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Live Campus Camera',
}: LiveCameraModalProps) => {
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'image' | 'video'; fileOrBlob?: File | Blob } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInsecureContext, setIsInsecureContext] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize Camera Stream safely
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsInsecureContext(false);
    stopTracks();

    // 1. Secure Context Check
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setIsInsecureContext(true);
      setCameraError(
        'Camera access requires a Secure Context (HTTPS or localhost).'
      );
      return;
    }

    // 2. Browser & Device Availability Check
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setCameraError(
        'Your browser or current device does not support live camera capture.'
      );
      return;
    }

    // 3. Request Camera Stream with portrait 9:16 aspect ratio constraints to avoid over-zoom
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9 / 16 },
        },
        audio: mode === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera Access Notice:', err?.message || err?.name || err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
        setCameraError(
          'Camera permission was blocked. Please allow camera permissions in browser settings.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(
          'No camera hardware detected on this device.'
        );
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError(
          'The camera is currently in use by another application.'
        );
      } else {
        // Retry with basic relaxed constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: mode === 'video',
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(() => {});
          }
          return;
        } catch {
          setCameraError('Unable to access camera on this device.');
        }
      }
    }
  }, [facingMode, mode, stopTracks]);

  useEffect(() => {
    if (!isOpen || capturedMedia) return;
    startCamera();

    return () => {
      stopTracks();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, startCamera, capturedMedia, stopTracks]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      stopTracks();
    };
  }, [stopTracks]);

  if (!isOpen) return null;

  // Take Photo
  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    if (flashOn || true) {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 200);
    }

    const compressed = captureAndCompressVideoFrame(videoRef.current, {
      facingMode,
      maxWidth: 1080,
      maxHeight: 1920,
      quality: 0.88,
    });

    if (compressed) {
      let fileOrBlob: File | Blob | undefined;
      try {
        const blob = dataUrlToBlob(compressed);
        fileOrBlob = new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
      } catch {}
      setCapturedMedia({ url: compressed, type: 'image', fileOrBlob });
      stopTracks();
    }
  };

  // Start Video Recording
  const handleStartRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    setRecordSeconds(0);

    try {
      let mimeType = 'video/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }
      }

      const recorder = new MediaRecorder(streamRef.current, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
        const file = new File([blob], `video_${Date.now()}.${ext}`, { type: mimeType });
        setCapturedMedia({ url: videoUrl, type: 'video', fileOrBlob: file });
        setIsRecording(false);
        stopTracks();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 30) {
            handleStopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      console.error('MediaRecorder error:', e);
      setCameraError('Video recording is not supported on this browser.');
    }
  };

  // Stop Video Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Confirm capture
  const handleConfirm = () => {
    if (capturedMedia) {
      onCapture(capturedMedia.url, capturedMedia.type, capturedMedia.fileOrBlob);
      handleClose();
    }
  };

  // Retake
  const handleRetake = () => {
    if (capturedMedia?.url.startsWith('blob:')) {
      URL.revokeObjectURL(capturedMedia.url);
    }
    setCapturedMedia(null);
    startCamera();
  };

  const handleClose = () => {
    if (capturedMedia?.url.startsWith('blob:')) {
      URL.revokeObjectURL(capturedMedia.url);
    }
    setCapturedMedia(null);
    stopTracks();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    onClose();
  };

  // Fallback file input handler (Native camera or File selection)
  const handleFallbackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    try {
      if (isVid) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            onCapture(event.target.result, 'video', file);
            handleClose();
          }
        };
        reader.readAsDataURL(file);
      } else {
        const compressed = await compressImageFile(file, {
          maxWidth: 1080,
          maxHeight: 1920,
          quality: 0.88,
        });
        let compressedFile: File = file;
        try {
          const blob = dataUrlToBlob(compressed);
          compressedFile = new File([blob], file.name || `snap_${Date.now()}.jpg`, { type: blob.type });
        } catch {}
        onCapture(compressed, 'image', compressedFile);
        handleClose();
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onCapture(event.target.result, isVid ? 'video' : 'image', file);
          handleClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 30-second progress ring calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - recordSeconds / 30);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none overflow-hidden"
    >
      {/* Container: Fullscreen on mobile, 9:16 framed view on larger screens */}
      <div className="relative w-full h-full sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl sm:border sm:border-neutral-800 bg-black overflow-hidden flex flex-col justify-between shadow-2xl">

        {/* Flash Animation Overlay */}
        {flashActive && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none animate-out fade-out duration-200" />
        )}

        {/* Hidden inputs for native camera & gallery picker */}
        <input
          ref={nativeCameraRef}
          type="file"
          accept="image/*,video/*"
          capture={facingMode}
          style={{ display: 'none' }}
          onChange={handleFallbackFile}
        />
        <input
          ref={fileFallbackRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFallbackFile}
        />

        {/* Top Controls Bar */}
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-auto">
          {/* Close Button (Left) */}
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-colors cursor-pointer shadow-md"
            aria-label="Close Camera"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Right Controls: Flip Camera & Flash */}
          {!capturedMedia && !cameraError && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFlashOn((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md border border-white/10 transition-colors cursor-pointer shadow-md ${
                  flashOn ? 'bg-amber-400 text-black font-bold' : 'bg-black/40 text-white hover:bg-black/60'
                }`}
                title="Toggle Flash"
              >
                {flashOn ? <Zap className="h-5 w-5 fill-black" /> : <ZapOff className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-colors cursor-pointer shadow-md"
                title="Flip Camera"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Main Viewfinder / Media Preview Field */}
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-4 max-w-sm z-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto">
                {isInsecureContext ? <ShieldAlert className="h-7 w-7" /> : <AlertCircle className="h-7 w-7" />}
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  {isInsecureContext ? 'Secure Context Required' : 'Camera Unavailable'}
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {cameraError}
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black py-3 text-xs font-bold transition-all shadow-md cursor-pointer hover:bg-neutral-200"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Choose Media from Gallery</span>
                </button>
                
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 text-white py-2.5 text-xs font-semibold hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            </div>
          ) : capturedMedia ? (
            capturedMedia.type === 'image' ? (
              <img 
                src={capturedMedia.url} 
                alt="Captured Snap" 
                className="h-full w-full object-cover"
              />
            ) : (
              <video 
                src={capturedMedia.url} 
                controls 
                autoPlay 
                playsInline 
                loop
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`h-full w-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Recording Header Banner */}
              {isRecording && (
                <div className="absolute top-16 z-30 flex items-center gap-2 rounded-full bg-red-600/90 backdrop-blur-md px-4 py-1.5 text-xs font-mono font-bold text-white shadow-lg border border-red-400/30 animate-pulse">
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  <span>REC 00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:30</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Controls / Preview Actions Overlay */}
        <div className="absolute bottom-6 inset-x-0 z-30 flex flex-col items-center gap-4 px-6 pointer-events-auto">
          {capturedMedia ? (
            /* Post-Capture Preview Buttons */
            <div className="flex items-center justify-between w-full max-w-xs gap-4">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 py-3.5 px-5 text-xs font-bold text-white transition-all cursor-pointer shadow-lg"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retake</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 py-3.5 px-6 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-emerald-950/60"
              >
                <Check className="h-4.5 w-4.5" />
                <span>Use Media</span>
              </motion.button>
            </div>
          ) : !cameraError ? (
            /* Camera Shutter & Mode Selector */
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Shutter Bar with Gallery Thumbnail on Left */}
              <div className="flex items-center justify-between w-full max-w-xs px-2">
                {/* Gallery Thumbnail (Left) */}
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/50 bg-black/40 backdrop-blur-md text-white hover:border-white hover:bg-black/60 transition-all cursor-pointer shadow-md overflow-hidden group"
                  title="Upload from Gallery"
                >
                  <ImageIcon className="h-5 w-5 text-white/90 group-hover:scale-110 transition-transform" />
                </button>

                {/* Shutter Button (Center) */}
                {mode === 'photo' ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={handleTakePhoto}
                    className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-black/20 backdrop-blur-xs p-1 shadow-2xl cursor-pointer"
                    title="Take Photo"
                  >
                    <span className="h-16 w-16 rounded-full bg-white transition-transform hover:scale-95 active:scale-90" />
                  </motion.button>
                ) : (
                  <div className="relative flex items-center justify-center">
                    {/* SVG Progress Ring */}
                    <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 86 86">
                      <circle
                        cx="43"
                        cy="43"
                        r={radius}
                        className="stroke-white/30"
                        strokeWidth="4"
                        fill="transparent"
                      />
                      {isRecording && (
                        <circle
                          cx="43"
                          cy="43"
                          r={radius}
                          className="stroke-red-500 transition-all duration-1000 ease-linear"
                          strokeWidth="5"
                          strokeDasharray={circumference}
                          strokeDashoffset={progressOffset}
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      )}
                    </svg>

                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      className={`absolute flex h-16 w-16 items-center justify-center rounded-full shadow-2xl cursor-pointer transition-all ${
                        isRecording ? 'bg-red-600 scale-105 animate-pulse' : 'bg-red-500 hover:bg-red-400'
                      }`}
                      title={isRecording ? 'Stop Recording' : 'Start Recording'}
                    >
                      {isRecording ? (
                        <Square className="h-6 w-6 text-white fill-white rounded-xs" />
                      ) : (
                        <span className="h-7 w-7 rounded-full bg-white" />
                      )}
                    </motion.button>
                  </div>
                )}

                {/* Right Placeholder Spacer to keep shutter perfectly centered */}
                <div className="w-12" />
              </div>

              {/* Photo / Video Mode Selector Switch */}
              <div className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md p-1 border border-white/10 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMode('photo');
                    if (isRecording) handleStopRecording();
                  }}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    mode === 'photo'
                      ? 'bg-white text-black shadow-md'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>PHOTO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('video')}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    mode === 'video'
                      ? 'bg-white text-black shadow-md'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>VIDEO</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
