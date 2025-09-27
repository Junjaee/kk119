import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');
const db = new Database(dbPath);

try {
  console.log('📋 All users with admin roles:');
  const adminUsers = db.prepare(`
    SELECT id, email, name, role, association_id, is_admin
    FROM users
    WHERE role IN ('admin', 'super_admin') OR is_admin = 1
    ORDER BY role, id
  `).all();

  console.log(`Total admin users: ${adminUsers.length}`);
  adminUsers.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Association: ${user.association_id}, IsAdmin: ${user.is_admin}`);
  });

  console.log('\n📊 Existing admins table records:');
  const admins = db.prepare("SELECT * FROM admins").all();
  console.log(`Total admin records: ${admins.length}`);
  admins.forEach(admin => {
    console.log(`- Admin ID: ${admin.id}, User ID: ${admin.user_id}, Association: ${admin.association_id}`);
  });

} finally {
  db.close();
}