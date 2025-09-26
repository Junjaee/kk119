const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('./data/kyokwon119.db');

// 슈퍼어드민 계정 생성
const hashedPassword = bcrypt.hashSync('SuperAdmin123!', 10);

try {
  const insertUser = db.prepare(`
    INSERT INTO users (email, password, name, role, school, status, is_super_admin, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(email) DO UPDATE SET
      is_super_admin = 1,
      role = 'super_admin'
  `);

  insertUser.run('superadmin@test.com', hashedPassword, '슈퍼관리자', 'super_admin', null, 'approved', 1);

  console.log('✅ 슈퍼어드민 계정 생성/업데이트 완료:');
  console.log('이메일: superadmin@test.com');
  console.log('비밀번호: SuperAdmin123!');
  console.log('역할: super_admin');

  // 확인
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get('superadmin@test.com');
  console.log('생성된 계정:', user);

} catch (error) {
  console.error('에러:', error);
} finally {
  db.close();
}