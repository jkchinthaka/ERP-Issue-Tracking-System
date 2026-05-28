import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { credentialsFor, hasCredentials, missingCredentialsMessage } from "./helpers";

test.describe("Mobile UI", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("login page fits a mobile viewport", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectVisible();

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("staff can reach report issue form on mobile", async ({ page }) => {
    test.skip(!hasCredentials("staff"), missingCredentialsMessage("staff"));

    const credentials = credentialsFor("staff");
    const loginPage = new LoginPage(page);
    await loginPage.login(credentials.email!, credentials.password!);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.openReportIssue();
    await expect(page.getByTestId("issue-title-input")).toBeVisible();
    await expect(page.getByTestId("issue-description-input")).toBeVisible();
  });
});
