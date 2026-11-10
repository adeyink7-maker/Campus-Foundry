import { supabase, isSupabaseConfigured, formatSupabaseErrorMessage, ALLOWED_PROFILES_READ_COLUMNS } from './supabase';
import { AppUser, UserRole, StudentLevel } from '../types';

export const UNILORIN_DOMAIN = 'students.unilorin.edu.ng';
export const MATRIC_USERNAME_REGEX = /^[a-z0-9-]+$/i;
export const ADMIN_EMAILS: string[] = [];

export interface SendOtpResult {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
  retryAfterSeconds?: number;
}

export interface VerifyOtpParams {
  email: string;
  otp: string;
  fullName?: string;
  role?: UserRole;
  level?: StudentLevel;
  hostelLocation?: string;
  whatsapp?: string;
  faculty?: string;
  department?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  user: AppUser;
  needsOnboarding?: boolean;
  message?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  university?: string;
  faculty: string;
  department: string;
  level: StudentLevel;
  role?: UserRole;
  whatsapp?: string;
  hostelLocation?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/**
 * Validates any student email address from any provider (Gmail, Outlook, Yahoo, etc.)
 */
export function validateUnilorinEmail(email: string): { valid: boolean; error?: string; matricNumber?: string } {
  const normalized = (email || '').trim().toLowerCase().replace(/[\x00-\x1F\x7F]/g, '');
  if (!normalized || !normalized.includes('@')) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }

  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) {
    return { valid: false, error: 'Please enter a complete and valid email address.' };
  }

  const [username] = parts;
  return { valid: true, matricNumber: username };
}

/**
 * Signs up a new student account using email and password with user-selected academic info.
 */
export async function signUpWithEmailPassword(params: SignUpParams): Promise<{
  success: boolean;
  user?: AppUser;
  requiresEmailConfirmation: boolean;
  message: string;
}> {
  const validation = validateUnilorinEmail(params.email);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!params.password || params.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  if (!params.fullName.trim()) {
    throw new Error('Please enter your full name.');
  }

  const normalized = params.email.trim().toLowerCase();
  const username = normalized.split('@')[0];

  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password: params.password,
    options: {
      data: {
        full_name: params.fullName.trim(),
        faculty: params.faculty,
        department: params.department,
        level: params.level,
        role: params.role || 'student',
        hostel_location: params.hostelLocation,
        whatsapp: params.whatsapp,
      },
    },
  });

  if (error) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('already registered') || msg.includes('user already exists')) {
      throw new Error('This email is already registered. Please sign in instead.');
    }
    throw new Error(formatSupabaseErrorMessage(error, 'Sign up failed. Please try again.'));
  }

  const createdAuthUser = data.user;
  const requiresEmailConfirmation = !data.session;

  if (createdAuthUser) {
    // Attempt profile upsert (is_verified defaults to false until manual student verification)
    try {
      await supabase.from('profiles').upsert({
        id: createdAuthUser.id,
        email: normalized,
        full_name: params.fullName.trim(),
        username,
        role: params.role || 'student',
        account_type: params.role === 'trader' ? 'TRADER' : 'BUYER',
        level: params.level || '300L',
        faculty: params.faculty,
        department: params.department,
        university: params.university || 'University of Ilorin (UNILORIN)',
        hostel_location: params.hostelLocation,
        whatsapp: params.whatsapp,
        is_verified: false,
        is_admin: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[Profile Creation Notice]:', e);
    }
  }

  const appUser: AppUser = {
    id: createdAuthUser?.id || `usr_${Date.now()}`,
    email: normalized,
    fullName: params.fullName.trim(),
    username,
    role: params.role || 'student',
    accountType: params.role === 'trader' ? 'TRADER' : 'BUYER',
    faculty: params.faculty,
    department: params.department,
    university: params.university || 'University of Ilorin (UNILORIN)',
    level: params.level,
    hostelLocation: params.hostelLocation,
    whatsapp: params.whatsapp,
    isVerified: false,
    isAdmin: false,
    joinedAt: new Date().toISOString(),
  };

  return {
    success: true,
    user: appUser,
    requiresEmailConfirmation,
    message: requiresEmailConfirmation
      ? `A confirmation link has been sent to ${normalized}. Please check your inbox and spam folder.`
      : 'Account created successfully!',
  };
}

/**
 * Signs in an existing student account using email and password.
 */
export async function signInWithEmailPassword(params: SignInParams): Promise<{
  success: boolean;
  user: AppUser;
}> {
  const validation = validateUnilorinEmail(params.email);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (!params.password) {
    throw new Error('Please enter your password.');
  }

  const normalized = params.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password: params.password,
  });

  if (error || !data?.user) {
    console.error('[Supabase Auth Debug]: signInWithEmailPassword error:', error);
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('email not confirmed')) {
      throw new Error('Email not confirmed. Please enter the 6-digit code sent to your email to verify your account.');
    }
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      throw new Error('Incorrect email or password. Please double check and try again.');
    }
    throw new Error(formatSupabaseErrorMessage(error, 'Sign in failed. Please check your credentials.'));
  }

  const authUser = data.user;

  // Retrieve user profile using get_my_profile RPC
  const { data: myProfile } = await supabase.rpc('get_my_profile');
  let profile = myProfile;
  if (!profile) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select(ALLOWED_PROFILES_READ_COLUMNS)
      .eq('id', authUser.id)
      .maybeSingle();
    profile = fallback;
  }

  const appUser: AppUser = {
    id: authUser.id,
    email: normalized,
    fullName: profile?.full_name || authUser.user_metadata?.full_name || 'Campus Student',
    username: profile?.username || normalized.split('@')[0],
    role: (profile?.role as UserRole) || authUser.user_metadata?.role || 'student',
    accountType: profile?.account_type || (authUser.user_metadata?.role === 'trader' ? 'TRADER' : 'BUYER'),
    level: (profile?.level as StudentLevel) || authUser.user_metadata?.level || '300L',
    faculty: profile?.faculty || authUser.user_metadata?.faculty,
    department: profile?.department || authUser.user_metadata?.department,
    hostelLocation: profile?.hostel_location || authUser.user_metadata?.hostel_location,
    whatsapp: profile?.whatsapp || authUser.user_metadata?.whatsapp,
    isVerified: Boolean(profile?.is_verified),
    isAdmin: Boolean(profile?.is_admin || profile?.role === 'admin' || profile?.staff_role),
    staffRole: (profile?.staff_role as any) || (profile?.role === 'admin' || profile?.is_admin ? 'super_admin' : null),
    verifiedAt: profile?.verified_at,
    joinedAt: profile?.created_at || authUser.created_at || new Date().toISOString(),
  };

  return {
    success: true,
    user: appUser,
  };
}

