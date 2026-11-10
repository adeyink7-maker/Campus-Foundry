import { supabase, isSupabaseConfigured } from './supabase';
import { getFriendlyError } from '../utils/friendlyErrors';
import { fetchAuthorsByIds } from './articles';
import type { 
  WriterApplication, 
  ApprovedWriterProfile, 
  WriterStatus,
  WriterVerification,
  WriterVerificationStatus
} from '../types/writers';

const LOCAL_WRITERS_KEY = 'cf_writers_local_applications';
const LOCAL_VERIFICATIONS_KEY = 'cf_writers_local_verifications';

function getLocalWriters(): Record<string, WriterApplication> {
  try {
    const raw = localStorage.getItem(LOCAL_WRITERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveLocalWriter(app: WriterApplication): void {
  try {
    const all = getLocalWriters();
    all[app.user_id] = app;
    localStorage.setItem(LOCAL_WRITERS_KEY, JSON.stringify(all));
  } catch {}
}

function getLocalVerifications(): Record<string, WriterVerification> {
  try {
    const raw = localStorage.getItem(LOCAL_VERIFICATIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveLocalVerification(v: WriterVerification): void {
  try {
    const all = getLocalVerifications();
    all[v.user_id] = v;
    localStorage.setItem(LOCAL_VERIFICATIONS_KEY, JSON.stringify(all));
  } catch {}
}

/**
 * Validate that a URL looks like a valid web address
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Match standard URLs with or without http(s)
  const pattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
  return pattern.test(trimmed);
}

/**
 * Normalize link to include https:// if missing
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Fetch a user's writer application / status
 */
export async function fetchUserWriterApplication(userId: string): Promise<WriterApplication | null> {
  if (!userId) return null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('writers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          user_id: data.user_id,
          status: data.status as WriterStatus,
          links: Array.isArray(data.links) ? data.links : [],
          bio: data.bio || '',
          note: data.note || '',
          created_at: data.created_at,
          reviewed_at: data.reviewed_at
        };
      }
    } catch (err) {
      console.warn('[fetchUserWriterApplication Notice]:', err);
    }
  }

  // Fallback to local cache
  const local = getLocalWriters();
  return local[userId] || null;
}

/**
 * Check if a user is an approved writer
 */
export async function checkIsApprovedWriter(userId?: string): Promise<boolean> {
  if (!userId) return false;
  const app = await fetchUserWriterApplication(userId);
  return app?.status === 'approved';
}

/**
 * Submit a new writer application
 */
export async function submitWriterApplication(
  userId: string,
  rawLinks: string[],
  bio: string,
  note: string
): Promise<WriterApplication> {
  if (!userId) throw new Error('Please sign in to submit a writer application.');

  const cleanLinks = rawLinks
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 3);

  if (cleanLinks.length === 0) {
    throw new Error('Please provide at least one link to your previous writing.');
  }

  for (const link of cleanLinks) {
    if (!isValidUrl(link)) {
      throw new Error(`"${link}" does not look like a valid website URL.`);
    }
  }

  const normalizedLinks = cleanLinks.map(normalizeUrl);
  const now = new Date().toISOString();

  const record: WriterApplication = {
    user_id: userId,
    status: 'pending',
    links: normalizedLinks,
    bio: bio.trim(),
    note: note.trim(),
    created_at: now,
    reviewed_at: null
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('writers')
        .upsert(
          {
            user_id: userId,
            status: 'pending',
            links: normalizedLinks,
            bio: bio.trim(),
            note: note.trim(),
            created_at: now,
            reviewed_at: null
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) {
        console.warn('[submitWriterApplication Notice]:', error.message);
        saveLocalWriter(record);
        return record;
      }

      const created: WriterApplication = {
        id: data.id,
        user_id: data.user_id,
        status: data.status as WriterStatus,
        links: data.links || normalizedLinks,
        bio: data.bio || bio,
        note: data.note || note,
        created_at: data.created_at || now,
        reviewed_at: data.reviewed_at
      };
      saveLocalWriter(created);
      return created;
    } catch (err: any) {
      console.warn('[submitWriterApplication error]:', err);
      saveLocalWriter(record);
      return record;
    }
  }

  saveLocalWriter(record);
  return record;
}

/**
 * Reapply for writer status (updates row back to pending)
 */
export async function reapplyWriterApplication(
  userId: string,
  rawLinks: string[],
  bio: string,
  note: string
): Promise<WriterApplication> {
  return submitWriterApplication(userId, rawLinks, bio, note);
}

/**
 * Fetch all pending writer applications for admin review
 */
export async function fetchPendingWriterApplications(): Promise<WriterApplication[]> {
  if (!isSupabaseConfigured) {
    const local = Object.values(getLocalWriters()).filter((a) => a.status === 'pending');
    return local;
  }

  try {
    const { data, error } = await supabase
      .from('writers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[fetchPendingWriterApplications Notice]:', error.message);
      return Object.values(getLocalWriters()).filter((a) => a.status === 'pending');
    }

    if (!data || data.length === 0) return [];

    // Fetch applicant names and avatars from profiles
    const userIds = data.map((d) => d.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, department')
      .in('id', userIds);

    const profileMap: Record<string, any> = {};
    if (profilesData) {
      for (const p of profilesData) {
        profileMap[p.id] = p;
      }
    }

    return data.map((d) => {
      const p = profileMap[d.user_id] || {};
      return {
        id: d.id,
        user_id: d.user_id,
        status: d.status as WriterStatus,
        links: Array.isArray(d.links) ? d.links : [],
        bio: d.bio || '',
        note: d.note || '',
        created_at: d.created_at,
        reviewed_at: d.reviewed_at,
        applicantName: p.full_name || p.username || 'Student Writer',
        applicantUsername: p.username ? (p.username.startsWith('@') ? p.username : `@${p.username}`) : undefined,
        applicantAvatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        applicantDepartment: p.department
      };
    });
  } catch (err) {
    console.warn('[fetchPendingWriterApplications error]:', err);
    return Object.values(getLocalWriters()).filter((a) => a.status === 'pending');
  }
}

/**
 * Approve or Reject a writer application (Admin only)
 */
export async function reviewWriterApplication(
  userId: string,
  newStatus: 'approved' | 'rejected'
): Promise<boolean> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('writers')
        .update({
          status: newStatus,
          reviewed_at: now
        })
        .eq('user_id', userId);

      if (error) {
        console.warn('[reviewWriterApplication Notice]:', error.message);
      }
    } catch (err) {
      console.warn('[reviewWriterApplication error]:', err);
    }
  }

  // Update local cache
  const local = getLocalWriters();
  if (local[userId]) {
    local[userId].status = newStatus;
    local[userId].reviewed_at = now;
    localStorage.setItem(LOCAL_WRITERS_KEY, JSON.stringify(local));
  } else {
    saveLocalWriter({
      user_id: userId,
      status: newStatus,
      links: [],
      bio: '',
      created_at: now,
      reviewed_at: now
    });
  }

  return true;
}

