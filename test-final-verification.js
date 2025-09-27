const { chromium } = require('playwright');

async function testFinalVerification() {
  console.log('🔍 Final verification of association admin functionality...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Test association admin login
    console.log('\n=== 테스트 1: 협회관리자 로그인 ===');
    await page.goto('http://localhost:3021/login');
    await page.waitForSelector('input[name="email"]');

    // Clear storage first
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('🔐 Logging in as association admin...');
    await page.fill('input[name="email"]', 'association@kk119.com');
    await page.fill('input[name="password"]', 'Assoc2025!');
    await page.click('button[type="submit"]');

    // Wait for redirect and page load
    await page.waitForURL(/.*\/admin\/dashboard.*/, { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow page to fully load

    const currentUrl = page.url();
    console.log('🌐 Redirected to:', currentUrl);

    // Check page title
    const title = await page.locator('h1').first().textContent();
    console.log('📄 Page title:', title);

    // Check if it's the association admin dashboard
    const isCorrectDashboard = title && title.includes('협회관리자 대시보드');
    console.log('✅ Correct dashboard loaded:', isCorrectDashboard);

    // Check user info in header
    const userMenu = await page.locator('[data-testid="user-menu"]').first();
    if (userMenu) {
      const userText = await userMenu.textContent();
      console.log('👤 User displayed:', userText);
    }

    // 2. Test access to associations page
    console.log('\n=== 테스트 2: 협회 관리 페이지 접근 ===');
    await page.goto('http://localhost:3021/admin/associations');
    await page.waitForTimeout(2000);

    const assocUrl = page.url();
    const assocTitle = await page.locator('h1').first().textContent().catch(() => 'No title');
    console.log('🌐 Associations page URL:', assocUrl);
    console.log('📄 Associations page title:', assocTitle);

    const hasAccessToAssociations = assocUrl.includes('/admin/associations') &&
                                   assocTitle && assocTitle.includes('협회 관리');
    console.log('✅ Can access associations page:', hasAccessToAssociations);

    // 3. Test super admin login (for comparison)
    console.log('\n=== 테스트 3: 슈퍼관리자 로그인 (비교) ===');

    // Logout first
    if (await page.locator('[data-testid="user-menu"]').count() > 0) {
      await page.click('[data-testid="user-menu"]');
      await page.waitForTimeout(500);
      await page.click('text=로그아웃');
      await page.waitForTimeout(2000);
    }

    // Login as super admin
    await page.goto('http://localhost:3021/login');
    await page.waitForSelector('input[name="email"]');

    console.log('🔐 Logging in as super admin...');
    await page.fill('input[name="email"]', 'super@kk119.com');
    await page.fill('input[name="password"]', 'Super2025!');
    await page.click('button[type="submit"]');

    await page.waitForURL(/.*\/admin$/, { timeout: 10000 });
    await page.waitForTimeout(3000);

    const superUrl = page.url();
    const superTitle = await page.locator('h1').first().textContent();
    console.log('🌐 Super admin redirected to:', superUrl);
    console.log('📄 Super admin page title:', superTitle);

    const isSuperDashboard = superUrl.endsWith('/admin') &&
                           superTitle && (superTitle.includes('슈퍼관리자') || superTitle.includes('관리자 대시보드'));
    console.log('✅ Super admin has different dashboard:', isSuperDashboard);

    // 4. Final summary
    console.log('\n=== 최종 결과 요약 ===');
    console.log('✅ 협회관리자 → /admin/dashboard 리다이렉트:', isCorrectDashboard);
    console.log('✅ 협회 관리 페이지 접근 권한:', hasAccessToAssociations);
    console.log('✅ 슈퍼관리자와 다른 대시보드 제공:', isSuperDashboard);

    if (isCorrectDashboard && hasAccessToAssociations && isSuperDashboard) {
      console.log('\n🎉 모든 테스트 통과! 협회관리자 페이지가 정상 작동합니다.');
    } else {
      console.log('\n⚠️ 일부 기능에 문제가 있을 수 있습니다.');
    }

    await page.waitForTimeout(5000); // Keep open for final inspection

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  await browser.close();
}

testFinalVerification().catch(console.error);