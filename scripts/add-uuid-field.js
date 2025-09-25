const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'consult.db');
const db = new Database(dbPath);

// Add UUID column if it doesn't exist
try {
  db.exec('ALTER TABLE consults ADD COLUMN uuid TEXT');
  console.log('✅ UUID column added to consults table');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⚠️ UUID column already exists');
  } else {
    throw error;
  }
}

// Generate UUIDs for existing consults
const consults = db.prepare('SELECT id FROM consults WHERE uuid IS NULL').all();

const updateStmt = db.prepare('UPDATE consults SET uuid = ? WHERE id = ?');

consults.forEach(consult => {
  const uuid = crypto.randomUUID();
  updateStmt.run(uuid, consult.id);
  console.log(`Generated UUID for consult ${consult.id}: ${uuid}`);
});

console.log(`\n✅ Generated UUIDs for ${consults.length} consults`);

// Show sample data
const samples = db.prepare('SELECT id, title, uuid FROM consults LIMIT 3').all();
console.log('\n📋 Sample UUIDs:');
samples.forEach(s => {
  console.log(`  ID ${s.id}: ${s.uuid}`);
  console.log(`    Title: ${s.title}`);
});

db.close();