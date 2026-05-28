import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { cookieHeader, createIssueViaApi, credentialsFor, hasCredentials, loginViaApi, missingCredentialsMessage } from "./helpers";

test.describe("IT workflow", () => {
  test("IT support can move a staff issue into progress", async ({ page, request }) => {
    test.skip(!(hasCredentials("staff") && hasCredentials("it")), missingCredentialsMessage("staff", "it"));

    const staffToken = await loginViaApi(request, "staff");
    const issueId = await createIssueViaApi(request, staffToken);

    const itToken = await loginViaApi(request, "it");
    const updateResponse = await request.patch(`/api/issues/${issueId}`, {
      headers: { Cookie: cookieHeader(itToken) },
      data: { status: "In Progress" },
    });
    expect(updateResponse.status()).toBe(200);
    expect((await updateResponse.json()).issue.status).toBe("In Progress");

    const credentials = credentialsFor("it");
    const loginPage = new LoginPage(page);
    await loginPage.login(credentials.email!, credentials.password!);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await dashboardPage.expectDashboardCards();
  });
});
