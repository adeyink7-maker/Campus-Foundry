import React, { useState } from 'react';
import { UNIVERSITIES, DEFAULT_UNIVERSITY } from '../constants/universities';
import { X, Camera, Check, User, Phone, Globe, ShieldCheck, Award, Sparkles, Eye, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePlayerCard } from '../context/PlayerCardContext';
import { StudentLevel } from '../types';
import { HostelSelectMenu } from './HostelSelectMenu';
import { FacultyDepartmentSelector } from './FacultyDepartmentSelector';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const LEVEL_OPTIONS: StudentLevel[] = ['100L', '200L', '300L', '400L', '500L', 'Postgrad'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, updateUser } = useAuth();
  const { openPlayerCard, openPlayerCardEditor } = usePlayerCard();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [university, setUniversity] = useState(currentUser?.university || DEFAULT_UNIVERSITY);
  const [session, setSession] = useState(currentUser?.session || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [level, setLevel] = useState<StudentLevel>((currentUser?.level as StudentLevel) || '300L');
  const [faculty, setFaculty] = useState(currentUser?.faculty || 'Communication & Information Sciences');
  const [department, setDepartment] = useState(currentUser?.department || 'Computer Science');
  const [hostel, setHostel] = useState(currentUser?.hostelLocation || 'Zamfara Hostel Block B');
  const [whatsapp, setWhatsapp] = useState(currentUser?.whatsapp || '08012345678');
  const [website, setWebsite] = useState(currentUser?.socialLinks?.portfolio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'
  );

  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = username.startsWith('@') ? username : `@${username}`;

    updateUser({
      fullName,
      username: cleanUsername,
      university,
      session,
      bio,
      level,
      faculty,
      department,
      hostelLocation: hostel,
      whatsapp,
      avatarUrl,
      socialLinks: {
        ...currentUser.socialLinks,
        portfolio: website,
      },
    });

    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onSuccess?.();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-amber-400" />
              <span>Edit Instagram-Style Profile</span>
            </h2>
            <p className="text-xs text-neutral-400">Update your public identity, bio & campus portfolio</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Avatar Edit */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="h-24 w-24 rounded-full object-cover border-4 border-amber-400 shadow-xl"
              />
              <button
                type="button"
                onClick={() => {
                  const newPreset = [
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300',
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
                  ][Math.floor(Math.random() * 4)];
                  setAvatarUrl(newPreset);
                }}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-500 text-neutral-950 shadow-lg hover:scale-110 transition-transform cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Or paste custom image URL..."
              className="w-full max-w-xs px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-neutral-300 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Adeyinka Johnson"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* University Name & Academic Session */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">University Name</label>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Academic Session</label>
              <input
                type="text"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="e.g. 2025/2026"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1">Profile Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell peers about your skills, venture, or campus interests..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Academic Level & Department */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1">Academic Class Level</label>
              <div className="flex flex-wrap gap-2">
                {LEVEL_OPTIONS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      level === lvl
                        ? 'bg-amber-500 text-neutral-950 shadow-md'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <FacultyDepartmentSelector
              selectedFaculty={faculty}
              selectedDepartment={department}
              onFacultyChange={(fac: string) => setFaculty(fac)}
              onDepartmentChange={(dept: string) => setDepartment(dept)}
            />
          </div>

          {/* Hostel Location */}
          <div>
            <HostelSelectMenu
              selectedHostel={hostel}
              onHostelChange={(h: string) => setHostel(h)}
              label="Hostel Residence"
            />
          </div>

          {/* WhatsApp & Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-400" />
                <span>WhatsApp Contact</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-300 block mb-1 flex items-center gap-1">
                <Globe className="h-3 w-3 text-sky-400" />
                <span>Custom Website / Link</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* ======================================================== */}
          {/* PLAYER CARD & WORLD CUP STAGE SECTION                    */}
          {/* ======================================================== */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-neutral-900 to-emerald-500/10 p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-wide">Player Card Reveal</span>
                    <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                      World Cup Intro
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Triggers when anyone holds down your avatar anywhere on Campus Foundry
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openPlayerCardEditor();
                }}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-bold border border-neutral-700 transition-colors cursor-pointer"
              >
                <Palette className="h-3.5 w-3.5 text-amber-400" />
                <span>Customize Stage & Achievements</span>
              </button>

              <button
                type="button"
                onClick={() => openPlayerCard(currentUser.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-colors cursor-pointer"
                title="Preview World Cup reveal live"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Live Preview</span>
              </button>
            </div>
          </div>

          {/* Toast Notice */}
          {savedToast && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
