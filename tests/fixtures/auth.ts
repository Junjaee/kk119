import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AssociationAdminPage } from '../pages/AssociationAdminPage';
import fs from 'fs';

// Define test fixtures
export const test = base.extend<{
  loginPage: LoginPage;
  associationAdminPage: AssociationAdminPage;
  authenticatedAssociationAdmin: AssociationAdminPage;
  authenticatedTeacher: void;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  associationAdminPage: async ({ page }, use) => {
    const adminPage = new AssociationAdminPage(page);
    await use(adminPage);
  },

  // Pre-authenticated association admin
  authenticatedAssociationAdmin: async ({ browser }, use) => {
    // Create a new context with saved authentication state
    const authFile = './tests/fixtures/auth-association.json';
    let context;

    if (fs.existsSync(authFile)) {
      context = await browser.newContext({
        storageState: authFile
      });
    } else {
      // Fallback: authenticate manually
      context = await browser.newContext();
      const page = await context.newPage();
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.loginAsAssociationAdmin();
      await page.waitForURL('**/admin/**');
    }

    const page = await context.newPage();
    const adminPage = new AssociationAdminPage(page);

    await use(adminPage);
    await context.close();
  },

  // Pre-authenticated teacher
  authenticatedTeacher: async ({ browser }, use) => {
    const authFile = './tests/fixtures/auth-teacher.json';
    let context;

    if (fs.existsSync(authFile)) {
      context = await browser.newContext({
        storageState: authFile
      });
    } else {
      // Fallback: authenticate manually
      context = await browser.newContext();
      const page = await context.newPage();
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.loginAsTeacher();
      await page.waitForURL('**/');
    }

    await use();
    await context.close();
  },
});

export { expect };