import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Trash2, Eye, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileAvatarSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onViewSnap: () => void;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
  hasActiveSnap: boolean;
}

export const ProfileAvatarSheet: React.FC<ProfileAvatarSheetProps> = ({
  isOpen,
  onClose,
  onViewSnap,
  onChangePhoto,
  onRemovePhoto,
  hasActiveSnap,
}) => {
  const { currentUser } = useAuth();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-[#14161B] rounded-t-[32px] border-t border-white/10 shadow-2xl p-6 pb-10 flex flex-col gap-4"
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-2 shrink-0" />

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-500/50">
                  <img 
                    src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Profile Photo</h3>
                  <p className="text-xs text-neutral-400">Manage your campus identity</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 text-neutral-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {hasActiveSnap && (
                <button
                  onClick={() => {
                    onViewSnap();
                    onClose();
                  }}
                  className="w-full h-14 flex items-center gap-4 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <Eye className="h-5 w-5" />
                  <span>View Your Active Snap</span>
                </button>
              )}

              <button
                onClick={() => {
                  onChangePhoto();
                  onClose();
                }}
                className="w-full h-14 flex items-center gap-4 px-5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-all cursor-pointer"
              >
                <Camera className="h-5 w-5 text-emerald-400" />
                <span>Change Profile Photo</span>
              </button>

              <button
                onClick={() => {
                  onRemovePhoto();
                  onClose();
                }}
                className="w-full h-14 flex items-center gap-4 px-5 rounded-2xl bg-white/5 border border-white/10 text-rose-400 font-semibold text-sm hover:bg-white/10 transition-all cursor-pointer"
              >
                <Trash2 className="h-5 w-5" />
                <span>Remove Current Photo</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
