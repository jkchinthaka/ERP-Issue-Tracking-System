import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { credentialsFor, hasCredentials, missingCredentialsMessage } from "./helpers";

test.describe("Authentication", () => {
  test("login page exposes stable QA selectors", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectVisible();
    await expect(page.getByText("ERP Support & Improvement System")).toBeVisible();
  });

  test("invalid credentials show a safe login error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.submitInvalid("invalid@example.invalid", "wrong-password");
    await loginPage.expectLoginError();
    await expect(page.getByTestId("logout-button")).toHaveCount(0);
  });

  test("admin can login and logout", async ({ page }) => {
    test.skip(!hasCredentials("admin"), missingCredentialsMessage("admin"));

    const credentials = credentialsFor("admin");
    const loginPage = new LoginPage(page);
    await loginPage.login(credentials.email!, credentials.password!);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.logout();
  });
});
