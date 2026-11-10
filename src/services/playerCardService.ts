import { supabase, isSupabaseConfigured, uploadMedia } from './supabase';
import { Achievement, PlayerCardSettings, PlayerCardData } from '../types/playercard';
import { AppUser } from '../types';

// In-memory LRU cache for preloaded cards during long-press
const playerCardCache = new Map<string, { data: PlayerCardData; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Default Seed Achievements for demo accounts & preview
const DEMO_ACHIEVEMENTS: Record<string, Achievement[]> = {
  default: [
    {
      id: 'ach_1',
      userId: 'default',
      title: 'Campus Hackathon Champion 2026',
      description: '1st place out of 64 teams building campus emergency & transit routing systems.',
      icon: 'Trophy',
      category: 'award',
      dateAchieved: '2026-02-14',
      isVerified: true,
      isVisible: true,
      sortOrder: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ach_2',
      userId: 'default',
      title: 'Dean’s Honour List (First Class Scholar)',
      description: 'Maintained 4.85+ CGPA across continuous academic sessions in Faculty of CIS.',
      icon: 'Award',
      category: 'academic',
      dateAchieved: '2025-11-20',
      isVerified: true,
      isVisible: true,
      sortOrder: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ach_3',
      userId: 'default',
      title: 'Inter-Faculty Football Gold Medalist',
      description: 'Starting attacking midfielder for Faculty of CIS, winning the 2025 Vice-Chancellor Cup.',
      icon: 'Flame',
      category: 'sports',
      dateAchieved: '2025-08-10',
      isVerified: false,
      isVisible: true,
      sortOrder: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ach_4',
      userId: 'default',
      title: 'Google Developer Student Clubs (GDSC) Lead',
      description: 'Mentored 350+ undergraduate students across Web3, Cloud, and Machine Learning tracks.',
      icon: 'Users',
      category: 'leadership',
      dateAchieved: '2025-05-18',
      isVerified: true,
      isVisible: true,
      sortOrder: 4,
      createdAt: new Date().toISOString(),
    },
  ],
};

const DEFAULT_SETTINGS: PlayerCardSettings = {
  userId: 'default',
  accentColor: '#f59e0b', // Amber Champion Gold
  heroVideoUrl: undefined,
  showStats: true,
  tagline: 'Campus Midfield Playmaker & Open Source Architect',
  topSkill: 'Full-Stack Distributed Engineering & UI/UX',
  jerseyNumber: 10,
  portfolioLinks: [
    { title: 'GitHub Portfolio', url: 'https://github.com', type: 'github' },
  ],
};

const STORAGE_KEY_SETTINGS = 'campus_foundry_player_card_settings_v1';
const STORAGE_KEY_ACHIEVEMENTS = 'campus_foundry_player_card_achievements_v1';

/**
 * Fetch player card settings and achievements with cache and local persistence fallback
 */
export async function getPlayerCardData(user: AppUser): Promise<PlayerCardData> {
  const cached = playerCardCache.get(user.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let settings: PlayerCardSettings = {
    ...DEFAULT_SETTINGS,
    userId: user.id,
    tagline: user.role === 'trader'
      ? `${user.fullName} • Verified Campus Founder & Vendor`
      : `${user.department || 'Computer Science'} • ${user.faculty || 'CIS'}`,
  };

  let achievements: Achievement[] = [];

  // 1. Try local storage for user-customized settings
  try {
    const savedSettingsRaw = localStorage.getItem(`${STORAGE_KEY_SETTINGS}_${user.id}`);
    if (savedSettingsRaw) {
      settings = { ...settings, ...JSON.parse(savedSettingsRaw) };
    }

    const savedAchRaw = localStorage.getItem(`${STORAGE_KEY_ACHIEVEMENTS}_${user.id}`);
    if (savedAchRaw) {
      achievements = JSON.parse(savedAchRaw);
    }
  } catch {}

  // 2. Fetch from Supabase if live configured
  if (isSupabaseConfigured) {
    try {
      const [settingsRes, achRes] = await Promise.all([
        supabase.from('player_card_settings').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('achievements').select('*').eq('user_id', user.id).eq('is_visible', true).order('sort_order', { ascending: true }),
      ]);

      if (settingsRes.data) {
        const row = settingsRes.data;
        settings = {
          userId: row.user_id,
          accentColor: row.accent_color || settings.accentColor,
          heroVideoUrl: row.hero_video_url || undefined,
          showStats: row.show_stats ?? true,
          tagline: row.tagline || settings.tagline,
          topSkill: row.top_skill || settings.topSkill,
          jerseyNumber: row.jersey_number ?? 10,
          portfolioLinks: row.portfolio_links || settings.portfolioLinks,
          updatedAt: row.updated_at,
        };
      }

      if (achRes.data && achRes.data.length > 0) {
        achievements = achRes.data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          title: r.title,
          description: r.description,
          icon: r.icon || 'Trophy',
          category: r.category,
          dateAchieved: r.date_achieved,
          linkUrl: r.link_url,
          mediaUrl: r.media_url,
          isVerified: Boolean(r.is_verified),
          isVisible: Boolean(r.is_visible),
          sortOrder: r.sort_order || 0,
          createdAt: r.created_at,
        }));
      }
    } catch (err: any) {
      console.warn('[PlayerCard Service] Supabase read fallback:', err?.message || err);
    }
  }

  // If no achievements exist, supply tailored demo achievements so the player card is never dull
  if (achievements.length === 0) {
    achievements = (DEMO_ACHIEVEMENTS[user.id] || DEMO_ACHIEVEMENTS.default).map((a, i) => ({
      ...a,
      id: `${user.id}_ach_${i}`,
      userId: user.id,
    }));
  }

  const cardData: PlayerCardData = {
    user,
    settings,
    achievements,
    stats: {
      postsCount: user.postsCount || 0,
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      projectsCount: achievements.filter((a) => a.category === 'project').length || 0,
      venturesCount: user.role === 'trader' ? 1 : 0,
    },
  };

  playerCardCache.set(user.id, { data: cardData, timestamp: Date.now() });
  return cardData;
}

