import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');
const db = new Database(dbPath);

try {
  console.log('🔧 Fixing admins table to allow NULL association_id...');

  // First, let's backup the existing data
  console.log('📋 Backing up existing admins data...');
  const existingAdmins = db.prepare("SELECT * FROM admins").all();
  console.log(`Found ${existingAdmins.length} existing admin records`);

  // Drop the existing table and recreate with correct schema
  console.log('🗑️ Dropping existing admins table...');
  db.prepare("DROP TABLE IF EXISTS admins_backup").run();
  db.prepare("CREATE TABLE admins_backup AS SELECT * FROM admins").run();
  db.prepare("DROP TABLE admins").run();

  // Create new admins table with association_id allowing NULL
  console.log('🏗️ Creating new admins table with NULL-allowed association_id...');
  db.prepare(`
    CREATE TABLE admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      association_id INTEGER, -- Removed NOT NULL constraint
      permissions TEXT DEFAULT '{"can_approve_members":true,"can_manage_boards":true,"can_view_reports":true}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (association_id) REFERENCES associations(id)
    )
  `).run();

  // Restore the backed up data
  console.log('📥 Restoring existing admin records...');
  const insertStmt = db.prepare(`
    INSERT INTO admins (id, user_id, association_id, permissions, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  existingAdmins.forEach(admin => {
    insertStmt.run(admin.id, admin.user_id, admin.association_id, admin.permissions, admin.created_at);
    console.log(`✅ Restored admin record for user ${admin.user_id}`);
  });

  // Verify the new schema
  console.log('\n📋 New admins table schema:');
  const schema = db.prepare("PRAGMA table_info(admins)").all();
  schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });

  console.log('\n✅ Admins table schema fix completed!');

} catch (error) {
  console.error('❌ Error fixing admins table:', error);
} finally {
  db.close();
}