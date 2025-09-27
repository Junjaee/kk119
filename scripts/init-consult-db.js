const path = require('path');

// Add the project root to the path for module resolution
require('ts-node/register');

// Import and initialize the consultation database
require('../lib/db/consult-db');

console.log('Consultation database initialized successfully!');