/**
 * Prefetch card data into memory ahead of time (e.g. on pointer down)
 */
export function prefetchPlayerCard(user: AppUser): void {
  getPlayerCardData(user).catch(() => {});
}

/**
 * Save updated player card settings
 */
export async function savePlayerCardSettings(settings: PlayerCardSettings): Promise<void> {
  // Update local storage
  try {
    localStorage.setItem(`${STORAGE_KEY_SETTINGS}_${settings.userId}`, JSON.stringify(settings));
  } catch {}

  // Invalidate cache
  playerCardCache.delete(settings.userId);

  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('player_card_settings').upsert({
      user_id: settings.userId,
      accent_color: settings.accentColor,
      hero_video_url: settings.heroVideoUrl,
      show_stats: settings.showStats,
      tagline: settings.tagline,
      top_skill: settings.topSkill,
      jersey_number: settings.jerseyNumber,
      portfolio_links: settings.portfolioLinks || [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (err: any) {
    console.warn('[PlayerCard Service] Save settings notice:', err?.message || err);
  }
}

/**
 * Save / Update an achievement
 */
export async function saveAchievement(achievement: Achievement): Promise<Achievement> {
  const isNew = !achievement.id || achievement.id.startsWith('temp_');
  const finalizedId = isNew ? `ach_${Date.now()}` : achievement.id;
  const itemToSave = { ...achievement, id: finalizedId };

  // Local storage update
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_ACHIEVEMENTS}_${achievement.userId}`);
    const list: Achievement[] = raw ? JSON.parse(raw) : [];
    const updated = isNew
      ? [itemToSave, ...list]
      : list.map((a) => (a.id === itemToSave.id ? itemToSave : a));
    localStorage.setItem(`${STORAGE_KEY_ACHIEVEMENTS}_${achievement.userId}`, JSON.stringify(updated));
  } catch {}

  playerCardCache.delete(achievement.userId);

  if (isSupabaseConfigured) {
    try {
      const payload: any = {
        user_id: itemToSave.userId,
        title: itemToSave.title,
        description: itemToSave.description,
        icon: itemToSave.icon,
        category: itemToSave.category,
        date_achieved: itemToSave.dateAchieved || null,
        link_url: itemToSave.linkUrl,
        media_url: itemToSave.mediaUrl,
        is_visible: itemToSave.isVisible,
        sort_order: itemToSave.sortOrder,
      };

      if (!isNew && !itemToSave.id.startsWith('ach_')) {
        payload.id = itemToSave.id;
      }

      const { data } = await supabase.from('achievements').upsert(payload).select().single();
      if (data) {
        return {
          ...itemToSave,
          id: data.id,
          createdAt: data.created_at,
        };
      }
    } catch (err: any) {
      console.warn('[PlayerCard Service] Save achievement notice:', err?.message || err);
    }
  }

  return itemToSave;
}

/**
 * Delete an achievement
 */
export async function deleteAchievement(userId: string, achievementId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_ACHIEVEMENTS}_${userId}`);
    if (raw) {
      const list: Achievement[] = JSON.parse(raw);
      localStorage.setItem(`${STORAGE_KEY_ACHIEVEMENTS}_${userId}`, JSON.stringify(list.filter((a) => a.id !== achievementId)));
    }
  } catch {}

  playerCardCache.delete(userId);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('achievements').delete().eq('id', achievementId).eq('user_id', userId);
    } catch (err: any) {
      console.warn('[PlayerCard Service] Delete achievement notice:', err?.message || err);
    }
  }
}

/**
 * Upload hero loop video or achievement badge media
 */
export async function uploadPlayerCardMedia(userId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop() || 'mp4';
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
  return uploadMedia('player-cards' as any, fileName, file);
}
