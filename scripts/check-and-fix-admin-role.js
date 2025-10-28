/**
 * Check and fix admin roles in Supabase
 * This script verifies if the migration ran successfully and fixes it if needed
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixAdminRoles() {
  console.log('🔍 Checking admin roles in Supabase...\n');

  // Check for super_admin users
  const { data: superAdmins, error: superError } = await supabase
    .from('users')
    .select('id, email, name, role')
    .eq('role', 'super_admin');

  if (superError) {
    console.error('❌ Error checking super_admin users:', superError);
    return;
  }

  console.log(`📊 Found ${superAdmins.length} super_admin users`);

  if (superAdmins.length > 0) {
    console.log('\n🔧 Updating super_admin → admin...\n');

    for (const user of superAdmins) {
      console.log(`   - Updating ${user.email} (ID: ${user.id})`);

      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (updateError) {
        console.error(`   ❌ Failed to update ${user.email}:`, updateError);
      } else {
        console.log(`   ✅ Updated ${user.email}`);
      }
    }
  }

  // Verify final state
  console.log('\n🔍 Verifying final state...\n');

  const { data: stillSuper, error: checkError } = await supabase
    .from('users')
    .select('count')
    .eq('role', 'super_admin');

  const { data: admins, error: adminError } = await supabase
    .from('users')
    .select('count')
    .eq('role', 'admin');

  if (!checkError && !adminError) {
    const superCount = stillSuper?.[0]?.count || 0;
    const adminCount = admins?.[0]?.count || 0;

    console.log(`✅ Migration complete!`);
    console.log(`   - super_admin users: ${superCount} (should be 0)`);
    console.log(`   - admin users: ${adminCount}`);

    if (superCount > 0) {
      console.log('\n⚠️  Warning: Still have super_admin users!');
    }
  }
}

checkAndFixAdminRoles()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
