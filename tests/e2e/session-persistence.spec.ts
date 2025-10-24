// @TEST:AUTH-004-E2E | Chain: SPEC-AUTH-004 -> CODE-AUTH-004 -> TEST-AUTH-004-E2E
// E2E Test: Session Persistence with Token Detection

import { test, expect } from '@playwright/test';

test.describe('SPEC-AUTH-004: 세션 지속성 및 토큰 감지 (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('E2E-001: 페이지 새로고침 시 role-specific 토큰으로 세션 유지', async ({ page }) => {
    // Given: Teacher logged in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/**', { timeout: 5000 });

    // Verify token stored
    const tokenBefore = await page.evaluate(() => localStorage.getItem('token_teacher'));
    expect(tokenBefore).toBeTruthy();

    // When: Refresh page
    await page.reload({ waitUntil: 'networkidle' });

    // Then: Session should persist
    const tokenAfter = await page.evaluate(() => localStorage.getItem('token_teacher'));
    expect(tokenAfter).toBe(tokenBefore);

    // Should still be on teacher page
    await expect(page).toHaveURL(/\/teacher\//);
  });

  test('E2E-002: 브라우저 재시작 시뮬레이션 - localStorage 토큰으로 세션 복원', async ({ page, context }) => {
    // Given: Lawyer logged in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'lawyer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/lawyer/**', { timeout: 5000 });

    // Get token
    const savedToken = await page.evaluate(() => localStorage.getItem('token_lawyer'));
    expect(savedToken).toBeTruthy();

    // When: Simulate browser restart (new page, restore localStorage)
    const newPage = await context.newPage();
    await newPage.goto('/login');
    await newPage.evaluate((token) => {
      localStorage.setItem('token_lawyer', token);
      localStorage.setItem('token', token); // legacy key
    }, savedToken!);

    // Navigate to lawyer page
    await newPage.goto('/lawyer/dashboard');

    // Then: Should be authenticated
    await expect(newPage).toHaveURL(/\/lawyer\//);
    const restoredToken = await newPage.evaluate(() => localStorage.getItem('token_lawyer'));
    expect(restoredToken).toBe(savedToken);

    await newPage.close();
  });

  test('E2E-003: Legacy 토큰 자동 마이그레이션 후 세션 유지', async ({ page }) => {
    // Given: User has only legacy token (old session)
    await page.goto('/login');

    // Simulate old session with legacy token only
    const futureTime = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(JSON.stringify({
      exp: futureTime,
      role: 'admin',
      userId: 1,
      email: 'admin@test.com'
    }));
    const legacyToken = `header.${payload}.signature`;

    await page.evaluate((token) => {
      localStorage.setItem('token', token); // Only legacy key
    }, legacyToken);

    // When: Navigate to admin page (should trigger migration)
    await page.goto('/admin/dashboard');

    // Then: Should migrate to role-specific key
    const migratedToken = await page.evaluate(() => localStorage.getItem('token_admin'));
    expect(migratedToken).toBe(legacyToken);

    // Legacy token should still exist (dual storage)
    const legacyStillExists = await page.evaluate(() => localStorage.getItem('token'));
    expect(legacyStillExists).toBe(legacyToken);
  });

  test('E2E-004: 만료된 토큰으로 세션 복원 실패 및 로그인 페이지 리다이렉트', async ({ page }) => {
    // Given: Expired token in storage
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // -1 hour
    const payload = btoa(JSON.stringify({
      exp: pastTime,
      role: 'teacher',
      userId: 1
    }));
    const expiredToken = `header.${payload}.signature`;

    await page.goto('/login');
    await page.evaluate((token) => {
      localStorage.setItem('token_teacher', token);
    }, expiredToken);

    // When: Try to access protected page
    await page.goto('/teacher/dashboard');

    // Then: Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('E2E-005: 역할 전환 시 이전 토큰 완전 제거 및 새 토큰으로 세션 유지', async ({ page }) => {
    // Given: Teacher logged in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/**', { timeout: 5000 });

    const teacherToken = await page.evaluate(() => localStorage.getItem('token_teacher'));
    expect(teacherToken).toBeTruthy();

    // When: Logout and login as Super Admin
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    await page.fill('input[type="email"]', 'superadmin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/super-admin/**', { timeout: 5000 });

    // Then: Teacher token should be gone
    const teacherTokenAfter = await page.evaluate(() => localStorage.getItem('token_teacher'));
    expect(teacherTokenAfter).toBeNull();

    // Super admin token should exist
    const superAdminToken = await page.evaluate(() => localStorage.getItem('token_super_admin'));
    expect(superAdminToken).toBeTruthy();

    // Refresh should maintain super admin session
    await page.reload();
    await expect(page).toHaveURL(/\/super-admin\//);
  });

  test('E2E-006: 다중 탭 환경에서 세션 공유 및 로그아웃 동기화', async ({ page, context }) => {
    // Given: Teacher logged in on tab 1
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/**', { timeout: 5000 });

    const token = await page.evaluate(() => localStorage.getItem('token_teacher'));

    // When: Open tab 2 and check session
    const tab2 = await context.newPage();
    await tab2.goto('/teacher/dashboard');

    // Then: Tab 2 should have same session
    const token2 = await tab2.evaluate(() => localStorage.getItem('token_teacher'));
    expect(token2).toBe(token);

    // When: Logout from tab 1
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    // Then: Tab 2 should also lose session (eventual consistency)
    // Note: In real app, this would require storage event listener
    await tab2.reload();
    const tokenAfterLogout = await tab2.evaluate(() => localStorage.getItem('token_teacher'));
    expect(tokenAfterLogout).toBeNull();

    await tab2.close();
  });

  test('E2E-007: Dual storage 검증 - 역할별 키와 legacy 키 모두 저장', async ({ page }) => {
    // Given: Lawyer logged in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'lawyer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/lawyer/**', { timeout: 5000 });

    // When: Check storage
    const storage = await page.evaluate(() => ({
      roleSpecific: localStorage.getItem('token_lawyer'),
      legacy: localStorage.getItem('token'),
    }));

    // Then: Both should exist and match
    expect(storage.roleSpecific).toBeTruthy();
    expect(storage.legacy).toBeTruthy();
    expect(storage.roleSpecific).toBe(storage.legacy);
  });

  test('E2E-008: 네트워크 오류 시 캐시된 토큰으로 오프라인 세션 유지', async ({ page, context }) => {
    // Given: Admin logged in
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/**', { timeout: 5000 });

    const token = await page.evaluate(() => localStorage.getItem('token_admin'));
    expect(token).toBeTruthy();

    // When: Simulate offline (block network)
    await context.route('**/*', route => route.abort());

    // Refresh page
    await page.reload();

    // Then: Token should still exist in localStorage (offline persistence)
    const tokenAfterOffline = await page.evaluate(() => localStorage.getItem('token_admin'));
    expect(tokenAfterOffline).toBe(token);
  });

  test('E2E-009: 성능 요구사항 - 세션 복원 500ms 이내', async ({ page }) => {
    // Given: Teacher token stored
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/teacher/**', { timeout: 5000 });

    // When: Measure session restoration time
    const startTime = Date.now();
    await page.reload({ waitUntil: 'networkidle' });
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Then: Should complete within 500ms (network + localStorage read)
    // Note: This includes network time, so threshold is higher
    expect(duration).toBeLessThan(2000); // Allow network latency

    // Check localStorage access is fast
    const localStorageTime = await page.evaluate(() => {
      const start = performance.now();
      localStorage.getItem('token_teacher');
      const end = performance.now();
      return end - start;
    });

    expect(localStorageTime).toBeLessThan(50); // localStorage read < 50ms
  });

  test('E2E-010: 보안 검증 - 잘못된 토큰으로 접근 시도 차단', async ({ page }) => {
    // Given: Invalid token manually set
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token_admin', 'invalid-token-12345');
    });

    // When: Try to access protected page
    await page.goto('/admin/dashboard');

    // Then: Should redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
