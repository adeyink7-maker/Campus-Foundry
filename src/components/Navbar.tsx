import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  ShoppingBag, 
  Plus, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  MapPin, 
  BookOpen, 
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenAuth: (mode?: 'signin' | 'signup' | 'unilorin-otp', role?: UserRole) => void;
  onOpenCreateBusiness: () => void;
}

export const Navbar = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenCreateBusiness,
}: NavbarProps) => {
  const { currentUser, signOut } = useAuth();
  const { openChatDrawer, unreadTotalCount } = useChat();
  const { setIsCartOpen, totalItemCount } = useCart();

  const navigate = useNavigate();
  const handleLinkClick = (id: string) => {
    if (id === 'stores') navigate('/market');
    else if (id === 'hubs') navigate('/campus');
    else if (id === 'blueprints') navigate('/blueprints');
    else if (id === 'dashboard') navigate('/profile');
    else navigate('/' + id);
  };

  const navLinks = [
    { id: 'stores', label: 'Stores & Services', icon: Store },
    { id: 'hubs', label: 'Hostels & Faculties', icon: Building2 },
    { id: 'blueprints', label: 'Launch Blueprints', icon: BookOpen },
    { id: 'dashboard', label: 'My Hub', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800/90 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleLinkClick('stores')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-extrabold text-sm shadow-md shadow-emerald-950/40 border border-emerald-500/30 group-hover:border-emerald-400 transition-colors">
              CF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight leading-none group-hover:text-emerald-400 transition-colors">
                  Campus Foundry
                </span>
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 uppercase">
                  CAMPUS
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium hidden sm:block">
                Collegiate Student Trade & Hostel Delivery
              </p>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-neutral-900/90 p-1 border border-neutral-800/80 shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Auth & List Trade CTA */}
        <div className="flex items-center gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/90 py-1.5 px-3">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-white font-bold text-xs ${
                currentUser.role === 'trader' ? 'bg-amber-600' : 'bg-emerald-600'
              }`}>
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="flex items-center gap-1 text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                  <span className="truncate">{currentUser.fullName}</span>
                  {currentUser.isVerified && (
                    <span title="Verified UNILORIN Student" className="inline-flex shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <span className={currentUser.role === 'trader' ? 'text-amber-400 font-medium' : 'text-emerald-400 font-medium'}>
                    {currentUser.role === 'trader' ? 'Trader' : 'Student Buyer'}
                  </span>
                  <span>·</span>
                  <span className="truncate max-w-[80px]">{currentUser.hostelLocation?.split(',')[0]}</span>
                </div>
              </div>

              <button
                onClick={() => handleLinkClick('dashboard')}
                title="Open Dashboard"
                className="text-xs text-neutral-400 hover:text-white ml-1 p-1 hover:bg-neutral-800 rounded transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={signOut}
                title="Log Out"
                className="text-xs text-neutral-400 hover:text-red-400 p-1 hover:bg-neutral-800 rounded transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('unilorin-otp' as any, 'student')}
                className="flex items-center gap-1.5 rounded-xl border border-blue-500/50 bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-300 hover:border-blue-400 hover:bg-blue-600/30 transition-colors shadow-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onOpenAuth('signup', 'trader')}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <Store className="h-3.5 w-3.5 text-amber-400" />
                <span>Join as Trader</span>
              </button>
            </div>
          )}

          {/* Persistent Hostel Cart Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            title="Open Hostel Cart"
            className="relative flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 sm:px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:border-emerald-500/50 hover:bg-neutral-800 transition-colors"
          >
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Cart</span>
            {totalItemCount > 0 && (
              <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 font-mono text-[9px] font-bold text-neutral-950">
                {totalItemCount}
              </span>
            )}
          </button>

          {/* In-App Chat Trigger */}
          <button
            onClick={openChatDrawer}
            title="Open Trader Chat"
            className="relative flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-2.5 sm:px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:border-emerald-500/50 hover:bg-neutral-800 transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Messages</span>
            {unreadTotalCount > 0 && (
              <span className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-emerald-500 font-mono text-[9px] font-bold text-neutral-950">
                {unreadTotalCount}
              </span>
            )}
          </button>

          {/* List Trade CTA */}
          <button
            onClick={onOpenCreateBusiness}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-950/40 transition-all shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">List Your Trade</span>
            <span className="sm:hidden">List</span>
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-neutral-800 bg-neutral-950 px-2 py-2">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-emerald-400 font-bold bg-neutral-900' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{link.label.split(' ')[0]}</span>
            </button>
          );
        })}
        {/* Mobile Chat Quick Tab */}
        <button
          onClick={openChatDrawer}
          className="relative flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] font-medium text-neutral-400 hover:text-white"
        >
          <div className="relative">
            <MessageSquare className="h-4 w-4 text-emerald-400" />
            {unreadTotalCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-neutral-950">
                {unreadTotalCount}
              </span>
            )}
          </div>
          <span>Chat</span>
        </button>
      </div>
    </header>
  );
};