/**
 * Fetch approved writers directory for the Library
 */
export async function fetchApprovedWriters(): Promise<ApprovedWriterProfile[]> {
  if (!isSupabaseConfigured) {
    const approvedLocal = Object.values(getLocalWriters()).filter((a) => a.status === 'approved');
    return approvedLocal.map((a) => ({
      userId: a.user_id,
      name: a.applicantName || 'Campus Writer',
      username: a.applicantUsername,
      avatarUrl: a.applicantAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      bio: a.bio,
      department: a.applicantDepartment || 'Scholar',
      articlesCount: 1,
      isVerified: true
    }));
  }

  try {
    const { data: writersData, error: writersError } = await supabase
      .from('writers')
      .select('*')
      .eq('status', 'approved');

    if (writersError) {
      console.warn('[fetchApprovedWriters Notice]:', writersError.message);
      return [];
    }

    if (!writersData || writersData.length === 0) return [];

    const userIds = writersData.map((w) => w.user_id);

    // Fetch profiles and published articles count in parallel
    const [profilesRes, articlesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, department, university, is_verified')
        .in('id', userIds),
      supabase
        .from('articles')
        .select('author_id')
        .eq('status', 'published')
        .in('author_id', userIds)
    ]);

    const profileMap: Record<string, any> = {};
    if (profilesRes.data) {
      for (const p of profilesRes.data) {
        profileMap[p.id] = p;
      }
    }

    const countMap: Record<string, number> = {};
    if (articlesRes.data) {
      for (const a of articlesRes.data) {
        countMap[a.author_id] = (countMap[a.author_id] || 0) + 1;
      }
    }

    return writersData.map((w) => {
      const p = profileMap[w.user_id] || {};
      return {
        userId: w.user_id,
        name: p.full_name || p.username || 'Campus Writer',
        username: p.username ? (p.username.startsWith('@') ? p.username : `@${p.username}`) : undefined,
        avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
        bio: w.bio || 'Contributing student writer on CampusFoundry.',
        department: p.department || 'Undergraduate',
        university: p.university,
        articlesCount: countMap[w.user_id] || 0,
        isVerified: Boolean(p.is_verified)
      };
    });
  } catch (err) {
    console.warn('[fetchApprovedWriters error]:', err);
    return [];
  }
}

