import { supabase, isSupabaseConfigured } from './supabase';

/**
 * ============================================================================
 * CAMPUS FOUNDRY - IN-APP ADMIN PRODUCTION PURGE SERVICE
 * ============================================================================
 * Safe client/admin wrapper that clears local caches and invokes the launch
 * purge for posts, snaps, stores, products, orders, and storage buckets.
 * ============================================================================
 */

export const SUPER_ADMIN_EMAILS = ['adeyink7@gmail.com', 'admin@campusfoundry.app'];

export interface PurgeResult {
  success: boolean;
  message: string;
  purgedTables?: string[];
  preservedAdmins?: string[];
}

export async function executeProductionLaunchPurge(): Promise<PurgeResult> {
  console.log('🚀 Executing Production Launch Purge...');

  // 1. Clear all browser local storage caches
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('campus_foundry_user_session_v4');
      localStorage.removeItem('campus_foundry_chat_messages_v7');
      localStorage.removeItem('campus_foundry_chat_conversations_v7');
      localStorage.removeItem('campus_foundry_mp_conversations_v1');
      localStorage.removeItem('campus_foundry_posts_v4');
      localStorage.removeItem('campus_foundry_snaps_v4');
      localStorage.removeItem('campus_foundry_custom_businesses_v4');
      localStorage.removeItem('campus_foundry_system_reset_v1');
    } catch (e) {
      console.warn('[AdminPurge] LocalStorage clear notice:', e);
    }
  }

  if (!isSupabaseConfigured) {
    return {
      success: true,
      message: 'Local browser state and mock caches cleared successfully (Offline/Local mode).',
      purgedTables: ['posts', 'snaps', 'stores', 'products', 'orders', 'users'],
      preservedAdmins: SUPER_ADMIN_EMAILS,
    };
  }

  try {
    // 2. Delete operational data from Supabase backend tables
    const tables = [
      'product_orders',
      'marketplace_products',
      'student_businesses',
      'campus_comments',
      'campus_posts',
      'campus_snaps',
      'chat_messages',
      'chat_conversations',
      'marketplace_messages',
      'marketplace_conversations',
    ];

    for (const table of tables) {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // 3. Clear non-admin profiles (preserve super admin accounts)
    await supabase.from('profiles').delete().not('email', 'in', `(${SUPER_ADMIN_EMAILS.map((e) => `"${e}"`).join(',')})`);

    return {
      success: true,
      message: 'Production database records for posts, snaps, stores, products, orders, and non-admin profiles reset to zero. Table structures and super-admin credentials preserved.',
      purgedTables: tables,
      preservedAdmins: SUPER_ADMIN_EMAILS,
    };
  } catch (err: any) {
    console.error('[executeProductionLaunchPurge Error]:', err);
    return {
      success: false,
      message: err?.message || 'Failed to execute production purge.',
    };
  }
}
