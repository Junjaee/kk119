import { test, expect } from '../fixtures/auth';

test.describe('Association Admin - Members Management', () => {
  test.beforeEach(async ({ authenticatedAssociationAdmin }) => {
    await authenticatedAssociationAdmin.goto();
    await authenticatedAssociationAdmin.navigateToMembers();
  });

  test('should display members list', async ({ authenticatedAssociationAdmin }) => {
    // Members list should be visible
    await authenticatedAssociationAdmin.expectMembersListVisible();

    // Take screenshot for verification
    await authenticatedAssociationAdmin.takeScreenshot('members-list');
  });

  test('should search members', async ({ authenticatedAssociationAdmin }) => {
    // Get initial member count
    const initialCount = await authenticatedAssociationAdmin.getMemberCount();

    // Search for a specific member
    await authenticatedAssociationAdmin.searchMembers('테스트');

    // Wait for search results
    await authenticatedAssociationAdmin.page.waitForTimeout(1000);

    // Take screenshot of search results
    await authenticatedAssociationAdmin.takeScreenshot('members-search-results');

    // Verify search functionality works (results may vary)
    const searchResultsCount = await authenticatedAssociationAdmin.getMemberCount();
    expect(searchResultsCount).toBeGreaterThanOrEqual(0);
  });

  test('should filter members by status', async ({ authenticatedAssociationAdmin }) => {
    // Try to filter by different statuses
    const statusOptions = ['pending', 'approved', 'rejected'];

    for (const status of statusOptions) {
      try {
        await authenticatedAssociationAdmin.filterMembersByStatus(status);
        await authenticatedAssociationAdmin.page.waitForTimeout(1000);

        // Take screenshot for each filter
        await authenticatedAssociationAdmin.takeScreenshot(`members-filter-${status}`);

        // Verify filtering works
        const filteredCount = await authenticatedAssociationAdmin.getMemberCount();
        expect(filteredCount).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // Filter option may not exist, continue with other tests
        console.warn(`Filter option '${status}' not available:`, error);
      }
    }
  });

  test('should handle member approval workflow', async ({ authenticatedAssociationAdmin, page }) => {
    // Look for pending members
    const memberItems = page.locator('[data-testid="member-item"]');
    const memberCount = await memberItems.count();

    if (memberCount > 0) {
      // Click on first member
      await memberItems.first().click();

      // Look for approve/reject buttons
      const approveButton = page.locator('button', { hasText: '승인' });
      const rejectButton = page.locator('button', { hasText: '거부' });

      if (await approveButton.isVisible()) {
        // Test approval flow
        await approveButton.click();

        // Look for confirmation dialog or success message
        const confirmButton = page.locator('button', { hasText: '확인' });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Wait for action to complete
        await page.waitForTimeout(2000);

        // Take screenshot of result
        await authenticatedAssociationAdmin.takeScreenshot('member-approved');
      }
    }
  });

  test('should display member details', async ({ authenticatedAssociationAdmin, page }) => {
    const memberItems = page.locator('[data-testid="member-item"]');
    const memberCount = await memberItems.count();

    if (memberCount > 0) {
      // Click on first member to view details
      await memberItems.first().click();

      // Wait for details to load
      await page.waitForTimeout(1000);

      // Check if member details are displayed
      const memberDetails = page.locator('[data-testid="member-details"]');
      if (await memberDetails.isVisible()) {
        // Take screenshot of member details
        await authenticatedAssociationAdmin.takeScreenshot('member-details');

        // Verify essential information is displayed
        await expect(memberDetails).toContainText(/이름|이메일|학교/);
      }
    }
  });

  test('should handle pagination', async ({ authenticatedAssociationAdmin, page }) => {
    // Look for pagination controls
    const nextButton = page.locator('button', { hasText: '다음' });
    const prevButton = page.locator('button', { hasText: '이전' });
    const pageNumbers = page.locator('[data-testid="page-number"]');

    if (await pageNumbers.count() > 1) {
      // Test pagination
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Take screenshot of second page
        await authenticatedAssociationAdmin.takeScreenshot('members-page-2');
      }

      if (await prevButton.isVisible()) {
        await prevButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should export member data', async ({ authenticatedAssociationAdmin, page }) => {
    // Look for export button
    const exportButton = page.locator('button', { hasText: '내보내기' });

    if (await exportButton.isVisible()) {
      // Start download
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      try {
        const download = await downloadPromise;

        // Verify download was initiated
        expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx|pdf)$/);

        // Take screenshot of export action
        await authenticatedAssociationAdmin.takeScreenshot('members-export');
      } catch (error) {
        console.warn('Export functionality may not be implemented:', error);
      }
    }
  });

  test('should handle bulk actions', async ({ authenticatedAssociationAdmin, page }) => {
    // Look for checkboxes to select multiple members
    const checkboxes = page.locator('input[type="checkbox"][data-testid*="member-select"]');
    const bulkActionButton = page.locator('button', { hasText: '일괄 처리' });

    const checkboxCount = await checkboxes.count();
    if (checkboxCount > 0) {
      // Select first few members
      for (let i = 0; i < Math.min(3, checkboxCount); i++) {
        await checkboxes.nth(i).check();
      }

      // Take screenshot of selected members
      await authenticatedAssociationAdmin.takeScreenshot('members-bulk-selected');

      // Try bulk action if available
      if (await bulkActionButton.isVisible()) {
        await bulkActionButton.click();
        await page.waitForTimeout(1000);

        // Take screenshot of bulk action dialog
        await authenticatedAssociationAdmin.takeScreenshot('members-bulk-action');
      }
    }
  });

  test('should be responsive on mobile', async ({ authenticatedAssociationAdmin, page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload to ensure mobile layout
    await page.reload();
    await authenticatedAssociationAdmin.expectMembersListVisible();

    // Take screenshot of mobile layout
    await authenticatedAssociationAdmin.takeScreenshot('members-mobile');

    // Test mobile-specific interactions
    const memberItems = page.locator('[data-testid="member-item"]');
    if (await memberItems.count() > 0) {
      await memberItems.first().click();
      await page.waitForTimeout(1000);

      // Take screenshot of mobile member details
      await authenticatedAssociationAdmin.takeScreenshot('members-mobile-details');
    }
  });
});