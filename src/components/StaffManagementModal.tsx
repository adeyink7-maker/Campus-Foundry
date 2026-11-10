import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Clock,
  History,
  Users,
  CheckCircle2,
  AlertCircle,
  BadgeCheck,
  User
} from 'lucide-react';
import { AppUser, StaffRole, AdminActionLog } from '../types';
import {
  searchUsersForStaffManagementInSupabase,
  assignStaffRoleInSupabase,
  fetchAdminActionLogsFromSupabase,
} from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'assign_roles' | 'audit_logs'>('assign_roles');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Audit logs state
  const [logs, setLogs] = useState<AdminActionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'audit_logs') {
      setIsLoadingLogs(true);
      fetchAdminActionLogsFromSupabase().then((data) => {
        setLogs(data);
        setIsLoadingLogs(false);
      });
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchUsersForStaffManagementInSupabase(searchQuery.trim());
      setSearchResults(results);
    } catch (err) {
      onShowToast?.('Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssignRole = async (targetUser: AppUser, newRole: StaffRole) => {
    if (!currentUser) return;
    setUpdatingUserId(targetUser.id);
    try {
      const res = await assignStaffRoleInSupabase(currentUser.id, targetUser.id, newRole);
      if (res.success) {
        onShowToast?.(
          newRole
            ? `Assigned ${newRole.replace('_', ' ')} role to ${targetUser.fullName}.`
            : `Removed staff permissions from ${targetUser.fullName}.`
        );
        // Update local state in search results
        setSearchResults((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, staffRole: newRole } : u))
        );
      } else {
        onShowToast?.(res.error || 'Failed to update staff role.');
      }
    } catch (e: any) {
      onShowToast?.(e?.message || 'Action failed.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatRoleLabel = (role?: StaffRole) => {
    switch (role) {
      case 'student_verifier':
        return 'Student Verifier';
      case 'page_moderator':
        return 'Page Moderator';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'Normal User';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
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
              <h2 className="text-xl font-bold text-white">Super Admin - Staff Management</h2>
              <p className="text-xs text-neutral-400">Assign staff roles and view audit logs</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 mb-5">
            <button
              onClick={() => setActiveTab('assign_roles')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'assign_roles'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assign Staff Roles</span>
            </button>
            <button
              onClick={() => setActiveTab('audit_logs')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'audit_logs'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Action Audit Logs</span>
            </button>
          </div>

          {/* Tab 1: Search & Assign Roles */}
          {activeTab === 'assign_roles' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search user by username, full name or email..."
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 pl-10 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              <div className="space-y-3 pt-2">
                {searchResults.length === 0 ? (
                  <div className="p-8 text-center border border-neutral-800 rounded-2xl bg-neutral-900/40 text-xs text-neutral-400">
                    Search for a student account to manage their staff permissions.
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white font-bold shrink-0">
                          {user.fullName[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{user.fullName}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {formatRoleLabel(user.staffRole)}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 font-mono">
                            @{user.username || 'student'} • {user.department || 'Student'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          disabled={updatingUserId === user.id || user.staffRole === 'student_verifier'}
                          onClick={() => handleAssignRole(user, 'student_verifier')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                            user.staffRole === 'student_verifier'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                          }`}
                        >
                          + Verifier
                        </button>

                        <button
                          type="button"
                          disabled={updatingUserId === user.id || user.staffRole === 'page_moderator'}
                          onClick={() => handleAssignRole(user, 'page_moderator')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                            user.staffRole === 'page_moderator'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                          }`}
                        >
                          + Moderator
                        </button>

                        <button
                          type="button"
                          disabled={updatingUserId === user.id || user.staffRole === 'super_admin'}
                          onClick={() => handleAssignRole(user, 'super_admin')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                            user.staffRole === 'super_admin'
                              ? 'bg-purple-600 text-white border-purple-500'
                              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                          }`}
                        >
                          + Super Admin
                        </button>

                        {user.staffRole && (
                          <button
                            type="button"
                            disabled={updatingUserId === user.id}
                            onClick={() => handleAssignRole(user, null)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold cursor-pointer hover:bg-red-600/30"
                            title="Remove Staff Role"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Action Audit Logs */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-3">
              {isLoadingLogs ? (
                <div className="text-center py-10 text-xs text-neutral-500">Loading audit log history...</div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center border border-neutral-800 rounded-2xl bg-neutral-900/40 text-xs text-neutral-400">
                  No staff actions recorded in the audit log yet.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{log.staffName || log.staffId}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {log.action}
                      </span>
                      <span className="text-neutral-300 font-mono text-[11px]">Target: {log.targetId}</span>
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
