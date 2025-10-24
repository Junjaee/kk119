const jwt = require('jsonwebtoken');

// Test JWT token creation and validation with the same secret used in the app
const JWT_SECRET = 'kyokwon119-secret-key-2024-change-this-in-production';

// Create a test token for user ID 1 (teacher)
const testPayload = {
  userId: 1,
  email: 'teacher@test.com',
  role: 'teacher',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
};

console.log('=== Creating Test JWT Token ===');
const testToken = jwt.sign(testPayload, JWT_SECRET, { algorithm: 'HS256' });
console.log('Test token created:', testToken.substring(0, 50) + '...');
console.log('Token length:', testToken.length);
console.log('Token parts:', testToken.split('.').length);

// Verify the token
console.log('\n=== Verifying Test Token ===');
try {
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('✅ Token verification successful:', decoded);
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}

// Now test with the API
console.log('\n=== Testing API with Token ===');

const testData = {
  title: 'API Test Report',
  report_type: 'verbal',
  incident_date: '2025-09-29T10:00:00',
  report_content: 'This is a test report to verify API functionality'
};

const testAPI = async () => {
  try {
    const fetch = require('node-fetch');

    const response = await fetch('http://localhost:3014/api/consult', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    const responseData = await response.text();
    console.log('Response data:', responseData);

  } catch (error) {
    console.error('API test error:', error);
  }
};

// Run the API test
if (require.main === module) {
  testAPI();
}

module.exports = { testToken, testPayload };