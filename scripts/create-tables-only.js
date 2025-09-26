const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '../data/kyokwon119.db');
  const db = new Database(dbPath);

  console.log('=== Creating Association Tables Only ===\n');

  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  try {
    // Step 1: Create associations table
    console.log('Step 1: Creating associations table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS associations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        website VARCHAR(255),
        established_date DATE,
        status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ associations table created successfully');

    // Step 2: Create admins table
    console.log('Step 2: Creating admins table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        association_id INTEGER NOT NULL,
        permissions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE,
        UNIQUE(user_id, association_id)
      )
    `);
    console.log('✅ admins table created successfully');

    // Step 3: Create lawyers table
    console.log('Step 3: Creating lawyers table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS lawyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        license_number VARCHAR(50),
        specialties TEXT,
        experience_years INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ lawyers table created successfully');

    // Step 4: Create association_members table
    console.log('Step 4: Creating association_members table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS association_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        association_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
        approved_by INTEGER NULL,
        approved_at DATETIME NULL,
        rejection_reason TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(user_id, association_id)
      )
    `);
    console.log('✅ association_members table created successfully');

    // Step 5: Create board_categories table
    console.log('Step 5: Creating board_categories table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS board_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_association_restricted BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ board_categories table created successfully');

    // Step 6: Create association_board_permissions table
    console.log('Step 6: Creating association_board_permissions table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS association_board_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        association_id INTEGER NOT NULL,
        board_category_id INTEGER NOT NULL,
        is_accessible BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE,
        FOREIGN KEY (board_category_id) REFERENCES board_categories(id) ON DELETE CASCADE,
        UNIQUE(association_id, board_category_id)
      )
    `);
    console.log('✅ association_board_permissions table created successfully');

    // Step 7: Create indexes
    console.log('Step 7: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_associations_code ON associations(code)',
      'CREATE INDEX IF NOT EXISTS idx_associations_status ON associations(status)',
      'CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_admins_association_id ON admins(association_id)',
      'CREATE INDEX IF NOT EXISTS idx_lawyers_user_id ON lawyers(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_lawyers_license_number ON lawyers(license_number)',
      'CREATE INDEX IF NOT EXISTS idx_association_members_user_id ON association_members(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_association_members_association_id ON association_members(association_id)',
      'CREATE INDEX IF NOT EXISTS idx_association_members_status ON association_members(status)',
      'CREATE INDEX IF NOT EXISTS idx_board_categories_restricted ON board_categories(is_association_restricted)',
      'CREATE INDEX IF NOT EXISTS idx_board_permissions_association ON association_board_permissions(association_id)',
      'CREATE INDEX IF NOT EXISTS idx_board_permissions_category ON association_board_permissions(board_category_id)'
    ];

    indexes.forEach((indexSQL, i) => {
      db.exec(indexSQL);
      console.log(`  ✅ Index ${i + 1}/${indexes.length} created`);
    });

    // Commit transaction
    db.exec('COMMIT');
    console.log('✅ All tables created successfully!\n');

    // Show created tables
    console.log('=== Created Tables ===');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    console.log('All tables:', tables.map(t => t.name).join(', '));

    // Show table schemas
    console.log('\n=== Table Schemas ===');

    const newTables = ['associations', 'admins', 'lawyers', 'association_members', 'board_categories', 'association_board_permissions'];

    newTables.forEach(tableName => {
      console.log(`\n--- ${tableName} table ---`);
      try {
        const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
        console.table(schema);
      } catch (error) {
        console.log(`Error checking ${tableName}:`, error.message);
      }
    });

  } catch (createError) {
    db.exec('ROLLBACK');
    console.error('❌ Table creation failed, rolled back:', createError.message);
    throw createError;
  }

  db.close();
  console.log('\n🎉 Table creation completed successfully!');

} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}