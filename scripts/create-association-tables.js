const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '../data/kyokwon119.db');
  const db = new Database(dbPath);

  console.log('=== Starting Association Tables Creation ===\n');

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
    console.log('✅ associations table created successfully\n');

    // Step 2: Create admins table
    console.log('Step 2: Creating admins table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        association_id INTEGER NOT NULL,
        permissions TEXT, -- JSON 형태로 권한 저장
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE,
        UNIQUE(user_id, association_id) -- 한 사용자는 한 협회에 하나의 관리자 역할만 가능
      )
    `);
    console.log('✅ admins table created successfully\n');

    // Step 3: Create lawyers table
    console.log('Step 3: Creating lawyers table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS lawyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        license_number VARCHAR(50),
        specialties TEXT, -- JSON 배열 형태
        experience_years INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ lawyers table created successfully\n');

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
        UNIQUE(user_id, association_id) -- 한 사용자는 한 협회에 하나의 멤버십만 가능
      )
    `);
    console.log('✅ association_members table created successfully\n');

    // Step 5: Create board_categories table (for Task #3)
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
    console.log('✅ board_categories table created successfully\n');

    // Step 6: Create association_board_permissions table (for Task #3)
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
    console.log('✅ association_board_permissions table created successfully\n');

    // Step 7: Create indexes for performance
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
    console.log('✅ All indexes created successfully\n');

    // Step 8: Insert sample data
    console.log('Step 8: Inserting sample data...');

    // Sample associations
    const insertAssociation = db.prepare(`
      INSERT INTO associations (name, code, description, address, phone, email, website, established_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleAssociations = [
      ['서울교사협회', 'SEOUL001', '서울시 교사들을 위한 협회', '서울시 중구 세종대로 110', '02-1234-5678', 'info@seoul-teachers.kr', 'https://seoul-teachers.kr', '2020-01-15'],
      ['부산교사협회', 'BUSAN001', '부산시 교사들을 위한 협회', '부산시 해운대구 해운대로 264', '051-1234-5678', 'info@busan-teachers.kr', 'https://busan-teachers.kr', '2019-03-20'],
      ['경기교사협회', 'GYEONGGI001', '경기도 교사들을 위한 협회', '경기도 수원시 영통구 월드컵로 206', '031-1234-5678', 'info@gyeonggi-teachers.kr', 'https://gyeonggi-teachers.kr', '2018-05-10']
    ];

    sampleAssociations.forEach(association => {
      insertAssociation.run(...association);
    });
    console.log('✅ Sample associations inserted\n');

    // Sample board categories
    const insertBoardCategory = db.prepare(`
      INSERT INTO board_categories (name, description, is_association_restricted)
      VALUES (?, ?, ?)
    `);

    const sampleBoardCategories = [
      ['공지사항', '전체 공지사항', false],
      ['자유게시판', '자유로운 의견 교환', false],
      ['법률상담', '법률 관련 상담', false],
      ['자료실', '공용 자료 공유', false],
      ['협회 공지사항', '협회별 공지사항', true],
      ['협회 전용 게시판', '협회 회원 전용 게시판', true],
      ['협회 자료실', '협회별 자료 공유', true],
      ['내부 소통', '협회 내부 소통 게시판', true]
    ];

    sampleBoardCategories.forEach(category => {
      insertBoardCategory.run(...category);
    });
    console.log('✅ Sample board categories inserted\n');

    // Sample association board permissions (all associations can access all restricted boards by default)
    const insertBoardPermission = db.prepare(`
      INSERT INTO association_board_permissions (association_id, board_category_id, is_accessible)
      VALUES (?, ?, ?)
    `);

    // Get association IDs and restricted board category IDs
    const associations = db.prepare('SELECT id FROM associations').all();
    const restrictedCategories = db.prepare('SELECT id FROM board_categories WHERE is_association_restricted = 1').all();

    associations.forEach(assoc => {
      restrictedCategories.forEach(category => {
        insertBoardPermission.run(assoc.id, category.id, true);
      });
    });
    console.log('✅ Sample board permissions inserted\n');

    // Commit transaction
    db.exec('COMMIT');
    console.log('✅ All tables and sample data created successfully!\n');

    // Step 9: Show table information
    console.log('=== Database Schema Summary ===');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    console.log('Created tables:', tables.map(t => t.name).join(', '));
    console.log('');

    // Show sample data counts
    console.log('=== Data Summary ===');
    const dataSummary = [
      { table: 'associations', count: db.prepare('SELECT COUNT(*) as count FROM associations').get().count },
      { table: 'admins', count: db.prepare('SELECT COUNT(*) as count FROM admins').get().count },
      { table: 'lawyers', count: db.prepare('SELECT COUNT(*) as count FROM lawyers').get().count },
      { table: 'association_members', count: db.prepare('SELECT COUNT(*) as count FROM association_members').get().count },
      { table: 'board_categories', count: db.prepare('SELECT COUNT(*) as count FROM board_categories').get().count },
      { table: 'association_board_permissions', count: db.prepare('SELECT COUNT(*) as count FROM association_board_permissions').get().count }
    ];

    console.table(dataSummary);

    // Show associations sample
    console.log('\n=== Sample Associations ===');
    const sampleAssocs = db.prepare('SELECT id, name, code, status FROM associations').all();
    console.table(sampleAssocs);

    // Show board categories
    console.log('\n=== Board Categories ===');
    const boardCats = db.prepare('SELECT id, name, is_association_restricted FROM board_categories').all();
    console.table(boardCats);

  } catch (createError) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('❌ Table creation failed, rolled back:', createError.message);
    throw createError;
  }

  db.close();
  console.log('\n🎉 Association tables creation completed successfully!');

} catch (error) {
  console.error('❌ Database error:', error.message);
  process.exit(1);
}