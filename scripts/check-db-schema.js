const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, '../data/kyokwon119.db');
  const db = new Database(dbPath);

  console.log('=== Current Database Schema ===\n');

  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));
  console.log('');

  // Get users table schema
  console.log('=== Users Table Schema ===');
  const usersSchema = db.prepare("PRAGMA table_info(users)").all();
  if (usersSchema.length > 0) {
    console.table(usersSchema);
  } else {
    console.log('Users table not found');
  }

  // Check current data
  console.log('\n=== Sample Users Data ===');
  try {
    const users = db.prepare("SELECT * FROM users LIMIT 5").all();
    if (users.length > 0) {
      console.table(users);
    } else {
      console.log('No users found');
    }
  } catch (error) {
    console.log('Error querying users:', error.message);
  }

  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}