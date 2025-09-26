const Database = require('better-sqlite3');

const db = new Database('./data/kyokwon119.db');

try {
  // users 테이블 구조 확인
  const schema = db.prepare("PRAGMA table_info(users)").all();
  console.log('Users 테이블 구조:');
  console.table(schema);

  // 기존 사용자 확인
  const users = db.prepare("SELECT * FROM users LIMIT 5").all();
  console.log('\n기존 사용자들:');
  console.table(users);

} catch (error) {
  console.error('에러:', error);
} finally {
  db.close();
}