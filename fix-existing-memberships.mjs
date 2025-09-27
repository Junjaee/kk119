import { createMembershipApplications } from './lib/db/membership-sync.js';

console.log('🔄 Running membership sync for existing users...');

try {
  const result = createMembershipApplications();
  console.log('📊 Sync results:', result);
  console.log('✅ Membership sync completed successfully!');
} catch (error) {
  console.error('❌ Membership sync failed:', error);
}