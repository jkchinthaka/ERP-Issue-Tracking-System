import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { credentialsFor, hasCredentials, missingCredentialsMessage } from "./helpers";

test.describe("Manager dashboard", () => {
  test("manager can view dashboard but cannot report a new issue", async ({ page }) => {
    test.skip(!hasCredentials("manager"), missingCredentialsMessage("manager"));

    const credentials = credentialsFor("manager");
    const loginPage = new LoginPage(page);
    await loginPage.login(credentials.email!, credentials.password!);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.expectDashboardCards();
    await expect(page.getByTestId("report-issue-button")).toHaveCount(0);
  });
});
