const Database = require('better-sqlite3');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'kyokwon119.db');
const db = new Database(dbPath);

try {
  // Get lawyer user
  const lawyer = db.prepare("SELECT id, email, name, role, password FROM users WHERE email = 'lawyer@kk119.com'").get();
  if (lawyer) {
    console.log('Lawyer user found:');
    console.log(`  ID: ${lawyer.id}`);
    console.log(`  Email: ${lawyer.email}`);
    console.log(`  Name: ${lawyer.name}`);
    console.log(`  Role: ${lawyer.role}`);
    console.log(`  Password hash: ${lawyer.password.substring(0, 20)}...`);
  } else {
    console.log('❌ Lawyer user not found');
  }

  // Get all users with lawyer role
  const lawyers = db.prepare("SELECT id, email, name, role FROM users WHERE role = 'lawyer'").all();
  console.log('\nAll users with lawyer role:');
  lawyers.forEach(user => {
    console.log(`  ${user.id}: ${user.email} - ${user.name}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}

db.close();