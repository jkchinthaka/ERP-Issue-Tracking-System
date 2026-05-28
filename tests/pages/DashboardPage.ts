import { expect, type Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async expectLoaded() {
    await expect(this.page.getByTestId("logout-button")).toBeVisible({ timeout: 20_000 });
  }

  async expectDashboardCards() {
    await expect(this.page.getByTestId("dashboard-card-total-issues")).toBeVisible({ timeout: 20_000 });
    await expect(this.page.getByTestId("dashboard-card-pending-vendor")).toBeVisible({ timeout: 20_000 });
  }

  async openReportIssue() {
    await this.expectLoaded();
    await this.page.getByTestId("report-issue-button").click();
    await expect(this.page.getByTestId("issue-title-input")).toBeVisible();
  }

  async logout() {
    await this.page.getByTestId("logout-button").click();
    await expect(this.page.getByTestId("login-submit")).toBeVisible({ timeout: 15_000 });
  }
}