/**
 * Resends the signup confirmation email to the specified email address.
 */
export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; message: string }> {
  const normalized = email.trim().toLowerCase();
  const validation = validateUnilorinEmail(normalized);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalized,
  });

  if (error) {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('rate') || error.status === 429) {
      throw new Error('Too many requests. Please wait 60 seconds before trying again.');
    }
    throw new Error(formatSupabaseErrorMessage(error, 'Failed to resend confirmation email. Please try again.'));
  }

  return {
    success: true,
    message: `Confirmation code resent to ${normalized}. Please check your spam folder as well.`,
  };
}

/**
 * Verifies 6-digit email confirmation OTP for signup
 */
export async function verifySignupOtp({ email, token }: { email: string; token: string }): Promise<{
  user: any;
  session: any;
}> {
  const normalized = email.trim().toLowerCase();
  const cleanToken = token.trim();

  if (!cleanToken || cleanToken.length !== 6) {
    throw new Error('Please enter the 6-digit verification code.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: cleanToken,
    type: 'signup',
  });

  if (error || !data?.user) {
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('expired') || msg.includes('token expired') || msg.includes('token has expired')) {
      throw new Error('Verification code has expired. Please tap "Resend code" for a new code.');
    }
    if (msg.includes('rate') || (error as any)?.status === 429) {
      throw new Error('Too many verification attempts. Please wait a moment before trying again.');
    }
    throw new Error('Incorrect verification code. Please check your email and try again.');
  }

  return {
    user: data.user,
    session: data.session,
  };
}

/**
 * Initiates 6-digit OTP delivery using Supabase Auth signInWithOtp (email OTP fallback)
 */
