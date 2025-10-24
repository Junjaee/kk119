const http = require('http');

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve({ port, status: 'running', statusCode: res.statusCode });
    });

    req.on('error', (err) => {
      resolve({ port, status: 'not running', error: err.code });
    });

    req.setTimeout(3000, () => {
      resolve({ port, status: 'timeout' });
    });
  });
}

async function checkAllPorts() {
  const ports = [3000, 3001, 3002, 3003, 3009];
  console.log('🔍 Checking for running development servers...\n');

  const results = await Promise.all(ports.map(checkPort));

  results.forEach(result => {
    if (result.status === 'running') {
      console.log(`✅ Port ${result.port}: Server running (HTTP ${result.statusCode})`);
    } else {
      console.log(`❌ Port ${result.port}: ${result.status}`);
    }
  });

  const runningServers = results.filter(r => r.status === 'running');

  if (runningServers.length > 0) {
    console.log(`\n🎯 Found ${runningServers.length} running server(s).`);
    console.log('You can run the auth test now.');
  } else {
    console.log('\n⚠️  No servers found. Please start the development server with:');
    console.log('npm run dev');
    console.log('or');
    console.log('npm run dev -- -p 3009');
  }
}

checkAllPorts();