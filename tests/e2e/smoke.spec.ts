import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { credentialsFor, hasCredentials, missingCredentialsMessage } from "./helpers";

test.describe("Smoke", () => {
  test("public app shell loads", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectVisible();
    await expect(page.getByText("Nelna Farm")).toBeVisible();
  });

  test("health endpoint returns deployment readiness", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.database).toBeTruthy();
    expect(body.environment).toBeTruthy();
  });

  test("authenticated dashboard smoke", async ({ page }) => {
    const role = hasCredentials("admin") ? "admin" : hasCredentials("staff") ? "staff" : null;
    test.skip(!role, missingCredentialsMessage("admin", "staff"));

    const credentials = credentialsFor(role!);
    const loginPage = new LoginPage(page);
    await loginPage.login(credentials.email!, credentials.password!);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.expectDashboardCards();
  });
});
