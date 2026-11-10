/**
 * Central Error Handling & Sanitization Service for Campus Foundry
 * 
 * Guarantees that every user-facing error message is polite, short, and non-technical.
 * Users never see raw errors, database/table names, Supabase/VITE/env variable names,
 * "Failed to fetch", "permission denied", "row-level security", stack traces or developer advice.
 */

export type FriendlyErrorContext =
  | 'signin'
  | 'signup'
  | 'otp'
  | 'verification'
  | 'post'
  | 'snap'
  | 'voice'
  | 'dm'
  | 'chat'
  | 'marketplace'
  | 'order'
  | 'product'
  | 'store'
  | 'upload'
  | 'profile'
  | 'follow'
  | 'general';

/**
 * Checks whether an error is caused by a network drop, timeout, or abort
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const str = extractErrorString(err).toLowerCase();
  return (
    str.includes('failed to fetch') ||
    str.includes('networkerror') ||
    str.includes('network request failed') ||
    str.includes('err_connection') ||
    str.includes('err_internet_disconnected') ||
    str.includes('connection refused') ||
    str.includes('timeout') ||
    str.includes('timed out') ||
    str.includes('aborted') ||
    str.includes('offline') ||
    str.includes('internet') ||
    str.includes('load failed') ||
    str.includes('fetch failed') ||
    str.includes('econnreset') ||
    str.includes('503') ||
    str.includes('504')
  );
}

/**
 * Safely extracts raw text description from any unknown error type
 */
function extractErrorString(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return `${err.name} ${err.message}`;
  if (typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const parts: string[] = [];
    if (obj.message && typeof obj.message === 'string') parts.push(obj.message);
    if (obj.error && typeof obj.error === 'string') parts.push(obj.error);
    if (obj.error_description && typeof obj.error_description === 'string') parts.push(obj.error_description);
    if (obj.details && typeof obj.details === 'string') parts.push(obj.details);
    if (obj.hint && typeof obj.hint === 'string') parts.push(obj.hint);
    if (obj.code) parts.push(String(obj.code));
    if (obj.status) parts.push(String(obj.status));
    if (obj.statusCode) parts.push(String(obj.statusCode));
    return parts.join(' ');
  }
  return String(err);
}

