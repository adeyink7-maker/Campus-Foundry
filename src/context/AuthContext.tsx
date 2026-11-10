import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured, emitAppToast, ALLOWED_PROFILES_READ_COLUMNS } from '../services/supabase';
import { getFriendlyError } from '../utils/friendlyErrors';
import { AppUser, UserRole, AccountType, TraderProfile, StudentBusiness, StudentLevel } from '../types';
import { 
  requestStudentEmailOTP, 
  verifyStudentEmailOTP, 
  signUpWithEmailPassword,
  signInWithEmailPassword,
  resendConfirmationEmail,
  verifySignupOtp,
  SendOtpResult, 
  VerifyOtpParams,
  SignUpParams,
  SignInParams
} from '../services/unilorinAuth';

export interface TraderElevationData {
  brandName: string;
  brandLogoUrl: string;
  businessCategory: string;
  campusLocation: string;
  whatsappContact: string;
  description?: string;
  startingPrice?: number;
  acceptsHostelDelivery?: boolean;
}

interface AuthContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  signUpWithEmailPassword: (params: SignUpParams) => Promise<{ user?: AppUser; requiresEmailConfirmation: boolean; message: string }>;
  signInWithEmailPassword: (params: SignInParams) => Promise<{ user: AppUser }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  confirmSignupWithOtp: (email: string, token: string) => Promise<AppUser>;
  requestUnilorinOTP: (email: string) => Promise<SendOtpResult>;
  verifyUnilorinOTP: (params: VerifyOtpParams) => Promise<{ user: AppUser; needsOnboarding?: boolean }>;
  signOut: () => Promise<void>;
  updateUser: (updatedData: Partial<AppUser>) => Promise<void>;
  elevateToTrader: (traderData: TraderElevationData) => Promise<{ user: AppUser; business: StudentBusiness }>;
  toggleFollowUser: (targetUserId: string) => void;
  syncUserProfileFromSupabase: (userId: string) => Promise<AppUser | null>;
}

