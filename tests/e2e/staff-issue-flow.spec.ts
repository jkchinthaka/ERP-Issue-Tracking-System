import { test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { IssuePage } from "../pages/IssuePage";
import { LoginPage } from "../pages/LoginPage";
import { credentialsFor, hasCredentials, missingCredentialsMessage } from "./helpers";

test.describe("Staff issue flow", () => {
  test("staff can submit an ERP issue and see the generated issue ID", async ({ page }) => {
    test.skip(!hasCredentials("staff"), missingCredentialsMessage("staff"));

    const credentials = credentialsFor("staff");
    const loginPage = new LoginPage(page);
    await loginPage.login(credentials.email!, credentials.password!);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.openReportIssue();

    const issuePage = new IssuePage(page);
    await issuePage.fillRequiredIssue(
      `QA AUTO staff issue ${Date.now()}`,
      "Automated Playwright validation for staff issue submission before demo.",
    );
    await issuePage.submit();
    await issuePage.expectSuccess();
  });
});
