const { chromium } = require('playwright');

async function testLogoutIssue() {
  console.log('🔍 Starting logout issue diagnosis...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    // Clear all browser data
    permissions: [],
    ignoreHTTPSErrors: true
  });

  // Clear all browser storage including cache
  await context.clearCookies();
  await context.clearPermissions();
  const page = await context.newPage();

  try {
    console.log('1. 🌐 Navigating to login page...');
    await page.goto('http://localhost:3021/login');
    await page.waitForSelector('input[name="email"]');

    // Clear any existing storage
    console.log('2. 🧹 Clearing existing storage...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('3. 🔐 Logging in as super admin...');
    await page.fill('input[name="email"]', 'super@kk119.com');
    await page.fill('input[name="password"]', 'Super2025!');
    await page.click('button[type="submit"]');

    // Wait for redirect to admin
    await page.waitForURL(/.*\/admin.*/, { timeout: 10000 });
    console.log('✅ Successfully logged in and redirected to admin');

    // Check user info in header
    await page.waitForSelector('text=최관리자', { timeout: 5000 });
    console.log('✅ Super admin user info displayed correctly');

    // Check localStorage before logout
    const storageBeforeLogout = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        zustandStorage: localStorage.getItem('kyokwon119-storage'),
        allKeys: Object.keys(localStorage)
      };
    });
    console.log('📱 Storage before logout:', JSON.stringify(storageBeforeLogout, null, 2));

    console.log('4. 🔓 Attempting logout...');

    // Click on user menu dropdown
    await page.click('[data-testid="user-menu"], button:has-text("최관리자")');
    await page.waitForSelector('text=로그아웃', { timeout: 5000 });

    // Click logout
    await page.click('text=로그아웃');

    // Wait a bit for logout process
    await page.waitForTimeout(3000);

    // Force reload to ensure latest code is loaded
    await page.reload({ waitUntil: 'networkidle' });

    // Check localStorage after logout attempt
    const storageAfterLogout = await page.evaluate(() => {
      return {
        token: localStorage.getItem('token'),
        zustandStorage: localStorage.getItem('kyokwon119-storage'),
        allKeys: Object.keys(localStorage)
      };
    });
    console.log('📱 Storage after logout:', JSON.stringify(storageAfterLogout, null, 2));

    // Check what's currently displayed
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    console.log('🌐 Current URL after logout:', currentUrl);

    // Enhanced check for any logged-in user elements
    const userElements = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const text = el.textContent;
        return text && (text.includes('관리자') || text.includes('최관리자') || text.includes('협회관리자') || text.includes('시스템관리자'));
      }).map(el => ({
        text: el.textContent.trim(),
        tagName: el.tagName,
        className: el.className,
        id: el.id
      }));
    });

    if (userElements.length > 0) {
      console.log('❌ PROBLEM: Still showing user elements:', userElements);

      // Let's see what user info the API returns
      const response = await page.request.get('http://localhost:3020/api/auth/me', {
        headers: { 'Cookie': await page.context().cookies().then(cookies => cookies.map(c => `${c.name}=${c.value}`).join('; ')) }
      });

      if (response.ok()) {
        const userData = await response.json();
        console.log('🔍 API still returns user:', userData);
      }

      // Try to logout the current user (whoever they are)
      console.log('5. 🔄 Attempting second logout...');
      await page.click('[data-testid="user-menu"]').catch(() => {});
      await page.click('text=로그아웃').catch(() => {});
      await page.waitForTimeout(2000);

      const finalStorage = await page.evaluate(() => {
        return {
          token: localStorage.getItem('token'),
          zustandStorage: localStorage.getItem('kyokwon119-storage'),
          allKeys: Object.keys(localStorage)
        };
      });
      console.log('📱 Storage after second logout:', JSON.stringify(finalStorage, null, 2));

      const finalUrl = page.url();
      console.log('🌐 Final URL:', finalUrl);

      // Check again for any admin text
      const finalUserElements = await page.$$eval('*', elements => {
        return elements.filter(el => {
          const text = el.textContent;
          return text && (text.includes('관리자') || text.includes('최관리자') || text.includes('협회관리자') || text.includes('시스템관리자'));
        }).map(el => ({
          text: el.textContent.trim(),
          tagName: el.tagName
        }));
      });

      if (finalUserElements.length === 0) {
        console.log('✅ Second logout successful - fully logged out');
      } else {
        console.log('❌ Still showing user elements after second logout:', finalUserElements);
      }
    } else {
      console.log('✅ Successfully logged out completely');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  await browser.close();
}

testLogoutIssue().catch(console.error);