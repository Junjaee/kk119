// @TEST:AUTH-001-E2E | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
// E2E Test: Role-based Token Isolation System
// Tests the cross-contamination fix for multiple role logins
import { test, expect } from '@playwright/test';

test.describe('AUTH-001: 역할별 토큰 격리 (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
  });

  test('AC-001: Teacher 로그인 시 teacher 토큰만 저장', async ({ page }) => {
    await page.goto('/login');

    // Login as teacher
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { waitUntil: 'networkidle' });

    // Check that only teacher token exists
    const allTokens = await page.evaluate(() => ({
      teacher: localStorage.getItem('token_teacher'),
      lawyer: localStorage.getItem('token_lawyer'),
      admin: localStorage.getItem('token_admin'),
      super_admin: localStorage.getItem('token_super_admin'),
    }));

    expect(allTokens.teacher).toBeTruthy();
    expect(allTokens.lawyer).toBeNull();
    expect(allTokens.admin).toBeNull();
    expect(allTokens.super_admin).toBeNull();
  });

  test('AC-002: Logout 시 모든 역할 토큰 제거', async ({ page }) => {
    await page.goto('/login');

    // Login
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Verify token exists
    const tokenBefore = await page.evaluate(() => localStorage.getItem('token_teacher'));
    expect(tokenBefore).toBeTruthy();

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    // Check all tokens cleared
    const tokensAfter = await page.evaluate(() => ({
      teacher: localStorage.getItem('token_teacher'),
      lawyer: localStorage.getItem('token_lawyer'),
      admin: localStorage.getItem('token_admin'),
      super_admin: localStorage.getItem('token_super_admin'),
      legacy: localStorage.getItem('token'),
    }));

    expect(tokensAfter.teacher).toBeNull();
    expect(tokensAfter.lawyer).toBeNull();
    expect(tokensAfter.admin).toBeNull();
    expect(tokensAfter.super_admin).toBeNull();
    expect(tokensAfter.legacy).toBeNull();
  });

  test('AC-003: Teacher → Lawyer 전환 시 Teacher 토큰 미검출', async ({ page }) => {
    // Teacher login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const teacherToken = await page.evaluate(() => localStorage.getItem('token_teacher'));
    expect(teacherToken).toBeTruthy();

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    // Lawyer login
    await page.fill('input[type="email"]', 'lawyer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Check teacher token is gone, lawyer token exists
    const tokens = await page.evaluate(() => ({
      teacher: localStorage.getItem('token_teacher'),
      lawyer: localStorage.getItem('token_lawyer'),
    }));

    expect(tokens.teacher).toBeNull();
    expect(tokens.lawyer).toBeTruthy();
  });

  test('AC-003: 4개 역할 순환 전환 시 현재 역할만 유지', async ({ page }) => {
    const roles = [
      { email: 'teacher@test.com', key: 'token_teacher' },
      { email: 'lawyer@test.com', key: 'token_lawyer' },
      { email: 'admin@test.com', key: 'token_admin' },
      { email: 'superadmin@test.com', key: 'token_super_admin' },
    ];

    for (const role of roles) {
      // Go to login
      await page.goto('/login');

      // Login
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');

      // Check only current role token exists
      const tokens = await page.evaluate(() => ({
        teacher: localStorage.getItem('token_teacher'),
        lawyer: localStorage.getItem('token_lawyer'),
        admin: localStorage.getItem('token_admin'),
        super_admin: localStorage.getItem('token_super_admin'),
      }));

      // Exactly one token should exist
      const existingTokens = Object.values(tokens).filter(t => t !== null);
      expect(existingTokens).toHaveLength(1);
      expect(tokens[role.key as keyof typeof tokens]).toBeTruthy();

      // Logout
      await page.click('button:has-text("Logout")');
      await page.waitForURL('**/login');
    }
  });

  test('AC-006: 새로고침 후 현재 역할 토큰 유지', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'lawyer@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    const tokenBefore = await page.evaluate(() => localStorage.getItem('token_lawyer'));
    expect(tokenBefore).toBeTruthy();

    // Refresh page
    await page.reload();

    // Check token still exists
    const tokenAfter = await page.evaluate(() => localStorage.getItem('token_lawyer'));
    expect(tokenAfter).toBe(tokenBefore);
  });

  test('AC-006: Cross-role contamination test - 로그인 후 새로고침 시 다른 역할 토큰 없음', async ({ page }) => {
    // Teacher login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Logout
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');

    // Admin login
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Refresh
    await page.reload();

    // Check no teacher token exists
    const teacherToken = await page.evaluate(() => localStorage.getItem('token_teacher'));
    expect(teacherToken).toBeNull();

    // Check admin token exists
    const adminToken = await page.evaluate(() => localStorage.getItem('token_admin'));
    expect(adminToken).toBeTruthy();
  });

  test('Performance: Logout should complete within 500ms', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'teacher@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Measure logout performance
    const logoutStartTime = Date.now();
    await page.click('button:has-text("Logout")');
    await page.waitForURL('**/login');
    const logoutEndTime = Date.now();

    const logoutDuration = logoutEndTime - logoutStartTime;
    expect(logoutDuration).toBeLessThan(500);
  });
});
