// Test admin synchronization
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// Simplified version of admin sync functions
function getAllAdminUsers() {
  const db = new Database(dbPath);
  try {
    const users = db.prepare(`
      SELECT
        u.id as user_id,
        u.email,
        u.name,
        u.role,
        u.association_id,
        a.id as admin_id
      FROM users u
      LEFT JOIN admins a ON u.id = a.user_id
      WHERE u.role IN ('admin', 'super_admin')
      ORDER BY u.id
    `).all();

    return users.map(row => ({
      user_id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role,
      association_id: row.association_id,
      has_admin_record: !!row.admin_id
    }));
  } finally {
    db.close();
  }
}

function createAdminRecord(userId, associationId) {
  const db = new Database(dbPath);
  try {
    const permissions = {
      can_approve_members: true,
      can_manage_boards: true,
      can_view_reports: true
    };

    const result = db.prepare(`
      INSERT INTO admins (user_id, association_id, permissions, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(userId, associationId, JSON.stringify(permissions));

    return result.lastInsertRowid;
  } finally {
    db.close();
  }
}

console.log('🔍 Testing admin synchronization...');

try {
  // Check current state
  console.log('\n📊 Current admin users state:');
  const adminUsers = getAllAdminUsers();

  console.log(`Total admin users: ${adminUsers.length}`);

  let needSync = 0;
  adminUsers.forEach(user => {
    const status = user.has_admin_record ? '✅ Has admin record' : '❌ Missing admin record';
    console.log(`- ${user.email} (${user.role}): ${status}`);
    if (!user.has_admin_record) needSync++;
  });

  if (needSync > 0) {
    console.log(`\n🔧 Found ${needSync} users needing sync. Creating admin records...`);

    adminUsers.forEach(user => {
      if (!user.has_admin_record) {
        try {
          const adminId = createAdminRecord(user.user_id, user.association_id);
          console.log(`✅ Created admin record ${adminId} for ${user.email}`);
        } catch (error) {
          console.log(`❌ Failed to create admin record for ${user.email}: ${error.message}`);
        }
      }
    });
  } else {
    console.log('\n✅ All admin users already have admin records!');
  }

  console.log('\n✅ Admin synchronization test completed!');

} catch (error) {
  console.error('❌ Test failed:', error);
}