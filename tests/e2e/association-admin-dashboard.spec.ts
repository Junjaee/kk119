import { test, expect } from '../fixtures/auth';

test.describe('Association Admin Dashboard', () => {
  test('should display dashboard with correct layout', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();

    // Check main elements are visible
    await authenticatedAssociationAdmin.expectDashboardVisible();
    await authenticatedAssociationAdmin.expectNavigationLinksVisible();
    await authenticatedAssociationAdmin.expectStatsCardsVisible();

    // Check user role is displayed correctly
    await authenticatedAssociationAdmin.expectUserRole('관리자');
  });

  test('should navigate to members management', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();

    await authenticatedAssociationAdmin.navigateToMembers();

    // Should be on members page
    await expect(authenticatedAssociationAdmin.page).toHaveURL('**/admin/memberships**');
    await authenticatedAssociationAdmin.expectMembersListVisible();
  });

  test('should navigate to reports management', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();

    await authenticatedAssociationAdmin.navigateToReports();

    // Should be on reports page
    await expect(authenticatedAssociationAdmin.page).toHaveURL('**/admin/reports**');
  });

  test('should navigate to resources management', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();

    await authenticatedAssociationAdmin.navigateToResources();

    // Should be on resources page
    await expect(authenticatedAssociationAdmin.page).toHaveURL('**/admin/resources**');
  });

  test('should navigate to settings', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();

    await authenticatedAssociationAdmin.navigateToSettings();

    // Should be on settings page
    await expect(authenticatedAssociationAdmin.page).toHaveURL('**/admin/settings**');
  });

  test('should display statistics correctly', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();

    // Wait for stats to load
    await authenticatedAssociationAdmin.expectStatsCardsVisible();

    // Take screenshot for visual verification
    await authenticatedAssociationAdmin.takeScreenshot('dashboard-stats');

    // Verify stats cards are present
    const statsCards = authenticatedAssociationAdmin.statsCards;
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle navigation between sections', async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();

    // Navigate through different sections
    await authenticatedAssociationAdmin.navigateToMembers();
    await authenticatedAssociationAdmin.expectMembersListVisible();

    await authenticatedAssociationAdmin.navigateToReports();
    await expect(authenticatedAssociationAdmin.page).toHaveURL('**/admin/reports**');

    await authenticatedAssociationAdmin.dashboardLink.click();
    await expect(authenticatedAssociationAdmin.page).toHaveURL(/.*\/admin$/);
  });

  test('should be responsive on mobile devices', async ({ authenticatedAssociationAdmin, page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await authenticatedAssociationAdmin.goto();

    // Check if navigation is still accessible (might be in a hamburger menu)
    await authenticatedAssociationAdmin.expectDashboardVisible();

    // Take screenshot for mobile layout verification
    await authenticatedAssociationAdmin.takeScreenshot('dashboard-mobile');
  });

  test('should handle error states gracefully', async ({ authenticatedAssociationAdmin, page }) => {
    await authenticatedAssociationAdmin.goto();

    // Test network failure handling
    await page.route('**/api/**', route => route.abort());

    // Try to navigate to a section that requires API calls
    await authenticatedAssociationAdmin.navigateToMembers();

    // Should show some kind of error state or loading state
    // (Implementation depends on how the app handles network errors)
    await page.waitForTimeout(2000);

    // Take screenshot to verify error handling
    await authenticatedAssociationAdmin.takeScreenshot('dashboard-network-error');
  });
});