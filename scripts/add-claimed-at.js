const Database = require('better-sqlite3');
const path = require('path');

// 데이터베이스 연결
const dbPath = path.join(__dirname, '..', 'data', 'consult.db');
const db = new Database(dbPath);

try {
  // claimed_at 컬럼이 이미 있는지 확인
  const tableInfo = db.pragma('table_info(consults)');
  const hasClaimedAt = tableInfo.some(col => col.name === 'claimed_at');

  if (!hasClaimedAt) {
    // claimed_at 컬럼 추가
    db.exec('ALTER TABLE consults ADD COLUMN claimed_at DATETIME');
    console.log('✅ claimed_at 컬럼이 성공적으로 추가되었습니다.');
  } else {
    console.log('ℹ️ claimed_at 컬럼이 이미 존재합니다.');
  }

  // 컬럼 확인
  const updatedTableInfo = db.pragma('table_info(consults)');
  console.log('\n현재 consults 테이블 구조:');
  updatedTableInfo.forEach(col => {
    if (col.name === 'claimed_at') {
      console.log(`  ✓ ${col.name}: ${col.type}`);
    }
  });

} catch (error) {
  console.error('❌ 오류 발생:', error.message);
} finally {
  db.close();
}