const { chromium } = require('playwright');

async function testAssociationAdmin() {
  console.log('🔍 Testing association admin login...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. 🌐 Navigating to login page...');
    await page.goto('http://localhost:3021/login');
    await page.waitForSelector('input[name="email"]');

    console.log('2. 🔐 Logging in as association admin...');
    await page.fill('input[name="email"]', 'association@kk119.com');
    await page.fill('input[name="password"]', 'Assoc2025!');
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('🌐 Current URL after login:', currentUrl);

    // Wait for the page to fully load
    await page.waitForTimeout(2000);

    // Check what's displayed
    const title = await page.$('h1');
    if (title) {
      const titleText = await title.textContent();
      console.log('📄 Page title:', titleText);
    }

    // Check user info
    const userInfo = await page.$('[data-testid="user-menu"]');
    if (userInfo) {
      const userText = await userInfo.textContent();
      console.log('👤 User info displayed:', userText);
    }

    // Check if it's the right dashboard
    const isDashboard = await page.$('text=관리자 대시보드');
    const isAssocDashboard = await page.$('text=협회관리자 대시보드');

    console.log('📊 Dashboard type check:');
    console.log('  - General admin dashboard:', !!isDashboard);
    console.log('  - Association admin dashboard:', !!isAssocDashboard);

    // Check if page loaded successfully
    const pageContent = await page.textContent('body');
    const hasContent = pageContent.includes('협회관리자') || pageContent.includes('dashboard');
    console.log('🔄 Page loaded with content:', hasContent);

    // Check navigation menu
    const navItems = await page.$$eval('nav a, [role="navigation"] a',
      elements => elements.map(el => el.textContent?.trim()).filter(Boolean)
    );
    console.log('🧭 Navigation items:', navItems);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'association-admin-test.png', fullPage: true });
    console.log('📸 Screenshot saved as association-admin-test.png');

    // Check console errors
    const logs = await page.evaluate(() => {
      return [...document.querySelectorAll('*')].slice(0, 5).map(el => el.tagName);
    });
    console.log('🏗️ DOM structure sample:', logs);

    await page.waitForTimeout(5000); // Keep open for inspection

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  await browser.close();
}

testAssociationAdmin().catch(console.error);