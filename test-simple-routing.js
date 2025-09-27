const { chromium } = require('playwright');

async function testSimpleRouting() {
  console.log('🔍 Testing routing functionality only...');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test association admin login and routing
    console.log('\n=== 협회관리자 라우팅 테스트 ===');
    await page.goto('http://localhost:3021/login');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    console.log('🔐 협회관리자 로그인 중...');
    await page.fill('input[name="email"]', 'association@kk119.com');
    await page.fill('input[name="password"]', 'Assoc2025!');
    await page.click('button[type="submit"]');

    // Wait for redirect
    try {
      await page.waitForURL(/.*\/admin\/dashboard.*/, { timeout: 10000 });
      console.log('✅ 라우팅 성공: /admin/dashboard로 리다이렉트됨');
    } catch {
      console.log('❌ 라우팅 실패: 예상된 URL로 리다이렉트되지 않음');
    }

    const currentUrl = page.url();
    console.log('🌐 현재 URL:', currentUrl);

    // Check if URL is correct
    const isCorrectUrl = currentUrl.includes('/admin/dashboard');
    console.log('✅ URL 확인:', isCorrectUrl ? '올바른 URL' : '잘못된 URL');

    // Wait and check page state
    await page.waitForTimeout(3000);

    // Simple check if page has any content
    const hasContent = await page.evaluate(() => document.body.innerHTML.length > 1000);
    console.log('📄 페이지 콘텐츠 로드:', hasContent ? '로드됨' : '로드 안됨');

    // Check if logout works
    console.log('\n=== 로그아웃 후 슈퍼관리자 테스트 ===');

    // Try to find and click logout
    try {
      const logoutBtn = page.locator('text=로그아웃').first();
      if (await logoutBtn.count() > 0) {
        await logoutBtn.click();
        console.log('🔓 로그아웃 클릭됨');
        await page.waitForTimeout(2000);
      }
    } catch {
      // If logout doesn't work, go to login manually
      await page.goto('http://localhost:3021/login');
    }

    // Test super admin
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    console.log('🔐 슈퍼관리자 로그인 중...');
    await page.fill('input[name="email"]', 'super@kk119.com');
    await page.fill('input[name="password"]', 'Super2025!');
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(/.*\/admin$/, { timeout: 10000 });
      console.log('✅ 슈퍼관리자 라우팅 성공: /admin으로 리다이렉트됨');
    } catch {
      console.log('❌ 슈퍼관리자 라우팅 실패');
    }

    const superUrl = page.url();
    console.log('🌐 슈퍼관리자 URL:', superUrl);

    // Final summary
    console.log('\n=== 테스트 결과 ===');
    console.log('✅ 협회관리자 라우팅:', isCorrectUrl);
    console.log('✅ 슈퍼관리자 라우팅:', superUrl.endsWith('/admin'));
    console.log('✅ 각각 다른 경로로 분리:', isCorrectUrl && superUrl.endsWith('/admin'));

    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }

  await browser.close();
}

testSimpleRouting().catch(console.error);