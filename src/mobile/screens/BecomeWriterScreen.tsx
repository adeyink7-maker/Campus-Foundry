import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PenTool,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  BookOpen,
  Send,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchUserWriterVerification,
  submitWriterVerification,
  fetchUserWriterApplication,
  isValidUrl
} from '../../services/writers';
import type { WriterVerification, WriterApplication } from '../../types/writers';

interface BecomeWriterScreenProps {
  onBack?: () => void;
  showToast?: (msg: string, type?: 'error' | 'success' | 'info') => void;
  onApprovedContinue?: () => void;
}

export const BecomeWriterScreen: React.FC<BecomeWriterScreenProps> = ({
  onBack,
  showToast,
  onApprovedContinue
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [verification, setVerification] = useState<WriterVerification | null>(null);
  const [writerApp, setWriterApp] = useState<WriterApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadStatus = async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [verif, app] = await Promise.all([
        fetchUserWriterVerification(currentUser.id),
        fetchUserWriterApplication(currentUser.id)
      ]);
      setVerification(verif);
      setWriterApp(app);
      if (verif) {
        setLinkInput(verif.link);
      }
    } catch {
      // Non-blocking catch
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [currentUser?.id]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/feed');
    }
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      if (showToast) showToast('Verification code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser) {
      setFormError('Please sign in to verify your writer space.');
      return;
    }

    if (!linkInput || !linkInput.trim()) {
      setFormError('Please enter a link to your writing space or portfolio.');
      return;
    }

    if (!isValidUrl(linkInput)) {
      setFormError('Please enter a valid website link (e.g. medium.com/@yourusername).');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitWriterVerification(currentUser.id, linkInput);
      setVerification(created);
      if (showToast) {
        showToast('Verification request created! Copy your code into your bio.', 'success');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Unable to submit your writing link right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTryAgain = () => {
    setVerification(null);
    setFormError(null);
    setLinkInput('');
  };

  const isApproved = writerApp?.status === 'approved' || verification?.status === 'approved';

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="min-h-[44px] min-w-[44px] flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 font-bold text-xs cursor-pointer transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono uppercase tracking-wider">
          <PenTool className="w-4 h-4 text-amber-400" />
          <span>Verify as Writer</span>
        </div>
      </header>

      {/* Main Body Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="py-20 text-center text-neutral-400 space-y-3">
            <RotateCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
            <p className="text-xs font-semibold">Checking writer verification status...</p>
          </div>
        ) : isApproved ? (
          /* ==================================================== */
          /* APPROVED STATE: Verified Writer                      */
          /* ==================================================== */
          <div className="p-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-neutral-900 text-center space-y-5 shadow-xl animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Writer</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                You are a Verified Writer!
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                Your writing space has been verified. You now enjoy full publishing access and the <strong className="text-amber-300">Verified Writer</strong> badge across Campus Foundry.
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onApprovedContinue) {
                    onApprovedContinue();
                  } else {
                    navigate('/write');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg shadow-amber-950/50 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <PenTool className="w-4 h-4" />
                <span>Create New Article</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/library')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Explore Campus Library</span>
              </button>
            </div>
          </div>
        ) : verification?.status === 'pending' ? (
          /* ==================================================== */
          /* PENDING VERIFICATION STATE                           */
          /* ==================================================== */
          <div className="p-6 rounded-3xl border border-amber-500/40 bg-neutral-900/90 text-center space-y-6 shadow-xl animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                Verification Pending Review
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                We're confirming your writing space
              </h2>
              <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
                Add the verification code below to your bio or "About" section on your writing page. Once our moderators confirm the code matches, your <strong className="text-amber-300">Verified Writer</strong> badge will be activated.
              </p>
            </div>

            {/* Verification Code Box with Copy Button */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Your One-Time Verification Code:
                </span>
                <span className="text-2xl font-black font-mono text-amber-400 tracking-widest block">
                  {verification.code}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleCopyCode(verification.code)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Submitted Link */}
            <div className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-left space-y-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Submitted Writing Space Link:
              </span>
              <a
                href={verification.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1.5 truncate"
              >
                <span className="truncate">{verification.link}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>

            <div className="pt-2 text-[11px] text-neutral-400 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" />
              <span>Request active for 7 days (Expires: {new Date(verification.expires_at).toLocaleDateString()})</span>
            </div>
          </div>
        ) : verification?.status === 'rejected' || verification?.status === 'expired' ? (
          /* ==================================================== */
          /* REJECTED / EXPIRED STATE                             */
          /* ==================================================== */
          <div className="p-6 rounded-3xl border border-rose-500/40 bg-neutral-900/90 text-center space-y-5 shadow-xl animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                {verification.status === 'expired'
                  ? 'Verification request expired'
                  : 'Unable to verify writing space'}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
                {verification.status === 'expired'
                  ? 'Your verification code expired after 7 days before it could be confirmed. Please submit a new link to try again.'
                  : 'We could not verify ownership of the provided writing space page. Please double check that your code is added to your page bio and try again.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleTryAgain}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg shadow-amber-950/40 inline-flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try again</span>
            </button>
          </div>
        ) : (
          /* ==================================================== */
          /* DEFAULT FORM STATE: Link Field & Explanation         */
          /* ==================================================== */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Polite Explanation Message (Requirement 1) */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-neutral-900 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                <span>Verify Writing Space Ownership</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                Campus Foundry is home to real student writers, and we want every writer to get proper credit for their work. To keep it that way, we confirm that each writer owns the page they share. Add the code below to your bio or 'About' section, then tap Done. Once approved, you can remove it. Thank you for helping keep Campus Foundry trusted!
              </p>
            </div>

            {/* Error Message display */}
            {formError && (
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-snug">{formError}</span>
              </div>
            )}

            {/* Writing-Space Link Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                Writing-Space Link <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://medium.com/@username, Substack, or blog link..."
                  className="w-full min-h-[48px] px-4 py-3 rounded-2xl border border-neutral-800 bg-neutral-900 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none shadow-inner"
                />
              </div>
              <p className="text-[11px] text-neutral-400 italic">
                Link to your Substack, Medium, personal blog, or student press desk.
              </p>
            </div>

            {/* Done Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[50px] px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Done</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BecomeWriterScreen;
