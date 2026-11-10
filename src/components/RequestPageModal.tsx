import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Newspaper, Users, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { HubPageType, PageJoinMode, HubPage } from '../types';
import { requestPageInSupabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface RequestPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: HubPageType;
  onShowToast?: (msg: string) => void;
  onPageCreated?: (page: HubPage) => void;
}

export const RequestPageModal: React.FC<RequestPageModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'club',
  onShowToast,
  onPageCreated,
}) => {
  const { currentUser } = useAuth();

  const [type, setType] = useState<HubPageType>(defaultType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [joinMode, setJoinMode] = useState<PageJoinMode>('open');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !note.trim()) {
      onShowToast?.('Please fill out all required fields.');
      return;
    }

    if (!currentUser) {
      onShowToast?.('You must be signed in to request a page.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestPageInSupabase({
        type,
        name: name.trim(),
        description: description.trim(),
        logoUrl: logoUrl.trim() || (type === 'news' 
          ? 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80'),
        coverUrl: coverUrl.trim() || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1000&auto=format&fit=crop&q=80',
        joinMode: type === 'news' ? 'follow_only' : joinMode,
        ownerId: currentUser.id,
        note: note.trim(),
      });

      if (res.success && res.page) {
        setSubmittedSuccess(true);
        onShowToast?.('Page request submitted successfully! Pending admin approval.');
        if (onPageCreated) onPageCreated(res.page);
      } else {
        onShowToast?.(res.error || 'Failed to submit request.');
      }
    } catch (err: any) {
      onShowToast?.(err?.message || 'Error creating page request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white">Request a Campus Page</h2>
              <p className="text-xs text-neutral-400">Register your club or news outlet on Hubs</p>
            </div>
          </div>

          {submittedSuccess ? (
            <div className="my-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Request Under Review</h3>
              <p className="text-xs text-neutral-300 max-w-xs mx-auto leading-relaxed">
                Your request for <strong>{name}</strong> has been submitted. App admins will review your request shortly. New pages remain hidden until approved.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Page Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setType('club');
                      setJoinMode('open');
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      type === 'club'
                        ? 'bg-purple-600/20 border-purple-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Student Club / Society</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('news');
                      setJoinMode('follow_only');
                    }}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      type === 'news'
                        ? 'bg-emerald-600/20 border-emerald-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Newspaper className="w-4 h-4 text-emerald-400" />
                    <span>News Outlet</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {type === 'club' ? 'Club Name' : 'News Outlet Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'club' ? 'e.g. JCI Unilorin' : 'e.g. Campus Observer'}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your organization's mission, activities, or editorial scope..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Join Mode (for Clubs) */}
              {type === 'club' && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Membership Join Mode
                  </label>
                  <select
                    value={joinMode}
                    onChange={(e) => setJoinMode(e.target.value as PageJoinMode)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="open">Open (Anyone can join immediately)</option>
                    <option value="request">Request (Requires owner/admin approval)</option>
                    <option value="follow_only">Follow Only (No group members, followers only)</option>
                  </select>
                </div>
              )}

              {/* Requester Note */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Who are you in this club / outlet? *
                </label>
                <input
                  type="text"
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. President / Editor-in-Chief / Lead Coordinator"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-400">
                  This note is reviewed by app administrators during verification.
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
