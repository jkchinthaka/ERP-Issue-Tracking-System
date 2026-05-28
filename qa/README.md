# Nelna ERP Support QA Package

This folder contains the manual, API, security, UI/UX, role-permission, regression, smoke, and UAT testing assets for the Nelna ERP Support & Improvement System.

## What Is Included

- [TEST_STRATEGY.md](TEST_STRATEGY.md): company-ready QA strategy and sign-off criteria.
- [MANUAL_TEST_CASES.md](MANUAL_TEST_CASES.md): functional manual test cases for all major modules.
- [SECURITY_TEST_CASES.md](SECURITY_TEST_CASES.md): security and abuse-case checks.
- [UI_UX_TEST_CASES.md](UI_UX_TEST_CASES.md): usability, responsiveness, accessibility, and error-state checks.
- [ROLE_PERMISSION_TEST_CASES.md](ROLE_PERMISSION_TEST_CASES.md): permission matrix and role-based test cases.
- [API_TEST_CASES.md](API_TEST_CASES.md): API test coverage and Newman execution notes.
- [SMOKE_TEST_CHECKLIST.md](SMOKE_TEST_CHECKLIST.md): fast release/cold-start validation.
- [REGRESSION_CHECKLIST.md](REGRESSION_CHECKLIST.md): wider release regression checklist.
- [UAT_DEMO_CHECKLIST.md](UAT_DEMO_CHECKLIST.md): management demo readiness checklist.
- [BUG_REPORT_TEMPLATE.md](BUG_REPORT_TEMPLATE.md): standard defect report template.
- [TEST_EXECUTION_SUMMARY.md](TEST_EXECUTION_SUMMARY.md): test cycle summary template.
- [QA_AUTOMATION_ROADMAP.md](QA_AUTOMATION_ROADMAP.md): automation phasing and CI/CD plan.
- [postman/collection.json](postman/collection.json): Postman/Newman API collection.
- [postman/environment.example.json](postman/environment.example.json): safe placeholder environment.
- [playwright/README.md](playwright/README.md): E2E automation guide.

## Quick Start

1. Copy `.env.qa.example` to `.env.qa` and fill demo/test user credentials.
2. Install dependencies with `npm install`.
3. Install browser binaries when running E2E locally: `npx playwright install`.
4. Run smoke E2E: `npm run test:smoke`.
5. Run all E2E tests: `npm run test:e2e`.
6. Run API tests: `npm run test:api`.

## QA Execution Order Before Demo

1. Run [SMOKE_TEST_CHECKLIST.md](SMOKE_TEST_CHECKLIST.md).
2. Run the Playwright smoke suite.
3. Run the Newman API collection with real QA credentials.
4. Execute the UAT demo checklist.
5. Record results in [TEST_EXECUTION_SUMMARY.md](TEST_EXECUTION_SUMMARY.md).

## Test Data Rules

Use seeded demo users and test-only issue content. Do not use real passwords, live customer data, confidential vendor data, real attachments, or production screenshots in QA artifacts.