/**
 * Generate a random one-time verification code like CF-8K3Q2
 */
export function generateVerificationCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CF-${code}`;
}

/**
 * Fetch a user's writer verification request
 */
export async function fetchUserWriterVerification(userId: string): Promise<WriterVerification | null> {
  if (!userId) return null;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('writer_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        // Auto-check expiry
        let status = data.status as WriterVerificationStatus;
        if (status === 'pending' && new Date(data.expires_at).getTime() < Date.now()) {
          status = 'expired';
        }
        return {
          id: data.id,
          user_id: data.user_id,
          link: data.link,
          code: data.code,
          status,
          created_at: data.created_at,
          expires_at: data.expires_at,
          reviewed_at: data.reviewed_at
        };
      }
    } catch (err) {
      console.warn('[fetchUserWriterVerification Notice]:', err);
    }
  }

  const local = getLocalVerifications();
  const v = local[userId];
  if (v && v.status === 'pending' && new Date(v.expires_at).getTime() < Date.now()) {
    v.status = 'expired';
  }
  return v || null;
}

/**
 * Submit a new writer verification link and code
 */
export async function submitWriterVerification(
  userId: string,
  rawLink: string
): Promise<WriterVerification> {
  if (!userId) {
    throw new Error('Please sign in to verify your writer profile.');
  }

  const trimmed = rawLink ? rawLink.trim() : '';
  if (!trimmed) {
    throw new Error('Please enter a link to your writing space or portfolio.');
  }

  if (!isValidUrl(trimmed)) {
    throw new Error('Please enter a valid website link (e.g. medium.com/@username).');
  }

  const normalizedLink = normalizeUrl(trimmed);
  const normalizedKey = normalizedLink.toLowerCase().replace(/\/+$/, '');

  // Check if link is already verified by another account (Requirement 4)
  if (isSupabaseConfigured) {
    try {
      const { data: existing } = await supabase
        .from('writer_verifications')
        .select('id, user_id, link, status')
        .in('status', ['approved', 'pending']);

      if (existing && existing.length > 0) {
        const duplicate = existing.find((item) => {
          const itemKey = item.link.toLowerCase().replace(/\/+$/, '');
          return itemKey === normalizedKey && item.user_id !== userId;
        });

        if (duplicate) {
          throw new Error('This writing link is already associated with another student account. Please provide your own unique writing page link.');
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already associated')) {
        throw err;
      }
      console.warn('[submitWriterVerification Check Notice]:', err);
    }
  }

  // Local storage duplicate check fallback
  const localVerifications = getLocalVerifications();
  for (const [uid, item] of Object.entries(localVerifications)) {
    if (uid !== userId && (item.status === 'approved' || item.status === 'pending')) {
      const itemKey = item.link.toLowerCase().replace(/\/+$/, '');
      if (itemKey === normalizedKey) {
        throw new Error('This writing link is already associated with another student account. Please provide your own unique writing page link.');
      }
    }
  }

  const code = generateVerificationCode();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const record: WriterVerification = {
    user_id: userId,
    link: normalizedLink,
    code,
    status: 'pending',
    created_at: createdAt,
    expires_at: expiresAt
  };

  if (isSupabaseConfigured) {
    try {
      // Upsert/delete existing pending row for this user if any
      await supabase
        .from('writer_verifications')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'pending');

      const { data, error } = await supabase
        .from('writer_verifications')
        .insert({
          user_id: userId,
          link: normalizedLink,
          code,
          status: 'pending',
          created_at: createdAt,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (error) {
        console.warn('[submitWriterVerification Supabase Notice]:', error.message);
      } else if (data) {
        record.id = data.id;
      }
    } catch (err) {
      console.warn('[submitWriterVerification Exception]:', err);
    }
  }

  saveLocalVerification(record);
  return record;
}

/**
 * Fetch pending writer verifications for Admin review
 */
export async function fetchPendingWriterVerifications(): Promise<WriterVerification[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('writer_verifications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const userIds = data.map((d) => d.user_id);
        const authorsMap = await fetchAuthorsByIds(userIds);

        return data.map((d) => {
          const author = authorsMap[d.user_id];
          return {
            id: d.id,
            user_id: d.user_id,
            link: d.link,
            code: d.code,
            status: d.status as WriterVerificationStatus,
            created_at: d.created_at,
            expires_at: d.expires_at,
            applicantName: author?.name || 'Student Writer',
            applicantUsername: author?.username || `@student_${d.user_id.slice(0, 5)}`,
            applicantAvatarUrl: author?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
            applicantDepartment: author?.department || 'Undergraduate'
          };
        });
      }
    } catch (err) {
      console.warn('[fetchPendingWriterVerifications Notice]:', err);
    }
  }

  // Fallback to local
  const local = getLocalVerifications();
  return Object.values(local).filter((v) => v.status === 'pending');
}

/**
 * Review a writer verification (Approve / Reject)
 */
export async function reviewWriterVerification(
  userId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  const reviewedAt = new Date().toISOString();

  // Update writer_verifications
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('writer_verifications')
        .update({ status, reviewed_at: reviewedAt })
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (status === 'approved') {
        // Also update writers table or insert approved status
        const { data: existingApp } = await supabase
          .from('writers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (existingApp) {
          await supabase
            .from('writers')
            .update({ status: 'approved', reviewed_at: reviewedAt })
            .eq('user_id', userId);
        } else {
          await supabase.from('writers').insert({
            user_id: userId,
            status: 'approved',
            links: [],
            bio: 'Verified Student Writer',
            created_at: reviewedAt,
            reviewed_at: reviewedAt
          });
        }
      }
    } catch (err) {
      console.warn('[reviewWriterVerification Notice]:', err);
    }
  }

  // Update local storage
  const localVerifications = getLocalVerifications();
  if (localVerifications[userId]) {
    localVerifications[userId].status = status;
    localVerifications[userId].reviewed_at = reviewedAt;
    localStorage.setItem(LOCAL_VERIFICATIONS_KEY, JSON.stringify(localVerifications));
  }

  if (status === 'approved') {
    const localWriters = getLocalWriters();
    if (localWriters[userId]) {
      localWriters[userId].status = 'approved';
      localWriters[userId].reviewed_at = reviewedAt;
    } else {
      localWriters[userId] = {
        user_id: userId,
        status: 'approved',
        links: [],
        bio: 'Verified Student Writer',
        created_at: reviewedAt,
        reviewed_at: reviewedAt
      };
    }
    localStorage.setItem(LOCAL_WRITERS_KEY, JSON.stringify(localWriters));
  }
}

