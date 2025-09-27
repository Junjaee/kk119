const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'consult.db');
const db = new Database(dbPath);

try {
  // Add the claimed_at column
  db.exec('ALTER TABLE consults ADD COLUMN claimed_at DATETIME');
  console.log('✅ Successfully added claimed_at column to consults table');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('ℹ️ Column claimed_at already exists');
  } else {
    console.error('❌ Error adding column:', error.message);
  }
}

db.close();