// Test admin synchronization
const { getAllAdminUsers, syncAllAdminUsers } = require('./lib/db/admin-sync.ts');

console.log('🔍 Testing admin synchronization...');

try {
  // Check current state
  console.log('\n📊 Current admin users state:');
  const adminUsers = getAllAdminUsers();

  console.log(`Total admin users: ${adminUsers.length}`);

  adminUsers.forEach(user => {
    console.log(`- ${user.email} (${user.role}): ${user.admin_record ? '✅ Has admin record' : '❌ Missing admin record'}`);
  });

  // Run sync
  console.log('\n🔧 Running admin synchronization...');
  const result = syncAllAdminUsers();

  console.log('\n📈 Sync results:');
  console.log(`- Total processed: ${result.total}`);
  console.log(`- Newly synced: ${result.synced}`);
  console.log(`- Already synced: ${result.skipped}`);
  console.log(`- Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => {
      console.log(`- ${error.email}: ${error.error}`);
    });
  }

  console.log('\n✅ Admin synchronization test completed!');

} catch (error) {
  console.error('❌ Test failed:', error);
}