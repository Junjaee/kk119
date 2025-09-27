import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');
const db = new Database(dbPath);

try {
  console.log('📋 admins table schema:');
  const schema = db.prepare("PRAGMA table_info(admins)").all();
  schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });

  console.log('\n📊 Current admins table content:');
  const admins = db.prepare("SELECT * FROM admins").all();
  console.log(`Total records: ${admins.length}`);
  admins.forEach(admin => {
    console.log(`- ID: ${admin.id}, User: ${admin.user_id}, Association: ${admin.association_id}`);
  });
} finally {
  db.close();
}