import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { cookieHeader, createIssueViaApi, credentialsFor, getReferenceIds, hasCredentials, loginViaApi, missingCredentialsMessage } from "./helpers";

test.describe("Vendor flow", () => {
  test("vendor can view assigned follow-ups after IT creates one", async ({ page, request }) => {
    test.skip(!(hasCredentials("staff") && hasCredentials("it") && hasCredentials("vendor")), missingCredentialsMessage("staff", "it", "vendor"));

    const staffToken = await loginViaApi(request, "staff");
    const issueId = await createIssueViaApi(request, staffToken);
    const itToken = await loginViaApi(request, "it");
    const { vendorId } = await getReferenceIds(request, itToken);
    test.skip(!vendorId, "At least one vendor reference record is required for vendor follow-up tests.");

    const followupResponse = await request.post("/api/vendor-followups", {
      headers: { Cookie: cookieHeader(itToken) },
      data: {
        issueId,
        vendorId,
        vendorStatus: "Sent to Vendor",
        vendorResponse: "QA vendor flow follow-up created by Playwright.",
      },
    });
    expect(followupResponse.status()).toBe(201);

    const vendorToken = await loginViaApi(request, "vendor");
    const listResponse = await request.get("/api/vendor-followups", {
      headers: { Cookie: cookieHeader(vendorToken) },
    });
    expect(listResponse.status()).toBe(200);
    expect((await listResponse.json()).followups).toBeInstanceOf(Array);

    const credentials = credentialsFor("vendor");
    const loginPage = new LoginPage(page);
    await loginPage.login(credentials.email!, credentials.password!);

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.expectLoaded();
    await expect(page.getByTestId("report-issue-button")).toHaveCount(0);
  });
});
