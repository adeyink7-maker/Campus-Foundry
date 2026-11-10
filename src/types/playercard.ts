import { AppUser } from '../types';

export type AchievementCategory = 'academic' | 'sports' | 'leadership' | 'project' | 'award' | 'other';

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description?: string;
  icon?: string; // Icon identifier or emoji
  category: AchievementCategory;
  dateAchieved?: string;
  linkUrl?: string;
  mediaUrl?: string;
  isVerified: boolean;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PlayerCardSettings {
  userId: string;
  accentColor: string; // e.g. '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'
  heroVideoUrl?: string; // Short looping WebM/MP4 (2-3s)
  showStats: boolean;
  tagline?: string; // e.g., "CIS Midfield Architect & Hackathon Champion"
  topSkill?: string; // e.g., "Full-Stack & Distributed Systems"
  jerseyNumber?: number; // e.g., 7, 10, 24
  portfolioLinks?: Array<{ title: string; url: string; type?: 'github' | 'behance' | 'linkedin' | 'website' }>;
  updatedAt?: string;
}

export interface PlayerCardData {
  user: AppUser;
  settings: PlayerCardSettings;
  achievements: Achievement[];
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    projectsCount: number;
    venturesCount: number;
  };
}
