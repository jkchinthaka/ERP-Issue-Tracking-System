import { expect, type APIRequestContext } from "@playwright/test";

export type QaRole = "admin" | "it" | "manager" | "staff" | "vendor";

type Credentials = {
  email?: string;
  password?: string;
};

export function credentialsFor(role: QaRole): Credentials {
  const prefix = role === "it" ? "IT" : role.toUpperCase();
  return {
    email: process.env[`E2E_${prefix}_EMAIL`],
    password: process.env[`E2E_${prefix}_PASSWORD`],
  };
}

export function hasCredentials(role: QaRole) {
  const credentials = credentialsFor(role);
  return Boolean(credentials.email && credentials.password);
}

export function missingCredentialsMessage(...roles: QaRole[]) {
  return `Set ${roles.map((role) => role === "it" ? "E2E_IT_EMAIL/PASSWORD" : `E2E_${role.toUpperCase()}_EMAIL/PASSWORD`).join(", ")} in .env.qa to run this test.`;
}

export async function loginViaApi(request: APIRequestContext, role: QaRole) {
  const credentials = credentialsFor(role);
  expect(credentials.email, `${role} email is required`).toBeTruthy();
  expect(credentials.password, `${role} password is required`).toBeTruthy();

  const response = await request.post("/api/auth/login", {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  });
  expect(response.status(), `${role} login should succeed`).toBe(200);

  const setCookie = response.headers()["set-cookie"] ?? "";
  const sessionMatch = setCookie.match(/nelna_erp_session=([^;]+)/);
  expect(sessionMatch, `${role} login should issue session cookie`).toBeTruthy();
  return sessionMatch?.[1] ?? "";
}

export function cookieHeader(sessionToken: string) {
  return `nelna_erp_session=${sessionToken}`;
}

export async function getReferenceIds(request: APIRequestContext, sessionToken: string) {
  const response = await request.get("/api/reference", {
    headers: { Cookie: cookieHeader(sessionToken) },
  });
  expect(response.status()).toBe(200);
  const reference = await response.json();
  const departmentId = reference.departments?.[0]?._id;
  const erpModuleId = reference.erpModules?.[0]?._id;
  const vendorId = reference.vendors?.[0]?._id;

  expect(departmentId, "At least one department is required").toBeTruthy();
  expect(erpModuleId, "At least one ERP module is required").toBeTruthy();

  return { departmentId, erpModuleId, vendorId };
}

export async function createIssueViaApi(request: APIRequestContext, sessionToken: string) {
  const { departmentId, erpModuleId } = await getReferenceIds(request, sessionToken);
  const response = await request.post("/api/issues", {
    headers: { Cookie: cookieHeader(sessionToken) },
    multipart: {
      requestType: "Support",
      departmentId,
      erpModuleId,
      businessImpact: "Work is delayed but can continue",
      title: `QA AUTO issue ${Date.now()}`,
      description: "Automated Playwright issue created for workflow validation.",
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  const issueId = body.issue?._id ?? body.issue?.issueId;
  expect(issueId, "Created issue should return an ID").toBeTruthy();
  return issueId as string;
}
