const fetch = require('node-fetch');

async function testConsultAPI() {
  try {
    console.log('=== Testing /api/consult GET endpoint ===');

    // Test without authentication first
    const response = await fetch('http://localhost:3014/api/consult');
    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.success && data.data?.consults) {
      console.log(`\n Found ${data.data.consults.length} consults in API response`);
      if (data.data.consults.length > 0) {
        console.log('First consult:', data.data.consults[0]);
      }
    }

  } catch (error) {
    console.error('API test error:', error);
  }
}

testConsultAPI();