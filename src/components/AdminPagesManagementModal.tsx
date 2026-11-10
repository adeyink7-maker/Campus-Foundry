import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Check,
  XCircle,
  BadgeCheck,
  Flag,
  Building2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { HubPage, PageReport } from '../types';
import {
  fetchPendingPageRequestsFromSupabase,
  reviewPageRequestInSupabase,
  fetchPageReportsFromSupabase,
  reviewPageReportInSupabase,
} from '../services/supabase';

import { useAuth } from '../context/AuthContext';

interface AdminPagesManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const AdminPagesManagementModal: React.FC<AdminPagesManagementModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.staffRole === 'super_admin' || currentUser?.isAdmin;

  const [activeTab, setActiveTab] = useState<'pending_requests' | 'reports'>('pending_requests');
  const [pendingRequests, setPendingRequests] = useState<HubPage[]>([]);
  const [reports, setReports] = useState<PageReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [reqs, reps] = await Promise.all([
        fetchPendingPageRequestsFromSupabase(),
        fetchPageReportsFromSupabase(),
      ]);
      setPendingRequests(reqs);
      setReports(reps);
    } catch (err: any) {
      console.error('[AdminPagesManagementModal] Error loading admin items:', err);
      setErrorMsg(err?.message || 'Failed to load admin items from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReviewRequest = async (pageId: string, status: 'approved' | 'rejected', markVerified = false) => {
    try {
      await reviewPageRequestInSupabase(pageId, status, markVerified, currentUser?.id);
      onShowToast?.(
        status === 'approved'
          ? markVerified
            ? 'Page approved and marked as Verified!'
            : 'Page approved!'
          : 'Page request rejected.'
      );
      setPendingRequests((prev) => prev.filter((p) => p.id !== pageId));
    } catch (e) {
      onShowToast?.('Failed to process request.');
    }
  };

  const handleReviewReport = async (reportId: string, action: 'dismiss' | 'remove_post', postId?: string) => {
    try {
      await reviewPageReportInSupabase(reportId, action, postId, currentUser?.id);
      onShowToast?.(action === 'dismiss' ? 'Report dismissed.' : 'Reported post removed!');
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      onShowToast?.('Failed to process report.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">App Admin - Pages Control</h2>
              <p className="text-xs text-neutral-400">Review pending club & news requests and post reports</p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-4">
            <button
              onClick={() => setActiveTab('pending_requests')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pending_requests'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Pending Requests ({pendingRequests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Page Post Reports ({reports.length})</span>
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-10 text-xs text-neutral-500">Loading admin items...</div>
          ) : errorMsg ? (
            <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 text-xs text-red-300 text-center space-y-2">
              <p>{errorMsg}</p>
              <button
                onClick={loadData}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Retry
              </button>
            </div>
          ) : activeTab === 'pending_requests' ? (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center border border-neutral-800 rounded-2xl bg-neutral-900/40 text-xs text-neutral-400">
                  No pending page registration requests.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.logoUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80'}
                          alt={req.name}
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-800"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{req.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300">
                              {req.type}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 mt-0.5">{req.description}</p>
                        </div>
                      </div>
                    </div>

                    {req.note && (
                      <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-amber-300">
                        <strong>Requester note:</strong> "{req.note}"
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                      <button
                        onClick={() => handleReviewRequest(req.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReviewRequest(req.id, 'approved', false)}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Approve</span>
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleReviewRequest(req.id, 'approved', true)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-950/40"
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          <span>Approve & Mark Verified</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="p-8 text-center border border-neutral-800 rounded-2xl bg-neutral-900/40 text-xs text-neutral-400">
                  No active page post reports.
                </div>
              ) : (
                reports.map((rep) => (
                  <div key={rep.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span>Reporter ID: {rep.reporterId}</span>
                      <span>{new Date(rep.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-red-300 bg-red-950/30 p-2.5 rounded-xl border border-red-500/20">
                      <strong>Report Reason:</strong> {rep.reason}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => handleReviewReport(rep.id, 'dismiss')}
                        className="px-3 py-1.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
                      >
                        Dismiss
                      </button>
                      {rep.postId && (
                        <button
                          onClick={() => handleReviewReport(rep.id, 'remove_post', rep.postId)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Remove Post
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
