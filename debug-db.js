const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'kyokwon119.db');
const db = new Database(dbPath);

console.log('=== DATABASE DEBUG ===');

// Check specific users
console.log('\n1. User ID 16 (teacher@kk119.com):');
const user16 = db.prepare('SELECT * FROM users WHERE id = ?').get(16);
console.log(user16);

console.log('\n2. User ID 27 (association@kk119.com):');
const user27 = db.prepare('SELECT * FROM users WHERE id = ?').get(27);
console.log(user27);

console.log('\n3. All users with teacher/association emails:');
const teacherUsers = db.prepare(`
  SELECT id, email, name, role
  FROM users
  WHERE email IN ('teacher@kk119.com', 'association@kk119.com')
  ORDER BY id
`).all();
console.log(teacherUsers);

console.log('\n4. Check if there are multiple teacher entries:');
const allTeachers = db.prepare(`
  SELECT id, email, name, role
  FROM users
  WHERE email LIKE '%teacher%' OR role = 'teacher'
  ORDER BY id
`).all();
console.log(allTeachers);

db.close();