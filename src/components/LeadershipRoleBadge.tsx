import React from 'react';
import { Crown, Bookmark } from 'lucide-react';
import { HubPageType } from '../types';

export interface LeadershipRoleBadgeProps {
  label: string;
  pageType?: HubPageType | string;
  accentColor?: string;
  size?: 'xs' | 'sm';
  icon?: 'crown' | 'bookmark' | 'auto';
  className?: string;
}

export const LeadershipRoleBadge: React.FC<LeadershipRoleBadgeProps> = ({
  label,
  pageType = 'club',
  accentColor,
  size = 'xs',
  icon = 'auto',
  className = '',
}) => {
  if (!label) return null;

  const isClub = pageType === 'club';
  const isNews = pageType === 'news';

  // Determine icon: Book clubs & reading or editors often use bookmark/crown
  const isHeadOrLead =
    label.toLowerCase().includes('head') ||
    label.toLowerCase().includes('chief') ||
    label.toLowerCase().includes('owner') ||
    label.toLowerCase().includes('lead');

  const selectedIcon =
    icon === 'crown'
      ? 'crown'
      : icon === 'bookmark'
      ? 'bookmark'
      : isHeadOrLead
      ? 'crown'
      : 'bookmark';

  // Palette based on page type & subtle design guidelines
  const colorStyle = isClub
    ? 'bg-[#FF7A1A]/10 text-[#FF7A1A] border-[#FF7A1A]/25 dark:bg-[#FF7A1A]/15 dark:text-[#FFA052] dark:border-[#FF7A1A]/30'
    : isNews
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
    : 'bg-purple-500/10 text-purple-700 border-purple-500/25 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30';

  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-0.5 text-xs gap-1.5'
      : 'px-2 py-0.5 text-[10px] sm:text-[11px] gap-1';

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight rounded-full border shadow-xs whitespace-nowrap select-none ${colorStyle} ${sizeClasses} ${className}`}
      style={accentColor ? { color: accentColor, borderColor: `${accentColor}40` } : undefined}
    >
      {selectedIcon === 'crown' ? (
        <Crown className="w-3 h-3 shrink-0 stroke-[2.2]" />
      ) : (
        <Bookmark className="w-3 h-3 shrink-0 stroke-[2.2]" />
      )}
      <span>{label}</span>
    </span>
  );
};

export default LeadershipRoleBadge;
