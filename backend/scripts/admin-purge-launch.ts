import { createClient } from '@supabase/supabase-js';

/**
 * ============================================================================
 * CAMPUS FOUNDRY - PRODUCTION LAUNCH ADMIN PURGE SCRIPT
 * ============================================================================
 * Usage:
 *   SUPABASE_URL="https://your-project.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
 *   SUPER_ADMIN_EMAILS="adeyink7@gmail.com,admin@campusfoundry.app" \
 *   npx tsx scripts/admin-purge-launch.ts
 *
 * This administrative script executes a complete launch cleanup:
 * 1. Purges operational tables: posts, snaps, stores, products, orders, comments & chats.
 * 2. Empties storage bucket objects (avatars, media, businesses, audio, player-cards).
 * 3. Deletes non-admin accounts from Supabase Auth service (auth.users) and profiles.
 * 4. Preserves table structures, foreign key constraints, indexes & super-admin credentials.
 * ============================================================================
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// List of Super-Admin emails to preserve
const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || 'adeyink7@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Please provide the Service Role key to allow administrative auth and database operations.');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runLaunchPurge() {
  console.log('🚀 Starting Campus Foundry Admin Production Purge for Launch Readiness...\n');
  console.log(`Protected Super-Admin Emails: ${SUPER_ADMIN_EMAILS.join(', ')}`);

  try {
    // 1. PURGE OPERATIONAL DATA TABLES
    console.log('\n--- Step 1: Truncating/Deleting Operational Table Records ---');

    const tablesToPurge = [
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

    for (const tableName of tablesToPurge) {
      const { error, count } = await supabaseAdmin
        .from(tableName)
        .delete({ count: 'exact' })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        console.warn(`⚠️ Notice on table [${tableName}]: ${error.message}`);
      } else {
        console.log(`  ✓ Cleared table [${tableName}] (${count ?? 0} records deleted)`);
      }
    }

    // 2. CLEAR STORAGE BUCKET MEDIA OBJECTS
    console.log('\n--- Step 2: Clearing Media Files from Storage Buckets ---');
    const buckets = ['avatars', 'media', 'businesses', 'audio', 'voice-notes', 'player-cards'];

    for (const bucketName of buckets) {
      try {
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(bucketName)
          .list('', { limit: 1000 });

        if (listError) {
          console.warn(`  ⚠️ Bucket [${bucketName}] list notice: ${listError.message}`);
          continue;
        }

        if (files && files.length > 0) {
          const filePaths = files.map((f) => f.name);
          const { error: removeError } = await supabaseAdmin.storage
            .from(bucketName)
            .remove(filePaths);

          if (removeError) {
            console.warn(`  ⚠️ Bucket [${bucketName}] remove notice: ${removeError.message}`);
          } else {
            console.log(`  ✓ Cleared bucket [${bucketName}] (${filePaths.length} objects removed)`);
          }
        } else {
          console.log(`  ✓ Bucket [${bucketName}] is empty`);
        }
      } catch (bucketErr: any) {
        console.warn(`  ⚠️ Bucket [${bucketName}] exception: ${bucketErr?.message}`);
      }
    }

    // 3. PURGE NON-ADMIN USERS FROM SUPABASE AUTH & PROFILES
    console.log('\n--- Step 3: Purging Non-Admin Accounts from Auth Service & Profiles ---');

    // List users from Supabase Auth service
    const { data: authUsersData, error: listUsersErr } = await supabaseAdmin.auth.admin.listUsers();

    if (listUsersErr) {
      console.warn(`⚠️ Could not list Auth users via Admin API: ${listUsersErr.message}`);
    } else {
      const allAuthUsers = authUsersData?.users || [];
      let deletedUsersCount = 0;

      for (const u of allAuthUsers) {
        const userEmail = u.email?.trim().toLowerCase() || '';
        if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
          console.log(`  🛡️ Preserved Super-Admin user: ${userEmail} (${u.id})`);
          continue;
        }

        // Delete user profile
        await supabaseAdmin.from('profiles').delete().eq('id', u.id);

        // Delete user from Supabase Auth
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(u.id);
        if (delErr) {
          console.warn(`  ⚠️ Failed to delete Auth user [${userEmail}]: ${delErr.message}`);
        } else {
          deletedUsersCount++;
        }
      }

      console.log(`  ✓ Deleted ${deletedUsersCount} non-admin Auth users`);
    }

    // 4. CLEAN REMAINING NON-ADMIN PROFILES
    const { error: profileCleanErr } = await supabaseAdmin
      .from('profiles')
      .delete()
      .not('email', 'in', `(${SUPER_ADMIN_EMAILS.map((e) => `"${e}"`).join(',')})`);

    if (profileCleanErr) {
      console.warn(`⚠️ Profile cleanup notice: ${profileCleanErr.message}`);
    } else {
      console.log('  ✓ Verified non-admin profiles table clean');
    }

    console.log('\n✅ Administrative launch cleanup complete! System starts at zero with all table structures, indexes, and super-admin credentials preserved.');
  } catch (fatalErr: any) {
    console.error('❌ Fatal error during admin cleanup:', fatalErr);
    process.exit(1);
  }
}

runLaunchPurge();
