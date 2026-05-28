<!-- markdownlint-disable MD060 -->

# QA Test Strategy

## 1. QA Objective

Validate that the Nelna ERP Support & Improvement System is stable, secure, role-safe, demo-ready, and suitable for controlled internal production use. The goal is to reduce business risk around ERP issue intake, workflow management, vendor follow-up, SLA visibility, reporting, auditability, and user access control.

## 2. Testing Scope

In scope:

- Authentication and session handling.
- Role-based access control for Super Admin, IT Support, Manager, Department Head, Department Staff, and Vendor.
- Staff issue submission and attachment upload.
- Issue list, issue detail, workflow status updates, assignments, comments, and internal notes.
- Vendor follow-up creation and response updates.
- Dashboard cards, charts, loading states, empty states, and error states.
- Audit logs and email logs.
- Knowledge base and improvement actions.
- Reports/export.
- Health check endpoint and environment/database readiness.
- Render deployment smoke checks.

## 3. Out of Scope

Out of scope for this package unless separately approved:

- Load/performance testing beyond basic response-time assertions.
- Penetration testing by an external security team.
- Browser support below currently supported evergreen browsers.
- Automated verification of real SMTP mailbox delivery.
- Data migration validation from legacy systems.
- Backup restore drill execution; this package documents backup sync checks but does not restore production data.

## 4. Test Levels

| Level | Purpose | Owner | Frequency |
| --- | --- | --- | --- |
| Smoke testing | Confirm critical flows are alive after deploy/cold start. | QA/IT | Every deploy and before demo |
| Functional testing | Validate business workflows end to end. | QA | Every release |
| API testing | Validate backend contracts, auth, validation, and sensitive data behavior. | QA automation | Every release and before deploy |
| UI/UX testing | Validate usability, mobile, responsive layout, and friendly errors. | QA/Product owner | Before demo and release |
| Security testing | Validate common auth, authorization, input, upload, and data exposure risks. | QA/IT security | Every production release |
| Role/permission testing | Confirm each role sees and modifies only allowed data. | QA | Every release |
| Regression testing | Protect previously working modules. | QA | Every release candidate |
| UAT/demo testing | Confirm management demo story and business value. | QA/Product owner | Before management demo |

## 5. Test Environment

| Item | Standard |
| --- | --- |
| Live URL | `https://erp-issue-tracking-system.onrender.com` |
| Database | MongoDB Atlas `nelna` QA/demo dataset |
| Backup database | Company server `bileeta_db`; not used by hosted app |
| Test users | Seeded users for Admin, IT Support, Manager, Department Head, Staff, Vendor |
| Browsers | Chromium, Firefox, Mobile Chrome via Playwright |
| Viewports | 360px, 390px, 768px, 1366px |
| Devices | Desktop, laptop, mobile browser simulation |
| API tools | Postman/Newman |
| Automation | Playwright TypeScript |

## 6. Entry Criteria

- Latest code is deployed or locally built.
- `/api/health` responds or deployment issue is logged as a blocker.
- QA `.env.qa` or Postman environment has test credentials.
- Seed/demo data exists in Atlas.
- No known Sev 1 blockers remain open from previous cycle.
- QA scope and build/commit under test are recorded.

## 7. Exit Criteria

- Smoke checklist passed.
- Critical role-permission tests passed.
- Staff, IT, Manager, and Vendor demo flows passed.
- No Sev 1 or Sev 2 open defects.
- Sev 3 defects have documented workaround or owner approval.
- Test execution summary completed.
- Product owner/IT owner signs off for demo or production.

## 8. Defect Severity Levels

| Severity | Definition | Example |
| --- | --- | --- |
| Sev 1 Critical | System unusable, data breach, major security issue, or production deploy blocker. | Staff can see all company issues; login fails for all users. |
| Sev 2 High | Core workflow broken with no reasonable workaround. | IT cannot update issue status; manager dashboard returns 500. |
| Sev 3 Medium | Important function affected but workaround exists. | Export file missing one optional column. |
| Sev 4 Low | Cosmetic, wording, minor UX, or non-critical documentation issue. | Button label alignment issue on tablet. |

## 9. Defect Priority Levels

| Priority | Meaning |
| --- | --- |
| P1 | Fix immediately before demo/production. |
| P2 | Fix before release if possible; otherwise formal approval required. |
| P3 | Fix in next planned iteration. |
| P4 | Backlog or polish item. |

## 10. Test Data Strategy

- Use seeded demo users and non-sensitive issue descriptions.
- Prefix automated issues with `QA AUTO` or `Automated validation`.
- Avoid uploading real screenshots, invoices, supplier data, payroll data, or production documents.
- Soft-delete or clearly mark test issues after destructive workflow tests.
- Keep demo passwords in environment variables only.
- Do not commit real test credentials.

## 11. Risks and Mitigation

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Render cold start delays | Demo starts with slow loading | Run smoke test and warm app before demo. |
| Atlas network access misconfiguration | API 500/502 | Verify `/api/health`, Render logs, and Atlas allowlist. |
| Role-permission leakage | Confidential issue data exposure | Run role matrix tests before every release. |
| SMTP missing | Email notification gaps | Confirm issue creation succeeds and failure logs appear. |
| Local upload storage on Render | Attachments lost on redeploy | Use external storage before production. |
| Demo credentials visible in production | Security risk | Keep `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` in production. |
| Test data contaminates production reports | Management confusion | Use QA labels and clean up after automated runs. |

## 12. Sign-Off Criteria

A release or management demo is ready when:

- Smoke and UAT demo checklists pass.
- Role-permission matrix has no high-risk failures.
- API tests show no unexpected 500 responses.
- Security checklist has no Sev 1/Sev 2 open items.
- Test execution summary is completed and approved by QA, IT owner, and business/product owner.
