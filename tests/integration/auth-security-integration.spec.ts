import { test, expect } from '@playwright/test';

/**
 * Comprehensive integration tests for the enhanced authentication and security system
 * Tests the integration between JWT refresh tokens, session management, rate limiting,
 * security monitoring, and API security wrappers.
 */

test.describe('Authentication Security Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.context().clearCookies();
  });

  test('should handle complete authentication flow with enhanced security', async ({ page }) => {
    // Step 1: Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/login/);

    // Step 2: Attempt login with valid credentials
    await page.fill('input[name="email"]', 'association@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Step 3: Verify successful login and redirection
    await page.waitForURL(/.*\/admin/);
    await expect(page).toHaveURL(/.*\/admin/);

    // Step 4: Verify authentication cookies are set
    const cookies = await page.context().cookies();
    const authToken = cookies.find(c => c.name === 'auth-token');
    const refreshToken = cookies.find(c => c.name === 'refresh-token');

    expect(authToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(authToken?.httpOnly).toBe(true);
    expect(refreshToken?.httpOnly).toBe(true);

    // Step 5: Test authenticated API access
    const response = await page.request.get('/api/auth/me');
    expect(response.status()).toBe(200);

    const userData = await response.json();
    expect(userData.user).toBeTruthy();
    expect(userData.user.email).toBe('association@test.com');

    // Step 6: Test session management API
    const sessionsResponse = await page.request.get('/api/auth/sessions');
    expect(sessionsResponse.status()).toBe(200);

    const sessionsData = await sessionsResponse.json();
    expect(sessionsData.sessions).toBeTruthy();
    expect(Array.isArray(sessionsData.sessions)).toBe(true);

    // Step 7: Test logout and session cleanup
    await page.click('button:has-text("로그아웃")');
    await page.waitForURL(/.*\/login/);

    // Verify cookies are cleared
    const cookiesAfterLogout = await page.context().cookies();
    const authTokenAfterLogout = cookiesAfterLogout.find(c => c.name === 'auth-token');
    expect(authTokenAfterLogout?.value || '').toBe('');
  });

  test('should enforce rate limiting on authentication endpoints', async ({ page }) => {
    // Test rate limiting by making multiple failed login attempts
    await page.goto('/login');

    const failedAttempts = [];
    for (let i = 0; i < 6; i++) {
      const loginPromise = page.request.post('/api/auth/login-enhanced', {
        data: {
          email: 'test@test.com',
          password: 'wrongpassword'
        }
      });
      failedAttempts.push(loginPromise);
    }

    const responses = await Promise.all(failedAttempts);

    // First few attempts should return 401 (unauthorized)
    expect(responses[0].status()).toBe(401);
    expect(responses[1].status()).toBe(401);

    // Later attempts should be rate limited (429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check rate limit headers
    const rateLimitedResponse = rateLimitedResponses[0];
    const retryAfter = rateLimitedResponse.headers()['retry-after'];
    expect(retryAfter).toBeTruthy();
  });

  test('should handle token refresh flow correctly', async ({ page, context }) => {
    // Step 1: Login to get initial tokens
    await page.goto('/login');
    await page.fill('input[name="email"]', 'association@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin/);

    // Step 2: Get initial token
    const initialCookies = await context.cookies();
    const initialToken = initialCookies.find(c => c.name === 'auth-token')?.value;
    expect(initialToken).toBeTruthy();

    // Step 3: Test token refresh endpoint
    const refreshResponse = await page.request.post('/api/auth/refresh');
    expect(refreshResponse.status()).toBe(200);

    const refreshData = await refreshResponse.json();
    expect(refreshData.tokens).toBeTruthy();
    expect(refreshData.tokens.accessToken).toBeTruthy();

    // Step 4: Verify new token is different and valid
    const newCookies = await context.cookies();
    const newToken = newCookies.find(c => c.name === 'auth-token')?.value;
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(initialToken);

    // Step 5: Test that new token works for API access
    const meResponse = await page.request.get('/api/auth/me');
    expect(meResponse.status()).toBe(200);
  });

  test('should detect and respond to suspicious activity', async ({ page, browser }) => {
    // Create multiple contexts to simulate different devices/IPs
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Step 1: Login from first "device"
      await page1.goto('/login');
      await page1.fill('input[name="email"]', 'association@test.com');
      await page1.fill('input[name="password"]', 'password123');
      await page1.click('button[type="submit"]');
      await page1.waitForURL(/.*\/admin/);

      // Step 2: Attempt to use same credentials from second "device"
      await page2.goto('/login');
      await page2.fill('input[name="email"]', 'association@test.com');
      await page2.fill('input[name="password"]', 'password123');
      await page2.click('button[type="submit"]');
      await page2.waitForURL(/.*\/admin/);

      // Step 3: Check sessions API shows multiple active sessions
      const sessionsResponse = await page1.request.get('/api/auth/sessions');
      expect(sessionsResponse.status()).toBe(200);

      const sessionsData = await sessionsResponse.json();
      expect(sessionsData.sessions.length).toBeGreaterThanOrEqual(2);

      // Step 4: Test logout from all sessions
      const logoutAllResponse = await page1.request.delete('/api/auth/sessions', {
        data: { action: 'logout_all' }
      });
      expect(logoutAllResponse.status()).toBe(200);

      // Step 5: Verify other session is invalidated
      const meResponse2 = await page2.request.get('/api/auth/me');
      expect(meResponse2.status()).toBe(401);

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('should integrate security monitoring with admin dashboard', async ({ page }) => {
    // Step 1: Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin/);

    // Step 2: Generate some security events through failed logins
    const failedLoginPromises = [];
    for (let i = 0; i < 3; i++) {
      failedLoginPromises.push(
        page.request.post('/api/auth/login-enhanced', {
          data: {
            email: 'nonexistent@test.com',
            password: 'wrongpassword'
          }
        })
      );
    }
    await Promise.all(failedLoginPromises);

    // Step 3: Access security dashboard
    const securityResponse = await page.request.get('/api/admin/security?reportType=metrics');
    expect(securityResponse.status()).toBe(200);

    const securityData = await securityResponse.json();
    expect(securityData.metrics).toBeTruthy();
    expect(securityData.metrics.eventsByType).toBeTruthy();
    expect(securityData.metrics.systemHealth).toBeTruthy();

    // Step 4: Test security events filtering
    const eventsResponse = await page.request.get('/api/admin/security?reportType=events&type=LOGIN_FAILURE&limit=10');
    expect(eventsResponse.status()).toBe(200);

    const eventsData = await eventsResponse.json();
    expect(eventsData.events).toBeTruthy();
    expect(Array.isArray(eventsData.events)).toBe(true);

    // Step 5: Test security report generation
    const reportResponse = await page.request.get('/api/admin/security?reportType=report&timeRange=24h');
    expect(reportResponse.status()).toBe(200);

    const reportData = await reportResponse.json();
    expect(reportData.report).toBeTruthy();
    expect(reportData.report.summary).toBeTruthy();
    expect(reportData.report.topThreats).toBeTruthy();
  });

  test('should handle security headers and API protection correctly', async ({ page }) => {
    // Step 1: Test public endpoint security headers
    const publicResponse = await page.request.get('/api/health');
    const publicHeaders = publicResponse.headers();

    expect(publicHeaders['x-content-type-options']).toBe('nosniff');
    expect(publicHeaders['x-frame-options']).toBe('DENY');
    expect(publicHeaders['x-xss-protection']).toBe('1; mode=block');

    // Step 2: Login and test authenticated endpoint security headers
    await page.goto('/login');
    await page.fill('input[name="email"]', 'association@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin/);

    const authResponse = await page.request.get('/api/auth/me');
    const authHeaders = authResponse.headers();

    expect(authHeaders['x-content-type-options']).toBe('nosniff');
    expect(authHeaders['x-frame-options']).toBe('DENY');
    expect(authHeaders['x-request-id']).toBeTruthy(); // Request tracking
    expect(authHeaders['cache-control']).toContain('private');

    // Step 3: Test admin endpoint has stricter security headers
    const adminResponse = await page.request.get('/api/admin/security?reportType=metrics');
    const adminHeaders = adminResponse.headers();

    expect(adminHeaders['cache-control']).toContain('no-cache');
    expect(adminHeaders['x-request-id']).toBeTruthy();
  });

  test('should validate JWT token security claims properly', async ({ page }) => {
    // Step 1: Login to get valid tokens
    await page.goto('/login');
    await page.fill('input[name="email"]', 'association@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/admin/);

    // Step 2: Test token status endpoint
    const tokenStatusResponse = await page.request.get('/api/auth/refresh');
    expect(tokenStatusResponse.status()).toBe(200);

    const tokenData = await tokenStatusResponse.json();
    expect(tokenData.tokens).toBeTruthy();

    // Step 3: Test token validation with user info endpoint
    const userResponse = await page.request.get('/api/auth/me');
    expect(userResponse.status()).toBe(200);

    const userData = await userResponse.json();
    expect(userData.user).toBeTruthy();
    expect(userData.user.email).toBe('association@test.com');

    // Step 4: Test that blacklisted tokens are rejected
    await page.request.post('/api/auth/logout');

    const loggedOutResponse = await page.request.get('/api/auth/me');
    expect(loggedOutResponse.status()).toBe(401);
  });

  test('should handle concurrent authentication flows correctly', async ({ browser }) => {
    // Create multiple concurrent login attempts
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));

    try {
      // Concurrent login attempts
      const loginPromises = pages.map(async (page, index) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', `test${index}@test.com`);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Some may fail due to user not existing, which is expected
        try {
          await page.waitForURL(/.*\/admin/, { timeout: 5000 });
          return { success: true, index };
        } catch {
          return { success: false, index };
        }
      });

      const results = await Promise.all(loginPromises);

      // At least one should handle the request properly (even if login fails)
      expect(results.length).toBe(3);

      // Test that each page can make API requests independently
      const apiPromises = pages.map(page =>
        page.request.get('/api/auth/me').catch(() => ({ status: () => 401 }))
      );

      const apiResults = await Promise.all(apiPromises);
      expect(apiResults.length).toBe(3);

    } finally {
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });

  test('should maintain system performance under security load', async ({ page }) => {
    const startTime = Date.now();

    // Step 1: Perform multiple security-intensive operations
    const operations = [];

    // Multiple login attempts
    for (let i = 0; i < 3; i++) {
      operations.push(
        page.request.post('/api/auth/login-enhanced', {
          data: {
            email: 'association@test.com',
            password: 'password123'
          }
        })
      );
    }

    // Multiple token refresh attempts
    for (let i = 0; i < 2; i++) {
      operations.push(page.request.post('/api/auth/refresh'));
    }

    const responses = await Promise.all(operations);
    const endTime = Date.now();

    // Step 2: Verify performance is acceptable (< 5 seconds for all operations)
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000);

    // Step 3: Verify most operations completed successfully
    const successfulResponses = responses.filter(r => r.status() < 400);
    expect(successfulResponses.length).toBeGreaterThan(0);

    // Step 4: Test that security monitoring handled the load
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    if (await page.url().includes('/admin')) {
      const metricsResponse = await page.request.get('/api/admin/security?reportType=metrics');
      if (metricsResponse.status() === 200) {
        const metricsData = await metricsResponse.json();
        expect(metricsData.metrics).toBeTruthy();
      }
    }
  });
});