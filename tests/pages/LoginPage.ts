import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"], .error-message');
    this.forgotPasswordLink = page.locator('text=비밀번호를 잊으셨나요?');
    this.signupLink = page.locator('text=회원가입');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAsAssociationAdmin() {
    await this.login('association@test.com', 'TestAssoc2025!');
  }

  async loginAsTeacher() {
    await this.login('teacher@test.com', 'TestTeacher2025!');
  }

  async expectLoginError(message?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectSuccessfulRedirect(expectedUrl: string | RegExp) {
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
  }
}