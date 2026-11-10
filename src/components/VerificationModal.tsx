import { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  RotateCw,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VerificationRequest } from '../types';
import { 
  fetchMyVerificationRequest, 
  submitVerificationRequest,
  getProofSignedUrl 
} from '../services/verificationService';
import { getFriendlyError } from '../utils/friendlyErrors';
import { FriendlyAlert } from './FriendlyAlert';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const VerificationModal = ({
  isOpen,
  onClose,
  onStatusUpdated,
}: VerificationModalProps) => {
  const { currentUser, syncUserProfileFromSupabase } = useAuth();

  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing user verification status on open
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    setError(null);
    setSuccess(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setNote('');

    async function loadRequest() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const existing = await fetchMyVerificationRequest(currentUser.id);
        setRequest(existing);
        if (existing?.proofUrl) {
          const resolved = await getProofSignedUrl(existing.proofUrl);
          setProofUrl(resolved);
        }
      } catch (err: any) {
        console.warn('[VerificationModal load error]:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRequest();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('That file is too large or not supported. Please use a PNG or JPG under 10MB.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('That file is too large or not supported. Please use a PNG or JPG under 10MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    if (!selectedFile) {
      setError('Please upload a photo of your student ID or student portal screenshot.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const newReq = await submitVerificationRequest({
        userId: currentUser.id,
        file: selectedFile,
        note,
      });

      setRequest(newReq);
      setSuccess("Your verification request has been sent. We'll review it soon.");
      await syncUserProfileFromSupabase(currentUser.id);
      onStatusUpdated?.();
    } catch (err: unknown) {
      setError(getFriendlyError(err, 'verification'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Student Verification
              </h2>
              <p className="text-xs text-neutral-400">
                Receive the verified checkmark badge on your profile & posts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {error && (
            <FriendlyAlert
              message={error}
              onRetry={selectedFile ? () => { handleSubmit(); } : undefined}
              onDismiss={() => setError(null)}
              variant="warning"
              isRetrying={isSubmitting}
            />
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <p className="font-medium">{success}</p>
            </div>
          )}

          {/* User Already Verified */}
          {currentUser?.isVerified ? (
            <div className="text-center py-6 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white">You're a Verified Student!</h3>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                Your student status has been reviewed and verified by campus admins. Your profile, marketplace listings, and social feed posts now proudly display the verified badge.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : request?.status === 'pending' ? (
            /* Pending Status Screen */
            <div className="text-center py-5 space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg">
                <Clock className="h-7 w-7 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">Verification in Review</h3>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                Your student ID / portal screenshot was successfully submitted on{' '}
                <span className="font-mono text-amber-300">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
                . Our campus admin team will verify it shortly.
              </p>

              {proofUrl && (
                <div className="mt-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 max-w-xs mx-auto">
                  <p className="text-[10px] font-mono text-neutral-400 mb-1.5 uppercase font-bold">Uploaded Document</p>
                  <img 
                    src={proofUrl} 
                    alt="Uploaded Proof" 
                    className="w-full h-36 object-cover rounded-lg border border-neutral-800"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-all border border-neutral-700"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Informational Explanation */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-sky-200/90 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  Why get verified?
                </p>
                <p className="text-[11px] leading-relaxed text-neutral-300">
                  Manual student verification confirms you are an active university scholar. Verified students receive higher trust from buyers, sellers, and peers across campus.
                </p>
              </div>

              {request?.status === 'rejected' && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 space-y-1">
                  <p className="font-bold text-rose-400">Previous Request Declined</p>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    {request.note ? `Note from admin: ${request.note}` : 'Your previous document could not be validated. Please upload a clear photo and try again.'}
                  </p>
                </div>
              )}

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Student ID or Portal Screenshot <span className="text-amber-400">*</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-2xl border border-neutral-700 bg-neutral-950 p-2 overflow-hidden group">
                    <img 
                      src={previewUrl} 
                      alt="Proof Preview" 
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-neutral-800 text-white text-xs font-bold border border-neutral-700 hover:bg-neutral-700"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-700 hover:border-amber-500/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950/80"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 mb-2.5">
                      <UploadCloud className="h-6 w-6 text-amber-400" />
                    </div>
                    <p className="text-xs font-bold text-white mb-0.5">
                      Click to upload student proof
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Upload school ID card or student portal screenshot showing your name & department (PNG, JPG up to 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Optional Note for Reviewer
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. 300L Computer Science, matric ID: 21/52HL..."
                  rows={2}
                  maxLength={300}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !selectedFile}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400 text-neutral-950 font-extrabold text-xs shadow-lg transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading & Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Submit for Verification</span>
                  </>
                )}
              </button>

              <p className="text-center text-[10px] text-neutral-400">
                Verification is completely optional. You can continue using Campus Foundry without restriction.
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
