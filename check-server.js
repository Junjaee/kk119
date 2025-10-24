const http = require('http');

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3009', (res) => {
      console.log('✅ Server is running on http://localhost:3009');
      resolve(true);
    });

    req.on('error', (err) => {
      console.error('❌ Server is not running on http://localhost:3009');
      console.log('Please start the development server with: npm run dev');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.error('❌ Server connection timeout');
      resolve(false);
    });
  });
}

checkServer().then(running => {
  if (!running) {
    console.log('\nTo start the server, run:');
    console.log('npm run dev');
    console.log('\nIf you want to use a specific port:');
    console.log('npm run dev -- -p 3009');
  }
  process.exit(running ? 0 : 1);
});