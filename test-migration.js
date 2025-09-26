#!/usr/bin/env node

// Migration System Test Script
// Tests the localStorage to Supabase migration functionality

const { database } = require('./lib/services/database.ts');
const { migrationService } = require('./lib/services/migration.ts');
const { localDB } = require('./lib/services/localDB.ts');

async function testMigrationSystem() {
  console.log('🧪 Testing Migration System...\n');

  try {
    // 1. Test database mode switching
    console.log('1. Testing database mode switching...');
    const initialMode = database.getCurrentMode();
    console.log(`   Initial mode: ${initialMode}`);

    // 2. Test connection to both databases
    console.log('\n2. Testing database connections...');
    const connections = await database.testConnection();
    console.log(`   localStorage: ${connections.localStorage ? '✅' : '❌'}`);
    console.log(`   Supabase: ${connections.supabase ? '✅' : '❌'}`);

    // 3. Test localStorage data presence
    console.log('\n3. Checking localStorage data...');
    const reports = localDB.getAllReports();
    const posts = localDB.getAllPosts();
    const comments = localDB.getAllComments();

    console.log(`   Reports: ${reports.length} items`);
    console.log(`   Posts: ${posts.length} items`);
    console.log(`   Comments: ${comments.length} items`);

    // 4. Test sample data creation if no data exists
    if (reports.length === 0 && posts.length === 0) {
      console.log('\n4. Creating sample data for testing...');
      localDB.initWithSampleData();

      const newReports = localDB.getAllReports();
      const newPosts = localDB.getAllPosts();
      console.log(`   Created ${newReports.length} reports and ${newPosts.length} posts`);
    }

    // 5. Test migration readiness check
    console.log('\n5. Testing migration readiness...');
    const dummyUserId = 'test-user-123';
    const readiness = await migrationService.checkMigrationReadiness(dummyUserId);

    console.log(`   Can migrate: ${readiness.canMigrate ? '✅' : '❌'}`);
    if (!readiness.canMigrate) {
      console.log(`   Reason: ${readiness.reason}`);
    }
    console.log(`   Local data count:`, readiness.localDataCount);

    // 6. Test unified database service
    console.log('\n6. Testing unified database service...');

    // Force localStorage mode for testing
    database.setMode('localStorage');
    const localReports = await database.getAllReports();
    console.log(`   localStorage mode: ${localReports.length} reports`);

    // Test auto mode
    database.setMode('auto');
    const autoReports = await database.getAllReports();
    console.log(`   Auto mode: ${autoReports.length} reports`);

    console.log('\n✅ Migration system test completed successfully!');

    return {
      success: true,
      details: {
        mode: initialMode,
        connections,
        dataCount: {
          reports: reports.length,
          posts: posts.length,
          comments: comments.length
        },
        canMigrate: readiness.canMigrate
      }
    };

  } catch (error) {
    console.error('\n❌ Migration system test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run test if called directly
if (require.main === module) {
  testMigrationSystem()
    .then(result => {
      console.log('\n📊 Test Results:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = { testMigrationSystem };