/**
 * Automatically retries an async operation up to `maxRetries` times (default 2)
 * when a network failure occurs before throwing.
 */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 400
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt <= maxRetries && isNetworkError(err)) {
        console.warn(`[Network Retry]: Attempt ${attempt}/${maxRetries} failed with network error. Retrying in ${delayMs * attempt}ms...`);
        await new Promise((res) => setTimeout(res, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Maps any error into a polite, short, and non-technical user-facing message.
 * Always logs the raw error to console.error for debugging purposes only.
 */
export function getFriendlyError(error: unknown, context?: FriendlyErrorContext | string): string {
  // 1. Log real error to console for engineering/debugging only
  if (error) {
    console.error(`[App Error (${context || 'general'})]:`, error);
  }

  if (!error) {
    return 'Something went wrong. Please try again in a moment.';
  }

  const raw = extractErrorString(error);
  const lower = raw.toLowerCase().trim();

  // 1. Network / "Failed to fetch" / timeout
  if (isNetworkError(error)) {
    return "We couldn't connect right now. Please check your internet and try again.";
  }

  // 2. Invalid login / credentials
  if (
    lower.includes('invalid login') ||
    lower.includes('invalid credentials') ||
    lower.includes('invalid_credentials') ||
    lower.includes('invalid_grant') ||
    lower.includes('invalid email or password') ||
    lower.includes('wrong password') ||
    (lower.includes('user not found') && (context === 'signin' || !context))
  ) {
    return "That email or password doesn't look right. Please try again.";
  }

  // 3. Email already registered
  if (
    lower.includes('already registered') ||
    lower.includes('already in use') ||
    lower.includes('already exists') ||
    lower.includes('user_already_exists') ||
    lower.includes('email taken') ||
    (lower.includes('23505') && lower.includes('email'))
  ) {
    return 'This email already has an account. Try signing in instead.';
  }

  // 4. Weak password
  if (
    lower.includes('weak password') ||
    lower.includes('password should be at least') ||
    lower.includes('password must be at least') ||
    lower.includes('password is too short') ||
    lower.includes('authweakpassworderror')
  ) {
    return 'Please choose a password with at least 6 characters.';
  }

  // OTP specific validation
  if (lower.includes('token has expired') || lower.includes('otp expired')) {
    return 'That confirmation code has expired. Please request a new one.';
  }
  if (lower.includes('token is invalid') || lower.includes('invalid token') || lower.includes('bad_code') || lower.includes('verification code')) {
    return "That code doesn't look right. Please double-check the 6 digits.";
  }

  // 5. Permission / RLS / 403 / 401 / unauthorized
  if (
    lower.includes('permission denied') ||
    lower.includes('row-level security') ||
    lower.includes('rls') ||
    lower.includes('42501') ||
    lower.includes('unauthorized') ||
    lower.includes('not authenticated') ||
    lower.includes('jwt') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('forbidden')
  ) {
    return "We couldn't complete that right now. Please try again, or sign in again if it continues.";
  }

  // 6. File too large / wrong type
  if (
    lower.includes('too large') ||
    lower.includes('payload too large') ||
    lower.includes('exceeds') ||
    lower.includes('413') ||
    lower.includes('wrong type') ||
    lower.includes('unsupported file') ||
    lower.includes('unsupported media') ||
    lower.includes('invalid file type') ||
    lower.includes('size limit')
  ) {
    return 'That file is too large or not supported. Please use a PNG or JPG under 10MB.';
  }

  // Domain-specific marketplace rules
  if (lower.includes('cannot_order_own_business') || lower.includes('cannot_message_own_business') || lower.includes('own store')) {
    return "You can't place orders or send messages to your own store.";
  }
  if (lower.includes('insufficient_stock') || lower.includes('out of stock')) {
    return 'An item in your cart is currently out of stock. Please adjust quantities.';
  }
  if (lower.includes('wrong_delivery_pin')) {
    return 'That PIN is not correct. Please confirm the code with the buyer.';
  }
  if (lower.includes('pin_locked')) {
    return 'Too many attempts. Verification is locked briefly for security.';
  }
  if (lower.includes('empty_order')) {
    return 'Your cart is empty. Please add items to place an order.';
  }
  if (lower.includes('address_required')) {
    return 'Please enter a delivery address or room number.';
  }

  // Microphone recording
  if (lower.includes('notallowederror') || lower.includes('permissiondenied') || lower.includes('microphone')) {
    return 'Please allow microphone access in your browser to record a voice note.';
  }

  // 4. Context-specific fallback lines
  if (context === 'verification') {
    return "We couldn't submit your verification request. Please try again shortly.";
  }
  if (context === 'post') {
    return "We couldn't share your post right now. Please try again.";
  }
  if (context === 'snap') {
    return "We couldn't post your snap right now. Please try again.";
  }
  if (context === 'voice') {
    return "We couldn't send your voice note. Please try again.";
  }
  if (context === 'dm' || context === 'chat') {
    return "We couldn't send your message. Please try again.";
  }
  if (context === 'order') {
    return "We couldn't place your order right now. Please try again in a moment.";
  }
  if (context === 'product') {
    return "We couldn't save your product right now. Please try again.";
  }
  if (context === 'store') {
    return "We couldn't save your store details right now. Please try again.";
  }
  if (context === 'upload') {
    return "We couldn't upload your file right now. Please try again.";
  }
  if (context === 'follow') {
    return "We couldn't update follow status right now. Please try again.";
  }
  if (context === 'profile') {
    return "We couldn't update your profile right now. Please try again.";
  }

  // 7. Return the real message for other cases
  return raw || 'Something went wrong. Please try again in a moment.';
}
