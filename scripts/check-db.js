const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'kyokwon119.db');
const db = new Database(dbPath);

try {
  // Get table schema
  const schema = db.prepare("PRAGMA table_info(users)").all();
  console.log('Users table schema:');
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });

  // Get some sample users
  const users = db.prepare("SELECT id, email, name FROM users LIMIT 5").all();
  console.log('\nSample users:');
  users.forEach(user => {
    console.log(`  ${user.id}: ${user.email} - ${user.name}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}

db.close();