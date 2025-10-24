const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'consult.db');
const db = new Database(dbPath);

console.log('=== 최근 상담 요청 데이터 ===');
const consults = db.prepare('SELECT * FROM consults ORDER BY created_at DESC LIMIT 10').all();
console.log(consults);

console.log('\n=== 상담 요청 개수 ===');
const count = db.prepare('SELECT COUNT(*) as count FROM consults').get();
console.log(`총 ${count.count}개의 상담 요청이 있습니다.`);

console.log('\n=== 사용자별 상담 요청 개수 ===');
const userCounts = db.prepare('SELECT user_id, COUNT(*) as count FROM consults GROUP BY user_id').all();
console.log(userCounts);

db.close();