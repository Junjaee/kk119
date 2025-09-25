const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'consult.db');
const db = new Database(dbPath);

// Mapping for type updates
const typeMapping = {
  'student': 'violence',  // 학생 -> 학생 폭력
  'parent': 'verbal',     // 학부모 -> 학부모 민원
};

// Update consults table report_type field
const updateStmt = db.prepare('UPDATE consults SET report_type = ? WHERE report_type = ?');

for (const [oldType, newType] of Object.entries(typeMapping)) {
  const result = updateStmt.run(newType, oldType);
  console.log(`Updated ${result.changes} records from '${oldType}' to '${newType}'`);
}

// Show current type distribution
const types = db.prepare('SELECT report_type, COUNT(*) as count FROM consults GROUP BY report_type').all();
console.log('\nCurrent type distribution:');
types.forEach(t => {
  const labels = {
    'verbal': '학부모 민원',
    'violence': '학생 폭력',
    'sexual': '욕설 및 폭언',
    'defamation': '명예훼손',
    'harassment': '성희롱',
    'threat': '협박',
    'other': '기타'
  };
  console.log(`  ${labels[t.report_type] || t.report_type}: ${t.count} cases`);
});

console.log('\nConsult types updated successfully!');
db.close();