const STORAGE_BUSINESSES_KEY = 'campus_foundry_custom_businesses_v4';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Supabase Auth session & onAuthStateChange listener
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const FRESH_LAUNCH_KEY = 'campus_foundry_fresh_launch_signed_out_v1';
        if (!localStorage.getItem(FRESH_LAUNCH_KEY)) {
          localStorage.setItem(FRESH_LAUNCH_KEY, 'true');
          try {
            await supabase.auth.signOut();
          } catch {}
          
          // Purge all active Supabase and application session keys from localStorage
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach((key) => {
              if (
                key.startsWith('sb-') ||
                key.includes('supabase') ||
                key.startsWith('campus_foundry_')
              ) {
                if (key !== FRESH_LAUNCH_KEY) {
                  localStorage.removeItem(key);
                }
              }
            });
          }

          if (isMounted) {
            setCurrentUser(null);
            setIsLoading(false);
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await syncUserProfileFromSupabase(session.user.id);
        } else if (!session && isMounted) {
          setCurrentUser(null);
        }
      } catch (e) {
        console.warn('[Auth] Session initialization warning:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // Set up Supabase Auth state change subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' && session?.user) {
        await syncUserProfileFromSupabase(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const syncUserProfileFromSupabase = async (userId: string): Promise<AppUser | null> => {
    try {
      // Own full profile must come from get_my_profile RPC
      const { data: myProfile, error: rpcError } = await supabase.rpc('get_my_profile');
      let profile = myProfile;

      if (!profile) {
        const { data: fallbackProfile, error: tableError } = await supabase
          .from('profiles')
          .select(ALLOWED_PROFILES_READ_COLUMNS)
          .eq('id', userId)
          .maybeSingle();

        if (tableError && tableError.code !== 'PGRST116') {
          console.warn('[Supabase] Could not fetch profile from table:', tableError.message);
        }
        profile = fallbackProfile;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || profile?.email || '';

      if (profile) {
        let followersCount = 0;
        let followingCount = 0;
        let followingUserIds: string[] = [];

        if (isSupabaseConfigured) {
          try {
            let retryCount = 0;
            const maxRetries = 2;
            let followersRes: any;
            let followingRes: any;
            let followingRowsRes: any;

            while (retryCount <= maxRetries) {
              [followersRes, followingRes, followingRowsRes] = await Promise.all([
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
                supabase.from('follows').select('following_id').eq('follower_id', profile.id),
              ]);

              if (followersRes.error || followingRes.error || followingRowsRes.error) {
                const error = followersRes.error || followingRes.error || followingRowsRes.error;
                if (error.code === 'PGRST205' && retryCount < maxRetries) {
                  retryCount++;
                  console.warn(`[Supabase Schema Cache Notice]: Table 'follows' not found in cache. Retrying in ${500 * retryCount}ms...`);
                  await new Promise((r) => setTimeout(r, 500 * retryCount));
                  continue;
                }
                throw error;
              }
              break;
            }
            followersCount = followersRes.count ?? 0;
            followingCount = followingRes.count ?? 0;
            followingUserIds = (followingRowsRes.data || []).map((r: any) => r.following_id);
          } catch (err) {
            console.warn('[Supabase] Failed to compute follows counts:', err);
          }
        }

        const mappedUser: AppUser = {
          id: profile.id,
          email: profile.email || userEmail,
          fullName: profile.full_name || 'Campus Student',
          username: profile.username || (profile.email || userEmail)?.split('@')[0],
          matricNumber: profile.matric_number || (profile.email || userEmail)?.split('@')[0],
          role: (profile.role as UserRole) || 'student',
          accountType: (profile.account_type as AccountType) || 'BUYER',
          university: profile.university || '',
          session: profile.session || '',
          faculty: profile.faculty,
          department: profile.department,
          level: (profile.level as StudentLevel) || '300L',
          hostelLocation: profile.hostel_location,
          whatsapp: profile.whatsapp,
          isVerified: Boolean(profile.is_verified),
          isAdmin: Boolean(profile.is_admin || profile.role === 'admin' || profile.staff_role),
          staffRole: (profile.staff_role as any) || (profile.role === 'admin' || profile.is_admin ? 'super_admin' : null),
          verifiedAt: profile.verified_at,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
          postsCount: profile.posts_count || 0,
          followersCount,
          followingCount,
          followingUserIds,
          blockedUserIds: profile.blocked_user_ids || [],
          joinedAt: profile.created_at || new Date().toISOString(),
        };
        setCurrentUser(mappedUser);
        return mappedUser;
      } else if (session?.user) {
        // Fallback user if profile row doesn't exist yet
        const defaultUser: AppUser = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: session.user.user_metadata?.full_name || 'Campus Student',
          username: session.user.email?.split('@')[0],
          matricNumber: session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'student',
          accountType: session.user.user_metadata?.role === 'trader' ? 'TRADER' : 'BUYER',
          university: session.user.user_metadata?.university || '',
          faculty: session.user.user_metadata?.faculty,
          department: session.user.user_metadata?.department,
          level: session.user.user_metadata?.level || '300L',
          isVerified: false,
          isAdmin: false,
          joinedAt: session.user.created_at || new Date().toISOString(),
        };
        setCurrentUser(defaultUser);
        return defaultUser;
      }
    } catch (e) {
      console.warn('[Supabase] Profile sync warning:', e);
    }
    return null;
  };

  const handleSignUpWithEmailPassword = async (params: SignUpParams) => {
    const res = await signUpWithEmailPassword(params);
    if (res.user && !res.requiresEmailConfirmation) {
      setCurrentUser(res.user);
    }
    return res;
  };

  const handleSignInWithEmailPassword = async (params: SignInParams) => {
    const res = await signInWithEmailPassword(params);
    setCurrentUser(res.user);
    return res;
  };

  const handleResendConfirmationEmail = async (email: string) => {
    return await resendConfirmationEmail(email);
  };

  const handleConfirmSignupWithOtp = async (email: string, token: string): Promise<AppUser> => {
    const { user } = await verifySignupOtp({ email, token });
    const profile = await syncUserProfileFromSupabase(user.id);
    if (profile) {
      setCurrentUser(profile);
      return profile;
    }
    const defaultUser: AppUser = {
      id: user.id,
      email: user.email || email,
      fullName: user.user_metadata?.full_name || 'Campus Student',
      username: (user.email || email).split('@')[0],
      role: user.user_metadata?.role || 'student',
      accountType: user.user_metadata?.role === 'trader' ? 'TRADER' : 'BUYER',
      level: user.user_metadata?.level || '300L',
      faculty: user.user_metadata?.faculty,
      department: user.user_metadata?.department,
      isVerified: false,
      isAdmin: false,
      joinedAt: user.created_at || new Date().toISOString(),
    };
    setCurrentUser(defaultUser);
    return defaultUser;
  };

  const requestUnilorinOTP = async (email: string): Promise<SendOtpResult> => {
    return await requestStudentEmailOTP(email);
  };

  const verifyUnilorinOTP = async (params: VerifyOtpParams): Promise<{ user: AppUser; needsOnboarding?: boolean }> => {
    const result = await verifyStudentEmailOTP(params);
    setCurrentUser(result.user);
    return { user: result.user, needsOnboarding: result.needsOnboarding };
  };

  const elevateToTrader = async (traderData: TraderElevationData): Promise<{ user: AppUser; business: StudentBusiness }> => {
    if (!currentUser) {
      throw new Error('You must be logged in to become a campus trader.');
    }

    const businessId = `biz_${currentUser.id}_${Date.now()}`;

    const newTraderProfile: TraderProfile = {
      id: `tp_${Date.now()}`,
      brandName: traderData.brandName.trim(),
      brandLogoUrl: traderData.brandLogoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      businessCategory: traderData.businessCategory,
      campusLocation: traderData.campusLocation,
      whatsappContact: traderData.whatsappContact,
      products: [],
      isVerifiedVendor: true,
      activeOrdersToday: 0,
      rating: 5.0,
      reviewsCount: 1,
    };

    const newBusiness: StudentBusiness = {
      id: businessId,
      name: traderData.brandName.trim(),
      tagline: traderData.description || 'Verified student venture.',
      description: traderData.description || `${traderData.brandName} is a student-owned venture offering ${traderData.businessCategory} at ${traderData.campusLocation}.`,
      category: traderData.businessCategory,
      university: currentUser.university || '',
      campus: 'Permanent Site',
      hostelLocation: traderData.campusLocation,
      ownerId: currentUser.id,
      ownerName: currentUser.fullName,
      ownerEmail: currentUser.email,
      studentFaculty: currentUser.faculty || '',
      studentDept: currentUser.department || 'Undergraduate',
      studentLevel: currentUser.level || '300L',
      whatsapp: traderData.whatsappContact,
      rating: 5.0,
      reviewsCount: 1,
      acceptsHostelDelivery: traderData.acceptsHostelDelivery ?? true,
      deliveryTimeEstimate: '20 - 45 mins',
      startingPrice: traderData.startingPrice || 1500,
      imageUrl: traderData.brandLogoUrl || 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80',
      verifiedStudent: true,
      services: [
        {
          id: `srv_${Date.now()}_1`,
          name: `${traderData.brandName} Standard Package`,
          price: traderData.startingPrice || 1500,
          description: 'Official student rate package',
          estimatedTime: 'Same-day',
        },
      ],
    };

    // Save locally
    try {
      const stored = localStorage.getItem(STORAGE_BUSINESSES_KEY);
      const list: StudentBusiness[] = stored ? JSON.parse(stored) : [];
      const updated = [newBusiness, ...list.filter((b) => b.id !== businessId)];
      localStorage.setItem(STORAGE_BUSINESSES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving business locally:', e);
    }

    // Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').update({
          role: 'trader',
          account_type: 'TRADER',
          updated_at: new Date().toISOString(),
        }).eq('id', currentUser.id);

        await supabase.from('student_businesses').insert({
          owner_id: currentUser.id,
          name: newBusiness.name,
          tagline: newBusiness.tagline,
          description: newBusiness.description,
          category: newBusiness.category,
          university: currentUser.university || '',
          campus: newBusiness.campus,
          hostel_location: newBusiness.hostelLocation,
          owner_name: newBusiness.ownerName,
          owner_email: newBusiness.ownerEmail,
          whatsapp: newBusiness.whatsapp,
          image_url: newBusiness.imageUrl,
          starting_price: newBusiness.startingPrice,
          accepts_hostel_delivery: newBusiness.acceptsHostelDelivery,
          services: newBusiness.services,
          rating: 5.0,
          reviews_count: 1,
          badge: 'New Student Venture',
          verified_student: true,
        });
      } catch (err) {
        console.warn('[Supabase] Elevation sync deferred:', err);
      }
    }

    const elevatedUser: AppUser = {
      ...currentUser,
      role: 'trader',
      accountType: 'TRADER',
      businessProfileId: businessId,
      traderProfile: newTraderProfile,
    };

    setCurrentUser(elevatedUser);
    return { user: elevatedUser, business: newBusiness };
  };

  const toggleFollowUser = async (targetUserId: string) => {
    if (!currentUser) return;
    const previousUser = { ...currentUser };
    const currentFollowing = currentUser.followingUserIds || [];
    const isFollowing = currentFollowing.includes(targetUserId);

    const updatedFollowing = isFollowing
      ? currentFollowing.filter((id) => id !== targetUserId)
      : [...currentFollowing, targetUserId];

    const updatedUser: AppUser = {
      ...currentUser,
      followingUserIds: updatedFollowing,
      followingCount: Math.max(0, (currentUser.followingCount || 0) + (isFollowing ? -1 : 1)),
    };

    setCurrentUser(updatedUser);

    if (isSupabaseConfigured) {
      try {
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
          let error: any;
          if (isFollowing) {
            const res = await supabase
              .from('follows')
              .delete()
              .eq('follower_id', currentUser.id)
              .eq('following_id', targetUserId);
            error = res.error;
          } else {
            const res = await supabase
              .from('follows')
              .insert({
                follower_id: currentUser.id,
                following_id: targetUserId,
              });
            error = res.error;
          }

          if (error) {
            if (error.code === 'PGRST205' && retryCount < maxRetries) {
              retryCount++;
              console.warn(`[Supabase Schema Cache Notice]: Table 'follows' not found in cache. Retrying in ${500 * retryCount}ms...`);
              await new Promise((r) => setTimeout(r, 500 * retryCount));
              continue;
            }
            throw error;
          }
          break;
        }
      } catch (err: any) {
        setCurrentUser(previousUser);
        console.error('[Follow Error]:', err);
        const friendly = getFriendlyError(err, 'follow');
        emitAppToast(friendly, 'error');
      }
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[Auth] Supabase signOut warning:', e);
    }
    
    // Clear all cached session, chat, conversations, and message data from local storage
    localStorage.removeItem('campus_foundry_user_session_v4');
    localStorage.removeItem('campus_foundry_chat_messages_v7');
    localStorage.removeItem('campus_foundry_chat_conversations_v7');
    localStorage.removeItem('campus_foundry_mp_conversations_v1');
    localStorage.removeItem('campus_foundry_posts_v4');
    localStorage.removeItem('campus_foundry_snaps_v4');
    localStorage.removeItem('campus_foundry_custom_businesses_v4');
    
    setCurrentUser(null);
  };

  const updateUser = async (updatedData: Partial<AppUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedData };
    setCurrentUser(updated);

    if (isSupabaseConfigured) {
      const payload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updatedData.university !== undefined) payload.university = updatedData.university;
      if (updatedData.session !== undefined) payload.session = updatedData.session;
      if (updatedData.fullName !== undefined) payload.full_name = updatedData.fullName;
      if (updatedData.level !== undefined) payload.level = updatedData.level;
      if (updatedData.faculty !== undefined) payload.faculty = updatedData.faculty;
      if (updatedData.department !== undefined) payload.department = updatedData.department;
      if (updatedData.bio !== undefined) payload.bio = updatedData.bio;
      if (updatedData.avatarUrl !== undefined) payload.avatar_url = updatedData.avatarUrl;
      if (updatedData.whatsapp !== undefined) payload.whatsapp = updatedData.whatsapp;
      if (updatedData.hostelLocation !== undefined) payload.hostel_location = updatedData.hostelLocation;

      try {
        await supabase.from('profiles').update(payload).eq('id', currentUser.id);
      } catch (err) {
        console.warn('[Supabase] Profile update notice:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        signUpWithEmailPassword: handleSignUpWithEmailPassword,
        signInWithEmailPassword: handleSignInWithEmailPassword,
        resendConfirmationEmail: handleResendConfirmationEmail,
        confirmSignupWithOtp: handleConfirmSignupWithOtp,
        requestUnilorinOTP,
        verifyUnilorinOTP,
        signOut,
        updateUser,
        elevateToTrader,
        toggleFollowUser,
        syncUserProfileFromSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

