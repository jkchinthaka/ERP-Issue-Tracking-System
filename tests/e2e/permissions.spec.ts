import { expect, test } from "@playwright/test";
import { cookieHeader, createIssueViaApi, hasCredentials, loginViaApi, missingCredentialsMessage } from "./helpers";

test.describe("Role permissions", () => {
  test("staff cannot read audit logs", async ({ request }) => {
    test.skip(!hasCredentials("staff"), missingCredentialsMessage("staff"));

    const staffToken = await loginViaApi(request, "staff");
    const response = await request.get("/api/audit-logs", {
      headers: { Cookie: cookieHeader(staffToken) },
    });
    expect(response.status()).toBe(403);
  });

  test("manager cannot update issue workflow status", async ({ request }) => {
    test.skip(!(hasCredentials("staff") && hasCredentials("manager")), missingCredentialsMessage("staff", "manager"));

    const staffToken = await loginViaApi(request, "staff");
    const issueId = await createIssueViaApi(request, staffToken);
    const managerToken = await loginViaApi(request, "manager");

    const response = await request.patch(`/api/issues/${issueId}`, {
      headers: { Cookie: cookieHeader(managerToken) },
      data: { status: "Resolved" },
    });
    expect(response.status()).toBe(403);
  });

  test("vendor cannot read audit logs", async ({ request }) => {
    test.skip(!hasCredentials("vendor"), missingCredentialsMessage("vendor"));

    const vendorToken = await loginViaApi(request, "vendor");
    const response = await request.get("/api/audit-logs", {
      headers: { Cookie: cookieHeader(vendorToken) },
    });
    expect(response.status()).toBe(403);
  });
});
