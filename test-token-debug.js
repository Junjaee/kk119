const jwt = require('jsonwebtoken');

// 브라우저 localStorage에서 가져온 토큰
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE2LCJlbWFpbCI6InRlYWNoZXJAa2sxMTkuY29tIiwibmFtZSI6IuKkuOq1kOyeoSIsInJvbGUiOiJ0ZWFjaGVyIiwiZGV2aWNlSWQiOiI3MzFhNGEyNzNmZjUzZTI3ODczZmFkZGVjZDZkMzk3ZCIsImlwQWRkcmVzcyI6IjEyNy4wLjAuMSIsInNlc3Npb25JZCI6IjViZGI0YWJkLWU2NjYtNDcwZi1hNzMzLTNhNjQwMDQwN2E3NCIsInRva2VuVHlwZSI6ImFjY2VzcyIsImp0aSI6InRva2VuXzZjNGNhOGNhLTc5MTItNGQzZC1hOThjLWYzN2M4ZjIyOTY0YSIsImlhdCI6MTczMDA4NTgyNywiZXhwIjoxNzMwMDg5NDI3fQ.wCZA6HJXYu8sI_f9HSf7FBL4GtAU6M6pLVo9PgCOFeA';

console.log('=== TOKEN DEBUG ===');

try {
  // Decode without verification first
  const decoded = jwt.decode(token);
  console.log('1. Decoded token payload:', decoded);

  // Check if token has correct structure
  console.log('2. Token structure check:');
  console.log('   - userId:', decoded.userId);
  console.log('   - email:', decoded.email);
  console.log('   - role:', decoded.role);
  console.log('   - issued at:', new Date(decoded.iat * 1000).toISOString());
  console.log('   - expires at:', new Date(decoded.exp * 1000).toISOString());

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  console.log('3. Token validity:');
  console.log('   - Current time:', now);
  console.log('   - Token exp:', decoded.exp);
  console.log('   - Is expired:', now > decoded.exp);

  // Try to verify with JWT secret (we'll need to check what secret is used)
  console.log('4. Token verification test - checking with common secrets...');

  const possibleSecrets = [
    'your-secret-key',
    'secret',
    'kyokwon119-secret',
    'default-secret',
    process.env.JWT_SECRET
  ];

  for (const secret of possibleSecrets) {
    if (!secret) continue;
    try {
      const verified = jwt.verify(token, secret);
      console.log(`   ✅ Token verified with secret: ${secret}`);
      console.log('   Verified payload:', verified);
      break;
    } catch (err) {
      console.log(`   ❌ Failed with secret: ${secret} - ${err.message}`);
    }
  }

} catch (error) {
  console.error('Token decode error:', error.message);
}