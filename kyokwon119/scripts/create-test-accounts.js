const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, 'kyokwon119.db');
const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Test accounts data
const testAccounts = [
  {
    email: 'teacher@test.com',
    password: 'Teacher123!',
    name: '교사테스트',
    school: '테스트초등학교',
    position: '담임교사',
    phone: '010-1234-5678',
    is_admin: false
  },
  {
    email: 'lawyer@test.com', 
    password: 'Lawyer123!',
    name: '변호사테스트',
    school: null,
    position: '교육법 전문변호사',
    phone: '010-2345-6789',
    is_admin: false
  },
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: '관리자테스트',
    school: null,
    position: '시스템 관리자',
    phone: '010-3456-7890',
    is_admin: true
  },
  {
    email: 'teacher2@test.com',
    password: 'Teacher123!',
    name: '교사테스트2',
    school: '테스트중학교',
    position: '교과담당',
    phone: '010-4567-8901',
    is_admin: false
  },
  {
    email: 'principal@test.com',
    password: 'Principal123!',
    name: '교장테스트',
    school: '테스트고등학교',
    position: '교장',
    phone: '010-5678-9012',
    is_admin: false
  }
];

async function createTestAccounts() {
  console.log('🔧 테스트 계정 생성 중...\n');
  
  // Initialize users table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      school TEXT,
      position TEXT,
      phone TEXT,
      is_verified BOOLEAN DEFAULT 1,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO users (email, password, name, school, position, phone, is_verified, is_admin)
    VALUES (@email, @password, @name, @school, @position, @phone, 1, @is_admin)
  `);

  let successCount = 0;
  let errorCount = 0;

  for (const account of testAccounts) {
    try {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      const result = insertStmt.run({
        email: account.email,
        password: hashedPassword,
        name: account.name,
        school: account.school,
        position: account.position,
        phone: account.phone,
        is_admin: account.is_admin ? 1 : 0
      });

      console.log(`✅ ${account.email} - ${account.name} (${account.position})`);
      console.log(`   비밀번호: ${account.password}`);
      console.log(`   학교: ${account.school || '없음'}`);
      console.log('');
      
      successCount++;
    } catch (error) {
      console.error(`❌ ${account.email} 생성 실패:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 결과: 성공 ${successCount}개, 실패 ${errorCount}개`);
  
  if (successCount > 0) {
    console.log('\n🎯 로그인 테스트 정보:');
    console.log('─────────────────────────────────────');
    testAccounts.forEach(account => {
      console.log(`👤 ${account.name}:`);
      console.log(`   이메일: ${account.email}`);
      console.log(`   비밀번호: ${account.password}`);
      console.log(`   역할: ${account.is_admin ? '관리자' : '일반사용자'}`);
      console.log('');
    });
  }
  
  db.close();
}

// Run the script
createTestAccounts().catch(console.error);