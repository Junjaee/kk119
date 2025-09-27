import { chromium, FullConfig } from '@playwright/test';
import { userDb } from '../lib/db/database';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Global test setup started...');

  // Create test database entries if they don't exist
  try {
    // Check if association admin test user exists
    const existingUser = userDb.findByEmail('association@test.com');

    if (!existingUser) {
      console.log('📝 Creating test association admin user...');
      await userDb.create({
        email: 'association@test.com',
        password: 'TestAssoc2025!',
        name: '테스트 협회관리자',
        school: '테스트 학교',
        position: '협회관리자',
        phone: '010-1234-5678',
        role: 'admin',
        association_id: 1, // Assuming association ID 1 exists
        associations: ['전국교사협회']
      });
    }

    // Create a regular teacher test user
    const existingTeacher = userDb.findByEmail('teacher@test.com');

    if (!existingTeacher) {
      console.log('📝 Creating test teacher user...');
      await userDb.create({
        email: 'teacher@test.com',
        password: 'TestTeacher2025!',
        name: '테스트 교사',
        school: '테스트 중학교',
        position: '교사',
        phone: '010-5678-1234',
        role: 'teacher',
        association_id: null
      });
    }

    console.log('✅ Test users configured successfully');

  } catch (error) {
    console.warn('⚠️ Warning: Could not set up test users:', error);
    // Don't fail the tests if user setup fails
  }

  // Browser setup for authentication state
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Pre-authenticate association admin for tests that need it
  try {
    console.log('🔐 Pre-authenticating association admin...');
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'association@test.com');
    await page.fill('input[name="password"]', 'TestAssoc2025!');
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL('**/admin/**', { timeout: 10000 });

    // Save authentication state
    await context.storageState({ path: './tests/fixtures/auth-association.json' });
    console.log('✅ Association admin authentication state saved');

  } catch (error) {
    console.warn('⚠️ Warning: Could not pre-authenticate:', error);
  }

  // Pre-authenticate teacher user
  try {
    console.log('🔐 Pre-authenticating teacher user...');
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'teacher@test.com');
    await page.fill('input[name="password"]', 'TestTeacher2025!');
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL('**/', { timeout: 10000 });

    // Save authentication state
    await context.storageState({ path: './tests/fixtures/auth-teacher.json' });
    console.log('✅ Teacher authentication state saved');

  } catch (error) {
    console.warn('⚠️ Warning: Could not pre-authenticate teacher:', error);
  }

  await browser.close();
  console.log('🎉 Global test setup completed');
}

export default globalSetup;