export async function requestStudentEmailOTP(email: string): Promise<SendOtpResult> {
  const validation = validateUnilorinEmail(email);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const normalized = email.trim().toLowerCase();

  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    const lower = error.message?.toLowerCase() || '';
    if (lower.includes('rate') || error.status === 429) {
      throw new Error('Too many attempts. Please wait 60 seconds before requesting another code.');
    }
    throw new Error(formatSupabaseErrorMessage(error, 'Failed to send verification code. Please try again.'));
  }

  return {
    success: true,
    message: `A 6-digit verification code has been sent to ${normalized}. Please check your inbox or spam folder.`,
    expiresInSeconds: 600,
    retryAfterSeconds: 60,
  };
}

/**
 * Verifies 6-digit OTP via Supabase Auth verifyOtp, then checks and syncs profile
 */
export async function verifyStudentEmailOTP(params: VerifyOtpParams): Promise<VerifyOtpResult> {
  const validation = validateUnilorinEmail(params.email);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const token = params.otp.trim();
  if (!token || !/^\d{6}$/.test(token)) {
    throw new Error('Please enter a valid 6-digit verification passcode.');
  }

  const normalized = params.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.verifyOtp({
    email: normalized,
    token,
    type: 'email',
  });

  if (error || !data?.user) {
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('expire') || msg.includes('token expired')) {
      throw new Error('Verification code has expired. Please request a new code.');
    }
    if (msg.includes('rate') || error?.status === 429) {
      throw new Error('Too many verification attempts. Please wait a moment before trying again.');
    }
    throw new Error('Incorrect verification code. Please check your webmail inbox or spam folder and try again.');
  }

  const user = data.user;
  const matric = validation.matricNumber || normalized.split('@')[0];

  // Fetch existing profile using get_my_profile RPC
  const { data: myProfile } = await supabase.rpc('get_my_profile');
  let existingProfile = myProfile;
  if (!existingProfile) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select(ALLOWED_PROFILES_READ_COLUMNS)
      .eq('id', user.id)
      .maybeSingle();
    existingProfile = fallback;
  }

  const needsOnboarding = !existingProfile || !existingProfile.full_name || existingProfile.full_name === 'Campus Student' || !existingProfile.level || !existingProfile.department;

  // Prepare app user representation
  const appUser: AppUser = {
    id: user.id,
    email: normalized,
    fullName: params.fullName?.trim() || existingProfile?.full_name || 'Campus Student',
    username: existingProfile?.username || matric,
    matricNumber: existingProfile?.matric_number || matric,
    role: (existingProfile?.role as UserRole) || params.role || 'student',
    accountType: existingProfile?.account_type || (params.role === 'trader' ? 'TRADER' : 'BUYER'),
    university: existingProfile?.university || '',
    level: (existingProfile?.level as StudentLevel) || params.level || '300L',
    hostelLocation: existingProfile?.hostel_location || params.hostelLocation,
    faculty: existingProfile?.faculty || params.faculty,
    department: existingProfile?.department || params.department,
    whatsapp: existingProfile?.whatsapp || params.whatsapp,
    isVerified: Boolean(existingProfile?.is_verified),
    isAdmin: Boolean(existingProfile?.is_admin),
    verifiedAt: existingProfile?.verified_at,
    unilorinDomain: UNILORIN_DOMAIN,
    joinedAt: user.created_at || new Date().toISOString(),
    followersCount: existingProfile?.followers_count || 0,
    followingCount: existingProfile?.following_count || 0,
    postsCount: existingProfile?.posts_count || 0,
    followingUserIds: existingProfile?.following_user_ids || [],
    blockedUserIds: existingProfile?.blocked_user_ids || [],
    avatarUrl: existingProfile?.avatar_url,
    bio: existingProfile?.bio,
  };

  // Upsert profile into Supabase profiles table using real column names
  if (params.fullName || params.level || params.faculty || params.department) {
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: normalized,
        full_name: appUser.fullName,
        username: appUser.username,
        matric_number: appUser.matricNumber,
        role: appUser.role,
        account_type: appUser.accountType,
        level: appUser.level,
        faculty: appUser.faculty,
        department: appUser.department,
        hostel_location: appUser.hostelLocation,
        whatsapp: appUser.whatsapp,
        is_verified: Boolean(existingProfile?.is_verified),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('[Supabase Profile Upsert Notice]:', e);
    }
  }

  return {
    success: true,
    user: appUser,
    needsOnboarding,
    message: 'Signed in successfully.'
  };
}

