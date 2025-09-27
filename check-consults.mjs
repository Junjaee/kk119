import Database from 'better-sqlite3';
import path from 'path';

// Connect to consult database
const dbPath = path.join(process.cwd(), 'data', 'consult.db');
const db = new Database(dbPath);

try {
  console.log('🔍 Checking consults in database...');

  // Check all consults
  const consults = db.prepare('SELECT * FROM consults ORDER BY id').all();

  console.log(`📊 Found ${consults.length} consults:`);
  consults.forEach(consult => {
    console.log(`  ID: ${consult.id}, Title: ${consult.title}, Status: ${consult.status}, Lawyer ID: ${consult.lawyer_id}`);
  });

  // Check specific consult ID 4
  const consult4 = db.prepare('SELECT * FROM consults WHERE id = ?').get(4);
  console.log('\n🎯 Consult ID 4:', consult4 || 'NOT FOUND');

  // Check lawyers
  const lawyers = db.prepare('SELECT * FROM lawyers').all();
  console.log(`\n👨‍💼 Found ${lawyers.length} lawyers:`);
  lawyers.forEach(lawyer => {
    console.log(`  ID: ${lawyer.id}, Name: ${lawyer.name}, User ID: ${lawyer.user_id}`);
  });

  db.close();
} catch (error) {
  console.error('❌ Database error:', error);
}