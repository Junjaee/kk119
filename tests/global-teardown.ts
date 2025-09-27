import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global test teardown started...');

  try {
    // Clean up authentication state files
    const authFiles = [
      './tests/fixtures/auth-association.json',
      './tests/fixtures/auth-teacher.json'
    ];

    for (const authFile of authFiles) {
      if (fs.existsSync(authFile)) {
        fs.unlinkSync(authFile);
        console.log(`🗑️ Cleaned up ${authFile}`);
      }
    }

    // Clean up test screenshots and videos from failed tests
    const resultsDir = './tests/results';
    if (fs.existsSync(resultsDir)) {
      console.log('🗑️ Cleaning up test artifacts...');
      // Keep results but clean up old ones if needed
    }

    console.log('✅ Global test teardown completed');

  } catch (error) {
    console.warn('⚠️ Warning during teardown:', error);
  }
}

export default globalTeardown;