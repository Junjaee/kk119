const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize database connection
const dbPath = path.join(__dirname, '..', 'data', 'kyokwon119.db');
const db = new Database(dbPath);

try {
  // Get lawyer user
  const lawyer = db.prepare("SELECT id, email, name, role, password FROM users WHERE email = 'lawyer@kk119.com'").get();

  if (lawyer) {
    console.log('Testing passwords for lawyer user:', lawyer.email);

    // Test passwords
    const testPasswords = ['Lawyer2025!', 'lawyer123', 'password', 'lawyer2025!', 'Test123!'];

    for (const testPassword of testPasswords) {
      const isMatch = bcrypt.compareSync(testPassword, lawyer.password);
      console.log(`  Password "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
      if (isMatch) {
        console.log(`\n🎉 Found working password: ${testPassword}`);
        break;
      }
    }

    // Reset password to Lawyer2025!
    console.log('\n🔧 Resetting password to: Lawyer2025!');
    const newPassword = bcrypt.hashSync('Lawyer2025!', 10);
    const updateStmt = db.prepare("UPDATE users SET password = ? WHERE email = 'lawyer@kk119.com'");
    updateStmt.run(newPassword);
    console.log('✅ Password updated successfully');

  } else {
    console.log('❌ Lawyer user not found');
  }
} catch (error) {
  console.error('Error:', error.message);
}

db.close();