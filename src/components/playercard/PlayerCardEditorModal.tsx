import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  Sparkles, 
  Trophy, 
  Palette, 
  Film, 
  CheckCircle2, 
  Briefcase,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { AppUser } from '../../types';
import { Achievement, PlayerCardSettings, AchievementCategory } from '../../types/playercard';
import { usePlayerCard } from '../../context/PlayerCardContext';
import { 
  getPlayerCardData, 
  savePlayerCardSettings, 
  saveAchievement, 
  deleteAchievement,
  uploadPlayerCardMedia 
} from '../../services/playerCardService';

const PRESET_COLORS = [
  { name: 'Champion Gold', hex: '#f59e0b' },
  { name: 'Royal Cyber Blue', hex: '#3b82f6' },
  { name: 'Emerald Victory', hex: '#10b981' },
  { name: 'Purple Maestro', hex: '#8b5cf6' },
  { name: 'Crimson Striker', hex: '#ef4444' },
  { name: 'Neon Electric', hex: '#06b6d4' },
  { name: 'Rose Gold Ace', hex: '#f43f5e' },
];

export const PlayerCardEditorModal: React.FC = () => {
  const { isEditorOpen, closeEditor, editorUser } = usePlayerCard();

  const [settings, setSettings] = useState<PlayerCardSettings>({
    userId: '',
    accentColor: '#f59e0b',
    showStats: true,
    tagline: '',
    topSkill: '',
    jerseyNumber: 10,
    portfolioLinks: [],
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'design' | 'achievements' | 'portfolio'>('design');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Achievement Form State
  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<AchievementCategory>('award');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newLink, setNewLink] = useState('');

  // New Portfolio Link Form State
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [videoUploading, setVideoUploading] = useState(false);

  useEffect(() => {
    if (!isEditorOpen || !editorUser) return;

    getPlayerCardData(editorUser).then((data) => {
      setSettings(data.settings);
      setAchievements(data.achievements);
    });
  }, [isEditorOpen, editorUser]);

  const handleSaveSettings = async () => {
    if (!editorUser) return;
    setIsSaving(true);
    try {
      await savePlayerCardSettings({ ...settings, userId: editorUser.id });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorUser || !newTitle.trim()) return;

    const newAch: Achievement = {
      id: `ach_${Date.now()}`,
      userId: editorUser.id,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim(),
      dateAchieved: newDate || undefined,
      linkUrl: newLink.trim() || undefined,
      isVerified: false,
      isVisible: true,
      sortOrder: achievements.length + 1,
      createdAt: new Date().toISOString(),
    };

    const saved = await saveAchievement(newAch);
    setAchievements((prev) => [saved, ...prev]);

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewDate('');
    setNewLink('');
    setIsAddingAchievement(false);
  };

  const handleDeleteAchievement = async (achId: string) => {
    if (!editorUser) return;
    await deleteAchievement(editorUser.id, achId);
    setAchievements((prev) => prev.filter((a) => a.id !== achId));
  };

  const handleToggleVisibility = async (ach: Achievement) => {
    const updated = { ...ach, isVisible: !ach.isVisible };
    await saveAchievement(updated);
    setAchievements((prev) => prev.map((a) => (a.id === ach.id ? updated : a)));
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= achievements.length) return;

    const list = [...achievements];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    list.forEach((item, idx) => {
      item.sortOrder = idx + 1;
      saveAchievement(item);
    });

    setAchievements(list);
  };

  const handleAddPortfolioLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;

    const updatedLinks = [
      ...(settings.portfolioLinks || []),
      {
        title: newLinkTitle.trim(),
        url: newLinkUrl.trim(),
        type: newLinkUrl.includes('github') ? 'github' as const : 'website' as const,
      },
    ];

    setSettings((prev) => ({ ...prev, portfolioLinks: updatedLinks }));
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemovePortfolioLink = (idx: number) => {
    const updated = (settings.portfolioLinks || []).filter((_, i) => i !== idx);
    setSettings((prev) => ({ ...prev, portfolioLinks: updated }));
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editorUser) return;

    if (file.size > 6 * 1024 * 1024) {
      alert('Video file size exceeds 6MB. Please upload a short 2-3s looping clip under 6MB.');
      return;
    }

    setVideoUploading(true);
    try {
      const url = await uploadPlayerCardMedia(editorUser.id, file);
      setSettings((prev) => ({ ...prev, heroVideoUrl: url }));
    } catch (err) {
      console.error('Failed uploading video loop:', err);
    } finally {
      setVideoUploading(false);
    }
  };

  if (!isEditorOpen || !editorUser) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-3xl rounded-[32px] border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div className="flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-2xl shadow-md"
                style={{ backgroundColor: settings.accentColor }}
              >
                <Trophy className="h-5 w-5 text-neutral-950" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-mono tracking-tight flex items-center gap-2">
                  <span>Player Card Studio</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    World Cup Edition
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Customize your broadcast stage, tagline, accent color, and achievements.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeEditor}
              className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('design')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'design'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Palette className="h-4 w-4 text-amber-400" />
              <span>Broadcast Design</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('achievements')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'achievements'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Trophy className="h-4 w-4 text-emerald-400" />
              <span>Achievements ({achievements.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Briefcase className="h-4 w-4 text-sky-400" />
              <span>Portfolio Links</span>
            </button>
          </div>

          {/* TAB 1: DESIGN & STAGE */}
          {activeTab === 'design' && (
            <div className="space-y-5">
              {/* Accent Color Palette */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-300 block">
                  Championship Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, accentColor: color.hex }))}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-transform ${
                        settings.accentColor === color.hex ? 'scale-110 ring-2 ring-white shadow-lg' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {settings.accentColor === color.hex && (
                        <CheckCircle2 className="h-5 w-5 text-neutral-950" />
                      )}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="color"
                      value={settings.accentColor}
                      onChange={(e) => setSettings((s) => ({ ...s, accentColor: e.target.value }))}
                      className="h-9 w-9 rounded-xl cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-neutral-400 uppercase">
                      {settings.accentColor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tagline & Top Skill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-300 block">
                    Broadcast Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, tagline: e.target.value }))}
                    placeholder="e.g., CIS Midfield Architect & Hackathon Champion"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-300 block">
                    Top Skill / Signature Role
                  </label>
                  <input
                    type="text"
                    value={settings.topSkill || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, topSkill: e.target.value }))}
                    placeholder="e.g., Full-Stack & UI/UX"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Jersey Number */}
              <div className="space-y-1 max-w-xs">
                <label className="text-xs font-bold text-neutral-300 block">
                  Jersey Number
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={settings.jerseyNumber || 10}
                  onChange={(e) => setSettings((s) => ({ ...s, jerseyNumber: parseInt(e.target.value) || 10 }))}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>

              {/* Hero Loop Video Upload */}
              <div className="space-y-2 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Short Hero Looping Video (Optional)</span>
                  </div>
                  {settings.heroVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, heroVideoUrl: undefined }))}
                      className="text-[11px] text-red-400 hover:text-red-300"
                    >
                      Remove Video
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400">
                  Upload a 2-3s looping video (MP4/WebM, max 6MB) to replace your static photo with an active broadcast hero.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold cursor-pointer transition-colors border border-neutral-700">
                    <Upload className="h-3.5 w-3.5 text-amber-400" />
                    <span>{videoUploading ? 'Uploading...' : 'Choose Loop Video'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={handleVideoUpload}
                      disabled={videoUploading}
                      className="hidden"
                    />
                  </label>
                  {settings.heroVideoUrl && (
                    <span className="text-[11px] font-mono text-emerald-400 truncate max-w-xs">
                      ✓ Active Video Loop Loaded
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACHIEVEMENTS MANAGER */}
          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-300">
                  Publish Your Awards, GPA Honors & Victories
                </span>
                {!isAddingAchievement && (
                  <button
                    type="button"
                    onClick={() => setIsAddingAchievement(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Achievement</span>
                  </button>
                )}
              </div>

              {/* Add Achievement Form */}
              {isAddingAchievement && (
                <form onSubmit={handleAddAchievement} className="p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-bold text-amber-300">New Achievement Entry</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingAchievement(false)}
                      className="text-neutral-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. UNILORIN Innovation Challenge"
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as AchievementCategory)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="award">Award & Contest</option>
                        <option value="academic">Academic & Scholar</option>
                        <option value="leadership">Leadership & Student Body</option>
                        <option value="sports">Sports & Athletics</option>
                        <option value="project">Project & Research</option>
                        <option value="other">Other Milestone</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Brief details or impact of this achievement..."
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Date Achieved</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Link URL (Optional)</label>
                      <input
                        type="url"
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold"
                    >
                      Save Achievement
                    </button>
                  </div>
                </form>
              )}

              {/* Achievements List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {achievements.map((ach, idx) => (
                  <div
                    key={ach.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="text-neutral-500 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === achievements.length - 1}
                          className="text-neutral-500 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{ach.title}</span>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono">
                          {ach.category} {ach.dateAchieved ? `• ${ach.dateAchieved}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(ach)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          ach.isVisible ? 'bg-neutral-800 text-emerald-400 border-neutral-700' : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                        }`}
                        title={ach.isVisible ? 'Visible on card' : 'Hidden from card'}
                      >
                        {ach.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAchievement(ach.id)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-neutral-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PORTFOLIO LINKS */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <form onSubmit={handleAddPortfolioLink} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newLinkTitle}
                  onChange={(e) => setNewLinkTitle(e.target.value)}
                  placeholder="Title (e.g. GitHub, Project Alpha)"
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="url"
                  required
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold shrink-0"
                >
                  Add Link
                </button>
              </form>

              <div className="space-y-2">
                {(settings.portfolioLinks || []).map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-3.5 w-3.5 text-amber-400" />
                      <span className="font-bold text-white">{link.title}</span>
                      <span className="text-[11px] text-neutral-400 truncate max-w-xs font-mono">
                        {link.url}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioLink(idx)}
                      className="p-1 rounded text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
            <div>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Player Card updated successfully!</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-bold border border-neutral-800 transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Player Card'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
