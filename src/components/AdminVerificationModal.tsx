import { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Check, 
  XCircle, 
  Eye, 
  RotateCw, 
  User, 
  GraduationCap, 
  Clock, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  PenTool
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VerificationRequest } from '../types';
import { 
  fetchPendingVerificationRequests, 
  approveVerificationRequest, 
  rejectVerificationRequest,
  getProofSignedUrl
} from '../services/verificationService';
import {
  fetchPendingWriterApplications,
  fetchPendingWriterVerifications,
  reviewWriterApplication,
  reviewWriterVerification
} from '../services/writers';
import type { WriterApplication, WriterVerification } from '../types/writers';

interface AdminVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestActioned?: () => void;
}

export const AdminVerificationModal = ({
  isOpen,
  onClose,
  onRequestActioned,
}: AdminVerificationModalProps) => {
  const { currentUser, syncUserProfileFromSupabase } = useAuth();

  const [adminTab, setAdminTab] = useState<'students' | 'writers'>('students');
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [writerApps, setWriterApps] = useState<WriterApplication[]>([]);
  const [writerVerifs, setWriterVerifs] = useState<WriterVerification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWriters, setIsLoadingWriters] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actioningWriterId, setActioningWriterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lightbox view state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewApplicantName, setPreviewApplicantName] = useState<string>('');

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPendingVerificationRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load verification requests.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWriterApps = async () => {
    setIsLoadingWriters(true);
    try {
      const [apps, verifs] = await Promise.all([
        fetchPendingWriterApplications(),
        fetchPendingWriterVerifications()
      ]);
      setWriterApps(apps);
      setWriterVerifs(verifs);
    } catch (err: any) {
      console.warn('[loadWriterApps Notice]:', err);
    } finally {
      setIsLoadingWriters(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRequests();
      loadWriterApps();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Lightbox preview of proof image
  const handleViewProof = async (req: VerificationRequest) => {
    try {
      const signedUrl = await getProofSignedUrl(req.proofUrl);
      setPreviewImageUrl(signedUrl);
      setPreviewApplicantName(req.applicantName || 'Applicant');
    } catch (e) {
      console.warn('[View proof signed URL error]:', e);
      setPreviewImageUrl(req.proofUrl);
    }
  };

  // Handle Approve
  const handleApprove = async (req: VerificationRequest) => {
    if (!currentUser) return;
    setActioningId(req.id);
    try {
      await approveVerificationRequest(req.id, req.userId, currentUser.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      if (req.userId === currentUser.id) {
        await syncUserProfileFromSupabase(currentUser.id);
      }
      onRequestActioned?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve request.');
    } finally {
      setActioningId(null);
    }
  };

  // Handle Reject
  const handleReject = async (req: VerificationRequest) => {
    if (!currentUser) return;
    setActioningId(req.id);
    try {
      await rejectVerificationRequest(req.id, req.userId, currentUser.id, 'Document could not be verified.');
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      onRequestActioned?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject request.');
    } finally {
      setActioningId(null);
    }
  };

  // Handle Approve Writer
  const handleApproveWriter = async (app: WriterApplication) => {
    if (!currentUser) return;
    setActioningWriterId(app.user_id);
    try {
      await reviewWriterApplication(app.user_id, 'approved');
      setWriterApps((prev) => prev.filter((a) => a.user_id !== app.user_id));
      onRequestActioned?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve writer.');
    } finally {
      setActioningWriterId(null);
    }
  };

  // Handle Approve Writer Verification
  const handleApproveWriterVerification = async (verif: WriterVerification) => {
    if (!currentUser) return;
    setActioningWriterId(verif.user_id);
    try {
      await reviewWriterVerification(verif.user_id, 'approved');
      setWriterVerifs((prev) => prev.filter((v) => v.user_id !== verif.user_id));
      setWriterApps((prev) => prev.filter((a) => a.user_id !== verif.user_id));
      onRequestActioned?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve writer verification.');
    } finally {
      setActioningWriterId(null);
    }
  };

  // Handle Reject Writer
  const handleRejectWriter = async (app: WriterApplication) => {
    if (!currentUser) return;
    setActioningWriterId(app.user_id);
    try {
      await reviewWriterApplication(app.user_id, 'rejected');
      setWriterApps((prev) => prev.filter((a) => a.user_id !== app.user_id));
      onRequestActioned?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject writer.');
    } finally {
      setActioningWriterId(null);
    }
  };

  // Handle Reject Writer Verification
  const handleRejectWriterVerification = async (verif: WriterVerification) => {
    if (!currentUser) return;
    setActioningWriterId(verif.user_id);
    try {
      await reviewWriterVerification(verif.user_id, 'rejected');
      setWriterVerifs((prev) => prev.filter((v) => v.user_id !== verif.user_id));
      onRequestActioned?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject writer verification.');
    } finally {
      setActioningWriterId(null);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Admin Accent Strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 bg-neutral-950/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Admin Approval Queue
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  {adminTab === 'students'
                    ? `${requests.length} pending student verification${requests.length === 1 ? '' : 's'}`
                    : `${writerApps.length} pending writer application${writerApps.length === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  loadRequests();
                  loadWriterApps();
                }}
                disabled={isLoading || isLoadingWriters}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Refresh Queue"
              >
                <RotateCw className={`h-4 w-4 ${isLoading || isLoadingWriters ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Admin Queue Tabs */}
          <div className="flex border-b border-neutral-800 bg-neutral-950 px-4 sm:px-6 shrink-0">
            <button
              type="button"
              onClick={() => setAdminTab('students')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                adminTab === 'students'
                  ? 'border-amber-500 text-amber-400 font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Student ID ({requests.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('writers')}
              className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                adminTab === 'writers'
                  ? 'border-amber-500 text-amber-400 font-extrabold'
                  : 'border-transparent text-neutral-400 hover:text-white'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Writer Applications ({writerApps.length})</span>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
            
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* TAB 1: STUDENT ID VERIFICATIONS */}
            {adminTab === 'students' && (
              <>
                {isLoading ? (
              <div className="py-12 text-center text-neutral-400 space-y-3">
                <RotateCw className="h-8 w-8 animate-spin mx-auto text-amber-400" />
                <p className="text-xs font-semibold">Loading verification requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-white">All caught up!</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  There are currently no pending student verification requests in the queue.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      
                      {/* Applicant Metadata */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            {req.applicantName}
                          </h4>
                          {req.applicantLevel && (
                            <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono font-bold">
                              {req.applicantLevel}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {req.applicantUsername && (
                          <p className="text-xs font-mono text-neutral-400">
                            @{req.applicantUsername}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-neutral-300 pt-0.5">
                          <GraduationCap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span>
                            {req.applicantDepartment || 'Department'} • {req.applicantFaculty || 'Faculty'}
                          </span>
                        </div>

                        {req.note && (
                          <p className="text-xs text-neutral-300 bg-neutral-900/90 border border-neutral-800 rounded-lg p-2 mt-2 italic">
                            "{req.note}"
                          </p>
                        )}
                      </div>

                      {/* Tap to View Proof Button */}
                      <button
                        type="button"
                        onClick={() => handleViewProof(req)}
                        className="self-start px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Proof</span>
                      </button>
                    </div>

                    {/* Action Buttons: Approve & Reject */}
                    <div className="pt-2 border-t border-neutral-900 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleReject(req)}
                        disabled={actioningId === req.id}
                        className="px-3 py-1.5 rounded-xl border border-neutral-700 hover:border-rose-500/50 hover:bg-rose-500/10 text-neutral-300 hover:text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(req)}
                        disabled={actioningId === req.id}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actioningId === req.id ? (
                          <>
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve Student</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
              </>
            )}

            {/* TAB 2: WRITER APPLICATIONS */}
            {adminTab === 'writers' && (
              <>
                {isLoadingWriters ? (
                  <div className="py-12 text-center text-neutral-400 space-y-3">
                    <RotateCw className="h-8 w-8 animate-spin mx-auto text-amber-400" />
                    <p className="text-xs font-semibold">Loading writer applications...</p>
                  </div>
                ) : (writerApps.length === 0 && writerVerifs.length === 0) ? (
                  <div className="py-12 text-center text-neutral-400 space-y-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-neutral-400">
                      <Check className="h-6 w-6 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">No pending writer applications</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      All student writer submissions have been reviewed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Writer Verification Code Requests (Requirement 5) */}
                    {writerVerifs.map((verif) => (
                      <div
                        key={`verif-${verif.user_id}`}
                        className="p-4 sm:p-5 rounded-2xl border border-amber-500/40 bg-neutral-950 hover:border-amber-500/60 transition-all space-y-3 shadow-md"
                      >
                        {/* Header: Writer Profile Name & Username */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                verif.applicantAvatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                              }
                              alt={verif.applicantName || 'Writer'}
                              className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-white">
                                  {verif.applicantName || 'Student Writer'}
                                </h4>
                                {verif.applicantUsername && (
                                  <span className="text-xs font-mono text-neutral-400">
                                    {verif.applicantUsername}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-400">
                                {verif.applicantDepartment || 'Student'} • Code Verification Request
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                            Verification Code
                          </span>
                        </div>

                        {/* Submitted Writing Link & Code */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                              Writing-Space Link:
                            </span>
                            <a
                              href={verif.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-amber-400 hover:underline flex items-center justify-between gap-1"
                            >
                              <span className="truncate">{verif.link}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                            </a>
                          </div>

                          <div className="p-3 rounded-xl bg-neutral-900/80 border border-amber-500/30 space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                              Required Bio Code:
                            </span>
                            <span className="text-base font-black font-mono text-amber-400 tracking-wider block">
                              {verif.code}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Approve / Reject Verification */}
                        <div className="pt-2 border-t border-neutral-900 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRejectWriterVerification(verif)}
                            disabled={actioningWriterId === verif.user_id}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveWriterVerification(verif)}
                            disabled={actioningWriterId === verif.user_id}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {actioningWriterId === verif.user_id ? (
                              <>
                                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve Verification</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Standard Writer Form Applications */}
                    {writerApps.map((app) => (
                      <div
                        key={app.user_id}
                        className="p-4 sm:p-5 rounded-2xl border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-all space-y-3"
                      >
                        {/* Header: Name, Department, Date */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                app.applicantAvatarUrl ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                              }
                              alt={app.applicantName}
                              className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-white">
                                  {app.applicantName}
                                </h4>
                                {app.applicantUsername && (
                                  <span className="text-xs font-mono text-neutral-400">
                                    {app.applicantUsername}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-400">
                                {app.applicantDepartment || 'Student'} • Applied {new Date(app.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                            Pending Review
                          </span>
                        </div>

                        {/* Bio */}
                        {app.bio && (
                          <div className="text-xs text-neutral-300 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800/80 leading-relaxed">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                              Applicant Bio:
                            </span>
                            "{app.bio}"
                          </div>
                        )}

                        {/* Submitted Writing Links (Open in new tab) */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                            Submitted Links ({app.links.length}):
                          </span>
                          <div className="space-y-1">
                            {app.links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 hover:border-amber-500/50 text-xs text-amber-400 group transition-colors"
                              >
                                <span className="truncate max-w-[320px] sm:max-w-md">{link}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>

                        {/* Confirmation Note */}
                        {app.note && (
                          <div className="text-xs text-neutral-300 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800/60 leading-relaxed">
                            <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider block mb-1">
                              Confirmation Note:
                            </span>
                            "{app.note}"
                          </div>
                        )}

                        {/* Action Buttons: Reject & Approve Writer */}
                        <div className="pt-2 border-t border-neutral-900 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleRejectWriter(app)}
                            disabled={actioningWriterId === app.user_id}
                            className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveWriter(app)}
                            disabled={actioningWriterId === app.user_id}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {actioningWriterId === app.user_id ? (
                              <>
                                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Updating...</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve Writer</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>

      {/* Lightbox Modal for Full Image View */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Proof Document • {previewApplicantName}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto rounded-xl flex items-center justify-center bg-black/50">
              <img 
                src={previewImageUrl} 
                alt="Student Proof Document" 
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
