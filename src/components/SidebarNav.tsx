import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Home, 
  ShoppingBag, 
  Vote, 
  BookOpen, 
  Users, 
  Newspaper, 
  MapPin, 
  User, 
  Sparkles, 
  ChevronRight, 
  MessageSquare, 
  ShoppingCart, 
  Zap, 
  Building2, 
  ShieldCheck,
  Menu,
  X,
  PlusCircle,
  TrendingUp,
  LogOut,
  LogIn,
  Store
} from 'lucide-react';
import { AppModule, AppUser } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import { LongPressAvatar } from './playercard/LongPressAvatar';

interface SidebarNavProps {
  currentModule: AppModule;
  onSelectModule: (module: AppModule) => void;
  onOpenCreateBusiness?: () => void;
  onOpenCreatePost?: () => void;
  onOpenBecomeTrader?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup' | 'unilorin-otp') => void;
  onOpenAdminVerification?: () => void;
  onOpenAdminPages?: () => void;
  onOpenStaffManagement?: () => void;
}

export const SidebarNav = ({
  currentModule,
  onSelectModule,
  onOpenCreateBusiness,
  onOpenCreatePost,
  onOpenBecomeTrader,
  onOpenAuth,
  onOpenAdminVerification,
  onOpenAdminPages,
  onOpenStaffManagement,
}: SidebarNavProps) => {
  const { currentUser, signOut } = useAuth();
  const { unreadTotalCount, pendingRequestsCount, openChatDrawer } = useChat();
  const { totalItemCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Edge Swipe Listener on mobile window
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        // Swipe right from left edge (< 40px) opens drawer
        if (startX < 40 && diffX > 50) {
          setIsMobileMenuOpen(true);
        }
        // Swipe left from open drawer closes it
        else if (isMobileMenuOpen && diffX < -50) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileMenuOpen]);

  const navigationItems: Array<{
    id: AppModule;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'feed',
      label: 'Campus Feed',
      sublabel: 'Snaps, Posts & Trends',
      icon: Home,
    },
    {
      id: 'marketplace',
      label: 'Campus Marketplace',
      sublabel: 'Student Ventures & Orders',
      icon: ShoppingBag,
      badge: 'Live',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'politics',
      label: 'Politics & SUG Hub',
      sublabel: 'Elections & Manifestos',
      icon: Vote,
      badge: 'UNECOM',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'academics',
      label: 'Faculties & Depts',
      sublabel: '100L-500L Resources',
      icon: BookOpen,
      badge: 'GNS/IT',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'clubs',
      label: 'Clubs & Orgs',
      sublabel: 'JCI, GDSC, Rotaract',
      icon: Users,
    },
    {
      id: 'news',
      label: 'Campus News',
      sublabel: 'Senate & Exam Bulletins',
      icon: Newspaper,
    },
    {
      id: 'map',
      label: 'Campus Map & Transit',
      sublabel: 'Landmarks & Shuttle Fares',
      icon: MapPin,
    },
    {
      id: 'dashboard',
      label: 'Profile',
      sublabel: 'Posts, Products & ID',
      icon: User,
    },
  ];

  const navigate = useNavigate();
  const handleItemClick = (module: AppModule) => {
    if (module === 'feed') navigate('/feed');
    else if (module === 'dashboard') navigate('/profile');
    else navigate('/' + module);
    setIsMobileMenuOpen(false);
  };

  const isElevatedTrader = currentUser?.accountType === 'TRADER' || currentUser?.role === 'trader';

  return (
    <>
      {/* Mobile Top App Bar with Logo & Menu Toggle */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-sm shadow-md">
            ⚡
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Campus Foundry</h1>
            <span className="text-[10px] text-emerald-400 font-medium">UNILORIN Student Ecosystem</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* In-App Chat Trigger */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={openChatDrawer}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
            title="Open Chat"
          >
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            {unreadTotalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-neutral-950">
                {unreadTotalCount}
              </span>
            )}
          </motion.button>

          {/* Cart Trigger */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
            title="Open Cart"
          >
            <ShoppingCart className="h-4 w-4 text-amber-400" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-neutral-950">
                {totalItemCount}
              </span>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-200 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      {/* Backdrop for Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar / Mobile Slide Drawer with Spring Physics */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex-col justify-between border-r border-neutral-800 bg-neutral-950/98 backdrop-blur-xl p-4 transition-transform duration-300 ease-out lg:static lg:flex lg:translate-x-0 ${
          isMobileMenuOpen ? 'flex translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-5 overflow-y-auto">
          {/* Header Brand */}
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-800 text-white font-black text-lg shadow-lg shadow-emerald-950/50 ring-1 ring-white/10">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-white tracking-tight">Campus Foundry</span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] font-medium text-emerald-400">Student Venture Ecosystem</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                if (onOpenCreatePost) onOpenCreatePost();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 text-xs font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Post</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                if (isElevatedTrader) {
                  if (onOpenCreateBusiness) onOpenCreateBusiness();
                } else {
                  if (onOpenBecomeTrader) onOpenBecomeTrader();
                  else if (onOpenCreateBusiness) onOpenCreateBusiness();
                }
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 py-2 px-3 text-xs font-bold transition-all shadow-md shadow-amber-950/30 cursor-pointer"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{isElevatedTrader ? '+ List Trade' : 'Sell Item'}</span>
            </motion.button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-3 block mb-1">
              Ecosystem Modules
            </span>

            {navigationItems.map((item) => {
              const isActive = currentModule === item.id;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between rounded-2xl px-3 py-2.5 text-left text-xs font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-neutral-800 text-white font-bold shadow-xs border border-neutral-700/60'
                      : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                      isActive 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-neutral-900 text-neutral-400 group-hover:text-neutral-200'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 truncate">
                      <div className="text-xs font-semibold text-neutral-100 truncate">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 truncate">
                        {item.sublabel}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase border ${
                      item.badgeColor || 'bg-neutral-800 text-neutral-300 border-neutral-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Global Enterprise Communication & Logistics Quick Triggers */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 px-3 block mb-1">
              Live Interactions
            </span>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => openChatDrawer()}
              className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <span>Direct Messages</span>
              </div>
              <div className="flex items-center gap-1">
                {pendingRequestsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white animate-pulse" title="Pending Message Requests">
                    {pendingRequestsCount} req
                  </span>
                )}
                {unreadTotalCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500 text-neutral-950">
                    {unreadTotalCount}
                  </span>
                )}
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-neutral-200 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <span>Cart & Live Tracking</span>
              </div>
              {totalItemCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-500 text-neutral-950">
                  {totalItemCount}
                </span>
              )}
            </motion.button>

            {/* Role-Based Staff Administration Buttons */}
            {(currentUser?.staffRole || currentUser?.isAdmin) && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-3 block">
                  Staff Admin Desk
                </span>

                {(currentUser?.staffRole === 'student_verifier' || currentUser?.staffRole === 'super_admin' || currentUser?.isAdmin) && onOpenAdminVerification && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => onOpenAdminVerification()}
                    className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                      <span>Student Verifier</span>
                    </div>
                  </motion.button>
                )}

                {(currentUser?.staffRole === 'page_moderator' || currentUser?.staffRole === 'super_admin' || currentUser?.isAdmin) && onOpenAdminPages && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => onOpenAdminPages()}
                    className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Admin Pages Control</span>
                    </div>
                  </motion.button>
                )}

                {(currentUser?.staffRole === 'super_admin' || currentUser?.isAdmin) && onOpenStaffManagement && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => onOpenStaffManagement()}
                    className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-purple-400" />
                      <span>Staff Management</span>
                    </div>
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Account / Session Footer Card */}
        <div className="pt-4 mt-4 border-t border-neutral-800/80 space-y-3">
          {currentUser ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3">
              <div className="flex items-center justify-between gap-2">
                <div 
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                  onClick={() => handleItemClick('dashboard')}
                >
                  <LongPressAvatar
                    userId={currentUser.id}
                    avatarUrl={currentUser.avatarUrl}
                    name={currentUser.fullName}
                    size="sm"
                    showRingHint
                    className="rounded-xl shrink-0"
                  />
                  <div className="min-w-0 truncate">
                    <div className="text-xs font-bold text-white truncate">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">
                      {isElevatedTrader ? 'Verified Trader' : `${currentUser.level || '300L'} Student`}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={signOut}
                  className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3 text-center space-y-2">
              <p className="text-[11px] text-neutral-400">Join the UNILORIN Network</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onOpenAuth?.('signin')}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-2 text-xs font-bold shadow-md shadow-blue-950/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Sign In with Student Portal</span>
              </motion.button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
