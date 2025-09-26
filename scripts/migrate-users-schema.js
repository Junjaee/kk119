const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '../data/kyokwon119.db');
  const db = new Database(dbPath);

  console.log('=== Starting Users Table Migration ===\n');

  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  try {
    // Step 1: Add role column with CHECK constraint
    console.log('Step 1: Adding role column...');
    db.exec(`
      ALTER TABLE users
      ADD COLUMN role TEXT
      CHECK(role IN ('super_admin', 'admin', 'lawyer', 'teacher'))
      DEFAULT 'teacher'
    `);
    console.log('✅ Role column added successfully\n');

    // Step 2: Add association_id column
    console.log('Step 2: Adding association_id column...');
    db.exec(`
      ALTER TABLE users
      ADD COLUMN association_id INTEGER
    `);
    console.log('✅ Association_id column added successfully\n');

    // Step 3: Migrate existing users based on their data
    console.log('Step 3: Migrating existing user roles...');

    // Update roles based on current data patterns
    const updates = [
      // Super admin - has 'admin' in position and 'superadmin' in email
      {
        sql: `UPDATE users SET role = 'super_admin' WHERE email LIKE '%superadmin%' OR position LIKE '%시스템관리자%'`,
        desc: 'Super admin users'
      },
      // Admin - has is_admin = 1 but not super admin
      {
        sql: `UPDATE users SET role = 'admin' WHERE is_admin = 1 AND role != 'super_admin'`,
        desc: 'Admin users'
      },
      // Lawyer - has 'lawyer' in email or '변호사' in position
      {
        sql: `UPDATE users SET role = 'lawyer' WHERE email LIKE '%lawyer%' OR position LIKE '%변호사%'`,
        desc: 'Lawyer users'
      },
      // Teacher - everyone else (default is already 'teacher')
      {
        sql: `UPDATE users SET role = 'teacher' WHERE role IS NULL OR role = 'teacher'`,
        desc: 'Teacher users (default)'
      }
    ];

    for (const update of updates) {
      const result = db.exec(update.sql);
      console.log(`✅ Updated ${update.desc}`);
    }

    // Step 4: Show migration results
    console.log('\nStep 4: Checking migration results...');
    const roleStats = db.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY role
    `).all();

    console.log('Role distribution after migration:');
    console.table(roleStats);

    // Step 5: Create indexes for performance
    console.log('\nStep 5: Creating indexes...');
    try {
      db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
      db.exec('CREATE INDEX IF NOT EXISTS idx_users_association_id ON users(association_id)');
      console.log('✅ Indexes created successfully\n');
    } catch (indexError) {
      console.log('⚠️ Index creation warning:', indexError.message);
    }

    // Commit transaction
    db.exec('COMMIT');
    console.log('✅ Migration completed successfully!\n');

    // Show final schema
    console.log('=== Updated Users Table Schema ===');
    const finalSchema = db.prepare("PRAGMA table_info(users)").all();
    console.table(finalSchema);

    // Show sample data
    console.log('\n=== Sample Migrated Users ===');
    const sampleUsers = db.prepare(`
      SELECT id, email, name, role, association_id, is_admin
      FROM users
      ORDER BY id
      LIMIT 10
    `).all();
    console.table(sampleUsers);

  } catch (migrationError) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('❌ Migration failed, rolled back:', migrationError.message);
    throw migrationError;
  }

  db.close();
  console.log('\n🎉 Database migration completed successfully!');

} catch (error) {
  console.error('❌ Database migration error:', error.message);
  process.exit(1);
}