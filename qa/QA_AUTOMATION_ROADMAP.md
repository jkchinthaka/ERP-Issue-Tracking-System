<!-- markdownlint-disable MD060 -->

# QA Automation Roadmap

## Current Automation Baseline

This package introduces:

- Playwright TypeScript E2E tests for authentication, smoke, staff issue flow, IT workflow, manager dashboard, vendor flow, permissions, and mobile UI.
- Page object classes for Login, Dashboard, and Issue flows.
- Postman/Newman API collection with environment variables and security-oriented assertions.
- Stable `data-testid` hooks for critical login, issue submission, dashboard, and logout controls.

## Phase 1: Demo-Ready Automation

Timeline: immediate.

| Item | Description | Owner | Status |
| --- | --- | --- | --- |
| E2E smoke | Validate app open, login screen, health endpoint, and core selectors | QA automation | Added |
| Auth tests | Valid/invalid login and logout | QA automation | Added |
| Staff flow | Staff creates issue and sees issue ID | QA automation | Added |
| Role smoke | Confirm Manager/Vendor restricted behavior | QA automation | Added |
| API health/auth | Newman checks health, login, me, reference, dashboard | QA automation | Added |

## Phase 2: CI/CD Integration

Timeline: next release cycle.

| Item | Description | Recommendation |
| --- | --- | --- |
| GitHub Actions | Run build, Playwright list, API collection against staging | Use secrets for credentials |
| Render deploy gate | Trigger smoke tests after Render deploy webhook | Fail release if smoke fails |
| HTML reports | Upload Playwright report and Newman JSON as artifacts | Retain for 30 days |
| Test tags | Add `@smoke`, `@regression`, `@security` tags | Run targeted suites |
| Parallel execution | Run chromium smoke first, then full matrix | Save time on failures |

## Phase 3: Data and Environment Control

Timeline: before broader production use.

| Item | Description | Recommendation |
| --- | --- | --- |
| Dedicated QA database | Avoid testing against production data | Create separate Atlas database/cluster |
| Test data API/seed | Reset known users/issues before automation | Add QA-only seed task guarded by env |
| Test cleanup | Archive or soft-delete `QA AUTO` issues | Scheduled cleanup script |
| Storage isolation | Use external non-production bucket/folder | Separate file storage by environment |
| SMTP sandbox | Use Mailtrap/sandbox mailbox | Avoid sending to real users |

## Phase 4: Wider Coverage

Timeline: after stable QA environment.

| Item | Description |
| --- | --- |
| Visual regression | Snapshot dashboard/login/issue form across desktop/mobile |
| Accessibility automation | Add `@axe-core/playwright` checks for key screens |
| Performance budget | Track health/auth/dashboard response times over time |
| File upload tests | Use fixture files for valid/invalid upload paths |
| Export validation | Download and inspect Excel report headers/content |
| Security regression | Add automated checks for forbidden fields and direct API role bypass |
| Audit verification | Programmatically confirm audit log entries after workflow actions |

## Phase 5: Production Monitoring Alignment

Timeline: production launch.

| Area | Recommendation |
| --- | --- |
| Health check | Monitor `/api/health` every 1-5 minutes |
| Error rate | Alert on 5xx spikes from API routes |
| Auth failures | Track repeated failed login attempts |
| Vendor pending | Operational alert/report for long-pending vendor items |
| SLA breach | Daily dashboard/report for breached issues |
| Backup | Scheduled backup worker health and restore drill documentation |

## CI Example

```yaml
name: QA

on:
  pull_request:
  workflow_dispatch:

jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npx playwright test --list
      - run: npm run test:smoke
        env:
          E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
          E2E_STAFF_EMAIL: ${{ secrets.E2E_STAFF_EMAIL }}
          E2E_STAFF_PASSWORD: ${{ secrets.E2E_STAFF_PASSWORD }}
      - run: npm run test:api
```

Do not commit real credentials. Store QA credentials in CI secrets or a private Postman environment.
