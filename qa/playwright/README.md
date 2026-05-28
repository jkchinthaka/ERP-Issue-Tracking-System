# Playwright E2E Guide

The Playwright suite validates the most important management-demo and production-readiness paths for the Nelna ERP Support & Improvement System.

## Files

| Path | Purpose |
| --- | --- |
| `playwright.config.ts` | Shared Playwright configuration, projects, screenshots, video, trace, base URL, `.env.qa` loader. |
| `tests/pages/LoginPage.ts` | Login page object. |
| `tests/pages/DashboardPage.ts` | Dashboard and shell page object. |
| `tests/pages/IssuePage.ts` | Staff issue submission page object. |
| `tests/e2e/auth.spec.ts` | Login, invalid login, logout. |
| `tests/e2e/smoke.spec.ts` | App shell, health endpoint, dashboard smoke. |
| `tests/e2e/staff-issue-flow.spec.ts` | Staff issue creation and issue ID validation. |
| `tests/e2e/it-workflow.spec.ts` | Staff issue seeded through API, IT status update, dashboard smoke. |
| `tests/e2e/manager-dashboard.spec.ts` | Manager dashboard and read-only behavior. |
| `tests/e2e/vendor-flow.spec.ts` | Vendor-assigned follow-up visibility. |
| `tests/e2e/permissions.spec.ts` | API-level role restrictions. |
| `tests/e2e/ui-mobile.spec.ts` | Mobile login and issue form reachability. |

## Setup

1. Install dependencies:

```bash
npm install
```

1. Install Playwright browsers locally:

```bash
npx playwright install
```

1. Copy `.env.qa.example` to `.env.qa` and fill only test/demo credentials:

```bash
E2E_BASE_URL=https://erp-issue-tracking-system.onrender.com
E2E_ADMIN_EMAIL=admin@example.local
E2E_ADMIN_PASSWORD=...
E2E_IT_EMAIL=it@example.local
E2E_IT_PASSWORD=...
E2E_MANAGER_EMAIL=manager@example.local
E2E_MANAGER_PASSWORD=...
E2E_STAFF_EMAIL=staff@example.local
E2E_STAFF_PASSWORD=...
E2E_VENDOR_EMAIL=vendor@example.local
E2E_VENDOR_PASSWORD=...
```

Do not commit `.env.qa`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run test:smoke` | Run the fastest release smoke suite. |
| `npm run test:e2e` | Run all Playwright tests across configured projects. |
| `npm run test:e2e:headed` | Run tests with visible browsers for debugging. |
| `npm run test:e2e:ui` | Open the Playwright UI runner. |
| `npm run test:e2e:report` | Open the latest HTML report. |
| `npx playwright test --list` | Validate test discovery without running browsers. |

## Credential Behavior

Credential-dependent tests call `test.skip()` when required environment variables are missing. This allows `npx playwright test --list` and public smoke checks to run without secrets. For full QA coverage, fill all role credentials in `.env.qa` or CI secrets.

## Artifacts

- Screenshots are captured only on failure.
- Video is retained on failure.
- Trace is captured on the first retry.
- Reports are generated under `playwright-report/`.
- Raw test artifacts are generated under `test-results/`.

Both generated folders are ignored by Git.

## Selector Policy

Use `data-testid` for core workflow controls. Avoid brittle selectors based only on long text, table order, or chart internals.

Current critical selectors:

- `login-email`
- `login-password`
- `login-submit`
- `logout-button`
- `report-issue-button`
- `issue-title-input`
- `issue-description-input`
- `issue-submit-button`
- `issue-success-message`
- `issue-id`
- `dashboard-card-total-issues`
- `dashboard-card-pending-vendor`

## CI Recommendations

- Run `npm run build` before Playwright.
- Run `npx playwright test --list` on pull requests.
- Run `npm run test:smoke` after deployment to Render.
- Store credentials in CI secrets.
- Upload `playwright-report/` on failure.
