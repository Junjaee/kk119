import { test, expect } from '../fixtures/auth';

test.describe('Association Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.context().clearCookies();
  });

  test('should login successfully as association admin', async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.loginAsAssociationAdmin();

    // Should redirect to admin dashboard
    await loginPage.expectSuccessfulRedirect('**/admin**');

    // Verify we're on the admin page
    await expect(loginPage.page).toHaveURL(/.*\/admin.*/);
  });

  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.login('association@test.com', 'wrongpassword');

    await loginPage.expectLoginError('이메일 또는 비밀번호가 올바르지 않습니다');
  });

  test('should show error with non-existent user', async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.login('nonexistent@test.com', 'password');

    await loginPage.expectLoginError('이메일 또는 비밀번호가 올바르지 않습니다');
  });

  test('should show validation error with empty fields', async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.submitButton.click();

    // Should show HTML5 validation or custom validation
    await expect(loginPage.emailInput).toHaveAttribute('required');
    await expect(loginPage.passwordInput).toHaveAttribute('required');
  });

  test('should logout successfully', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();
    await authenticatedAssociationAdmin.expectDashboardVisible();

    await authenticatedAssociationAdmin.logout();

    // Should redirect to login page
    await expect(authenticatedAssociationAdmin.page).toHaveURL('**/login**');
  });

  test('should maintain session across page reloads', async ({ loginPage, associationAdminPage }) => {
    await loginPage.goto();
    await loginPage.loginAsAssociationAdmin();
    await associationAdminPage.expectDashboardVisible();

    // Reload the page
    await associationAdminPage.page.reload();

    // Should still be authenticated
    await associationAdminPage.expectDashboardVisible();
  });

  test('should redirect to login when accessing admin without authentication', async ({ page }) => {
    await page.goto('/admin');

    // Should redirect to login
    await expect(page).toHaveURL('**/login**');
  });
});