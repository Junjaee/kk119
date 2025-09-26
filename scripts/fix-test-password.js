const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(process.cwd(), 'data', 'kyokwon119.db');
const db = new Database(dbPath);

async function fixTestPassword() {
  console.log('Fixing test account password...');

  const email = 'teacher@kk119.com';
  const newPassword = 'Teacher2025!';

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('New hash generated, length:', hashedPassword.length);

    // Update the password
    const stmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
    const result = stmt.run(hashedPassword, email);

    if (result.changes > 0) {
      console.log('✅ Password updated successfully for:', email);

      // Verify the update by trying to compare
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      const isValid = await bcrypt.compare(newPassword, user.password);
      console.log('✅ Password verification test:', isValid ? 'PASS' : 'FAIL');
    } else {
      console.log('❌ No user found with email:', email);
    }

  } catch (error) {
    console.error('❌ Failed to update password:', error.message);
  }

  console.log('Password fix completed!');
}

fixTestPassword()
  .then(() => {
    db.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Password fix failed:', error);
    db.close();
    process.exit(1);
  });