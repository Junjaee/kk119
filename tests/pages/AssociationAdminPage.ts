import { Page, Locator, expect } from '@playwright/test';

export class AssociationAdminPage {
  readonly page: Page;
  readonly dashboardTitle: Locator;
  readonly userMenu: Locator;
  readonly navigationMenu: Locator;
  readonly logoutButton: Locator;
  readonly statsCards: Locator;
  readonly membersSection: Locator;
  readonly reportsSection: Locator;
  readonly settingsSection: Locator;

  // Navigation links
  readonly dashboardLink: Locator;
  readonly membersLink: Locator;
  readonly reportsLink: Locator;
  readonly resourcesLink: Locator;
  readonly settingsLink: Locator;

  // Members management
  readonly membersList: Locator;
  readonly addMemberButton: Locator;
  readonly searchMembersInput: Locator;
  readonly memberStatusFilter: Locator;

  // Reports management
  readonly reportsList: Locator;
  readonly reportFilters: Locator;
  readonly exportReportsButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.dashboardTitle = page.locator('h1', { hasText: '관리자 대시보드' });
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.navigationMenu = page.locator('nav, [role="navigation"]');
    this.logoutButton = page.locator('button', { hasText: '로그아웃' });
    this.statsCards = page.locator('[data-testid="stats-card"]');

    // Main sections
    this.membersSection = page.locator('[data-testid="members-section"]');
    this.reportsSection = page.locator('[data-testid="reports-section"]');
    this.settingsSection = page.locator('[data-testid="settings-section"]');

    // Navigation links
    this.dashboardLink = page.locator('nav a[href*="/admin"]', { hasText: '대시보드' });
    this.membersLink = page.locator('nav a[href*="/admin/memberships"]', { hasText: '회원관리' });
    this.reportsLink = page.locator('nav a[href*="/admin/reports"]', { hasText: '신고관리' });
    this.resourcesLink = page.locator('nav a[href*="/admin/resources"]', { hasText: '자료관리' });
    this.settingsLink = page.locator('nav a[href*="/admin/settings"]', { hasText: '설정' });

    // Members management
    this.membersList = page.locator('[data-testid="members-list"]');
    this.addMemberButton = page.locator('button', { hasText: '회원 추가' });
    this.searchMembersInput = page.locator('input[placeholder*="회원 검색"]');
    this.memberStatusFilter = page.locator('select[data-testid="member-status-filter"]');

    // Reports management
    this.reportsList = page.locator('[data-testid="reports-list"]');
    this.reportFilters = page.locator('[data-testid="report-filters"]');
    this.exportReportsButton = page.locator('button', { hasText: '내보내기' });
  }

  async goto() {
    await this.page.goto('/admin');
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    // Wait for one of the key elements to be visible
    await Promise.race([
      this.dashboardTitle.waitFor({ state: 'visible' }),
      this.navigationMenu.waitFor({ state: 'visible' }),
      this.page.waitForURL('**/admin/**')
    ]);
  }

  async expectDashboardVisible() {
    await expect(this.page).toHaveURL(/.*\/admin.*/);
    await expect(this.navigationMenu).toBeVisible();
  }

  async expectUserRole(roleName: string) {
    await expect(this.userMenu).toContainText(roleName);
  }

  async navigateToMembers() {
    await this.membersLink.click();
    await this.page.waitForURL('**/admin/memberships**');
    await expect(this.membersList).toBeVisible({ timeout: 10000 });
  }

  async navigateToReports() {
    await this.reportsLink.click();
    await this.page.waitForURL('**/admin/reports**');
  }

  async navigateToResources() {
    await this.resourcesLink.click();
    await this.page.waitForURL('**/admin/resources**');
  }

  async navigateToSettings() {
    await this.settingsLink.click();
    await this.page.waitForURL('**/admin/settings**');
  }

  async searchMembers(searchTerm: string) {
    await this.searchMembersInput.fill(searchTerm);
    await this.searchMembersInput.press('Enter');
  }

  async filterMembersByStatus(status: string) {
    await this.memberStatusFilter.selectOption(status);
  }

  async expectMembersListVisible() {
    await expect(this.membersList).toBeVisible();
  }

  async expectReportsListVisible() {
    await expect(this.reportsList).toBeVisible();
  }

  async getMemberCount() {
    const members = await this.membersList.locator('[data-testid="member-item"]').count();
    return members;
  }

  async getReportCount() {
    const reports = await this.reportsList.locator('[data-testid="report-item"]').count();
    return reports;
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await this.page.waitForURL('**/login**');
  }

  async expectStatsCardsVisible() {
    await expect(this.statsCards.first()).toBeVisible();
  }

  async getStatValue(statName: string) {
    const statCard = this.page.locator(`[data-testid="stat-${statName}"]`);
    return await statCard.locator('[data-testid="stat-value"]').textContent();
  }

  async expectNavigationLinksVisible() {
    await expect(this.dashboardLink).toBeVisible();
    await expect(this.membersLink).toBeVisible();
    await expect(this.reportsLink).toBeVisible();
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `./tests/results/screenshots/${name}.png`,
      fullPage: true
    });
  }
}