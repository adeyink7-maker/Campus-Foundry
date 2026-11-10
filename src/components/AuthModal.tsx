import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, StudentLevel } from '../types';
import { UNIVERSITIES, DEFAULT_UNIVERSITY } from '../constants/universities';
import { FacultyDepartmentSelector } from './FacultyDepartmentSelector';
import { HostelSelectMenu } from './HostelSelectMenu';
import { getFriendlyError } from '../utils/friendlyErrors';
import { FriendlyAlert } from './FriendlyAlert';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  initialStep?: 'signin' | 'signup' | 'confirm_sent';
  forceOnboarding?: boolean;
  onSuccess?: () => void;
}

const STUDENT_LEVELS: { value: StudentLevel; label: string }[] = [
  { value: '100L', label: '100L' },
  { value: '200L', label: '200L' },
  { value: '300L', label: '300L' },
  { value: '400L', label: '400L' },
  { value: '500L', label: '500L' },
  { value: 'Postgraduate', label: 'PG' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'student',
  initialStep = 'signin',
  forceOnboarding = false,
  onSuccess,
}) => {
  const { 
    currentUser, 
    signUpWithEmailPassword, 
    signInWithEmailPassword, 
    resendConfirmationEmail,
    confirmSignupWithOtp,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'confirm_sent'>(initialStep);
  const [role, setRole] = useState<UserRole>(defaultRole);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState<StudentLevel>('300L');
  const [hostelLocation, setHostelLocation] = useState('');
  const [university, setUniversity] = useState<string>(DEFAULT_UNIVERSITY);
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');

  // 6-digit OTP verification state
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState('');

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialStep);
      setRole(defaultRole);
      setError(null);
      setSuccess(null);
      setPassword('');
      setOtpCode(['', '', '', '', '', '']);
      if (currentUser) {
        setEmail(currentUser.email || '');
        setFullName(currentUser.fullName || '');
        if (currentUser.level) setLevel(currentUser.level as StudentLevel);
        if (currentUser.faculty) setFaculty(currentUser.faculty);
        if (currentUser.department) setDepartment(currentUser.department);
        if (currentUser.hostelLocation) setHostelLocation(currentUser.hostelLocation);
      }
    }
  }, [isOpen, defaultRole, initialStep, currentUser]);

  // 60-Second Cooldown Timer for Resend Code
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Auto-focus first OTP input when entering verification mode
  useEffect(() => {
    if (mode === 'confirm_sent') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

  if (!isOpen) return null;

  // Handle OTP digit changes
  const handleOtpChange = (val: string, index: number) => {
    const cleanDigit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otpCode];
    newOtp[index] = cleanDigit;
    setOtpCode(newOtp);
    setError(null);

    // Auto-advance to next box if digit entered
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP backspace and arrow navigation
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpCode[index] && index > 0) {
        const newOtp = [...otpCode];
        newOtp[index - 1] = '';
        setOtpCode(newOtp);
        otpInputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpCode];
        newOtp[index] = '';
        setOtpCode(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtpCode(newOtp);
    setError(null);

    const nextIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Handle Sign In with Email & Password
  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmailPassword({
        email: cleanEmail,
        password,
      });

      setSuccess('Signed in successfully.');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: unknown) {
      const raw = String((err as any)?.message || err || '').toLowerCase();
      if (raw.includes('not confirmed') || raw.includes('verification code') || raw.includes('confirm')) {
        setLastSubmittedEmail(cleanEmail);
        setOtpCode(['', '', '', '', '', '']);
        setMode('confirm_sent');
        setError('Your email is not confirmed yet. Please enter the 6-digit code sent to your email.');
        return;
      }
      setError(getFriendlyError(err, 'signin'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up with Any Email
  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Please choose a password with at least 6 characters.');
      return;
    }

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!faculty) {
      setError('Please select your faculty.');
      return;
    }

    if (!department) {
      setError('Please select your department.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUpWithEmailPassword({
        email: cleanEmail,
        password,
        fullName: fullName.trim(),
        university,
        faculty,
        department,
        level,
        role,
        hostelLocation: hostelLocation || undefined,
      });

      setLastSubmittedEmail(cleanEmail);
      setOtpCode(['', '', '', '', '', '']);

      if (result.requiresEmailConfirmation) {
        setMode('confirm_sent');
        setCooldownSeconds(60);
      } else {
        setSuccess('Account created successfully.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      setError(getFriendlyError(err, 'signup'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit 6-digit verification code
  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = otpCode.join('');
    if (token.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    const targetEmail = lastSubmittedEmail || email.trim().toLowerCase();
    if (!targetEmail) {
      setError('Missing email address. Please return to sign up.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await confirmSignupWithOtp(targetEmail, token);
      setSuccess('Email verified successfully! Continuing to your campus account...');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 700);
    } catch (err: unknown) {
      setError(getFriendlyError(err, 'otp'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend 6-digit confirmation code with cooldown
  const handleResendConfirmation = async () => {
    const targetEmail = lastSubmittedEmail || email.trim().toLowerCase();
    if (!targetEmail) {
      setError('Please provide the email address to resend confirmation code.');
      return;
    }

    if (cooldownSeconds > 0) return;

    setIsResending(true);
    setError(null);

    try {
      await resendConfirmationEmail(targetEmail);
      setSuccess(`A new 6-digit code has been sent to ${targetEmail}.`);
      setCooldownSeconds(60);
      setOtpCode(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(getFriendlyError(err, 'otp'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={forceOnboarding ? undefined : onClose}
    >
      <div 
        className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#14161B] shadow-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Campus Foundry
            </h2>
            <p className="text-xs text-neutral-400">
              {mode === 'confirm_sent' 
                ? 'Verify your email'
                : mode === 'signup' 
                ? 'Create student account' 
                : 'Sign in to continue'}
            </p>
          </div>

          {!forceOnboarding && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Slim Segmented Mode Switcher (Sign In | Create Account) */}
        {mode !== 'confirm_sent' && (
          <div className="px-5 pb-3 shrink-0">
            <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-900 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccess(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccess(null);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Create account
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto px-5 pb-5 pt-1 space-y-3">
          
          {/* Alerts */}
          {error && (
            <div className="space-y-2">
              <FriendlyAlert
                message={error}
                onRetry={
                  mode === 'signin'
                    ? () => handleSignIn()
                    : mode === 'signup'
                    ? () => handleSignUp()
                    : mode === 'confirm_sent'
                    ? () => handleVerifyOtpSubmit()
                    : undefined
                }
                onDismiss={() => setError(null)}
                variant="warning"
                isRetrying={isSubmitting}
              />
              {lastSubmittedEmail && mode === 'confirm_sent' && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={cooldownSeconds > 0 || isResending}
                  className="text-xs font-bold text-amber-400 hover:underline inline-flex items-center gap-1 pl-1 disabled:opacity-50 cursor-pointer"
                >
                  <RotateCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {cooldownSeconds > 0
                      ? `Resend code in ${cooldownSeconds}s`
                      : 'Resend code'}
                  </span>
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <p className="font-medium leading-relaxed">{success}</p>
            </div>
          )}

          {/* ============================================================= */}
          {/* SCREEN: VERIFY YOUR EMAIL (6-DIGIT OTP CODE INPUT)            */}
          {/* ============================================================= */}
          {mode === 'confirm_sent' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white tracking-tight">Verify your email</h3>
                <p className="text-xs text-neutral-400">
                  Enter the 6-digit confirmation code sent to:
                </p>
                <div className="inline-block px-3 py-1 rounded-lg bg-neutral-900 border border-white/[0.08] text-orange-400 text-xs font-mono font-medium max-w-full truncate">
                  {lastSubmittedEmail || email}
                </div>
              </div>

              {/* 6-Digit Code Input (Numeric keyboard, auto-advance, paste support) */}
              <div className="py-1">
                <div className="grid grid-cols-6 gap-2">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      autoComplete="one-time-code"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={handleOtpPaste}
                      className={`h-12 w-full rounded-xl border text-center text-lg font-mono font-bold text-white transition-all focus:outline-none ${
                        digit
                          ? 'border-orange-500/80 bg-orange-500/10'
                          : 'border-white/[0.08] bg-neutral-950 focus:border-orange-500'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || otpCode.join('').length !== 6}
                className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs transition-colors active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify and continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Resend Code with 60s cooldown */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-neutral-400">Didn't get the code?</span>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={cooldownSeconds > 0 || isResending}
                  className="font-semibold text-orange-400 hover:underline disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                  <span>
                    {cooldownSeconds > 0
                      ? `Resend code in ${cooldownSeconds}s`
                      : 'Resend code'}
                  </span>
                </button>
              </div>

              {/* Spam Hint */}
              <div className="rounded-xl border border-white/[0.08] bg-neutral-900/60 p-3 text-left text-xs text-neutral-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-orange-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Check your Spam or Junk folder</span>
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Confirmation codes sometimes land in spam or promotions. Please check there if not visible within 1 minute.
                </p>
              </div>

              {/* Switch Email or Sign In */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs font-medium text-neutral-400 hover:text-white transition-colors"
                >
                  Return to sign in
                </button>
              </div>
            </form>
          )}

          {/* ============================================================= */}
          {/* SCREEN: SIGN IN                                               */}
          {/* ============================================================= */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    autoComplete="email"
                    className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 pl-10 pr-3.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 pl-10 pr-3.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 mt-1 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs transition-colors active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-neutral-400">
                  New to Campus Foundry?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-semibold text-orange-400 hover:underline cursor-pointer"
                  >
                    Create account
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ============================================================= */}
          {/* SCREEN: CREATE ACCOUNT                                        */}
          {/* ============================================================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              
              {/* Account Type: Two slim segmented tabs (Student | Trader) */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Account type
                </label>
                <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-950 border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      role === 'student'
                        ? 'bg-orange-500 text-neutral-950 font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('trader')}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      role === 'trader'
                        ? 'bg-orange-500 text-neutral-950 font-bold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Trader
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Full name <span className="text-orange-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Adeyinka Alao"
                  required
                  autoComplete="name"
                  className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 px-3.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Email <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@email.com"
                    required
                    autoComplete="email"
                    className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 pl-10 pr-3.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Password <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 pl-10 pr-3.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none transition-colors"
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              {/* Level: ONE horizontal scrollable row of small chips */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Level <span className="text-orange-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {STUDENT_LEVELS.map((lvl) => {
                    const isSelected = level === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        onClick={() => setLevel(lvl.value)}
                        className={`h-8 px-3 rounded-lg text-xs font-mono font-medium border shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-neutral-950 font-bold border-orange-500'
                            : 'bg-neutral-950 text-neutral-400 border-white/[0.08] hover:text-white hover:border-white/20'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* University Name */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  University <span className="text-orange-500">*</span>
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full h-[46px] rounded-xl border border-white/[0.08] bg-neutral-950 px-3.5 text-xs text-white focus:border-orange-500 focus:outline-none transition-colors"
                >
                  {UNIVERSITIES.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty & Department: Tappable select-fields opening the bottom sheet */}
              <FacultyDepartmentSelector
                selectedFaculty={faculty}
                onFacultyChange={setFaculty}
                selectedDepartment={department}
                onDepartmentChange={setDepartment}
                required={true}
              />

              {/* Hostel / Residence (Optional single select-field) */}
              <HostelSelectMenu
                selectedHostel={hostelLocation}
                onHostelChange={setHostelLocation}
                label="Hostel (optional)"
                required={false}
              />

              {/* Primary Orange Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 mt-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-bold text-xs transition-colors active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create account</span>
                )}
              </button>

              <div className="pt-1 text-center">
                <p className="text-xs text-neutral-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-semibold text-orange-400 hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
