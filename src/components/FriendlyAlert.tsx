import React from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface FriendlyAlertProps {
  message: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'warning' | 'info' | 'success';
  className?: string;
  isRetrying?: boolean;
}

/**
 * Renders errors and alerts softly (calm warning tones rather than aggressive red),
 * featuring a friendly icon, clear typography, and an optional "Try again" action.
 */
export const FriendlyAlert: React.FC<FriendlyAlertProps> = ({
  message,
  onRetry,
  onDismiss,
  variant = 'warning',
  className = '',
  isRetrying = false,
}) => {
  if (!message) return null;

  const colorStyles = {
    warning: 'border-amber-500/25 bg-amber-500/10 text-amber-200/90 shadow-sm',
    info: 'border-sky-500/25 bg-sky-500/10 text-sky-200/90 shadow-sm',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200/90 shadow-sm',
  }[variant];

  const iconColor = {
    warning: 'text-amber-400',
    info: 'text-sky-400',
    success: 'text-emerald-400',
  }[variant];

  return (
    <div
      role="alert"
      className={`rounded-2xl border p-3.5 text-xs flex items-start gap-3 backdrop-blur-sm animate-in fade-in duration-200 ${colorStyles} ${className}`}
    >
      <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />

      <div className="flex-1 leading-relaxed font-medium">
        <span>{message}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>Try again</span>
          </button>
        )}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
