const { chromium } = require('playwright');

async function manualCheck() {
  console.log('🔍 Manual check - opening browsers for inspection...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    // Test 1: Association admin
    const page1 = await context.newPage();
    console.log('📝 Opening association admin login...');
    await page1.goto('http://localhost:3021/login');
    await page1.waitForSelector('input[name="email"]');

    await page1.fill('input[name="email"]', 'association@kk119.com');
    await page1.fill('input[name="password"]', 'Assoc2025!');
    await page1.click('button[type="submit"]');

    console.log('✅ Association admin login submitted - check the result manually');
    console.log('Expected: Should redirect to /admin/dashboard');

    // Wait a bit then open super admin in new tab
    await page1.waitForTimeout(3000);

    // Test 2: Super admin for comparison
    const page2 = await context.newPage();
    console.log('📝 Opening super admin login...');
    await page2.goto('http://localhost:3021/login');
    await page2.waitForSelector('input[name="email"]');

    await page2.fill('input[name="email"]', 'super@kk119.com');
    await page2.fill('input[name="password"]', 'Super2025!');
    await page2.click('button[type="submit"]');

    console.log('✅ Super admin login submitted - check the result manually');
    console.log('Expected: Should redirect to /admin');

    console.log('\n🔍 Please manually check:');
    console.log('1. Association admin tab - should show /admin/dashboard with "협회관리자 대시보드"');
    console.log('2. Super admin tab - should show /admin with different dashboard');
    console.log('3. Check if pages load properly and show correct content');

    // Keep browsers open for 30 seconds for manual inspection
    await page1.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  await browser.close();
}

manualCheck().catch(console.error);