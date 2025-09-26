const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(process.cwd(), 'data', 'kyokwon119.db');
const db = new Database(dbPath);

async function seedTestAccounts() {
  console.log('Seeding test accounts...');

  const testAccounts = [
    {
      email: 'teacher@kk119.com',
      password: 'Teacher2025!',
      name: '김교사',
      school: '서울초등학교',
      position: '교사',
      phone: '010-1234-5678',
      role: 'teacher'
    },
    {
      email: 'lawyer@kk119.com',
      password: 'Lawyer2025!',
      name: '박변호사',
      school: null,
      position: '변호사',
      phone: '010-2345-6789',
      role: 'lawyer'
    },
    {
      email: 'association@kk119.com',
      password: 'Assoc2025!',
      name: '이관리자',
      school: '한국교원단체총연합회',
      position: '협회관리자',
      phone: '010-3456-7890',
      role: 'admin'
    },
    {
      email: 'super@kk119.com',
      password: 'Super2025!',
      name: '최관리자',
      school: null,
      position: '슈퍼관리자',
      phone: '010-4567-8901',
      role: 'super_admin'
    }
  ];

  for (const account of testAccounts) {
    try {
      // Check if account already exists
      const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(account.email);

      if (existing) {
        console.log(`Account ${account.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(account.password, 10);

      // Insert user
      const stmt = db.prepare(`
        INSERT INTO users (email, password, name, school, position, phone, is_verified, is_admin)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `);

      const isAdmin = account.role === 'admin' || account.role === 'super_admin' ? 1 : 0;

      const result = stmt.run(
        account.email,
        hashedPassword,
        account.name,
        account.school,
        account.position,
        account.phone,
        isAdmin
      );

      console.log(`✅ Created ${account.role} account: ${account.email}`);

    } catch (error) {
      console.error(`❌ Failed to create ${account.email}:`, error.message);
    }
  }

  console.log('Test account seeding completed!');
}

seedTestAccounts()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    db.close();
    process.exit(1);
  });